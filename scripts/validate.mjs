import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
let exitCode = 0;

function logError(msg) {
  console.error(`\x1b[31m✗\x1b[0m ${msg}`);
  exitCode = 1;
}

function logSuccess(msg) {
  console.log(`\x1b[32m✓\x1b[0m ${msg}`);
}

// 1. Validate projects.json
try {
  const projectsPath = join(ROOT, 'projects.json');
  const data = JSON.parse(readFileSync(projectsPath, 'utf8'));
  
  if (!data.meta) logError('projects.json: missing "meta" object');
  if (!data.projects || !Array.isArray(data.projects)) {
    logError('projects.json: "projects" must be an array');
  } else {
    const projectNames = new Set();
    const projectRanks = new Set();
    
    data.projects.forEach((p, idx) => {
      const label = p.name || `project[${idx}]`;
      if (!p.name) logError(`projects.json: project at index ${idx} has no "name"`);
      else {
        if (projectNames.has(p.name)) logError(`projects.json: duplicate project name "${p.name}"`);
        projectNames.add(p.name);
      }
      
      if (typeof p.rank !== 'number') logError(`projects.json [${label}]: "rank" must be a number`);
      else {
        if (projectRanks.has(p.rank)) logError(`projects.json: duplicate project rank "${p.rank}"`);
        projectRanks.add(p.rank);
      }
      
      if (!p.displayName) logError(`projects.json [${label}]: missing "displayName"`);
      
      const validCategories = ['game', 'app', 'content'];
      if (!validCategories.includes(p.category)) {
        logError(`projects.json [${label}]: invalid category "${p.category}"`);
      }
      
      const validVisibilities = ['public', 'private'];
      if (!validVisibilities.includes(p.visibility)) {
        logError(`projects.json [${label}]: invalid visibility "${p.visibility}"`);
      }
      
      const validTools = ['claude', 'codex', 'hermes', 'hybrid'];
      if (!validTools.includes(p.tool)) {
        logError(`projects.json [${label}]: invalid tool "${p.tool}"`);
      }
      
      const validStatuses = ['active', 'paused', 'archived'];
      if (!validStatuses.includes(p.status)) {
        logError(`projects.json [${label}]: invalid status "${p.status}"`);
      }
      
      if (p.status === 'paused' && !p.pausedReason) {
        logError(`projects.json [${label}]: status is "paused" but "pausedReason" is missing`);
      }
      
      const validSprints = ['A', 'B', 'C', 'D', 'defer'];
      if (!validSprints.includes(p.sprint)) {
        logError(`projects.json [${label}]: invalid sprint "${p.sprint}"`);
      }
      
      const validSprintStatuses = ['planned', 'inProgress', 'review', 'done'];
      if (!validSprintStatuses.includes(p.sprintStatus)) {
        logError(`projects.json [${label}]: invalid sprintStatus "${p.sprintStatus}"`);
      }
      
      if (!p.progress) logError(`projects.json [${label}]: missing "progress" object`);
      else {
        const { docs = 0, skeleton = 0, features = 0, alpha = 0, total = 0 } = p.progress;
        if (docs < 0 || docs > 20) logError(`projects.json [${label}]: progress.docs (${docs}) out of bounds [0, 20]`);
        if (skeleton < 0 || skeleton > 30) logError(`projects.json [${label}]: progress.skeleton (${skeleton}) out of bounds [0, 30]`);
        if (features < 0 || features > 30) logError(`projects.json [${label}]: progress.features (${features}) out of bounds [0, 30]`);
        if (alpha < 0 || alpha > 20) logError(`projects.json [${label}]: progress.alpha (${alpha}) out of bounds [0, 20]`);
        if (total !== docs + skeleton + features + alpha) {
          logError(`projects.json [${label}]: progress.total (${total}) does not match sum of components (${docs + skeleton + features + alpha})`);
        }
      }
      
      if (typeof p.commits !== 'number' || p.commits < 0) {
        logError(`projects.json [${label}]: commits must be a non-negative number`);
      }
      
      if (p.url && !p.url.startsWith('https://github.com/')) {
        logError(`projects.json [${label}]: invalid url "${p.url}"`);
      }
      
    });
    
    // Check ranks are consecutive starting from 1
    const sortedRanks = Array.from(projectRanks).sort((a, b) => a - b);
    for (let i = 0; i < sortedRanks.length; i++) {
      if (sortedRanks[i] !== i + 1) {
        logError(`projects.json: ranks must be consecutive integers starting from 1. Found ranks: ${sortedRanks.join(', ')}`);
        break;
      }
    }
    
    logSuccess('projects.json validation passed');
  }
} catch (e) {
  logError(`Failed to parse or validate projects.json: ${e.message}`);
}

// 2. Validate history.json
try {
  const historyPath = join(ROOT, 'history.json');
  const hist = JSON.parse(readFileSync(historyPath, 'utf8'));
  
  if (!hist.snapshots || !Array.isArray(hist.snapshots)) {
    logError('history.json: "snapshots" must be an array');
  } else {
    hist.snapshots.forEach((snap, idx) => {
      const dateLabel = snap.date || `index ${idx}`;
      if (!snap.date || !/^\d{4}-\d{2}-\d{2}$/.test(snap.date)) {
        logError(`history.json: invalid date format for snapshot at ${dateLabel}`);
      }
      if (typeof snap.avgProgress !== 'number') {
        logError(`history.json [${dateLabel}]: avgProgress must be a number`);
      }
      if (typeof snap.totalCommits !== 'number') {
        logError(`history.json [${dateLabel}]: totalCommits must be a number`);
      }
      if (typeof snap.active !== 'number') {
        logError(`history.json [${dateLabel}]: active must be a number`);
      }
    });
    logSuccess('history.json validation passed');
  }
} catch (e) {
  logError(`Failed to parse or validate history.json: ${e.message}`);
}

// 3. Validate activity.json
try {
  const activityPath = join(ROOT, 'activity.json');
  const act = JSON.parse(readFileSync(activityPath, 'utf8'));
  
  if (!act.asOf || !/^\d{4}-\d{2}-\d{2}$/.test(act.asOf)) {
    logError('activity.json: invalid or missing "asOf" date');
  }
  if (!act.commits || !Array.isArray(act.commits)) {
    logError('activity.json: "commits" must be an array');
  } else {
    act.commits.forEach((c, idx) => {
      if (!c.repo) logError(`activity.json commit[${idx}]: missing "repo"`);
      if (!c.sha || !/^[a-f0-9]{7}$/i.test(c.sha)) {
        logError(`activity.json commit[${idx}]: invalid or missing sha "${c.sha}"`);
      }
      if (!c.message) logError(`activity.json commit[${idx}]: missing "message"`);
      if (!c.date || isNaN(Date.parse(c.date))) {
        logError(`activity.json commit[${idx}]: invalid or missing date "${c.date}"`);
      }
    });
    logSuccess('activity.json validation passed');
  }
} catch (e) {
  logError(`Failed to parse or validate activity.json: ${e.message}`);
}

// 4. Validate monthly-analysis.json
try {
  const analysisPath = join(ROOT, 'monthly-analysis.json');
  const analysis = JSON.parse(readFileSync(analysisPath, 'utf8'));
  if (!analysis.window || !/^\d{4}-\d{2}-\d{2}$/.test(analysis.window.start || '') || !/^\d{4}-\d{2}-\d{2}$/.test(analysis.window.end || '')) {
    logError('monthly-analysis.json: invalid or missing window.start/window.end');
  }
  if (!analysis.summary || typeof analysis.summary.totalCommits !== 'number') {
    logError('monthly-analysis.json: summary.totalCommits must be a number');
  }
  if (!Array.isArray(analysis.daily) || analysis.daily.length === 0) {
    logError('monthly-analysis.json: daily must be a non-empty array');
  }
  if (!Array.isArray(analysis.repos) || analysis.repos.length === 0) {
    logError('monthly-analysis.json: repos must be a non-empty array');
  }
  logSuccess('monthly-analysis.json validation passed');
} catch (e) {
  logError(`Failed to parse or validate monthly-analysis.json: ${e.message}`);
}

function compileInlineScripts(relativePath) {
  const html = readFileSync(join(ROOT, relativePath), 'utf8');
  const scriptRegex = /<script([^>]*)>([\s\S]*?)<\/script>/gi;
  let match;
  let count = 0;
  while ((match = scriptRegex.exec(html)) !== null) {
    if (/type=["']application\/json["']/i.test(match[1])) continue;
    const scriptContent = match[2].trim();
    if (!scriptContent) continue;
    count++;
    try {
      new vm.Script(scriptContent, { filename: `${relativePath}:script[${count}]` });
    } catch (scriptErr) {
      logError(`Syntax error in ${relativePath} inline script #${count}: ${scriptErr.message}\n` +
        `Code snippet:\n${scriptContent.split('\n').slice(0, 10).join('\n')}\n...`);
    }
  }
  logSuccess(`${relativePath} parsed, verified ${count} inline script block(s) compiled successfully`);
}

function extractJsonSeed(html, id) {
  const pattern = new RegExp(`<script[^>]*id=["']${id}["'][^>]*>([\\s\\S]*?)<\\/script>`, 'i');
  const match = html.match(pattern);
  if (!match) throw new Error(`dashboard.html: missing JSON seed #${id}`);
  return JSON.parse(match[1]);
}

// 5. Validate Codex public aggregate and private-data boundary
try {
  const summary = JSON.parse(readFileSync(join(ROOT, 'codex-summary.json'), 'utf8'));
  const config = JSON.parse(readFileSync(join(ROOT, 'codex-metrics.config.json'), 'utf8'));
  const projects = JSON.parse(readFileSync(join(ROOT, 'projects.json'), 'utf8'));
  if (!summary.meta?.asOf || Number.isNaN(Date.parse(summary.meta.asOf))) {
    logError('codex-summary.json: meta.asOf must be a valid timestamp');
  }
  if (!Array.isArray(summary.projects)) {
    logError('codex-summary.json: projects must be an array');
  } else {
    const tracked = new Set(projects.projects.map((project) => project.name));
    const seen = new Set();
    for (const item of summary.projects) {
      if (!tracked.has(item.repo)) logError(`codex-summary.json: unknown repo "${item.repo}"`);
      if (seen.has(item.repo)) logError(`codex-summary.json: duplicate repo "${item.repo}"`);
      seen.add(item.repo);
      for (const window of ['allTime', 'last30Days']) {
        if (!Number.isFinite(item[window]?.totalTokens) || item[window].totalTokens < 0) {
          logError(`codex-summary.json [${item.repo}]: ${window}.totalTokens must be non-negative`);
        }
        if (!Number.isInteger(item[window]?.sessions) || item[window].sessions < 0) {
          logError(`codex-summary.json [${item.repo}]: ${window}.sessions must be a non-negative integer`);
        }
      }
      if (!['finite', 'continuous', 'unconfigured'].includes(item.forecast?.mode)) {
        logError(`codex-summary.json [${item.repo}]: invalid forecast mode "${item.forecast?.mode}"`);
      }
    }
    if (seen.size !== tracked.size) logError('codex-summary.json: every tracked project must have one aggregate row');
  }
  for (const key of ['rootSessionsWithUsage', 'mappedSessions', 'unmappedSessions', 'excludedSubagents']) {
    if (!Number.isInteger(summary.coverage?.[key]) || summary.coverage[key] < 0) {
      logError(`codex-summary.json: coverage.${key} must be a non-negative integer`);
    }
  }
  const publicText = JSON.stringify(summary);
  for (const forbidden of ['"sessionId"', '"cwd"', '"prompt"', '"sourceRoots"']) {
    if (publicText.includes(forbidden)) logError(`codex-summary.json: private key ${forbidden} must not be public`);
  }
  if (!config.forecastTiers || !config.projects) logError('codex-metrics.config.json: forecastTiers and projects are required');
  logSuccess('codex-summary.json public aggregate validation passed');
} catch (e) {
  logError(`Failed to parse or validate Codex metrics: ${e.message}`);
}

// 6. Parse & compile dashboard scripts and verify generated FALLBACKs
try {
  compileInlineScripts('dashboard.html');
  compileInlineScripts('monthly-analysis.html');
  new vm.Script(readFileSync(join(ROOT, 'scripts/dashboard.js'), 'utf8'), { filename: 'scripts/dashboard.js' });
  logSuccess('scripts/dashboard.js compiled successfully');

  const html = readFileSync(join(ROOT, 'dashboard.html'), 'utf8');
  const seeds = [
    ['fallback-projects', 'projects.json'],
    ['fallback-suggestions', 'suggestions.json'],
    ['fallback-usage', 'usage.json'],
    ['fallback-codex', 'codex-summary.json'],
  ];
  for (const [id, file] of seeds) {
    const seed = extractJsonSeed(html, id);
    const source = JSON.parse(readFileSync(join(ROOT, file), 'utf8'));
    if (JSON.stringify(seed) !== JSON.stringify(source)) logError(`dashboard.html #${id} does not match ${file}`);
  }
  logSuccess('dashboard.html JSON FALLBACKs match source files');
} catch (e) {
  logError(`Failed to read or verify dashboard scripts: ${e.message}`);
}

process.exit(exitCode);
