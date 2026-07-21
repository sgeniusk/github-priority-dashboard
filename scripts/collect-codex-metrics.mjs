#!/usr/bin/env node

import { createReadStream, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { homedir } from 'node:os';
import { basename, join, normalize, resolve, sep } from 'node:path';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import { buildDashboard } from './build-dashboard.mjs';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const CONFIG_PATH = join(ROOT, 'codex-metrics.config.json');
const PROJECTS_PATH = join(ROOT, 'projects.json');
const PUBLIC_PATH = join(ROOT, 'codex-summary.json');
const PRIVATE_DIR = join(ROOT, '.codex-local');
const PRIVATE_PATH = join(PRIVATE_DIR, 'codex-ledger.json');
const MAX_RELEVANT_LINE_BYTES = 2 * 1024 * 1024;
const DAY_MS = 86_400_000;

const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const includeArchived = !args.has('--current-only');
const now = new Date();
const cutoff30 = new Date(now.getTime() - 30 * DAY_MS);

function roundTo(value, step) {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.round(value / step) * step;
}

function dateKey(value) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
}

function walkJsonl(dir, out) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const target = join(dir, entry.name);
    if (entry.isDirectory()) walkJsonl(target, out);
    else if (entry.isFile() && entry.name.endsWith('.jsonl')) out.push(target);
  }
}

function relevantRecord(line) {
  if (!line.includes('"type":"session_meta"') && !line.includes('"token_count"')) return null;
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
}

async function inspectSession(file) {
  let meta = null;
  let usage = null;
  let lastEventAt = null;
  let carry = Buffer.alloc(0);
  let skippingOversizeLine = false;

  for await (const chunk of createReadStream(file)) {
    let data = carry.length ? Buffer.concat([carry, chunk]) : chunk;
    let start = 0;
    for (let i = 0; i < data.length; i++) {
      if (data[i] !== 10) continue;
      if (!skippingOversizeLine) {
        const lineLength = i - start;
        if (lineLength <= MAX_RELEVANT_LINE_BYTES) {
          const record = relevantRecord(data.subarray(start, i).toString('utf8'));
          if (record?.type === 'session_meta') meta = record.payload;
          if (record?.type === 'event_msg' && record.payload?.type === 'token_count') {
            const candidate = record.payload?.info?.total_token_usage;
            if (candidate && Number.isFinite(candidate.total_tokens)) {
              usage = candidate;
              lastEventAt = record.timestamp || lastEventAt;
            }
          }
        }
      }
      skippingOversizeLine = false;
      start = i + 1;
    }
    carry = data.subarray(start);
    if (carry.length > MAX_RELEVANT_LINE_BYTES) {
      carry = Buffer.alloc(0);
      skippingOversizeLine = true;
    } else {
      carry = Buffer.from(carry);
    }
  }

  if (!skippingOversizeLine && carry.length) {
    const record = relevantRecord(carry.toString('utf8'));
    if (record?.type === 'session_meta') meta = record.payload;
    if (record?.type === 'event_msg' && record.payload?.type === 'token_count') {
      const candidate = record.payload?.info?.total_token_usage;
      if (candidate && Number.isFinite(candidate.total_tokens)) {
        usage = candidate;
        lastEventAt = record.timestamp || lastEventAt;
      }
    }
  }

  return { meta, usage, lastEventAt };
}

async function inspectSessionsWithRipgrep(roots) {
  const sessions = new Map();
  const child = spawn('rg', [
    '--json',
    '--no-messages',
    '-e',
    '"type":"session_meta"',
    '-e',
    '"token_count"',
    ...roots,
  ], { stdio: ['ignore', 'pipe', 'pipe'] });
  let stderr = '';
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', (chunk) => { stderr += chunk; });
  const lines = createInterface({ input: child.stdout, crlfDelay: Infinity });
  for await (const line of lines) {
    let envelope;
    try {
      envelope = JSON.parse(line);
    } catch {
      continue;
    }
    if (envelope.type !== 'match') continue;
    const file = envelope.data?.path?.text;
    const text = envelope.data?.lines?.text;
    if (!file || !text || Buffer.byteLength(text) > MAX_RELEVANT_LINE_BYTES) continue;
    const record = relevantRecord(text.trimEnd());
    if (!record) continue;
    if (!sessions.has(file)) sessions.set(file, { meta: null, usage: null, lastEventAt: null });
    const state = sessions.get(file);
    if (record.type === 'session_meta') state.meta = record.payload;
    if (record.type === 'event_msg' && record.payload?.type === 'token_count') {
      const candidate = record.payload?.info?.total_token_usage;
      if (candidate && Number.isFinite(candidate.total_tokens)) {
        state.usage = candidate;
        state.lastEventAt = record.timestamp || state.lastEventAt;
      }
    }
  }
  const exitCode = await new Promise((resolveExit, reject) => {
    child.once('error', reject);
    child.once('close', resolveExit);
  });
  if (exitCode !== 0 && exitCode !== 1) {
    throw new Error(`rg 기반 Codex 로그 검색 실패(exit ${exitCode}). ${stderr.trim()}`);
  }
  return sessions;
}

function sourceLabel(source) {
  if (typeof source === 'string') return source.toLowerCase();
  if (source && typeof source === 'object') {
    return [source.type, source.kind, source.name].filter(Boolean).join(' ').toLowerCase();
  }
  return '';
}

function isSubagent(meta) {
  if (!meta) return false;
  if (meta.parent_thread_id) return true;
  const source = `${sourceLabel(meta.source)} ${sourceLabel(meta.thread_source)}`;
  return /sub.?agent|guardian|reviewer|explorer|worker/.test(source);
}

function pathSegments(value) {
  return normalize(value || '').split(sep).filter(Boolean).map((part) => part.toLowerCase());
}

function matchesAlias(cwd, alias) {
  const normalizedAlias = normalize(alias).toLowerCase();
  const normalizedCwd = normalize(cwd || '').toLowerCase();
  if (!normalizedAlias || !normalizedCwd) return false;
  if (normalizedAlias.includes(sep)) {
    return normalizedCwd === normalizedAlias || normalizedCwd.startsWith(`${normalizedAlias}${sep}`);
  }
  return pathSegments(normalizedCwd).includes(normalizedAlias);
}

function resolveProject(cwd, config, trackedNames) {
  let best = null;
  for (const [repo, projectConfig] of Object.entries(config.projects || {})) {
    const aliases = [repo, ...(projectConfig.aliases || [])];
    for (const alias of aliases) {
      if (!matchesAlias(cwd, alias)) continue;
      const score = normalize(alias).length;
      if (!best || score > best.score) best = { repo, score };
    }
  }
  if (best) return best.repo;
  const leaf = basename(normalize(cwd || ''));
  return trackedNames.has(leaf) ? leaf : null;
}

function blankUsage() {
  return {
    inputTokens: 0,
    cachedInputTokens: 0,
    outputTokens: 0,
    reasoningTokens: 0,
    totalTokens: 0,
    sessions: 0,
  };
}

function addUsage(target, usage) {
  target.inputTokens += usage.input_tokens || 0;
  target.cachedInputTokens += usage.cached_input_tokens || 0;
  target.outputTokens += usage.output_tokens || 0;
  target.reasoningTokens += usage.reasoning_output_tokens || 0;
  target.totalTokens += usage.total_tokens || 0;
  target.sessions += 1;
}

function percentile(values, ratio) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * ratio) - 1));
  return sorted[index];
}

function publicUsage(usage, step) {
  return {
    totalTokens: roundTo(usage.totalTokens, step),
    sessions: usage.sessions,
    inputTokens: roundTo(usage.inputTokens, step),
    cachedInputTokens: roundTo(usage.cachedInputTokens, step),
    outputTokens: roundTo(usage.outputTokens, step),
    reasoningTokens: roundTo(usage.reasoningTokens, step),
  };
}

function forecastFor(repo, projectConfig, meanSessionTokens, spentTokens, tiers, step) {
  if (projectConfig?.forecastMode !== 'finite') {
    return {
      mode: projectConfig?.forecastMode || 'unconfigured',
      confidence: 'none',
      reason: projectConfig?.forecastMode === 'continuous'
        ? '종료점이 고정되지 않은 지속형 프로젝트라 완성 백분율을 계산하지 않습니다.'
        : '규모 등급을 먼저 정해야 예측할 수 있습니다.',
    };
  }
  const tier = tiers[projectConfig.tier];
  if (!tier || !meanSessionTokens) {
    return { mode: 'finite', confidence: 'none', reason: '개인 세션 기준값이 아직 부족합니다.' };
  }
  const p50Tokens = roundTo(meanSessionTokens * tier.p50Sessions, step);
  const p80Tokens = roundTo(meanSessionTokens * tier.p80Sessions, step);
  return {
    mode: 'finite',
    tier: projectConfig.tier,
    tierLabel: tier.label,
    p50Tokens,
    p80Tokens,
    burnP50Pct: p50Tokens ? Math.round((spentTokens / p50Tokens) * 100) : null,
    burnP80Pct: p80Tokens ? Math.round((spentTokens / p80Tokens) * 100) : null,
    confidence: 'low',
    reason: '실제 개인 평균 세션 토큰과 프로젝트 규모 등급을 곱한 초기 추정치입니다. 검수 완료 이력이 쌓이면 보정해야 합니다.',
  };
}

async function main() {
  const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
  const projectsData = JSON.parse(readFileSync(PROJECTS_PATH, 'utf8'));
  const trackedNames = new Set(projectsData.projects.map((project) => project.name));
  const roots = [join(homedir(), '.codex', 'sessions')];
  if (includeArchived) roots.push(join(homedir(), '.codex', 'archived_sessions'));
  const files = [];
  roots.forEach((dir) => walkJsonl(dir, files));

  const exactSessionMap = new Map();
  const excluded = { subagents: 0, missingMeta: 0, missingUsage: 0, unmapped: 0 };
  const excludedSubagentIds = new Set();
  const missingUsageIds = new Set();
  let inspected;
  try {
    inspected = await inspectSessionsWithRipgrep(roots);
  } catch (error) {
    console.warn(`rg 빠른 경로를 쓸 수 없어 스트리밍 경로로 전환합니다. ${error.message}`);
    inspected = new Map();
    for (const file of files) inspected.set(file, await inspectSession(file));
  }
  for (const file of files) {
    const { meta, usage, lastEventAt } = inspected.get(file) || {};
    if (!meta) {
      excluded.missingMeta += 1;
      continue;
    }
    if (isSubagent(meta)) {
      excludedSubagentIds.add(meta.id || meta.session_id || file);
      continue;
    }
    if (!usage) {
      missingUsageIds.add(meta.id || meta.session_id || file);
      continue;
    }
    const repo = resolveProject(meta.cwd, config, trackedNames);
    const sessionId = meta.id || meta.session_id || file;
    const record = {
      sessionId,
      repo,
      cwd: meta.cwd || null,
      startedAt: meta.timestamp || null,
      lastEventAt: lastEventAt || meta.timestamp || null,
      usage: {
        inputTokens: usage.input_tokens || 0,
        cachedInputTokens: usage.cached_input_tokens || 0,
        outputTokens: usage.output_tokens || 0,
        reasoningTokens: usage.reasoning_output_tokens || 0,
        totalTokens: usage.total_tokens || 0,
      },
    };
    const previous = exactSessionMap.get(sessionId);
    if (!previous || String(record.lastEventAt || '') >= String(previous.lastEventAt || '')) {
      exactSessionMap.set(sessionId, record);
    }
  }

  const exactSessions = [...exactSessionMap.values()];
  excluded.subagents = excludedSubagentIds.size;
  excluded.missingUsage = missingUsageIds.size;
  excluded.unmapped = exactSessions.filter((session) => !session.repo).length;

  const rootTokenValues = exactSessions.map((session) => session.usage.totalTokens).filter((value) => value > 0);
  const calibration = {
    medianSessionTokens: percentile(rootTokenValues, 0.5),
    meanSessionTokens: rootTokenValues.length
      ? Math.round(rootTokenValues.reduce((sum, value) => sum + value, 0) / rootTokenValues.length)
      : 0,
    p80SessionTokens: percentile(rootTokenValues, 0.8),
    sampleSessions: rootTokenValues.length,
  };
  const projectMap = new Map();
  const totalAllTime = blankUsage();
  const total30Days = blankUsage();
  const unmappedAllTime = blankUsage();
  const unmapped30Days = blankUsage();
  const daily = new Map();

  for (const session of exactSessions) {
    const eventDate = new Date(session.lastEventAt || session.startedAt || 0);
    addUsage(totalAllTime, {
      input_tokens: session.usage.inputTokens,
      cached_input_tokens: session.usage.cachedInputTokens,
      output_tokens: session.usage.outputTokens,
      reasoning_output_tokens: session.usage.reasoningTokens,
      total_tokens: session.usage.totalTokens,
    });
    if (eventDate >= cutoff30) {
      addUsage(total30Days, {
        input_tokens: session.usage.inputTokens,
        cached_input_tokens: session.usage.cachedInputTokens,
        output_tokens: session.usage.outputTokens,
        reasoning_output_tokens: session.usage.reasoningTokens,
        total_tokens: session.usage.totalTokens,
      });
    }
    if (!session.repo) {
      addUsage(unmappedAllTime, {
        input_tokens: session.usage.inputTokens,
        cached_input_tokens: session.usage.cachedInputTokens,
        output_tokens: session.usage.outputTokens,
        reasoning_output_tokens: session.usage.reasoningTokens,
        total_tokens: session.usage.totalTokens,
      });
      if (eventDate >= cutoff30) {
        addUsage(unmapped30Days, {
          input_tokens: session.usage.inputTokens,
          cached_input_tokens: session.usage.cachedInputTokens,
          output_tokens: session.usage.outputTokens,
          reasoning_output_tokens: session.usage.reasoningTokens,
          total_tokens: session.usage.totalTokens,
        });
      }
    }
    if (!session.repo) continue;
    if (!projectMap.has(session.repo)) {
      projectMap.set(session.repo, { allTime: blankUsage(), last30Days: blankUsage(), lastActivity: null });
    }
    const record = projectMap.get(session.repo);
    addUsage(record.allTime, {
      input_tokens: session.usage.inputTokens,
      cached_input_tokens: session.usage.cachedInputTokens,
      output_tokens: session.usage.outputTokens,
      reasoning_output_tokens: session.usage.reasoningTokens,
      total_tokens: session.usage.totalTokens,
    });
    if (eventDate >= cutoff30) {
      addUsage(record.last30Days, {
        input_tokens: session.usage.inputTokens,
        cached_input_tokens: session.usage.cachedInputTokens,
        output_tokens: session.usage.outputTokens,
        reasoning_output_tokens: session.usage.reasoningTokens,
        total_tokens: session.usage.totalTokens,
      });
      const day = dateKey(eventDate);
      if (day) daily.set(day, (daily.get(day) || 0) + session.usage.totalTokens);
    }
    const activity = eventDate.toISOString();
    if (!record.lastActivity || activity > record.lastActivity) record.lastActivity = activity;
  }

  const rounding = config.publicRoundingTokens || 100_000;
  const projects = projectsData.projects.map((project) => {
    const exact = projectMap.get(project.name) || { allTime: blankUsage(), last30Days: blankUsage(), lastActivity: null };
    const projectConfig = config.projects?.[project.name] || {};
    return {
      repo: project.name,
      allTime: publicUsage(exact.allTime, rounding),
      last30Days: publicUsage(exact.last30Days, rounding),
      lastActivity: exact.lastActivity,
      forecast: forecastFor(
        project.name,
        projectConfig,
        calibration.meanSessionTokens,
        exact.allTime.totalTokens,
        config.forecastTiers,
        rounding,
      ),
    };
  });

  const mappedSessions = exactSessions.filter((session) => session.repo).length;
  const publicSummary = {
    _comment: '공개 가능한 Codex 집계. 원문·제목·session id·cwd는 포함하지 않고 토큰은 반올림한다.',
    meta: {
      asOf: now.toISOString(),
      source: 'local Codex rollout token_count',
      sourceMode: 'last cumulative event per root session',
      windowDays: 30,
      publicRoundingTokens: rounding,
    },
    methodology: {
      workMetric: 'token consumption',
      limitation: '토큰은 작업량의 근사치이며 산출물 품질이나 검수 완료를 뜻하지 않는다.',
      forecast: '개인 평균 세션 토큰 x 프로젝트 규모별 예상 세션 수. 초기 신뢰도는 낮다.',
      privacy: 'root session aggregate only; prompts, titles, ids, paths excluded',
    },
    coverage: {
      filesScanned: files.length,
      rootSessionsWithUsage: exactSessions.length,
      mappedSessions,
      unmappedSessions: excluded.unmapped,
      excludedSubagents: excluded.subagents,
      filesMissingMeta: excluded.missingMeta,
      sessionsMissingUsage: excluded.missingUsage,
      trackedProjects: projectsData.projects.length,
      projectsWithUsage: projects.filter((project) => project.allTime.sessions > 0).length,
    },
    calibration: {
      medianSessionTokens: roundTo(calibration.medianSessionTokens, rounding),
      meanSessionTokens: roundTo(calibration.meanSessionTokens, rounding),
      p80SessionTokens: roundTo(calibration.p80SessionTokens, rounding),
      sampleSessions: calibration.sampleSessions,
    },
    totals: {
      allTime: publicUsage(totalAllTime, rounding),
      last30Days: publicUsage(total30Days, rounding),
      unmappedAllTime: publicUsage(unmappedAllTime, rounding),
      unmappedLast30Days: publicUsage(unmapped30Days, rounding),
    },
    daily30: [...daily.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, tokens]) => ({ date, tokens: roundTo(tokens, rounding) })),
    projects,
  };

  const privateLedger = {
    meta: {
      generatedAt: now.toISOString(),
      sourceRoots: roots,
      filesScanned: files.length,
      excluded,
    },
    calibration,
    sessions: exactSessions,
  };

  if (dryRun) {
    console.log(JSON.stringify({
      mode: 'dry-run',
      coverage: publicSummary.coverage,
      calibration: publicSummary.calibration,
      totals: publicSummary.totals,
      topProjects: projects
        .filter((project) => project.allTime.sessions > 0)
        .sort((a, b) => b.allTime.totalTokens - a.allTime.totalTokens)
        .slice(0, 10)
        .map((project) => ({ repo: project.repo, tokens: project.allTime.totalTokens, sessions: project.allTime.sessions })),
    }, null, 2));
    return;
  }

  mkdirSync(PRIVATE_DIR, { recursive: true });
  writeFileSync(PRIVATE_PATH, `${JSON.stringify(privateLedger, null, 2)}\n`);
  writeFileSync(PUBLIC_PATH, `${JSON.stringify(publicSummary, null, 2)}\n`);
  buildDashboard();
  console.log(`Codex 집계 완료. root ${exactSessions.length}세션, 프로젝트 매핑 ${mappedSessions}세션, 공개 집계 ${PUBLIC_PATH}.`);
  console.log(`정확한 로컬 원장은 Git 제외 경로 ${PRIVATE_PATH}에만 저장했습니다.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
