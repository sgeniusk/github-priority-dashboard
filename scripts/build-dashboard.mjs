// dashboard.html 셸과 file:// FALLBACK 데이터를 한 번에 생성한다.
//
// 사용법
//   node scripts/build-dashboard.mjs
//   node scripts/build-dashboard.mjs --dry-run

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'dashboard.html');

function readJson(name, fallback = {}) {
  const target = join(ROOT, name);
  return existsSync(target) ? JSON.parse(readFileSync(target, 'utf8')) : fallback;
}

function embed(value) {
  return JSON.stringify(value, null, 2).replaceAll('<', '\\u003c');
}

export function buildDashboard({ dryRun = false } = {}) {
  const projects = readJson('projects.json', { meta: {}, projects: [] });
  const suggestions = readJson('suggestions.json', { suggestions: [] });
  const usage = readJson('usage.json', { tools: [] });
  const codex = readJson('codex-summary.json', {
    meta: { asOf: null },
    coverage: {},
    totals: { allTime: {}, last30Days: {} },
    daily30: [],
    projects: [],
  });

  const html = `<!doctype html>
<html lang="ko" data-theme="dark">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="GitHub 프로젝트와 Codex 작업량을 함께 보는 개인 운영 대시보드">
  <title>Project Control Room</title>
  <link rel="stylesheet" href="dashboard.css">
</head>
<body>
  <a class="skip-link" href="#main-content">본문으로 건너뛰기</a>
  <header class="topbar">
    <a class="brand" href="dashboard.html" aria-label="Project Control Room 홈">
      <span class="brand-mark" aria-hidden="true">GP</span>
      <span><strong>Project Control Room</strong><small>Codex-first operating system</small></span>
    </a>
    <nav class="primary-nav" aria-label="대시보드 보기">
      <button class="nav-tab is-active" type="button" data-view="ops" aria-selected="true">운영실</button>
      <button class="nav-tab" type="button" data-view="projects" aria-selected="false">프로젝트</button>
      <button class="nav-tab" type="button" data-view="codex" aria-selected="false">Codex 작업</button>
      <button class="nav-tab" type="button" data-view="resources" aria-selected="false">리소스</button>
    </nav>
    <div class="top-actions">
      <a href="report.html">보고서</a>
      <a href="monthly-analysis.html">30일 분석</a>
      <button class="theme-toggle" type="button" id="theme-toggle" aria-label="색상 테마 전환">라이트</button>
    </div>
  </header>

  <main id="main-content" class="app-shell">
    <div id="freshness-strip" class="freshness-strip" role="status"></div>

    <section class="view is-active" data-view-panel="ops" aria-labelledby="ops-title">
      <div class="hero-grid">
        <article class="hero-copy">
          <p class="eyebrow">운영 판단을 위한 첫 화면</p>
          <h1 id="ops-title">완성률 대신,<br>실제 작업을 봅니다.</h1>
          <p class="hero-lead">토큰 소모량은 작업량을, 검수 단위는 완성을 설명합니다. 지금은 Codex 소비와 프로젝트 신호를 먼저 정확히 연결하고 있습니다.</p>
          <div class="hero-meta" id="hero-meta"></div>
        </article>
        <article class="hero-focus" id="hero-focus" aria-label="오늘의 최우선 프로젝트"></article>
      </div>

      <div class="kpi-grid" id="ops-kpis"></div>

      <div class="ops-grid">
        <section class="panel decision-panel" aria-labelledby="decision-title">
          <div class="panel-head">
            <div><p class="kicker">Decision queue</p><h2 id="decision-title">지금 결정할 일</h2></div>
            <button class="text-button" type="button" data-jump="projects">전체 프로젝트</button>
          </div>
          <div id="decision-list" class="decision-list"></div>
        </section>

        <section class="panel signal-panel" aria-labelledby="signal-title">
          <div class="panel-head"><div><p class="kicker">Signals</p><h2 id="signal-title">운영 신호</h2></div></div>
          <div id="signal-list" class="signal-list"></div>
        </section>
      </div>

      <section class="panel token-map-panel" aria-labelledby="token-map-title">
        <div class="panel-head">
          <div><p class="kicker">Actual work</p><h2 id="token-map-title">Codex 토큰 소진 지도</h2></div>
          <button class="text-button" type="button" data-jump="codex">집계 방식 보기</button>
        </div>
        <p class="panel-copy">막대는 최근 30일 작업량입니다. 예측선은 완성률이 아니라 초기 P50 토큰 예산과 비교한 소진 위치입니다.</p>
        <div id="token-map" class="token-map"></div>
      </section>
    </section>

    <section class="view" data-view-panel="projects" aria-labelledby="projects-title" hidden>
      <div class="section-intro">
        <div><p class="eyebrow">Portfolio</p><h1 id="projects-title">집중 프로젝트</h1><p>지금 실제로 이어가는 작업을 먼저 보고, 나머지는 정리 검토 범위에서 따로 확인합니다.</p></div>
        <div class="section-stat" id="project-section-stat"></div>
      </div>
      <div class="filter-bar" aria-label="프로젝트 필터">
        <label class="search-field"><span>검색</span><input id="project-search" type="search" placeholder="프로젝트 이름 또는 다음 액션"></label>
        <label><span>범위</span><select id="portfolio-filter"><option value="focus">집중</option><option value="active">활성 전체</option><option value="review">정리 검토</option><option value="all">전체</option></select></label>
        <label><span>상태</span><select id="status-filter"><option value="all">전체</option><option value="active">활성</option><option value="paused">일시중단</option><option value="archived">보관</option></select></label>
        <label><span>도구</span><select id="tool-filter"><option value="all">전체</option><option value="codex">Codex</option><option value="hybrid">Hybrid</option><option value="claude">Claude</option><option value="hermes">Hermes</option></select></label>
        <label><span>정렬</span><select id="project-sort"><option value="rank">우선순위</option><option value="tokens">30일 토큰</option><option value="recent">최근 Codex 활동</option><option value="risk">예측 초과 위험</option></select></label>
      </div>
      <div id="project-grid" class="project-grid"></div>
      <div id="project-empty" class="empty-state" hidden>조건에 맞는 프로젝트가 없습니다.</div>
    </section>

    <section class="view" data-view-panel="codex" aria-labelledby="codex-title" hidden>
      <div class="section-intro">
        <div><p class="eyebrow">Codex ledger</p><h1 id="codex-title">실제 작업량과 예측</h1><p>세션의 마지막 누적 token_count만 사용해 중복을 막고, 하위 에이전트는 합계에서 제외합니다.</p></div>
        <div class="section-stat" id="codex-section-stat"></div>
      </div>
      <div class="method-grid" id="method-grid"></div>
      <section class="panel chart-panel" aria-labelledby="daily-title">
        <div class="panel-head"><div><p class="kicker">30 days</p><h2 id="daily-title">프로젝트 연결 토큰 리듬</h2></div><span class="subtle" id="daily-total"></span></div>
        <div id="daily-chart" class="daily-chart" aria-label="최근 30일 토큰 막대 차트"></div>
      </section>
      <section class="panel table-panel" aria-labelledby="ledger-title">
        <div class="panel-head"><div><p class="kicker">Project ledger</p><h2 id="ledger-title">프로젝트별 Codex 원장</h2></div></div>
        <div class="table-wrap"><table><thead><tr><th>프로젝트</th><th>30일</th><th>누적</th><th>세션</th><th>예측</th><th>최근 활동</th></tr></thead><tbody id="ledger-body"></tbody></table></div>
      </section>
      <aside class="caveat" id="codex-caveat"></aside>
    </section>

    <section class="view" data-view-panel="resources" aria-labelledby="resources-title" hidden>
      <div class="section-intro">
        <div><p class="eyebrow">Capacity</p><h1 id="resources-title">리소스와 수집 상태</h1><p>계정 한도와 데이터 신선도를 작업량 원장과 분리해서 봅니다.</p></div>
        <div class="section-stat" id="resource-section-stat"></div>
      </div>
      <div id="usage-grid" class="usage-grid"></div>
      <section class="panel collection-panel" aria-labelledby="collection-title">
        <div class="panel-head"><div><p class="kicker">Collection</p><h2 id="collection-title">갱신 명령</h2></div></div>
        <div class="command-grid">
          <article><strong>Codex 작업량</strong><code>node scripts/collect-codex-metrics.mjs</code><p>로컬 세션을 다시 집계하고 공개 요약을 갱신합니다.</p></article>
          <article><strong>계정 한도</strong><code>node scripts/refresh-usage.mjs</code><p>Codex·Claude 한도 사용률과 리셋 시각을 갱신합니다.</p></article>
          <article><strong>GitHub 활동</strong><code>GH_TOKEN=... node scripts/refresh-progress.mjs</code><p>커밋, 마지막 업데이트, 보고서 데이터를 갱신합니다.</p></article>
        </div>
      </section>
    </section>
  </main>

  <footer class="footer"><span>Project Control Room</span><span id="footer-source"></span></footer>

  <script type="application/json" id="fallback-projects">${embed(projects)}</script>
  <script type="application/json" id="fallback-suggestions">${embed(suggestions)}</script>
  <script type="application/json" id="fallback-usage">${embed(usage)}</script>
  <script type="application/json" id="fallback-codex">${embed(codex)}</script>
  <script defer src="scripts/dashboard.js"></script>
</body>
</html>
`;

  if (!dryRun) writeFileSync(OUT, html);
  return `${dryRun ? '[dry-run] ' : ''}dashboard.html — 운영실·프로젝트·Codex 작업·리소스 4개 보기와 FALLBACK ${dryRun ? '생성 예정' : '생성 완료'}.`;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(buildDashboard({ dryRun: process.argv.includes('--dry-run') }));
}
