// projects.json과 보고서 데이터를 읽어 프로젝트별 kami 스타일 정적 페이지를 생성한다.
//
// 사용법
//   node scripts/build-project-pages.mjs
//   node scripts/build-project-pages.mjs --dry-run

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'project-pages');

const CATEGORY_LABELS = {
  game: '게임',
  app: '앱',
  content: '콘텐츠',
};

const STATUS_LABELS = {
  active: '활성',
  paused: '일시중단',
  archived: '보관',
};

const TOOL_LABELS = {
  claude: 'Claude',
  codex: 'Codex',
  hermes: 'Hermes',
  hybrid: 'Hybrid',
};

const DOCS_TO_KEEP = [
  {
    path: 'prd.md',
    label: 'PRD',
    purpose: '무엇을 만들고 왜 만드는지, 핵심 기능과 리스크를 최신 결정 기준으로 정리합니다.',
  },
  {
    path: 'roadmap.md',
    label: '로드맵',
    purpose: '버전별 완료·진행·예정 상태와 다음 마일스톤을 실제 작업 증거에 맞춥니다.',
  },
  {
    path: 'log.md',
    label: '작업 로그',
    purpose: '이번 세션의 변경, 검증 결과, 남은 의사결정을 최신 항목으로 맨 위에 남깁니다.',
  },
  {
    path: 'project.json',
    label: '문서 인덱스',
    purpose: 'versions, currentVersion, synced 값을 로드맵과 같은 상태로 유지합니다.',
  },
];

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(ROOT, relativePath), 'utf8'));
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function plain(value, fallback = '아직 기록이 없습니다.') {
  const text = String(value ?? '').trim();
  return text || fallback;
}

function sentence(value, fallback) {
  const text = plain(value, fallback).replace(/\s+/g, ' ').trim();
  return /[.!?)]$/.test(text) ? text : `${text}.`;
}

function completionCopy(value, fallback) {
  return sentence(value, fallback).replaceAll('진척', '완성도');
}

function dateOnly(value) {
  return String(value || '').slice(0, 10) || '미기록';
}

function daysSince(value, asOf) {
  if (!value || !asOf) return null;
  const start = new Date(value);
  const end = new Date(`${asOf}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  return Math.max(0, Math.floor((end - start) / 86400000));
}

function flattenServices(reports) {
  const services = new Map();
  for (const field of reports.fields || []) {
    for (const service of field.services || []) {
      services.set(service.repo, service);
    }
  }
  return services;
}

function latestLogs(logData, repo) {
  const logs = (logData.logs && logData.logs[repo]) || [];
  return logs
    .slice()
    .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))
    .slice(0, 7);
}

function suggestionsFor(suggestions, repo) {
  return (suggestions.items || []).filter((item) => item.repo === repo);
}

function topSuggestion(items) {
  const order = { high: 3, warn: 2, info: 1 };
  return items.slice().sort((a, b) => (order[b.severity] || 0) - (order[a.severity] || 0))[0] || null;
}

function projectHealth(project, suggestionItems, asOf) {
  const top = topSuggestion(suggestionItems);
  const age = daysSince(project.lastUpdate, asOf);
  if (project.status === 'paused') {
    return {
      label: '일시중단',
      tone: 'neutral',
      detail: project.pausedReason || '사용자 결정으로 일시중단된 상태입니다.',
    };
  }
  if (top && top.severity === 'high') {
    return { label: '위험', tone: 'danger', detail: top.title };
  }
  if (age != null && age >= 14) {
    return { label: '위험', tone: 'danger', detail: `최근 푸시가 ${age}일 전입니다.` };
  }
  if (['A', 'B'].includes(project.sprint) && age != null && age >= 7) {
    return { label: '위험', tone: 'danger', detail: `Sprint ${project.sprint}에서 ${age}일째 정체 중입니다.` };
  }
  if (top && top.severity === 'warn') {
    return { label: '주의', tone: 'warn', detail: top.title };
  }
  if (age != null && age >= 5) {
    return { label: '주의', tone: 'warn', detail: `최근 푸시가 ${age}일 전입니다.` };
  }
  return { label: '정상', tone: 'good', detail: '최근 활동과 다음 액션이 이어지는 상태입니다.' };
}

function stageFocus(project) {
  if (project.progressAssessed === false) return '검수 기준 정립';
  const p = project.progress || {};
  const gaps = [
    { label: '문서 보강', gap: 20 - (p.docs || 0), max: 20 },
    { label: '구현 골격', gap: 30 - (p.skeleton || 0), max: 30 },
    { label: '핵심 기능', gap: 30 - (p.features || 0), max: 30 },
    { label: '알파 검증', gap: 20 - (p.alpha || 0), max: 20 },
  ].filter((item) => item.gap > 0);
  if (!gaps.length) return '릴리즈 품질';
  gaps.sort((a, b) => (b.gap / b.max) - (a.gap / a.max));
  return gaps[0].label;
}

function confidence(project, logs) {
  if (project.progressAssessed === false) return { score: null, label: '검수 전' };
  const p = project.progress || {};
  let score = 0;
  score += Math.min(20, Math.round(((p.docs || 0) / 20) * 20));
  score += Math.min(25, Math.round(((p.skeleton || 0) / 30) * 25));
  score += Math.min(25, Math.round(((p.features || 0) / 30) * 25));
  score += Math.min(15, Math.round(((p.alpha || 0) / 20) * 15));
  if ((project.commits || 0) >= 20) score += 5;
  if ((project.nextActions || []).length) score += 5;
  if (logs.length) score += 5;
  score = Math.max(0, Math.min(100, score));
  if (score >= 76) return { score, label: '높음' };
  if (score >= 52) return { score, label: '보통' };
  return { score, label: '낮음' };
}

function sprintLabel(value) {
  return value === 'defer' ? 'Defer' : `Sprint ${value}`;
}

function logKindLabel(item) {
  if (item.kind === 'commit') return '커밋';
  if (item.kind === 'progress') return '완성도';
  if (item.kind === 'note') return item.label || '노트';
  return item.label || item.kind || '로그';
}

function listHtml(items, fallback) {
  const list = (items || []).filter(Boolean);
  if (!list.length) return `<p class="quiet">${escapeHtml(fallback)}</p>`;
  return `<ul>${list.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
}

function progressRows(progress) {
  return [
    ['문서', progress.docs || 0, 20],
    ['골격', progress.skeleton || 0, 30],
    ['기능', progress.features || 0, 30],
    ['알파', progress.alpha || 0, 20],
  ];
}

function promptFor(project, service) {
  const tool = TOOL_LABELS[project.tool] || project.tool;
  const completion = project.progressAssessed === false
    ? '수동 완성도는 아직 산출하지 않았습니다.'
    : `현재 대시보드 완성도는 ${project.progress.total}%입니다.`;
  return `이 세션은 "${project.displayName}" (${project.name}) 최신화 세션입니다.
담당 도구는 ${tool}이고, ${completion}

먼저 프로젝트 저장소의 README, PRD, ROADMAP, CHANGELOG, TESTING 문서를 확인하고, 이 대시보드의 mirror 문서인 projects/${project.name}/prd.md, roadmap.md, log.md, project.json과 어긋나는 내용을 기록해 주세요.

이번 세션에서 할 일입니다.
1. 실제 작업 증거를 먼저 확인합니다. 커밋, 실행 화면, 테스트, 배포 URL, 실패 로그 중 하나 이상을 근거로 삼습니다.
2. PRD에는 새로 확정된 목표, 핵심 기능, 기술 스택, 리스크만 반영합니다.
3. roadmap.md에는 완료, 진행 중, 예정 상태를 실제 산출물 기준으로 조정합니다.
4. log.md에는 오늘의 변경과 검증 결과를 최신 항목으로 맨 위에 추가합니다.
5. project.json에는 currentVersion, versions, synced 값을 roadmap.md와 같은 상태로 맞춥니다.
6. 완성도 점수는 부풀리지 않습니다. docs, skeleton, features, alpha 점수 변경은 산출물 증거가 있을 때만 제안합니다.
7. 대시보드 반영안으로 projects.json의 rationale, risks, nextActions, eta 변경안과 reports.json의 body, goal, progress, advice 갱신안을 마지막에 따로 적습니다.

현재 목표 요약입니다.
${plain(service?.goal || project.rationale, '목표 요약이 아직 충분하지 않습니다.')}`;
}

function renderProjectPage({ project, service, suggestions, logs, meta }) {
  const isAssessed = project.progressAssessed !== false;
  const health = projectHealth(project, suggestions, meta.asOf);
  const conf = confidence(project, logs);
  const top = topSuggestion(suggestions);
  const p = project.progress || {};
  const latest = logs[0];
  const prompt = promptFor(project, service);
  const title = `${project.displayName} 제작 현황`;
  const docRows = DOCS_TO_KEEP.map((doc) => {
    const path = `projects/${project.name}/${doc.path}`;
    return `<article class="doc-row">
      <div>
        <p class="doc-label">${escapeHtml(doc.label)}</p>
        <p class="doc-path">${escapeHtml(path)}</p>
      </div>
      <p>${escapeHtml(doc.purpose)}</p>
    </article>`;
  }).join('');
  const progressBreakdown = isAssessed ? progressRows(p).map(([label, value, max]) => {
    const pct = max ? Math.round((value / max) * 100) : 0;
    return `<div class="progress-row">
      <div class="progress-head"><span>${escapeHtml(label)}</span><span>${value}/${max}</span></div>
      <div class="meter"><span style="width:${pct}%"></span></div>
    </div>`;
  }).join('') : '<p class="quiet">산출물 기준 검수를 마친 뒤에만 docs·skeleton·features·alpha 점수를 기록합니다.</p>';
  const suggestionBlock = top ? `
    <article class="note ${escapeHtml(top.severity)}">
      <p class="note-kicker">${escapeHtml(top.severity === 'high' ? '위험 신호' : top.severity === 'warn' ? '주의 신호' : '코칭')}</p>
      <h3>${escapeHtml(top.title)}</h3>
      <p>${escapeHtml(top.detail)}</p>
      ${listHtml(top.actions, '권장 액션은 아직 없습니다.')}
    </article>` : `
    <article class="note">
      <p class="note-kicker">코칭</p>
      <h3>등록된 블로커가 없습니다</h3>
      <p>현재는 다음 액션과 최근 로그를 기준으로 세션을 이어가면 됩니다.</p>
    </article>`;
  const logBlock = logs.length ? logs.map((item) => `
    <article class="timeline-item">
      <time>${escapeHtml(dateOnly(item.date))}</time>
      <div>
        <p class="timeline-kind">${escapeHtml(logKindLabel(item))}</p>
        <p>${escapeHtml(item.text || item.message || '내용 없음')}</p>
        ${item.sha ? `<a href="${escapeHtml(project.url)}/commit/${escapeHtml(item.sha)}">${escapeHtml(item.sha)}</a>` : ''}
      </div>
    </article>`).join('') : '<p class="quiet">아직 누적 로그가 없습니다.</p>';

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<link rel="icon" type="image/svg+xml" href="../favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Nanum+Myeongjo:wght@400;700&family=Noto+Serif+KR:wght@400;500&family=Noto+Sans+KR:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
:root{
  --parchment:#f5f4ed;
  --ivory:#faf9f5;
  --ink:#1B365D;
  --text:#141413;
  --secondary:#3d3d3a;
  --sub:#504e49;
  --meta:#6b6a64;
  --border:#e8e6dc;
  --border-soft:#e5e3d8;
  --good:#266344;
  --warn:#836016;
  --danger:#8f2f2f;
  --serif:"Nanum Myeongjo","Noto Serif KR","Apple SD Gothic Neo",Georgia,serif;
  --sans:"Noto Sans KR","Apple SD Gothic Neo",system-ui,sans-serif;
  --shadow:0 18px 44px rgba(64,58,40,.055),0 1px 0 rgba(64,58,40,.035);
}
*,*::before,*::after{box-sizing:border-box}
body{margin:0;min-height:100vh;background:var(--parchment);color:var(--text);font-family:var(--serif);font-size:17px;line-height:1.58;letter-spacing:0}
a{color:inherit}
.page{width:min(100%,1120px);margin:0 auto;padding:28px 24px 84px}
.top-nav{display:flex;flex-wrap:wrap;gap:8px 20px;margin-bottom:48px}
.top-nav a{display:inline-flex;align-items:center;min-height:34px;color:var(--ink);font-family:var(--sans);font-size:13px;font-weight:600;text-decoration:none}
.top-nav a:hover{text-decoration:underline;text-underline-offset:4px}
h1,h2,h3,p{margin:0}
.hero{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:42px;align-items:end;margin-bottom:42px}
.eyebrow{margin-bottom:14px;color:var(--ink);font-family:var(--sans);font-size:12px;font-weight:700;letter-spacing:.12em}
h1{max-width:760px;font-size:clamp(40px,6vw,72px);font-weight:500;line-height:1.14;word-break:keep-all;overflow-wrap:break-word}
.lede{max-width:740px;margin-top:22px;color:var(--secondary);font-size:18px;line-height:1.65}
.hero-card{padding:22px 24px;background:var(--ivory);border:1px solid var(--border);border-radius:8px;box-shadow:var(--shadow)}
.hero-card dl{display:grid;gap:13px;margin:0}
.hero-card div{display:flex;justify-content:space-between;gap:16px;padding-bottom:12px;border-bottom:1px solid var(--border)}
.hero-card div:last-child{padding-bottom:0;border-bottom:0}
dt{color:var(--meta);font-family:var(--sans);font-size:12px;font-weight:700;letter-spacing:.05em}
dd{margin:0;color:var(--ink);font-family:var(--sans);font-size:13px;font-weight:700;text-align:right}
.grid{display:grid;grid-template-columns:1.12fr .88fr;gap:24px;align-items:start}
.section{margin-bottom:24px;padding:28px 30px;background:var(--ivory);border:1px solid var(--border);border-radius:8px;box-shadow:var(--shadow)}
.section.full{grid-column:1 / -1}
.section-title{margin-bottom:18px;color:var(--ink);font-family:var(--sans);font-size:13px;font-weight:800;letter-spacing:.08em}
.summary{display:grid;gap:14px;color:var(--secondary);font-size:16.5px}
.metric-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:24px}
.metric{padding:13px 14px;background:var(--parchment);border:1px solid var(--border-soft);border-radius:8px}
.metric span{display:block;color:var(--meta);font-family:var(--sans);font-size:11px;font-weight:800;letter-spacing:.05em}
.metric strong{display:block;margin-top:4px;color:var(--ink);font-family:var(--sans);font-size:18px}
.pill{display:inline-flex;align-items:center;min-height:24px;padding:3px 9px;border-radius:999px;color:#fff;background:var(--ink);font-family:var(--sans);font-size:11px;font-weight:800}
.pill.good{background:var(--good)}.pill.warn{background:var(--warn)}.pill.danger{background:var(--danger)}.pill.neutral{color:var(--meta);background:transparent;border:1px dashed var(--meta)}
.metric .pill{display:inline-flex;color:#fff}.metric .pill.neutral{color:var(--meta)}
.progress-total{display:flex;align-items:baseline;gap:8px;color:var(--ink);font-family:var(--sans)}
.progress-total strong{font-size:52px;line-height:1}
.progress-total span{font-size:13px;font-weight:800;color:var(--meta)}
.progress-row{margin-top:14px}
.progress-head{display:flex;justify-content:space-between;margin-bottom:6px;color:var(--meta);font-family:var(--sans);font-size:12px;font-weight:700}
.meter{height:7px;overflow:hidden;background:var(--border-soft);border-radius:999px}
.meter span{display:block;height:100%;background:var(--ink);border-radius:999px}
.note{padding:17px 18px;background:var(--parchment);border-left:3px solid var(--ink);border-radius:0 6px 6px 0}
.note.high{border-left-color:var(--danger)}.note.warn{border-left-color:var(--warn)}
.note-kicker{margin-bottom:6px;color:var(--ink);font-family:var(--sans);font-size:11px;font-weight:800;letter-spacing:.08em}
.note h3{margin-bottom:8px;font-family:var(--sans);font-size:16px}
.note p,.note li{color:var(--secondary);font-size:15px;line-height:1.55}
ul{margin:10px 0 0;padding-left:20px;color:var(--secondary)}
li{margin:5px 0}
.doc-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.doc-row{display:grid;gap:9px;padding:16px 17px;background:var(--parchment);border:1px solid var(--border-soft);border-radius:8px}
.doc-label{color:var(--ink);font-family:var(--sans);font-size:13px;font-weight:800}
.doc-path{margin-top:2px;color:var(--meta);font-family:var(--sans);font-size:12px;word-break:break-all}
.doc-row p:last-child{color:var(--secondary);font-size:14.5px;line-height:1.55}
.prompt{white-space:pre-wrap;margin:0;padding:20px 22px;overflow:auto;color:var(--secondary);background:var(--parchment);border:1px solid var(--border-soft);border-radius:8px;font-family:var(--sans);font-size:13px;line-height:1.7}
.timeline{display:grid;gap:15px}
.timeline-item{display:grid;grid-template-columns:112px minmax(0,1fr);gap:18px;padding-bottom:15px;border-bottom:1px solid var(--border)}
.timeline-item:last-child{padding-bottom:0;border-bottom:0}
.timeline time{color:var(--meta);font-family:var(--sans);font-size:12px;font-weight:700}
.timeline-kind{margin-bottom:5px;color:var(--ink);font-family:var(--sans);font-size:11px;font-weight:800;letter-spacing:.08em}
.timeline p:last-of-type{color:var(--secondary);font-size:15px}
.timeline a{display:inline-flex;margin-top:6px;color:var(--meta);font-family:var(--sans);font-size:12px;text-decoration:none}
.timeline a:hover{color:var(--ink);text-decoration:underline;text-underline-offset:4px}
.quiet{color:var(--meta);font-family:var(--sans);font-size:14px}
footer{margin-top:54px;padding-top:20px;border-top:1px solid var(--border);color:var(--meta);font-family:var(--sans);font-size:12px;line-height:1.5}
@media (max-width:900px){.hero,.grid{grid-template-columns:1fr}.hero-card{max-width:none}.metric-grid{grid-template-columns:repeat(3,1fr)}}
@media (max-width:640px){.page{padding:22px 18px 62px}.top-nav{margin-bottom:36px}.section{padding:24px 20px}.metric-grid,.doc-grid{grid-template-columns:1fr}.timeline-item{grid-template-columns:1fr;gap:5px}}
@media print{.top-nav{display:none}.page{width:auto;padding:0}.section,.hero-card{box-shadow:none}}
</style>
</head>
<body>
<main class="page">
  <nav class="top-nav" aria-label="상위 이동">
    <a href="../dashboard.html">대시보드</a>
    <a href="../monthly-analysis.html">30일 분석</a>
    <a href="../report.html">뉴스 피드</a>
    <a href="../project-report.html?repo=${encodeURIComponent(project.name)}">누적 로그</a>
    <a href="index.html">전체 프로젝트</a>
    <a href="${escapeHtml(project.url)}">GitHub</a>
  </nav>

  <header class="hero">
    <div>
      <p class="eyebrow">PROJECT STATUS</p>
      <h1>${escapeHtml(title)}</h1>
      <p class="lede">${escapeHtml(sentence(service?.body || project.rationale, '제작 현황 줄글이 아직 충분하지 않습니다.'))}</p>
    </div>
    <aside class="hero-card" aria-label="프로젝트 핵심 지표">
      <dl>
        <div><dt>기준일</dt><dd>${escapeHtml(meta.asOf)}</dd></div>
        <div><dt>담당</dt><dd>${escapeHtml(TOOL_LABELS[project.tool] || project.tool)}</dd></div>
        <div><dt>상태</dt><dd>${escapeHtml(STATUS_LABELS[project.status] || project.status)}</dd></div>
        <div><dt>스프린트</dt><dd>${escapeHtml(sprintLabel(project.sprint))}</dd></div>
      </dl>
    </aside>
  </header>

  <div class="grid">
    <section class="section">
      <p class="section-title">오늘의 판단</p>
      <div class="summary">
        <p>${escapeHtml(sentence(service?.goal || project.rationale, '목표 요약이 아직 없습니다.'))}</p>
        <p>${escapeHtml(sentence(service?.advice || top?.recommendation || project.nextActions?.[0], '다음 액션을 먼저 정리해야 합니다.'))}</p>
      </div>
      <div class="metric-grid">
        <div class="metric"><span>건강</span><strong><span class="pill ${escapeHtml(health.tone)}">${escapeHtml(health.label)}</span></strong></div>
        <div class="metric"><span>초점</span><strong>${escapeHtml(stageFocus(project))}</strong></div>
        <div class="metric"><span>신뢰도</span><strong>${escapeHtml(conf.label)}${conf.score == null ? '' : ` ${conf.score}%`}</strong></div>
      </div>
    </section>

    <section class="section">
      <p class="section-title">수동 완성도</p>
      <div class="progress-total"><strong>${isAssessed ? Number(project.progress.total) || 0 : '미산출'}</strong>${isAssessed ? '<span>%</span>' : ''}</div>
      ${progressBreakdown}
    </section>

    <section class="section">
      <p class="section-title">다음 액션</p>
      ${listHtml(project.nextActions, '다음 액션이 아직 없습니다.')}
    </section>

    <section class="section">
      <p class="section-title">리스크와 코칭</p>
      <p class="quiet" style="margin-bottom:14px">${escapeHtml(health.detail)}</p>
      ${suggestionBlock}
    </section>

    <section class="section full">
      <p class="section-title">항상 최신화할 문서</p>
      <div class="doc-grid">${docRows}</div>
    </section>

    <section class="section full">
      <p class="section-title">세션 시작 프롬프트</p>
      <pre class="prompt">${escapeHtml(prompt)}</pre>
    </section>

    <section class="section full">
      <p class="section-title">최근 근거</p>
      <div class="timeline">${logBlock}</div>
    </section>
  </div>

  <footer>
    ${escapeHtml(project.displayName)} · 최근 푸시 ${escapeHtml(dateOnly(project.lastUpdate))} · 커밋 ${Number(project.commits) || 0}개 · 최신 로그 ${escapeHtml(dateOnly(latest?.date))}.
  </footer>
</main>
</body>
</html>
`;
}

function renderIndex({ projects, services, suggestions, logData, meta }) {
  const cards = projects.map((project) => {
    const logs = latestLogs(logData, project.name);
    const health = projectHealth(project, suggestionsFor(suggestions, project.name), meta.asOf);
    const service = services.get(project.name);
    return `<article class="card">
      <p class="rank">#${project.rank} · ${escapeHtml(CATEGORY_LABELS[project.category] || project.category)}</p>
      <h2><a href="${encodeURIComponent(project.name)}.html">${escapeHtml(project.displayName)}</a></h2>
      <p>${escapeHtml(completionCopy(service?.progress || project.rationale, '현황 설명이 아직 없습니다.'))}</p>
      <div class="meta">
        <span>${project.progressAssessed === false ? '완성도 미산출' : `${Number(project.progress.total) || 0}%`}</span>
        <span>${escapeHtml(TOOL_LABELS[project.tool] || project.tool)}</span>
        <span>${escapeHtml(health.label)}</span>
        <span>로그 ${logs.length}건</span>
      </div>
    </article>`;
  }).join('');
  const active = projects.filter((p) => p.status === 'active').length;
  const paused = projects.filter((p) => p.status === 'paused').length;

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>프로젝트별 제작 현황</title>
<link rel="icon" type="image/svg+xml" href="../favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Nanum+Myeongjo:wght@400;700&family=Noto+Serif+KR:wght@400;500&family=Noto+Sans+KR:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
:root{--parchment:#f5f4ed;--ivory:#faf9f5;--ink:#1B365D;--text:#141413;--secondary:#3d3d3a;--meta:#6b6a64;--border:#e8e6dc;--border-soft:#e5e3d8;--serif:"Nanum Myeongjo","Noto Serif KR","Apple SD Gothic Neo",Georgia,serif;--sans:"Noto Sans KR","Apple SD Gothic Neo",system-ui,sans-serif;--shadow:0 18px 44px rgba(64,58,40,.055),0 1px 0 rgba(64,58,40,.035)}
*,*::before,*::after{box-sizing:border-box}
body{margin:0;min-height:100vh;background:var(--parchment);color:var(--text);font-family:var(--serif);font-size:17px;line-height:1.58;letter-spacing:0}
a{color:inherit}
.page{width:min(100%,1120px);margin:0 auto;padding:28px 24px 84px}
.top-nav{display:flex;flex-wrap:wrap;gap:8px 20px;margin-bottom:54px}
.top-nav a{display:inline-flex;align-items:center;min-height:34px;color:var(--ink);font-family:var(--sans);font-size:13px;font-weight:600;text-decoration:none}
.top-nav a:hover{text-decoration:underline;text-underline-offset:4px}
h1,h2,p{margin:0}
.hero{max-width:780px;margin-bottom:48px}
.eyebrow{margin-bottom:14px;color:var(--ink);font-family:var(--sans);font-size:12px;font-weight:700;letter-spacing:.12em}
h1{font-size:clamp(40px,7vw,72px);font-weight:500;line-height:1.14;word-break:keep-all;overflow-wrap:break-word}
.lede{margin-top:20px;color:var(--secondary);font-size:18px;line-height:1.65}
.stats{display:flex;flex-wrap:wrap;gap:10px;margin-top:24px}
.stats span{display:inline-flex;min-height:30px;align-items:center;padding:4px 11px;color:var(--ink);background:var(--ivory);border:1px solid var(--border);border-radius:999px;font-family:var(--sans);font-size:12px;font-weight:800}
.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
.card{padding:22px 23px;background:var(--ivory);border:1px solid var(--border);border-radius:8px;box-shadow:var(--shadow)}
.rank{margin-bottom:10px;color:var(--ink);font-family:var(--sans);font-size:12px;font-weight:800;letter-spacing:.06em}
h2{font-size:23px;font-weight:500;line-height:1.32}
h2 a{text-decoration:none}
h2 a:hover{color:var(--ink);text-decoration:underline;text-underline-offset:4px}
.card>p:not(.rank){margin-top:12px;color:var(--secondary);font-size:15.5px;line-height:1.55}
.meta{display:flex;flex-wrap:wrap;gap:6px;margin-top:17px}
.meta span{display:inline-flex;min-height:24px;align-items:center;padding:3px 9px;color:var(--meta);background:var(--parchment);border:1px solid var(--border-soft);border-radius:999px;font-family:var(--sans);font-size:11px;font-weight:800}
footer{margin-top:54px;padding-top:20px;border-top:1px solid var(--border);color:var(--meta);font-family:var(--sans);font-size:12px}
@media (max-width:900px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:640px){.page{padding:22px 18px 62px}.top-nav{margin-bottom:38px}.grid{grid-template-columns:1fr}}
</style>
</head>
<body>
<main class="page">
  <nav class="top-nav" aria-label="상위 이동">
    <a href="../dashboard.html">대시보드</a>
    <a href="../monthly-analysis.html">30일 분석</a>
    <a href="../report.html">뉴스 피드</a>
    <a href="../docs/project-session-prompts.md">세션 프롬프트 문서</a>
  </nav>
  <header class="hero">
    <p class="eyebrow">PROJECT PAGES</p>
    <h1>프로젝트별 제작 현황</h1>
    <p class="lede">각 프로젝트를 하나의 홈페이지처럼 열어 현재 판단, 제작 현황, 최신화할 문서, 세션 시작 프롬프트를 바로 확인합니다.</p>
    <div class="stats">
      <span>기준일 ${escapeHtml(meta.asOf)}</span>
      <span>전체 ${projects.length}개</span>
      <span>활성 ${active}개</span>
      <span>일시중단 ${paused}개</span>
    </div>
  </header>
  <section class="grid" aria-label="프로젝트 목록">
    ${cards}
  </section>
  <footer>이 페이지는 scripts/build-project-pages.mjs가 projects.json과 보고서 데이터를 기준으로 생성합니다.</footer>
</main>
</body>
</html>
`;
}

export function buildProjectPages({ dryRun = false } = {}) {
  const data = readJson('projects.json');
  const reports = readJson('reports.json');
  const suggestions = readJson('suggestions.json');
  const logData = readJson('project-logs.json');
  const services = flattenServices(reports);
  const projects = (data.projects || []).slice().sort((a, b) => a.rank - b.rank);

  const files = new Map();
  files.set('index.html', renderIndex({
    projects,
    services,
    suggestions,
    logData,
    meta: data.meta || {},
  }));

  for (const project of projects) {
    const logs = latestLogs(logData, project.name);
    files.set(`${project.name}.html`, renderProjectPage({
      project,
      service: services.get(project.name),
      suggestions: suggestionsFor(suggestions, project.name),
      logs,
      meta: data.meta || {},
    }));
  }

  if (!dryRun) {
    mkdirSync(OUT_DIR, { recursive: true });
    for (const [file, content] of files) {
      writeFileSync(join(OUT_DIR, file), content.replace(/[ \t]+$/gm, ''));
    }
  }

  return `${dryRun ? '[dry-run] ' : ''}project-pages — ${projects.length}개 프로젝트 페이지와 index.html ${dryRun ? '생성 예정' : '생성 완료'}.`;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(buildProjectPages({ dryRun: process.argv.includes('--dry-run') }));
}
