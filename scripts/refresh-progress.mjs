// sgeniusk GitHub 리포 활동을 수집해 projects.json을 갱신하는 스크립트
//
// 사용법
//   node scripts/refresh-progress.mjs                 # projects.json 갱신 + history/activity/news/logs 저장
//   node scripts/refresh-progress.mjs --dry-run       # 변경 diff만 출력, 저장 안 함
//   node scripts/refresh-progress.mjs --activity-only # activity.json 갱신 후 news/logs 재계산
//
// 인증 — GH_TOKEN 환경변수가 있으면 사용, 없으면 `gh auth token` 셸 호출.
// 자동 갱신 대상: lastUpdate, commits, firstCommit, daysActive, meta.asOf.
// tool/status/breakdown 등 다른 필드는 절대 건드리지 않는다.
// 실행 시 history.json 완성도 스냅샷, activity.json 통합 커밋 피드, news.json 뉴스 피드, project-logs.json 누적 로그도 갱신한다 (--dry-run 시 preview).

import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { writeReports } from './report-gen.mjs';
import { buildProjectPages } from './build-project-pages.mjs';
import { buildMonthlyAnalysis } from './build-monthly-analysis.mjs';
import { buildDashboard } from './build-dashboard.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const JSON_PATH = join(ROOT, 'projects.json');
const HISTORY_PATH = join(ROOT, 'history.json');
const ACTIVITY_PATH = join(ROOT, 'activity.json');
const DRY_RUN = process.argv.includes('--dry-run');
const ACTIVITY_ONLY = process.argv.includes('--activity-only');
const COMMITS_PER_REPO = 8;

function getToken() {
  if (process.env.GH_TOKEN) return process.env.GH_TOKEN.trim();
  try {
    return execSync('gh auth token', { encoding: 'utf8' }).trim();
  } catch {
    if (DRY_RUN) return '';
    console.error('인증 토큰을 찾을 수 없습니다. GH_TOKEN을 설정하거나 `gh auth login`을 실행하세요.');
    process.exit(1);
  }
}

const TOKEN = getToken();
const API = 'https://api.github.com';
const HEADERS = {
  ...(TOKEN ? { Authorization: `token ${TOKEN}` } : {}),
  Accept: 'application/vnd.github+json',
  'User-Agent': 'github-priority-dashboard-refresh',
};

// pushed_at(ISO, 초 포함)을 대시보드 표기용 `YYYY-MM-DDTHH:MMZ`로 정규화한다.
function normalizeTimestamp(iso) {
  return iso.replace(/:\d{2}(\.\d+)?Z$/, 'Z');
}

function todayKey() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

async function fetchRepo(owner, name) {
  const res = await fetch(`${API}/repos/${owner}/${name}`, { headers: HEADERS });
  if (!res.ok) throw new Error(`repo ${name}: HTTP ${res.status}`);
  return res.json();
}

// commits?per_page=1 응답의 Link 헤더 rel="last" 페이지 번호 = 총 커밋 수.
async function fetchCommitCount(owner, name) {
  const res = await fetch(`${API}/repos/${owner}/${name}/commits?per_page=1`, { headers: HEADERS });
  if (!res.ok) throw new Error(`commits ${name}: HTTP ${res.status}`);
  const link = res.headers.get('link');
  if (link) {
    const match = link.match(/[?&]page=(\d+)>;\s*rel="last"/);
    if (match) return Number(match[1]);
  }
  const arr = await res.json();
  return Array.isArray(arr) ? arr.length : 0;
}

// 마지막 페이지(per_page=1, page=총커밋수)의 커밋 = 가장 오래된 커밋. author.date를 YYYY-MM-DD로.
async function fetchFirstCommit(owner, name, totalCommits) {
  if (!totalCommits || totalCommits < 1) return null;
  const res = await fetch(`${API}/repos/${owner}/${name}/commits?per_page=1&page=${totalCommits}`, { headers: HEADERS });
  if (!res.ok) throw new Error(`firstCommit ${name}: HTTP ${res.status}`);
  const arr = await res.json();
  const c = Array.isArray(arr) && arr[0];
  const date = c && c.commit && ((c.commit.author && c.commit.author.date) || (c.commit.committer && c.commit.committer.date));
  return date ? date.slice(0, 10) : null;
}

// 오늘 스냅샷을 history.json에 upsert한다 (같은 날짜면 교체, 최근 90개 유지).
function upsertHistory(data) {
  let hist;
  try { hist = JSON.parse(readFileSync(HISTORY_PATH, 'utf8')); }
  catch { hist = { _comment: '완성도 스냅샷 히스토리.', snapshots: [] }; }
  if (!Array.isArray(hist.snapshots)) hist.snapshots = [];
  const active = data.projects.filter((p) => p.status === 'active');
  const assessedActive = active.filter((p) => p.progressAssessed !== false);
  const projMap = {};
  data.projects.forEach((p) => {
    projMap[p.name] = {
      total: p.progress.total,
      commits: p.commits || 0,
      ...(p.progressAssessed === false ? { assessed: false } : {}),
    };
  });
  const snap = {
    date: data.meta.asOf,
    avgProgress: assessedActive.length
      ? Math.round(assessedActive.reduce((s, p) => s + p.progress.total, 0) / assessedActive.length)
      : 0,
    totalCommits: data.projects.reduce((s, p) => s + (p.commits || 0), 0),
    active: active.length,
    projects: projMap,
  };
  const i = hist.snapshots.findIndex((s) => s.date === snap.date);
  if (i >= 0) hist.snapshots[i] = snap; else hist.snapshots.push(snap);
  hist.snapshots.sort((a, b) => a.date.localeCompare(b.date));
  if (hist.snapshots.length > 90) hist.snapshots = hist.snapshots.slice(-90);
  writeFileSync(HISTORY_PATH, JSON.stringify(hist, null, 2) + '\n');
  return `history.json 스냅샷 upsert — ${snap.date} (avg ${snap.avgProgress}%, 총 커밋 ${snap.totalCommits}), 스냅샷 ${hist.snapshots.length}개.`;
}

// 리포의 최근 커밋 N개 — 목록 엔드포인트(sha·message·date). 통합 활동 피드용.
async function fetchRecentCommits(owner, name, n) {
  const res = await fetch(`${API}/repos/${owner}/${name}/commits?per_page=${n}`, { headers: HEADERS });
  if (!res.ok) throw new Error(`recent commits ${name}: HTTP ${res.status}`);
  const arr = await res.json();
  if (!Array.isArray(arr)) return [];
  return arr.map((c) => ({
    repo: name,
    sha: (c.sha || '').slice(0, 7),
    message: ((c.commit && c.commit.message) || '').split('\n')[0],
    date: (c.commit && ((c.commit.author && c.commit.author.date) || (c.commit.committer && c.commit.committer.date))) || '',
  })).filter((c) => c.date && c.sha);
}

// 전 리포 최근 커밋을 날짜 내림차순으로 모아 activity.json에 쓴다 (최근 150건).
function writeActivity(allCommits) {
  const commits = allCommits
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 150);
  const out = {
    _comment: '전 프로젝트 통합 커밋 피드. refresh-progress.mjs가 각 추적 리포의 최근 커밋을 수집한다. 대시보드 활동 탭이 읽는다.',
    asOf: todayKey(),
    commits,
  };
  writeFileSync(ACTIVITY_PATH, JSON.stringify(out, null, 2) + '\n');
  return `activity.json — 커밋 ${commits.length}건 수집.`;
}

async function main() {
  const data = JSON.parse(readFileSync(JSON_PATH, 'utf8'));
  const owner = data.meta.owner;
  const today = todayKey();
  const changes = [];
  const allCommits = [];

  for (const p of data.projects) {
    if (p.activitySource === 'local') {
      console.log(`↷ ${p.name} — 로컬 활동 소스라 GitHub 수집에서 제외합니다.`);
      continue;
    }
    try {
      // 통합 활동 피드용 — 최근 커밋 수집
      try {
        allCommits.push(...await fetchRecentCommits(owner, p.name, COMMITS_PER_REPO));
      } catch (e) {
        console.error(`⚠️  ${p.name} 커밋 피드 수집 실패: ${e.message}`);
      }
      if (ACTIVITY_ONLY) continue;

      const repo = await fetchRepo(owner, p.name);
      const newLastUpdate = normalizeTimestamp(repo.pushed_at);
      const newCommits = await fetchCommitCount(owner, p.name);

      if (p.lastUpdate !== newLastUpdate) {
        changes.push(`  ${p.name}: lastUpdate ${p.lastUpdate} → ${newLastUpdate}`);
        p.lastUpdate = newLastUpdate;
      }
      if (p.commits !== newCommits) {
        changes.push(`  ${p.name}: commits ${p.commits} → ${newCommits}`);
        p.commits = newCommits;
      }

      const newFirstCommit = await fetchFirstCommit(owner, p.name, newCommits);
      if (newFirstCommit && p.firstCommit !== newFirstCommit) {
        changes.push(`  ${p.name}: firstCommit ${p.firstCommit} → ${newFirstCommit}`);
        p.firstCommit = newFirstCommit;
      }
      if (p.firstCommit && /^\d{4}-\d{2}-\d{2}$/.test(p.firstCommit)) {
        const newDays = Math.max(0, Math.round((new Date(today) - new Date(p.firstCommit)) / 86400000));
        if (p.daysActive !== newDays) {
          changes.push(`  ${p.name}: daysActive ${p.daysActive} → ${newDays}`);
          p.daysActive = newDays;
        }
      }
    } catch (err) {
      console.error(`⚠️  ${p.name} 수집 실패: ${err.message}`);
    }
  }

  if (DRY_RUN) {
    console.log(`[dry-run] activity.json 커밋 ${allCommits.length}건 수집(저장 안 함).`);
  } else {
    console.log(writeActivity(allCommits));
  }
  if (ACTIVITY_ONLY) {
    console.log(writeReports({ dryRun: DRY_RUN }));
    console.log(buildProjectPages({ dryRun: DRY_RUN }));
    console.log(await buildMonthlyAnalysis({ dryRun: DRY_RUN }));
    console.log(buildDashboard({ dryRun: DRY_RUN }));
    return;
  }

  if (data.meta.asOf !== today) {
    changes.push(`  meta.asOf: ${data.meta.asOf} → ${today}`);
    data.meta.asOf = today;
  }

  if (changes.length === 0) {
    console.log('변경 사항 없음 — projects.json이 이미 최신입니다.');
  } else {
    console.log(`${DRY_RUN ? '[dry-run] ' : ''}변경 사항 ${changes.length}건:`);
    console.log(changes.join('\n'));
  }

  if (DRY_RUN) {
    console.log('[dry-run] projects.json·history.json·news.json·project-logs.json은 저장하지 않습니다.');
    console.log(writeReports({ dryRun: DRY_RUN }));
    console.log(buildProjectPages({ dryRun: DRY_RUN }));
    console.log(await buildMonthlyAnalysis({ dryRun: DRY_RUN }));
    console.log(buildDashboard({ dryRun: DRY_RUN }));
    return;
  }
  if (changes.length > 0) {
    writeFileSync(JSON_PATH, JSON.stringify(data, null, 2) + '\n');
    console.log('\nprojects.json 저장 완료.');
  }
  console.log(upsertHistory(data));
  console.log(writeReports());
  console.log(buildProjectPages());
  console.log(await buildMonthlyAnalysis());
  console.log(buildDashboard());
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
