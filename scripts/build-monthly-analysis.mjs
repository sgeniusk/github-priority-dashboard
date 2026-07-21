import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PROJECTS_PATH = join(ROOT, 'projects.json');
const OUT_PATH = join(ROOT, 'monthly-analysis.json');
const HTML_PATH = join(ROOT, 'monthly-analysis.html');
const CLI_DRY_RUN = process.argv.includes('--dry-run');
const WINDOW_DAYS = 30;
const API = 'https://api.github.com';

function getToken() {
  if (process.env.GH_TOKEN) return process.env.GH_TOKEN.trim();
  try {
    return execSync('gh auth token', { encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

function addDays(date, days) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function dateKey(date) {
  return date.toISOString().slice(0, 10);
}

function parseDateKey(key) {
  return new Date(`${key}T00:00:00Z`);
}

function daysBetween(a, b) {
  return Math.round((parseDateKey(b) - parseDateKey(a)) / 86400000);
}

function toolLabel(tool) {
  return {
    claude: 'Claude',
    codex: 'Codex',
    hermes: 'Hermes',
    hybrid: 'Hybrid',
  }[tool] || tool;
}

function categoryLabel(category) {
  return {
    app: '앱',
    game: '게임',
    content: '콘텐츠',
  }[category] || category;
}

function classifyMessage(message) {
  const m = message.toLowerCase();
  if (/(fix|bug|hotfix|stabil|repair|patch|오류|수정|안정)/.test(m)) return 'stability';
  if (/(test|spec|qa|harness|playtest|검증|테스트)/.test(m)) return 'verification';
  if (/(doc|readme|report|brief|prd|roadmap|문서|보고서)/.test(m)) return 'docs';
  if (/(style|ui|ux|design|layout|responsive|css|visual|디자인|화면)/.test(m)) return 'experience';
  if (/(feat|feature|add|implement|phase|wave|기능|구현|추가)/.test(m)) return 'feature';
  return 'maintenance';
}

function themeLabel(theme) {
  return {
    feature: '기능 구현',
    stability: '안정화',
    verification: '검증',
    docs: '문서화',
    experience: '경험/화면',
    maintenance: '정리/운영',
  }[theme] || theme;
}

function insightFor(project, commits, activeDays, quietDays, maxGap, topTheme) {
  if (!commits) {
    return `${project.displayName}은 이번 30일 창에서 새 커밋이 보이지 않았습니다. 상태를 유지할 이유가 없다면 다음 세션에서 보류 사유나 재개 조건을 다시 적어두는 편이 좋습니다.`;
  }
  if (commits >= 40) {
    return `${project.displayName}은 ${commits}커밋으로 한 달의 중심 작업축이었습니다. 속도는 충분하니 다음 판단은 기능 추가보다 검증 산출물과 릴리스 기준을 고정하는 쪽이 좋습니다.`;
  }
  if (activeDays >= 8) {
    return `${project.displayName}은 ${activeDays}일에 걸쳐 꾸준히 움직였습니다. 가장 많이 보인 결은 ${themeLabel(topTheme)}이고, 이제 남은 위험을 한 장짜리 체크리스트로 압축할 시점입니다.`;
  }
  if (quietDays <= 3) {
    return `${project.displayName}은 최근까지 손이 닿았습니다. 커밋 수는 과열권은 아니지만 이어서 처리할 맥락이 살아 있으므로 다음 세션 진입 비용이 낮습니다.`;
  }
  if (maxGap >= 14) {
    return `${project.displayName}은 한 달 안에서도 긴 공백이 보입니다. 다시 잡을 때는 새 기능보다 실행 명령, 현재 깨진 지점, 다음 1시간 목표부터 확인하는 편이 안전합니다.`;
  }
  return `${project.displayName}은 제한된 횟수로 움직였습니다. 커밋의 결은 ${themeLabel(topTheme)} 쪽이라, 다음에는 작은 완료 증거를 남기는 작업이 효율적입니다.`;
}

async function fetchCommits({ owner, repo, sinceIso, untilIso, headers }) {
  const commits = [];
  for (let page = 1; page <= 10; page += 1) {
    const url = `${API}/repos/${owner}/${repo}/commits?since=${encodeURIComponent(sinceIso)}&until=${encodeURIComponent(untilIso)}&per_page=100&page=${page}`;
    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error(`${repo} commits HTTP ${response.status}`);
    const rows = await response.json();
    if (!Array.isArray(rows) || rows.length === 0) break;
    commits.push(...rows.map((item) => ({
      sha: (item.sha || '').slice(0, 7),
      message: ((item.commit && item.commit.message) || '').split('\n')[0],
      date: (item.commit && ((item.commit.author && item.commit.author.date) || (item.commit.committer && item.commit.committer.date))) || '',
      url: item.html_url || '',
    })).filter((item) => item.sha && item.date));
    if (rows.length < 100) break;
  }
  return commits.sort((a, b) => a.date.localeCompare(b.date));
}

function buildRepoAnalysis(project, commits, startKey, endKey) {
  const byDate = {};
  const themes = {};
  commits.forEach((commit) => {
    const key = commit.date.slice(0, 10);
    byDate[key] = (byDate[key] || 0) + 1;
    const theme = classifyMessage(commit.message);
    themes[theme] = (themes[theme] || 0) + 1;
  });
  const activeDays = Object.keys(byDate).length;
  const first = commits[0] || null;
  const last = commits[commits.length - 1] || null;
  const quietDays = last ? daysBetween(last.date.slice(0, 10), endKey) : WINDOW_DAYS;
  const activeKeys = Object.keys(byDate).sort();
  let maxGap = activeKeys.length ? daysBetween(startKey, activeKeys[0]) : WINDOW_DAYS;
  for (let i = 1; i < activeKeys.length; i += 1) {
    maxGap = Math.max(maxGap, daysBetween(activeKeys[i - 1], activeKeys[i]) - 1);
  }
  if (activeKeys.length) maxGap = Math.max(maxGap, daysBetween(activeKeys[activeKeys.length - 1], endKey));
  const topTheme = Object.entries(themes).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] || 'maintenance';

  let state = 'quiet';
  if (commits.length >= 25 || activeDays >= 8) state = 'surge';
  else if (commits.length >= 8 || quietDays <= 3) state = 'steady';
  else if (commits.length > 0) state = 'sporadic';

  return {
    repo: project.name,
    displayName: project.displayName,
    icon: project.icon,
    category: project.category,
    categoryLabel: categoryLabel(project.category),
    tool: project.tool,
    toolLabel: toolLabel(project.tool),
    status: project.status,
    rank: project.rank,
    progressTotal: project.progress.total,
    commits: commits.length,
    activeDays,
    quietDays,
    maxGap,
    firstCommit: first ? first.date : null,
    lastCommit: last ? last.date : null,
    state,
    topTheme,
    themeLabel: themeLabel(topTheme),
    themes,
    byDate,
    latest: commits.slice(-5).reverse(),
    insight: insightFor(project, commits.length, activeDays, quietDays, maxGap, topTheme),
  };
}

function buildDailySeries(startKey, endKey, repoAnalyses) {
  const days = [];
  for (let d = parseDateKey(startKey); dateKey(d) <= endKey; d = addDays(d, 1)) {
    const date = dateKey(d);
    const commits = repoAnalyses.reduce((sum, repo) => sum + (repo.byDate[date] || 0), 0);
    days.push({ date, commits });
  }
  return days;
}

function buildBreakdown(repoAnalyses, key) {
  const map = {};
  repoAnalyses.forEach((repo) => {
    const id = repo[key];
    if (!map[id]) {
      map[id] = {
        id,
        label: key === 'category' ? repo.categoryLabel : repo.toolLabel,
        commits: 0,
        repos: 0,
        activeRepos: 0,
      };
    }
    map[id].repos += 1;
    map[id].commits += repo.commits;
    if (repo.commits > 0) map[id].activeRepos += 1;
  });
  return Object.values(map).sort((a, b) => b.commits - a.commits || a.label.localeCompare(b.label));
}

function syncHtmlFallback(data) {
  if (!existsSync(HTML_PATH)) return;
  const marker = 'const FALLBACK_ANALYSIS = ';
  const html = readFileSync(HTML_PATH, 'utf8');
  const start = html.indexOf(marker);
  if (start === -1) return;
  let i = start + marker.length;
  while (/\s/.test(html[i])) i += 1;
  if (html[i] !== '{') return;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let j = i; j < html.length; j += 1) {
    const ch = html[j];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        const next = html.slice(0, i) + JSON.stringify(data, null, 2) + html.slice(j + 1);
        writeFileSync(HTML_PATH, next);
        return;
      }
    }
  }
}

export async function buildMonthlyAnalysis({ dryRun = false } = {}) {
  const projectsData = JSON.parse(readFileSync(PROJECTS_PATH, 'utf8'));
  const owner = projectsData.meta.owner;
  const endKey = projectsData.meta.asOf;
  const startKey = dateKey(addDays(parseDateKey(endKey), -(WINDOW_DAYS - 1)));
  const sinceIso = `${startKey}T00:00:00Z`;
  const untilIso = `${endKey}T23:59:59Z`;
  const token = getToken();
  const headers = {
    ...(token ? { Authorization: `token ${token}` } : {}),
    Accept: 'application/vnd.github+json',
    'User-Agent': 'github-priority-dashboard-monthly-analysis',
  };

  const analyses = [];
  const errors = [];
  for (const project of projectsData.projects) {
    try {
      const commits = await fetchCommits({ owner, repo: project.name, sinceIso, untilIso, headers });
      analyses.push(buildRepoAnalysis(project, commits, startKey, endKey));
    } catch (error) {
      errors.push({ repo: project.name, message: error.message });
      analyses.push(buildRepoAnalysis(project, [], startKey, endKey));
    }
  }

  const totalCommits = analyses.reduce((sum, repo) => sum + repo.commits, 0);
  const activeRepos = analyses.filter((repo) => repo.commits > 0).length;
  const quietRepos = analyses.filter((repo) => repo.commits === 0).length;
  const activeDays = buildDailySeries(startKey, endKey, analyses).filter((day) => day.commits > 0).length;
  const topRepos = analyses.slice().sort((a, b) => b.commits - a.commits || a.rank - b.rank).slice(0, 6);
  const quietList = analyses.slice().sort((a, b) => b.quietDays - a.quietDays || a.rank - b.rank).slice(0, 6);
  const themeTotals = {};
  analyses.forEach((repo) => {
    Object.entries(repo.themes).forEach(([theme, count]) => {
      themeTotals[theme] = (themeTotals[theme] || 0) + count;
    });
  });
  const themes = Object.entries(themeTotals)
    .map(([id, commits]) => ({ id, label: themeLabel(id), commits }))
    .sort((a, b) => b.commits - a.commits || a.label.localeCompare(b.label));

  const leader = topRepos[0];
  const diagnosis = [
    leader
      ? `이번 30일의 중심은 ${leader.displayName}입니다. ${leader.commits}커밋과 ${leader.activeDays}일의 활동일이 관찰되어, 가장 많은 실제 손길을 받았습니다.`
      : '이번 30일에는 커밋 활동이 관찰되지 않았습니다.',
    activeRepos >= Math.ceil(analyses.length / 2)
      ? `전체 ${analyses.length}개 중 ${activeRepos}개 리포가 움직였습니다. 포트폴리오 전반이 완전히 멈춘 상태는 아니고, 관심이 여러 프로젝트로 분산된 상태에 가깝습니다.`
      : `전체 ${analyses.length}개 중 ${activeRepos}개 리포만 움직였습니다. 지금은 확장보다 재개 조건을 좁히는 운영 판단이 더 중요합니다.`,
    quietRepos
      ? `${quietRepos}개 리포는 한 달 동안 새 커밋이 없었습니다. 보류 프로젝트는 괜찮지만, 활성 프로젝트가 여기에 포함되면 다음 액션의 크기를 줄여야 합니다.`
      : '한 달 동안 완전히 조용한 리포는 없었습니다. 다음 과제는 활동을 릴리스 증거로 전환하는 것입니다.',
  ];

  const output = {
    _comment: '최근 30일 GitHub 커밋 관찰 분석. scripts/build-monthly-analysis.mjs가 생성하며 monthly-analysis.html의 FALLBACK_ANALYSIS와 동기화한다.',
    generatedAt: endKey,
    owner,
    window: { start: startKey, end: endKey, days: WINDOW_DAYS },
    summary: {
      totalRepos: analyses.length,
      activeRepos,
      quietRepos,
      totalCommits,
      activeDays,
      avgCommitsPerActiveRepo: activeRepos ? Number((totalCommits / activeRepos).toFixed(1)) : 0,
      leaderRepo: leader ? leader.repo : '',
      leaderName: leader ? leader.displayName : '',
    },
    daily: buildDailySeries(startKey, endKey, analyses),
    breakdowns: {
      category: buildBreakdown(analyses, 'category'),
      tool: buildBreakdown(analyses, 'tool'),
      themes,
    },
    diagnosis,
    repos: analyses.sort((a, b) => b.commits - a.commits || a.rank - b.rank),
    topRepos,
    quietList,
    errors,
  };

  if (dryRun) {
    console.log(`[dry-run] monthly-analysis.json — ${totalCommits} commits, ${activeRepos}/${analyses.length} repos active, ${startKey}..${endKey}`);
    if (errors.length) console.log(`[dry-run] errors: ${errors.map((e) => `${e.repo}: ${e.message}`).join(', ')}`);
    return `[dry-run] monthly-analysis.json — ${totalCommits} commits, ${activeRepos}/${analyses.length} repos active.`;
  }
  writeFileSync(OUT_PATH, JSON.stringify(output, null, 2) + '\n');
  syncHtmlFallback(output);
  const message = `monthly-analysis.json — ${totalCommits} commits, ${activeRepos}/${analyses.length} repos active, ${startKey}..${endKey}`;
  if (errors.length) return `${message}\n수집 경고 ${errors.length}건: ${errors.map((e) => `${e.repo}: ${e.message}`).join(', ')}`;
  return message;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  buildMonthlyAnalysis({ dryRun: CLI_DRY_RUN }).then((message) => {
    console.log(message);
  }).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
