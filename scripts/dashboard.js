(function dashboardApp() {
  'use strict';

  const STATUS_LABELS = { active: '활성', paused: '일시중단', archived: '보관' };
  const TOOL_LABELS = { claude: 'Claude', codex: 'Codex', hermes: 'Hermes', hybrid: 'Hybrid' };
  const CATEGORY_LABELS = { game: '게임', app: '앱', content: '콘텐츠' };
  const SEVERITY_WEIGHT = { high: 30, warn: 16, info: 6 };
  const DAY_MS = 86_400_000;
  const state = {
    projectsData: { meta: {}, projects: [] },
    suggestionsData: { items: [] },
    usageData: { tools: [] },
    codexData: { meta: {}, coverage: {}, calibration: {}, totals: {}, daily30: [], projects: [] },
    view: 'ops',
  };

  function byId(id) {
    return document.getElementById(id);
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function fallback(id) {
    const node = byId(id);
    if (!node) return {};
    try {
      return JSON.parse(node.textContent);
    } catch (error) {
      console.error(`${id} JSON 파싱 실패.`, error);
      return {};
    }
  }

  async function loadJson(path, fallbackId) {
    try {
      const response = await fetch(path, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch {
      return fallback(fallbackId);
    }
  }

  function parseDate(value) {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function daysSince(value) {
    const date = parseDate(value);
    if (!date) return null;
    return Math.max(0, Math.floor((Date.now() - date.getTime()) / DAY_MS));
  }

  function relativeDate(value) {
    const days = daysSince(value);
    if (days == null) return '기록 없음';
    if (days === 0) return '오늘';
    if (days === 1) return '어제';
    if (days < 30) return `${days}일 전`;
    if (days < 365) return `${Math.floor(days / 30)}개월 전`;
    return `${Math.floor(days / 365)}년 전`;
  }

  function formatDate(value, includeTime) {
    const date = parseDate(value);
    if (!date) return '기록 없음';
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {}),
    }).format(date);
  }

  function formatTokens(value) {
    const tokens = Number(value || 0);
    if (tokens >= 100_000_000) return `${(tokens / 100_000_000).toFixed(tokens >= 10_000_000_000 ? 0 : 1)}억`;
    if (tokens >= 10_000) return `${(tokens / 10_000).toFixed(tokens >= 10_000_000 ? 0 : 1)}만`;
    return tokens.toLocaleString('ko-KR');
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function projectMetricsMap() {
    return new Map((state.codexData.projects || []).map((item) => [item.repo, item]));
  }

  function suggestionMap() {
    const map = new Map();
    for (const item of state.suggestionsData.items || []) {
      if (!map.has(item.repo)) map.set(item.repo, []);
      map.get(item.repo).push(item);
    }
    return map;
  }

  function projectViewModels() {
    const metrics = projectMetricsMap();
    const suggestions = suggestionMap();
    return (state.projectsData.projects || []).map((project) => ({
      ...project,
      codex: metrics.get(project.name) || {
        repo: project.name,
        allTime: { totalTokens: 0, sessions: 0 },
        last30Days: { totalTokens: 0, sessions: 0 },
        lastActivity: null,
        forecast: { mode: 'unconfigured', confidence: 'none' },
      },
      suggestions: suggestions.get(project.name) || [],
    }));
  }

  function severityFor(project) {
    return project.suggestions.reduce((max, item) => Math.max(max, SEVERITY_WEIGHT[item.severity] || 0), 0);
  }

  function decisionScore(project) {
    if (project.status !== 'active') return -Infinity;
    const rankWeight = Math.max(0, 22 - project.rank);
    const tokenWeight = Math.min(22, Math.log10((project.codex.last30Days.totalTokens || 0) + 1) * 2.6);
    const forecastWeight = project.codex.forecast?.burnP50Pct > 100 ? 12 : 0;
    return rankWeight + tokenWeight + severityFor(project) + forecastWeight;
  }

  function forecastLabel(forecast, short) {
    if (!forecast || forecast.mode === 'unconfigured') return short ? '규모 미설정' : '규모 등급을 정하면 예측을 시작합니다.';
    if (forecast.mode === 'continuous') return short ? '지속형' : '지속형 프로젝트라 완성 백분율을 계산하지 않습니다.';
    if (forecast.confidence === 'none' || forecast.burnP50Pct == null) return short ? '표본 대기' : '개인 세션 기준값이 더 필요합니다.';
    return short
      ? `P50 대비 ${forecast.burnP50Pct}%`
      : `${forecast.tierLabel || '유한 프로젝트'} · P50 예산 대비 ${forecast.burnP50Pct}% 소진`;
  }

  function nextAction(project) {
    return project.nextActions?.[0]
      || project.suggestions?.[0]?.actions?.[0]
      || project.pausedReason
      || '다음 검수 단위를 아직 기록하지 않았습니다.';
  }

  function renderFreshness() {
    const projectAge = daysSince(state.projectsData.meta?.asOf);
    const codexAge = daysSince(state.codexData.meta?.asOf);
    const usageAge = daysSince(state.usageData.asOf);
    const stale = projectAge == null || projectAge > 2 || codexAge == null || codexAge > 1;
    const strip = byId('freshness-strip');
    strip.classList.toggle('is-stale', stale);
    strip.innerHTML = `
      <span><strong>데이터 상태</strong> · GitHub ${projectAge == null ? '미확인' : `${projectAge}일 전`} · Codex ${codexAge == null ? '미확인' : `${codexAge}일 전`} · 한도 ${usageAge == null ? '미확인' : `${usageAge}일 전`}</span>
      <span>${stale ? '판단 전에 오래된 소스를 확인하세요.' : '핵심 데이터가 최근 수집 범위 안에 있습니다.'}</span>
    `;
    byId('footer-source').textContent = `GitHub ${state.projectsData.meta?.asOf || '미확인'} · Codex ${formatDate(state.codexData.meta?.asOf, true)}`;
  }

  function renderHero(projects) {
    const active = projects.filter((project) => project.status === 'active');
    const focus = [...active].sort((a, b) => decisionScore(b) - decisionScore(a))[0];
    const coverage = state.codexData.coverage || {};
    byId('hero-meta').innerHTML = `
      <span>활성 ${active.length}개</span>
      <span>Codex 연결 ${coverage.projectsWithUsage || 0}개</span>
      <span>root 세션 ${coverage.rootSessionsWithUsage || 0}개</span>
    `;
    if (!focus) {
      byId('hero-focus').innerHTML = '<p class="focus-label">오늘의 초점</p><h2 class="focus-name">활성 프로젝트 없음</h2><p class="focus-purpose">프로젝트 상태를 먼저 확인하세요.</p>';
      return;
    }
    byId('hero-focus').innerHTML = `
      <div class="focus-head"><span class="focus-label">오늘의 초점</span><span class="focus-rank">Priority ${escapeHtml(focus.rank)}</span></div>
      <h2 class="focus-name">${escapeHtml(focus.displayName)}</h2>
      <p class="focus-purpose">${escapeHtml(focus.rationale || focus.stack?.join(' · ') || '')}</p>
      <div class="focus-action"><small>다음 검수 단위</small><strong>${escapeHtml(nextAction(focus))}</strong></div>
      <div class="focus-stats">
        <div><span>최근 30일 Codex</span><strong>${formatTokens(focus.codex.last30Days.totalTokens)} 토큰</strong></div>
        <div><span>예측 위치</span><strong>${escapeHtml(forecastLabel(focus.codex.forecast, true))}</strong></div>
      </div>
    `;
  }

  function renderKpis(projects) {
    const totals = state.codexData.totals || {};
    const coverage = state.codexData.coverage || {};
    const active = projects.filter((project) => project.status === 'active').length;
    const mappedRatio = coverage.rootSessionsWithUsage
      ? Math.round((coverage.mappedSessions / coverage.rootSessionsWithUsage) * 100)
      : 0;
    const overBudget = projects.filter((project) => project.codex.forecast?.burnP50Pct > 100).length;
    const cards = [
      ['최근 30일 Codex 소비', `${formatTokens(totals.last30Days?.totalTokens)} 토큰`, `${totals.last30Days?.sessions || 0}개 root 세션`, ''],
      ['프로젝트 연결률', `${mappedRatio}%`, `${coverage.unmappedSessions || 0}개 세션은 아직 분류 대기`, mappedRatio < 70 ? 'is-alert' : ''],
      ['활성 프로젝트', `${active}개`, `전체 ${projects.length}개 중 현재 운영`, ''],
      ['P50 초기 예측 초과', `${overBudget}개`, '완성 실패가 아니라 예산 재산정 신호', overBudget ? 'is-alert' : ''],
    ];
    byId('ops-kpis').innerHTML = cards.map(([label, value, note, klass]) => `
      <article class="kpi-card ${klass}"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><small>${escapeHtml(note)}</small></article>
    `).join('');
  }

  function renderDecisions(projects) {
    const queue = [...projects]
      .filter((project) => project.status === 'active')
      .sort((a, b) => decisionScore(b) - decisionScore(a))
      .slice(0, 5);
    byId('decision-list').innerHTML = queue.map((project, index) => {
      const suggestion = [...project.suggestions].sort((a, b) => (SEVERITY_WEIGHT[b.severity] || 0) - (SEVERITY_WEIGHT[a.severity] || 0))[0];
      const action = suggestion?.actions?.[0] || nextAction(project);
      const reason = suggestion?.title || `${TOOL_LABELS[project.tool] || project.tool} 작업 · 우선순위 ${project.rank}`;
      return `
        <article class="decision-item">
          <span class="decision-index">${index + 1}</span>
          <div><h3>${escapeHtml(project.displayName)}</h3><p><strong>${escapeHtml(action)}</strong><br>${escapeHtml(reason)}</p></div>
          <div class="decision-metric"><strong>${formatTokens(project.codex.last30Days.totalTokens)}</strong><span>30일 토큰</span></div>
        </article>
      `;
    }).join('');
  }

  function renderSignals(projects) {
    const coverage = state.codexData.coverage || {};
    const totals = state.codexData.totals?.allTime || {};
    const cachedShare = totals.inputTokens ? Math.round((totals.cachedInputTokens / totals.inputTokens) * 100) : 0;
    const projectAge = daysSince(state.projectsData.meta?.asOf);
    const usageAge = daysSince(state.usageData.asOf);
    const highSuggestions = projects.reduce((sum, project) => sum + project.suggestions.filter((item) => item.severity === 'high').length, 0);
    const items = [
      {
        title: `분류 대기 root 세션 ${coverage.unmappedSessions || 0}개`,
        copy: '다른 Codex 작업 공간은 자동 집계되지만 추적 프로젝트와 연결되지 않았습니다.',
        level: coverage.unmappedSessions > 50 ? 'warn' : '',
        badge: coverage.unmappedSessions > 50 ? '정리 필요' : '양호',
      },
      {
        title: `GitHub 데이터 ${projectAge == null ? '미확인' : `${projectAge}일 경과`}`,
        copy: '로컬·Unity 작업은 GitHub 날짜만으로 실제 진행을 판단할 수 없습니다.',
        level: projectAge > 2 ? 'high' : '',
        badge: projectAge > 2 ? '오래됨' : '최근',
      },
      {
        title: `캐시 입력 비중 ${cachedShare}%`,
        copy: '토큰 작업량에는 반복 컨텍스트가 포함되므로 품질·완료와 같지 않습니다.',
        level: cachedShare > 90 ? 'warn' : '',
        badge: '해석 주의',
      },
      {
        title: `높은 우선도 제안 ${highSuggestions}건`,
        copy: `계정 한도 데이터는 ${usageAge == null ? '수집되지 않음' : `${usageAge}일 전`} 기준입니다.`,
        level: highSuggestions ? 'high' : '',
        badge: highSuggestions ? '확인 필요' : '양호',
      },
    ];
    byId('signal-list').innerHTML = items.map((item) => `
      <article class="signal-item"><div class="signal-line"><strong>${escapeHtml(item.title)}</strong><span class="signal-level ${item.level}">${escapeHtml(item.badge)}</span></div><p>${escapeHtml(item.copy)}</p></article>
    `).join('');
  }

  function renderTokenMap(projects) {
    const rows = [...projects]
      .filter((project) => project.codex.last30Days.totalTokens > 0 || project.codex.allTime.totalTokens > 0)
      .sort((a, b) => b.codex.last30Days.totalTokens - a.codex.last30Days.totalTokens)
      .slice(0, 10);
    const max = Math.max(1, ...rows.map((project) => project.codex.last30Days.totalTokens || 0));
    byId('token-map').innerHTML = rows.length ? rows.map((project) => {
      const recent = project.codex.last30Days.totalTokens || 0;
      const fill = clamp((recent / max) * 100, 0, 100);
      const p50 = project.codex.forecast?.p50Tokens;
      const budget = p50 ? clamp((p50 / Math.max(max, p50)) * 100, 2, 98) : null;
      return `
        <div class="token-row">
          <div class="token-name"><strong>${escapeHtml(project.displayName)}</strong><span>${escapeHtml(forecastLabel(project.codex.forecast, true))}</span></div>
          <div class="token-track" title="최근 30일 ${formatTokens(recent)} 토큰">
            <div class="token-fill" style="width:${fill.toFixed(1)}%"></div>
            ${budget == null ? '' : `<span class="token-budget" style="left:${budget.toFixed(1)}%" title="P50 초기 예산"></span>`}
          </div>
          <div class="token-value"><strong>${formatTokens(recent)}</strong><span>누적 ${formatTokens(project.codex.allTime.totalTokens)}</span></div>
        </div>
      `;
    }).join('') : '<div class="empty-state">프로젝트에 연결된 Codex 세션이 아직 없습니다.</div>';
  }

  function renderOps(projects) {
    renderHero(projects);
    renderKpis(projects);
    renderDecisions(projects);
    renderSignals(projects);
    renderTokenMap(projects);
  }

  function renderProjectCards() {
    const query = byId('project-search').value.trim().toLowerCase();
    const status = byId('status-filter').value;
    const tool = byId('tool-filter').value;
    const sort = byId('project-sort').value;
    let projects = projectViewModels().filter((project) => {
      const haystack = [project.displayName, project.name, project.rationale, ...(project.nextActions || [])].join(' ').toLowerCase();
      return (!query || haystack.includes(query))
        && (status === 'all' || project.status === status)
        && (tool === 'all' || project.tool === tool);
    });
    const sorters = {
      rank: (a, b) => a.rank - b.rank,
      tokens: (a, b) => b.codex.last30Days.totalTokens - a.codex.last30Days.totalTokens || a.rank - b.rank,
      recent: (a, b) => String(b.codex.lastActivity || '').localeCompare(String(a.codex.lastActivity || '')) || a.rank - b.rank,
      risk: (a, b) => (b.codex.forecast?.burnP50Pct || -1) - (a.codex.forecast?.burnP50Pct || -1) || a.rank - b.rank,
    };
    projects.sort(sorters[sort] || sorters.rank);
    byId('project-section-stat').innerHTML = `<strong>${projects.length}개</strong><span>현재 필터 결과</span>`;
    byId('project-grid').innerHTML = projects.map((project) => {
      const forecast = project.codex.forecast || {};
      const forecastOver = forecast.burnP50Pct > 100;
      return `
        <article class="project-card">
          <div class="project-top"><div class="chip-row"><span class="chip">${escapeHtml(STATUS_LABELS[project.status] || project.status)}</span><span class="chip tool-${escapeHtml(project.tool)}">${escapeHtml(TOOL_LABELS[project.tool] || project.tool)}</span><span class="chip">${escapeHtml(CATEGORY_LABELS[project.category] || project.category)}</span></div><span class="project-rank">P${project.rank}</span></div>
          <h2>${escapeHtml(project.displayName)}</h2>
          <p class="project-purpose">${escapeHtml(project.rationale || project.stack?.join(' · ') || '프로젝트 설명이 없습니다.')}</p>
          <div class="project-action"><span>다음 검수 단위</span><strong>${escapeHtml(nextAction(project))}</strong></div>
          <div class="project-metrics">
            <div><span>30일 토큰</span><strong>${formatTokens(project.codex.last30Days.totalTokens)}</strong></div>
            <div><span>Codex 세션</span><strong>${project.codex.allTime.sessions || 0}개</strong></div>
            <div><span>마지막 활동</span><strong>${relativeDate(project.codex.lastActivity || project.lastUpdate)}</strong></div>
          </div>
          <p class="forecast-note ${forecastOver ? 'is-over' : ''}">${escapeHtml(forecastLabel(forecast, false))}</p>
          <div class="project-footer"><a href="project-pages/${encodeURIComponent(project.name)}.html">현황 페이지</a><a href="project-report.html?repo=${encodeURIComponent(project.name)}">누적 기록</a><small>수동 완성도 참고 ${project.progress?.total ?? 0}%</small></div>
        </article>
      `;
    }).join('');
    byId('project-empty').hidden = projects.length > 0;
  }

  function renderMethod() {
    const coverage = state.codexData.coverage || {};
    const calibration = state.codexData.calibration || {};
    const mappedRatio = coverage.rootSessionsWithUsage
      ? Math.round((coverage.mappedSessions / coverage.rootSessionsWithUsage) * 100)
      : 0;
    const cards = [
      ['수집 단위', `${coverage.rootSessionsWithUsage || 0} root 세션`, '각 세션의 마지막 누적 이벤트만 사용합니다.'],
      ['중복 제거', `${coverage.excludedSubagents || 0} 하위 세션 제외`, '하위 에이전트 소비가 부모와 겹치지 않게 분리합니다.'],
      ['연결률', `${mappedRatio}%`, `${coverage.unmappedSessions || 0}세션은 프로젝트 별칭을 더 정해야 합니다.`],
      ['개인 기준', `평균 ${formatTokens(calibration.meanSessionTokens)} 토큰`, `중앙값 ${formatTokens(calibration.medianSessionTokens)} · 표본 ${calibration.sampleSessions || 0}개`],
    ];
    byId('method-grid').innerHTML = cards.map(([label, value, copy]) => `
      <article class="method-card"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><p>${escapeHtml(copy)}</p></article>
    `).join('');
    byId('codex-section-stat').innerHTML = `<strong>${formatTokens(state.codexData.totals?.last30Days?.totalTokens)} 토큰</strong><span>최근 30일 전체 Codex 소비</span>`;
  }

  function renderDailyChart() {
    const source = new Map((state.codexData.daily30 || []).map((item) => [item.date, item.tokens || 0]));
    const values = [];
    for (let offset = 29; offset >= 0; offset -= 1) {
      const date = new Date(Date.now() - offset * DAY_MS);
      const key = date.toISOString().slice(0, 10);
      values.push({ date: key, tokens: source.get(key) || 0 });
    }
    const max = Math.max(1, ...values.map((item) => item.tokens));
    byId('daily-chart').innerHTML = values.map((item, index) => {
      const height = item.tokens ? clamp((item.tokens / max) * 100, 1, 100) : 1;
      const label = index % 5 === 0 || index === values.length - 1 ? item.date.slice(5).replace('-', '/') : '';
      return `<div class="day-bar-wrap" title="${escapeHtml(item.date)} · ${formatTokens(item.tokens)} 토큰"><div class="day-bar" style="height:${height.toFixed(1)}%" aria-label="${escapeHtml(item.date)} ${formatTokens(item.tokens)} 토큰"></div>${label ? `<span class="day-label">${label}</span>` : ''}</div>`;
    }).join('');
    const sum = values.reduce((total, item) => total + item.tokens, 0);
    byId('daily-total').textContent = `연결 프로젝트 ${formatTokens(sum)} 토큰`;
  }

  function renderLedger(projects) {
    const rows = [...projects]
      .filter((project) => project.codex.allTime.sessions > 0)
      .sort((a, b) => b.codex.last30Days.totalTokens - a.codex.last30Days.totalTokens || b.codex.allTime.totalTokens - a.codex.allTime.totalTokens);
    byId('ledger-body').innerHTML = rows.map((project) => {
      const forecast = project.codex.forecast || {};
      const over = forecast.burnP50Pct > 100;
      return `
        <tr>
          <td><strong>${escapeHtml(project.displayName)}</strong><small>${escapeHtml(TOOL_LABELS[project.tool] || project.tool)}</small></td>
          <td><strong>${formatTokens(project.codex.last30Days.totalTokens)}</strong><small>${project.codex.last30Days.sessions || 0}세션</small></td>
          <td>${formatTokens(project.codex.allTime.totalTokens)}</td>
          <td>${project.codex.allTime.sessions || 0}</td>
          <td class="forecast-cell ${over ? 'is-over' : ''}">${escapeHtml(forecastLabel(forecast, true))}</td>
          <td>${escapeHtml(relativeDate(project.codex.lastActivity))}</td>
        </tr>
      `;
    }).join('');
    const totals = state.codexData.totals || {};
    const unmapped = totals.unmappedAllTime || {};
    byId('codex-caveat').innerHTML = `<strong>해석 원칙</strong> 토큰은 작업 강도와 컨텍스트 양을 보여주지만 기능 완성이나 품질을 보증하지 않습니다. 현재 전체 누적 중 프로젝트에 연결되지 않은 소비는 약 ${formatTokens(unmapped.totalTokens)} 토큰이며, 원문·제목·세션 ID·작업 경로는 공개 JSON에 넣지 않았습니다.`;
  }

  function renderCodex(projects) {
    renderMethod();
    renderDailyChart();
    renderLedger(projects);
  }

  function usageLevel(percent) {
    if (percent >= 85) return 'high';
    if (percent >= 70) return 'warn';
    return '';
  }

  function renderResources() {
    const tools = state.usageData.tools || [];
    const age = daysSince(state.usageData.asOf);
    byId('resource-section-stat').innerHTML = `<strong>${age == null ? '미확인' : `${age}일 전`}</strong><span>계정 한도 마지막 수집</span>`;
    byId('usage-grid').innerHTML = tools.length ? tools.map((tool) => {
      const collectedAt = tool.auto?.collectedAt || state.usageData.asOf;
      const collectedAge = daysSince(collectedAt);
      const windows = tool.auto?.windows?.length ? tool.auto.windows : [{ label: tool.limitLabel || '한도', usedPercent: tool.usedPercent || 0, resetsAt: tool.cycleResetDate }];
      return `
        <article class="usage-card">
          <div class="usage-head"><div><h2>${escapeHtml(tool.label || tool.tool)}</h2><p>${escapeHtml(tool.plan || '플랜 미확인')} · ${escapeHtml(tool.auto?.source || '수동')}</p></div><span class="usage-age ${collectedAge > 1 ? 'is-stale' : ''}">${collectedAge == null ? '미확인' : `${collectedAge}일 전`}</span></div>
          ${windows.map((window) => `
            <div class="usage-window"><div class="usage-window-head"><span>${escapeHtml(window.label || window.id)}</span><strong>${Math.round(window.usedPercent || 0)}%</strong></div><div class="usage-gauge"><span class="${usageLevel(window.usedPercent || 0)}" style="width:${clamp(window.usedPercent || 0, 0, 100)}%"></span></div><div class="usage-window-head"><span>리셋</span><span>${escapeHtml(formatDate(window.resetsAt, true))}</span></div></div>
          `).join('')}
        </article>
      `;
    }).join('') : '<div class="empty-state">사용량 데이터가 없습니다.</div>';
  }

  function setView(view, updateHash) {
    const allowed = new Set(['ops', 'projects', 'codex', 'resources']);
    const next = allowed.has(view) ? view : 'ops';
    state.view = next;
    document.querySelectorAll('[data-view-panel]').forEach((panel) => {
      const active = panel.dataset.viewPanel === next;
      panel.hidden = !active;
      panel.classList.toggle('is-active', active);
    });
    document.querySelectorAll('[data-view]').forEach((button) => {
      const active = button.dataset.view === next;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', String(active));
    });
    if (updateHash) history.replaceState(null, '', `#${next}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function bindEvents() {
    document.querySelectorAll('[data-view]').forEach((button) => {
      button.addEventListener('click', () => setView(button.dataset.view, true));
    });
    document.querySelectorAll('[data-jump]').forEach((button) => {
      button.addEventListener('click', () => setView(button.dataset.jump, true));
    });
    ['project-search', 'status-filter', 'tool-filter', 'project-sort'].forEach((id) => {
      byId(id).addEventListener(id === 'project-search' ? 'input' : 'change', renderProjectCards);
    });
    byId('theme-toggle').addEventListener('click', () => {
      const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      localStorage.setItem('dashboard-theme', next);
      byId('theme-toggle').textContent = next === 'dark' ? '라이트' : '다크';
    });
  }

  function initTheme() {
    const saved = localStorage.getItem('dashboard-theme');
    const theme = saved === 'light' || saved === 'dark' ? saved : 'dark';
    document.documentElement.dataset.theme = theme;
    byId('theme-toggle').textContent = theme === 'dark' ? '라이트' : '다크';
  }

  async function init() {
    initTheme();
    const [projectsData, suggestionsData, usageData, codexData] = await Promise.all([
      loadJson('projects.json', 'fallback-projects'),
      loadJson('suggestions.json', 'fallback-suggestions'),
      loadJson('usage.json', 'fallback-usage'),
      loadJson('codex-summary.json', 'fallback-codex'),
    ]);
    state.projectsData = projectsData || state.projectsData;
    state.suggestionsData = suggestionsData || state.suggestionsData;
    state.usageData = usageData || state.usageData;
    state.codexData = codexData || state.codexData;
    const projects = projectViewModels();
    renderFreshness();
    renderOps(projects);
    renderProjectCards();
    renderCodex(projects);
    renderResources();
    bindEvents();
    setView(location.hash.replace('#', ''), false);
  }

  init().catch((error) => {
    console.error('대시보드 초기화 실패.', error);
    const strip = byId('freshness-strip');
    if (strip) strip.textContent = '대시보드 데이터를 불러오지 못했습니다. FALLBACK과 JSON을 확인하세요.';
  });
}());
