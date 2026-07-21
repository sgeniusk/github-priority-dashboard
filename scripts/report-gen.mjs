// 뉴스(news.json)·프로젝트 로그(project-logs.json) 생성 로직.
// refresh-progress.mjs가 import해 매 refresh마다 갱신하고, 단독 실행(node scripts/report-gen.mjs)으로 시드/재생성도 한다.
// 네트워크 불필요 — 기존 history.json·activity.json·projects.json·suggestions.json에서 파생한다.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const rd = (f, d) => { try { return JSON.parse(readFileSync(join(ROOT, f), 'utf8')); } catch { return d; } };
const NEWS_MAX = 120, LOG_MAX_PER_REPO = 80, SURGE = 15, STALL_DAYS = 7;

function safeJson(value) {
  return JSON.stringify(value, null, 2).replace(/</g, '\\u003c');
}

function replaceJsonConstant(source, name, value) {
  const marker = `const ${name} = `;
  const markerIndex = source.indexOf(marker);
  if (markerIndex < 0) throw new Error(`report.html에서 ${name}을 찾지 못했습니다.`);
  const start = markerIndex + marker.length;
  const opening = source[start];
  if (opening !== '{' && opening !== '[') throw new Error(`${name} JSON 시작 문자가 올바르지 않습니다.`);

  let depth = 0;
  let quoted = false;
  let escaped = false;
  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if (quoted) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') quoted = false;
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === '{' || char === '[') depth += 1;
    else if (char === '}' || char === ']') {
      depth -= 1;
      if (depth === 0) {
        return `${source.slice(0, start)}${safeJson(value)}${source.slice(index + 1)}`;
      }
    }
  }
  throw new Error(`${name} JSON 끝을 찾지 못했습니다.`);
}

function replaceJsonSeed(source, id, value) {
  const pattern = new RegExp(`(<script[^>]*id=["']${id}["'][^>]*>)[\\s\\S]*?(<\\/script>)`, 'i');
  if (!pattern.test(source)) throw new Error(`project-report.html에서 #${id}를 찾지 못했습니다.`);
  return source.replace(pattern, `$1${safeJson(value)}$2`);
}

function syncReportFallbacks(news, logs) {
  const reportPath = join(ROOT, 'report.html');
  const projectReportPath = join(ROOT, 'project-report.html');
  const reportHtml = replaceJsonConstant(readFileSync(reportPath, 'utf8'), 'FALLBACK_NEWS', news);
  writeFileSync(reportPath, reportHtml);

  const seeds = [
    ['fallback-projects', rd('projects.json', { projects: [], meta: {} })],
    ['fallback-reports', rd('reports.json', {})],
    ['fallback-suggestions', rd('suggestions.json', { items: [] })],
    ['fallback-logs', logs],
  ];
  let projectReportHtml = readFileSync(projectReportPath, 'utf8');
  for (const [id, value] of seeds) projectReportHtml = replaceJsonSeed(projectReportHtml, id, value);
  writeFileSync(projectReportPath, projectReportHtml);
}

const nameOf = (projects, repo) => { const p = projects.find(x => x.name === repo); return p ? (p.displayName || p.name) : repo; };

// 뉴스 — history 델타(완성도/커밋)·suggestions 정체·status 변화에서 이벤트 도출, items에 누적(date+repo+kind 중복 제거)
export function buildNews() {
  const proj = rd('projects.json', { projects: [], meta: {} });
  const hist = rd('history.json', { snapshots: [] });
  const sug = rd('suggestions.json', { items: [] });
  const prev = rd('news.json', { items: [], _state: { status: {} } });
  const asOf = proj.meta.asOf;
  const items = prev.items.slice();
  const key = it => `${it.date}|${it.repo}|${it.kind}`;
  const seen = new Set(items.map(key));
  const add = it => { if (!seen.has(key(it))) { items.push(it); seen.add(key(it)); } };
  const snaps = hist.snapshots || [];
  // 최근 3개 전이(transition)에서 완성도/커밋 이벤트
  for (let i = Math.max(1, snaps.length - 3); i < snaps.length; i++) {
    const a = snaps[i - 1], b = snaps[i];
    for (const repo of Object.keys(b.projects || {})) {
      const pa = a.projects[repo], pb = b.projects[repo]; if (!pa || !pb) continue;
      const project = proj.projects.find((item) => item.name === repo);
      const nm = project ? (project.displayName || project.name) : repo;
      const dT = (pb.total || 0) - (pa.total || 0);
      if (project?.progressAssessed !== false && dT !== 0) add({ date: b.date, repo, kind: 'progress', headline: `${nm}, 완성도 ${dT > 0 ? '+' : ''}${dT}% (${pa.total}→${pb.total})`, detail: `${a.date} 대비 완성도가 ${Math.abs(dT)}포인트 ${dT > 0 ? '올랐습니다' : '내렸습니다'}.`, metric: `${dT > 0 ? '▲' : '▼'}${Math.abs(dT)}%` });
      const dC = (pb.commits || 0) - (pa.commits || 0);
      if (dC >= SURGE) add({ date: b.date, repo, kind: 'surge', headline: `${nm}, 커밋 +${dC}로 가속`, detail: `${a.date} 이후 커밋이 ${dC}건 늘며 개발이 활발합니다.`, metric: `+${dC} commits` });
    }
  }
  // 정체 — suggestions stall
  for (const s of sug.items || []) {
    if (s.type === 'stall') add({ date: sug.generatedAt || asOf, repo: s.repo, kind: 'stall', headline: `${nameOf(proj.projects, s.repo)} — ${s.title}`, detail: s.detail || '', metric: s.severity === 'high' ? '⚠ 위험' : '주의' });
  }
  // status 변화 — 이전 _state.status와 비교
  const prevStatus = (prev._state && prev._state.status) || {};
  const curStatus = {};
  for (const p of proj.projects) {
    curStatus[p.name] = p.status;
    const old = prevStatus[p.name];
    if (old && old !== p.status) {
      const verb = p.status === 'paused' ? '일시중단' : (p.status === 'active' ? '재개' : p.status);
      add({ date: asOf, repo: p.name, kind: 'status', headline: `${p.displayName || p.name} ${verb}`, detail: p.pausedReason || '', metric: verb });
    }
  }
  items.sort((x, y) => (y.date || '').localeCompare(x.date || ''));
  const trimmed = items.slice(0, NEWS_MAX);
  return { _comment: '대시보드 전체 뉴스 피드. refresh마다 history/activity 델타·정체·status 변화에서 자동 생성(하이브리드 — 헤드라인 템플릿). report.html이 읽는다. _state는 변화 감지용.', generatedAt: asOf, _state: { status: curStatus }, items: trimmed };
}

// 프로젝트 로그 — 각 repo에 새 커밋·완성도 변동을 시간순 누적(devlog). 큐레이션 노트(kind:note)는 보존.
export function buildLogs() {
  const proj = rd('projects.json', { projects: [], meta: {} });
  const act = rd('activity.json', { commits: [] });
  const hist = rd('history.json', { snapshots: [] });
  const prev = rd('project-logs.json', { logs: {} });
  const asOf = proj.meta.asOf;
  const logs = {};
  const snaps = hist.snapshots || [];
  const last = snaps[snaps.length - 1], prevSnap = snaps[snaps.length - 2];
  for (const p of proj.projects) {
    const repo = p.name;
    const existing = (prev.logs && prev.logs[repo]) || [];
    const seenSha = new Set(existing.filter(e => e.sha).map(e => e.sha));
    const arr = existing.slice();
    // 새 커밋 추가
    for (const c of (act.commits || []).filter(c => c.repo === repo)) {
      if (!seenSha.has(c.sha)) { arr.push({ date: c.date, kind: 'commit', text: c.message, sha: c.sha }); seenSha.add(c.sha); }
    }
    // 완성도 변동 entry (오늘 스냅샷 기준, 중복 방지)
    if (p.progressAssessed !== false && last && last.projects[repo]) {
      const pb = last.projects[repo], pa = prevSnap && prevSnap.projects[repo];
      const dT = pa ? (pb.total - pa.total) : 0, dC = pa ? (pb.commits - pa.commits) : 0;
      const pkey = `progress|${last.date}`;
      if (!arr.some(e => e.kind === 'progress' && e.date === last.date)) {
        const bits = [`완성도 ${pb.total}%`];
        if (dT) bits.push(`(${dT > 0 ? '+' : ''}${dT}p)`);
        if (dC) bits.push(`커밋 +${dC}`);
        arr.push({ date: last.date, kind: 'progress', text: bits.join(' · ') });
      }
    }
    arr.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    logs[repo] = arr.slice(-LOG_MAX_PER_REPO);
  }
  return { _comment: '프로젝트별 누적 타임라인(devlog). refresh마다 새 커밋·완성도 변동을 append(kind: commit/progress). 큐레이션은 kind:note로 /report·수동 추가 — 보존됨. project-report.html?repo=가 읽는다.', generatedAt: asOf, logs };
}

export function writeReports({ dryRun = false } = {}) {
  const news = buildNews(), logs = buildLogs();
  if (!dryRun) {
    writeFileSync(join(ROOT, 'news.json'), JSON.stringify(news, null, 2) + '\n');
    writeFileSync(join(ROOT, 'project-logs.json'), JSON.stringify(logs, null, 2) + '\n');
    syncReportFallbacks(news, logs);
  }
  const noteCount = Object.values(logs.logs).reduce((s, a) => s + a.filter(e => e.kind === 'note').length, 0);
  return `${dryRun ? '[dry-run] ' : ''}news.json ${news.items.length}건 · project-logs.json ${Object.keys(logs.logs).length}개 repo(노트 ${noteCount}건).`;
}

// 단독 실행 시 시드/재생성
if (process.argv[1] && process.argv[1].endsWith('report-gen.mjs')) {
  console.log(writeReports({ dryRun: process.argv.includes('--dry-run') }));
}
