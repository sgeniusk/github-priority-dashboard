# AGENTS.md — Codex 단독 운영 가이드 (github-priority-dashboard)

이 저장소는 sgeniusk(Gomgomee)의 GitHub 프로젝트 진척도·우선순위를 추적하는 **정적 대시보드 + JSON 데이터** 워크스페이스다. 빌드 도구 없이 브라우저에서 바로 열리는 HTML과 데이터 갱신 스크립트로 구성된다.

**너(Codex)가 이 워크스페이스의 단독 운영자다 — 설계·구현·검증·배포를 모두 직접 한다.** (과거엔 Claude가 설계·검증, Codex가 구현을 나눠 맡았지만, 지금부터는 네가 전부 맡는다.)

## 시작할 때 (매 세션)

1. `bash init.sh` — JSON 무결성·핵심 파일·GitHub 토큰·`meta.asOf`를 한 화면에 점검한다. 이게 검증 진입점이다.
2. `progress.md` 읽기 — 현재 상태·다음 액션·검증 증거. `feature_list.json`의 `active` 필드가 진행 중인 단일 작업이다.
3. 이 `AGENTS.md`의 규약을 따른다. 필드 상세는 `projects.schema.md`.

## 무엇으로 이루어져 있나 (파일 지도)

뷰 (정적 HTML, fetch 우선·실패 시 내장 FALLBACK)
- `dashboard.html` — 메인. 4탭(청사진·분석·스프린트·사용량 및 설정) + `보고서` 링크. 완성도 카드·운영 신호·차트·스프린트 보드·사용량.
- `report.html` — 전체 **뉴스 피드**. `news.json`을 최신순 카드로. 프로젝트명 → `project-pages/<repo>.html` 링크.
- `project-report.html` — **프로젝트별 누적 보고서**. `?repo=<repo>`로 헤더(무엇을·목표·완성도)+도움 패널(다음 액션·블로커·리스크·제안)+누적 타임라인(커밋 devlog·완성도·큐레이션 note).
- `project-pages/` — 프로젝트별 **제작 현황·홍보용 원페이지**. `scripts/build-project-pages.mjs`가 JSON에서 생성하며, 각 페이지는 현황 판단·문서 최신화 체크리스트·세션 시작 프롬프트를 포함한다.
- `index.html` — `dashboard.html`로 리다이렉트.

데이터 (단일 진실 소스)
- `projects.json` — 추적 프로젝트 전체. **SOT.** 필드 규칙은 `projects.schema.md`.
- `suggestions.json` — 코칭·정체 제안. 대시보드 카드 블로커 뱃지가 읽는다.
- `usage.json` — Codex/Claude 사용량 트래커.
- `history.json` — 완성도 일자별 스냅샷(추세 차트). refresh가 upsert.
- `activity.json` — 통합 커밋 피드(최근 N). refresh가 갱신.
- `reports.json` — 프로젝트별 줄글(헤더용 body/goal/advice). 1인칭 존댓말.
- `news.json` — 뉴스 피드 아이템(자동 생성, 누적).
- `project-logs.json` — 프로젝트별 타임라인(커밋 devlog + 완성도 변동 + 큐레이션 note, 누적).
- `feature_list.json`·`progress.md` — 이 워크스페이스 자체의 백로그·상태.

스크립트
- `scripts/refresh-progress.mjs` — GitHub 활동 수집 → `projects.json`(commits·lastUpdate·firstCommit·daysActive·meta.asOf) + `history.json` + `activity.json` 갱신, 그리고 `report-gen.mjs`로 `news.json`·`project-logs.json`, `build-project-pages.mjs`로 `project-pages/`까지 생성. `--dry-run`은 저장 없이 미리보기.
- `scripts/report-gen.mjs` — `buildNews()`/`buildLogs()`/`writeReports()`. history/activity/projects/suggestions 델타에서 뉴스·로그를 파생(네트워크 불필요). 단독 실행 `node scripts/report-gen.mjs`로 재생성.
- `scripts/build-project-pages.mjs` — `projects.json`·`reports.json`·`suggestions.json`·`project-logs.json`에서 프로젝트별 정적 원페이지와 index를 생성.
- `scripts/validate.mjs` — 회귀 방지 CI가 쓰는 스키마·파싱 검사.
- `scripts/check-report-pages.mjs` — report/project-report의 FALLBACK seed·file:// 렌더 검사.
- `init.sh` — 전체 점검 진입점.

## 핵심 규약 (어기면 안 됨)

### 완성도 공식
`total = docs(0-20) + skeleton(0-30) + features(0-30) + alpha(0-20)`. 값은 `projects.json`의 `progress{docs,skeleton,features,alpha,total}`. 변경 시 `total`을 4개 합으로 맞춘다. **완성도 점수를 임의로 부풀리지 말 것.**

### 운영 신호
대시보드는 `progress.total`을 완성도로 표시하고, 활동량은 모멘텀·건강·신뢰도로 분리해 파생 표시한다. refresh는 커밋·날짜·히스토리만 갱신하며 완성도 점수를 자동 변경하지 않는다.

### 도구 태그 (사용자 지정 — 확인 없이 변경 금지)
`claude`(주황 #ff5b22) · `codex`(초록 #3fb950) · `hermes`(보라 #bc8cff) · `hybrid`(시안 #39c5cf). 고정 매핑은 `CLAUDE.md`의 '사용자 직접 제공 매핑' 참고(Formi=codex, 뜬이유=hybrid 등).

### status·paused
`status` = `active`/`paused`/`archived`. **`status="paused"`면 `pausedReason`(문자열) 필수** — 없으면 `validate.mjs`(CI)가 실패한다. paused 프로젝트를 active로 되돌리는 건 사용자 명시 지시가 있을 때만.

### FALLBACK 동기화 (필수)
뷰는 `fetch` 우선, 실패(file://) 시 내장 FALLBACK 사본을 쓴다. 따라서 JSON을 바꾸면 해당 FALLBACK도 verbatim 동기화해야 한다.
- `dashboard.html`: `FALLBACK_PROJECTS`←projects.json · `FALLBACK_SUGGESTIONS`←suggestions.json · `FALLBACK_USAGE`←usage.json.
- `project-report.html`: `<script type="application/json" id="fallback-projects|fallback-reports|fallback-suggestions|fallback-logs">` seed.
- `report.html`: `FALLBACK_NEWS`←news.json.
- **동기화 대상 아님(누적 아카이브라 seed만)**: `FALLBACK_HISTORY`·`FALLBACK_ACTIVITY`, 그리고 `news.json`·`project-logs.json`의 seed. (`journal.json`은 폐기됨.)

### 한국어 출력
문장을 `:`로 끝내지 말 것(코드·키값 콜론은 무관). 종결은 `.`·`?`·`!`.

### 색·테마
`dashboard.html`의 다크 base 색 토큰을 바꾸지 말 것. 라이트 테마는 `:root[data-theme="light"]`로만 추가.

## 자주 하는 작업 (구체 절차)

데이터 리프레시
```bash
GH_TOKEN="$(gh auth token)" node scripts/refresh-progress.mjs --dry-run   # 변경 미리보기
GH_TOKEN="$(gh auth token)" node scripts/refresh-progress.mjs             # 적용(projects·history·activity·news·logs)
```
적용 후 `dashboard.html`의 `FALLBACK_PROJECTS`를 projects.json과 다시 맞춘다(아래 동기화 스니펫). suggestions가 바뀌었으면 `FALLBACK_SUGGESTIONS`도. 그다음 커밋·푸시.
`project-pages/`는 refresh가 자동 재생성한다. reports·suggestions·logs를 손으로 바꿨다면 `node scripts/build-project-pages.mjs`를 다시 실행한다.

프로젝트 일시중단(예: X)
1. `projects.json`에서 X의 `status`를 `paused`로, `sprintStatus` 뒤에 `pausedReason` 추가.
2. `reports.json`에서 X의 `status`도 `paused`로.
3. `dashboard.html` `FALLBACK_PROJECTS`·`project-report.html` `fallback-projects`/`fallback-reports` seed 동기화.
4. `node scripts/validate.mjs`로 pausedReason 확인.

뉴스·프로젝트 로그 갱신
```bash
node scripts/report-gen.mjs        # news.json·project-logs.json 재생성(데이터 델타 기반)
```
중요한 시점이면 `project-logs.json`의 해당 repo 배열에 `{date, kind:"note", label:"조언", text:"..."}` 큐레이션 노트를 손으로 추가한다(보존된다). `reports.json`의 줄글(body/goal/advice)은 1인칭 존댓말로 직접 갱신.

신규 프로젝트 등록
`projects.json`에 객체 추가 → `rank` 재정렬 → 필요한 FALLBACK 동기화 → `reports.json`에 해당 분야(game/app/content) 서비스 추가.
그다음 `projects/{repo}/` 문서 4종을 만들고 `node scripts/build-project-pages.mjs`로 개별 페이지를 생성한다.

FALLBACK 동기화 스니펫 (문자열 인지 중괄호 매칭으로 안전 치환)
```bash
node -e '
const fs=require("fs");
function repl(t,name,obj){const d="const "+name+" = ";const s=t.indexOf(d);const b=t.indexOf("{",s);let i=b,dep=0,q=false,e=false;for(;i<t.length;i++){const c=t[i];if(q){if(e)e=false;else if(c==="\\")e=true;else if(c===String.fromCharCode(34))q=false;continue;}if(c===String.fromCharCode(34))q=true;else if(c==="{")dep++;else if(c==="}"){dep--;if(dep===0){i++;break;}}}return t.slice(0,b)+JSON.stringify(obj,null,2)+t.slice(i);}
let d=fs.readFileSync("dashboard.html","utf8");
d=repl(d,"FALLBACK_PROJECTS",JSON.parse(fs.readFileSync("projects.json","utf8")));
d=repl(d,"FALLBACK_SUGGESTIONS",JSON.parse(fs.readFileSync("suggestions.json","utf8")));
fs.writeFileSync("dashboard.html",d);
console.log("dashboard FALLBACK 동기화 완료");
'
```
(project-report.html의 `<script id="fallback-*">` seed는 해당 태그 안 JSON을 파일 내용으로 교체. report.html `FALLBACK_NEWS`는 위 repl 패턴 동일.)

## 검증 게이트 (완료 주장 전 반드시)

1. `bash init.sh` — JSON 무결성·기준일.
2. `node scripts/validate.mjs` — 스키마·인라인 스크립트 컴파일.
3. `node scripts/check-report-pages.mjs` — report/project-report fallback·file 렌더.
4. 브라우저 — `npx serve -l 4180` 후 `http://localhost:4180/dashboard.html`·`report.html`·`project-report.html?repo=habit`·`project-pages/honbul.html` 열어 **전 탭/페이지 콘솔 에러 0** 확인.
5. FALLBACK이 JSON과 verbatim 일치하는지 확인.
6. `git diff --stat`으로 범위 밖 변경 없는지.

## 완료 정의 (Definition of Done)

- JSON 5종(+reports·news·project-logs) `JSON.parse` 통과(`bash init.sh`).
- 콘솔 에러 0(전 탭·전 페이지).
- 관련 FALLBACK verbatim 동기화.
- `main` push 후 `.github/workflows/deploy.yml`(GitHub Pages)와 `Regression Prevention CI` 모두 success.
- 의미 있는 작업이면 `progress.md`('Current Objective'·'Recommended Next Step'·'Last Updated'·검증 표) 갱신, 새 작업은 `feature_list.json`에 추가하고 `active` 갱신.

## 커밋·배포

- 이 저장소는 `main` 직접 푸시로 GitHub Pages에 배포된다(브랜치 안 씀). 원격에 매일 자동 refresh 커밋이 올라오니 **푸시 전 `git fetch && git rebase origin/main`** 으로 정리한다. 충돌 시 `history.json`은 날짜 합집합으로, `projects.json`/`activity.json`은 최신(자기 쪽)으로.
- 커밋 메시지는 한국어로 무엇을 왜 바꿨는지.

## 절대 하지 말 것

- 사용자 지정 도구 태그 임의 변경.
- paused 프로젝트를 사용자 지시 없이 active로 되돌리기.
- 완성도 점수 부풀리기.
- `dashboard.html` 다크 base 색 토큰 변경.
- `refresh-progress.mjs`로 `commits`·`lastUpdate`·`firstCommit`·`daysActive`·`meta.asOf` 외 필드 자동 변경.
- JSON 갱신 후 FALLBACK 동기화 누락.

## 더 보기

- `CLAUDE.md` — 동일 규약의 원본(도구 매핑·DoD 상세). `projects.schema.md` — 필드 스키마. `docs/` — 완성도 공식·도구 분류·스프린트 계획·에이전트 가이드. `.claude/commands/*.md` — 과거 슬래시 커맨드 정의(절차 참고용; Codex에선 위 '자주 하는 작업'으로 대체).
