// sgeniusk GitHub 리포 활동을 수집해 projects.json의 lastUpdate/commits를 갱신하는 스크립트
//
// 사용법
//   node scripts/refresh-progress.mjs            # projects.json 갱신 + 저장
//   node scripts/refresh-progress.mjs --dry-run  # 변경 diff만 출력, 저장 안 함
//
// 인증 — GH_TOKEN 환경변수가 있으면 사용, 없으면 `gh auth token` 셸 호출.
// tool/status/breakdown 등 다른 필드는 절대 건드리지 않는다 (lastUpdate, commits, meta.asOf만 갱신).

import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const JSON_PATH = join(ROOT, 'projects.json');
const DRY_RUN = process.argv.includes('--dry-run');

function getToken() {
  if (process.env.GH_TOKEN) return process.env.GH_TOKEN.trim();
  try {
    return execSync('gh auth token', { encoding: 'utf8' }).trim();
  } catch {
    console.error('인증 토큰을 찾을 수 없습니다. GH_TOKEN을 설정하거나 `gh auth login`을 실행하세요.');
    process.exit(1);
  }
}

const TOKEN = getToken();
const API = 'https://api.github.com';
const HEADERS = {
  Authorization: `token ${TOKEN}`,
  Accept: 'application/vnd.github+json',
  'User-Agent': 'github-priority-dashboard-refresh',
};

// pushed_at(ISO, 초 포함)을 대시보드 표기용 `YYYY-MM-DDTHH:MMZ`로 정규화한다.
function normalizeTimestamp(iso) {
  return iso.replace(/:\d{2}(\.\d+)?Z$/, 'Z');
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

async function main() {
  const data = JSON.parse(readFileSync(JSON_PATH, 'utf8'));
  const owner = data.meta.owner;
  const changes = [];

  for (const p of data.projects) {
    try {
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
    } catch (err) {
      console.error(`⚠️  ${p.name} 수집 실패: ${err.message}`);
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  if (data.meta.asOf !== today) {
    changes.push(`  meta.asOf: ${data.meta.asOf} → ${today}`);
    data.meta.asOf = today;
  }

  if (changes.length === 0) {
    console.log('변경 사항 없음 — projects.json이 이미 최신입니다.');
    return;
  }

  console.log(`${DRY_RUN ? '[dry-run] ' : ''}변경 사항 ${changes.length}건:`);
  console.log(changes.join('\n'));

  if (!DRY_RUN) {
    writeFileSync(JSON_PATH, JSON.stringify(data, null, 2) + '\n');
    console.log(`\nprojects.json 저장 완료.`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
