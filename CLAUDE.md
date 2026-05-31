# GitHub 프로젝트 우선순위 대시보드 — Claude Code 컨텍스트

이 폴더는 sgeniusk(Gomgomee)의 GitHub 프로젝트 진척도와 우선순위를 추적하는 **프로젝트 관리 에이전트 워크스페이스**입니다. 단순 대시보드를 넘어, 데이터 갱신·진척 코칭·새 프로젝트 킥오프를 슬래시 커맨드와 루틴으로 지원합니다.

## 컨텍스트 요약

- **소유자**: sgeniusk (Gomgomee)
- **데이터 기준일**: `projects.json`의 `meta.asOf` 참고 (refresh 시 자동 갱신)
- **활성 프로젝트**: 10개 (게임 4, 앱 5, 콘텐츠 1)
- **일시중단**: 1개 (jewelry-webtoon-cloud — 핵심 마감 후 재개)
- **제외**: tteuniyu 메인 monorepo (사용자 요청으로 분석에서 제외, tteuniyu-ios는 유지)

## 시작 (Startup workflow)

새 세션은 이 4단계로 시작한다.

1. **시작 진단** — `bash init.sh` 실행. JSON 무결성·핵심 파일·GitHub 토큰·`meta.asOf`를 한 화면에 확인한다.
2. **상태 파악** — `progress.md` (현재 작업·다음 액션·검증 증거)와 `feature_list.json` (v1.0→v2.0 백로그, `active` 필드가 진행 중 feature)를 읽는다.
3. **세부 컨텍스트** — 본 `CLAUDE.md`의 핵심 규약 + `projects.schema.md`의 필드 규칙을 따른다.
4. **이어받기** — 다른 세션에서 넘어오는 경우 `HANDOFF.md`도 함께 본다.

## 완료 정의 (Definition of Done)

이 워크스페이스의 변경은 다음을 모두 만족해야 "done"이다.

- **JSON 무결성** — `projects.json`·`suggestions.json`·`usage.json`·`history.json`·`activity.json`이 모두 `JSON.parse` 통과 (`bash init.sh`로 한 번에 검증)
- **콘솔 에러 0** — `dashboard.html`을 브라우저에서 열어 모든 탭(청사진/순위/제안/활동/분석/스프린트/사용량 및 설정) 전환 시 콘솔 에러 없음
- **FALLBACK 동기화** — `projects.json`·`suggestions.json`·`usage.json`을 갱신했으면 `dashboard.html`의 `FALLBACK_*` 상수도 verbatim 동기화 (`/refresh`가 자동 처리; `FALLBACK_HISTORY`·`FALLBACK_ACTIVITY`는 동기화 대상 아님). 보고서는 v2.5에서 뉴스 피드(`report.html`←`news.json`)와 프로젝트별 누적 페이지(`project-report.html`←`project-logs.json`)로 분리됐고, 둘은 `scripts/report-gen.mjs`가 매 refresh마다 데이터 델타에서 생성한다. `news.json`·`project-logs.json`은 누적 아카이브라 해당 FALLBACK seed는 동기화 대상 아님 (`journal.json`은 폐기)
- **배포** — `main` push 후 `.github/workflows/deploy.yml`이 success로 끝남
- **상태 갱신** — 의미 있는 작업이라면 `progress.md`의 '현재 작업'·'다음 액션'을 갱신, 새 feature는 `feature_list.json`에 추가
- **변경 금지 항목 준수** — 아래 '절대 하지 말 것' 위반 0건

`/refresh` 실행 후의 검증 증거(스냅샷 수, 활동 커밋 수, 배포 conclusion)는 `progress.md`의 검증 표에 기록한다.

## 폴더 구조

```
github-priority-dashboard/
├── CLAUDE.md            # 이 파일 — Claude Code 진입점 컨텍스트
├── HANDOFF.md           # 핸드오프 절차 가이드
├── README.md            # 사람용 개요
├── index.html           # dashboard.html로 리다이렉트 (Pages 루트 URL용)
├── dashboard.html       # 뷰 — Chart.js 기반, 낮/밤 모드, Sprint 보드, 제안·사용량 패널
├── projects.json        # 단일 진실 소스 (Source of Truth)
├── projects.schema.md   # projects.json 필드 스키마 + 변경 규칙
├── suggestions.json     # /coach·/refresh가 생성하는 제안·코칭 데이터
├── usage.json           # Codex/Claude 사용량 트래커 기준값
├── history.json         # 진척도 스냅샷 히스토리 — refresh 시 날짜별 upsert
├── projects/{repo}/     # 프로젝트별 표준 문서 — project.json·prd.md·roadmap.md·log.md
├── scripts/
│   └── refresh-progress.mjs   # GitHub 활동 수집 스크립트 (Node 20 내장 fetch)
├── .claude/commands/    # 프로젝트 슬래시 커맨드 (refresh, coach, new-project)
├── .github/workflows/
│   └── deploy.yml       # main push 시 GitHub Pages 배포
└── docs/
    ├── progress-formula.md   # 진척도 산정 공식
    ├── tool-attribution.md   # 도구별 분류 근거
    ├── sprint-plan.md        # 4-6주 권장 스케줄
    └── agent-guide.md        # 슬래시 커맨드·루틴 사용법 (사람용)
```

## 에이전트 시스템

이 워크스페이스는 4계층으로 동작합니다.

| 계층 | 구성 | 역할 |
| --- | --- | --- |
| 뷰 | `dashboard.html` | 진척도·Sprint 보드·제안·사용량 시각화 |
| 데이터 | `projects.json`·`suggestions.json`·`usage.json` | 단일 진실 소스 |
| 에이전트 | `.claude/commands/*.md` | 슬래시 커맨드로 갱신·코칭·킥오프 |
| 자동화 | `/schedule` 루틴 | 매일 `/refresh`를 무인 실행 |

### 슬래시 커맨드

- **`/refresh`** — GitHub 활동을 가져와 `projects.json`을 갱신하고, `dashboard.html`의 FALLBACK을 동기화한 뒤 `/coach` 로직으로 `suggestions.json`을 재생성한다.
- **`/coach`** — 각 프로젝트의 막힌 단계·속도·정체를 분석해 `suggestions.json`에 제안을 기록한다. 인자로 프로젝트 이름을 주면 해당 프로젝트만 분석.
- **`/weekly-report`** — `projects.json`을 읽어 주간 진척 요약(하이라이트·Sprint 현황·주의 신호·다음 주 우선)을 마크다운으로 산출한다.
- **`/new-project`** — 새 게임/앱/웹 아이디어를 대화로 구상하고, 결정되면 하네스 엔지니어링을 고려한 첫 프롬프트를 작성한다.
- **`/sync-project`** — 플랫폼별 산재한 plan/PRD/로드맵을 읽어 `projects/{repo}/`의 표준 구조(`project.json`·`prd.md`·`roadmap.md`·`log.md`)로 정규화한다.

### 데이터 흐름

`dashboard.html`은 `fetch`로 `projects.json`·`suggestions.json`·`usage.json`을 로드하고, 실패하면(예: `file://`) 각 파일의 내장 `FALLBACK_PROJECTS`/`FALLBACK_SUGGESTIONS`/`FALLBACK_USAGE` 사본을 쓴다. 세 폴백 상수는 각 JSON 파일의 verbatim 복사본이므로, **JSON을 갱신하면 `dashboard.html`의 해당 폴백 상수도 같이 동기화**해야 한다 (`/refresh`가 자동 처리). `mapProject()`가 `projects.json` 구조를 뷰가 기대하는 형태로 변환한다.

## 핵심 규약

### 1. 진척도 공식

`total = docs(0-20) + skeleton(0-30) + features(0-30) + alpha(0-20)`

- **docs**: PRD, README, ADR, Implementation Spec의 완성도
- **skeleton**: 기능 구현을 떠받치는 하네스 엔지니어링 + 서브에이전트 구성 완성도 (검증 하네스·CI·에이전트 역할 분담)
- **features**: PRD에 정의된 핵심 기능의 실제 동작 비율
- **alpha**: 사용자 테스트, 폴리시, 알파/베타 등급 검증

값은 `projects.json`의 `progress` 객체(`docs`/`skeleton`/`features`/`alpha`/`total`)에 있다. 변경 시 `total`을 4개 합으로 갱신한다.

### 2. 도구 태그

| 태그 | 의미 | 색상 (UI) |
| --- | --- | --- |
| `claude` | Claude Code로 작성 | 오렌지 (#db6d28) |
| `codex` | Codex CLI로 작성 | 초록 (#3fb950) |
| `hermes` | Hermes Agent로 작성 | 보라 (#bc8cff) |
| `hybrid` | Claude + Codex 하이브리드 | 시안 (#39c5cf) |

### 3. 사용자 직접 제공 매핑 (변경 금지 — 사용자 확인 없이 수정 X)

- Formi (habit) → codex
- 뜬이유 iOS → hybrid (README 명시)
- 시즈폴 (sam-defender-logue) → codex
- 전지적 군주 시점 (samguk-idle-prototype) → codex
- 군령: 책략의 전장 (three-kingdoms-deckbuilder) → hermes
- AI Builder School → claude
- AI 컴퍼니 타이쿤 → codex
- Story X → claude
- BookCircle → claude (사용자 미지정, 기본값)
- 반짝상점 → claude, status=paused

### 4. 상태 (status)·Sprint 필드

- `status` — `active`(개발 중) / `paused`(일시중단, UI에 점선 뱃지) / `archived`(미사용)
- `sprint` — `A`/`B`/`C`/`D`/`defer`. `docs/sprint-plan.md` 기준
- `sprintStatus` — Sprint 보드 시드값(`planned`/`inProgress`/`review`/`done`). 보드 UI는 localStorage로 오버라이드

전체 필드 규칙은 `projects.schema.md` 참고.

## 자주 쓰는 작업

- **진척도·활동 갱신** — `/refresh` (또는 `node scripts/refresh-progress.mjs`)
- **정체 점검·코칭** — `/coach`
- **주간 진척 요약** — `/weekly-report`
- **새 프로젝트 시작** — `/new-project`
- **프로젝트 문서 표준화** — `/sync-project {repo}`
- **신규 프로젝트 등록** — `projects.json`에 객체 추가 → `rank` 재정렬 → `dashboard.html`의 `FALLBACK_PROJECTS` 폴백도 동기화 (`/refresh`가 처리)
- **도구 태그 변경** — 사용자 확인 후에만, `tool-attribution.md`에 사유 기록

## Verification Commands

- `bash init.sh` — JSON 무결성·핵심 파일·GitHub 토큰·`meta.asOf` 한 번에 점검 (verify 진입점)
- `node scripts/refresh-progress.mjs --dry-run` — projects.json·history.json·activity.json 변경 미리보기, 저장 안 함
- `node -e "JSON.parse(require('fs').readFileSync('projects.json','utf8'))"` — 단일 JSON 파일 파싱 검증 (각 JSON에 대해 반복; init.sh가 일괄 수행)
- 브라우저 검증 — `npx serve -l 4180` 후 `http://localhost:4180/dashboard.html` 열기. 모든 탭 전환 시 콘솔 에러 0 확인
- 별도의 단위 test 프레임워크(vitest/jest 등)는 두지 않는다 — 정적 대시보드 + JSON이라 `init.sh`의 파싱·존재 체크가 사실상 test 역할

## 범위·세션 규칙 (Stay in scope · End of Session)

### One feature at a time

이 워크스페이스는 동시에 하나의 `active` feature만 둔다 — `feature_list.json`의 `active` 필드가 진행 중인 단일 항목. 새 작업이 떠오르면 그 feature의 `doneCriteria`에 추가하거나, 별도 feature로 백로그에 넣고 현재 active는 끝낼 때까지 유지.

### Stay in scope

`active` feature의 `description` + `doneCriteria` 범위를 벗어나는 작업은 별도 feature로 분리한다. 새 프로젝트 추가·도구 태그 변경 같이 사용자 결정이 필요한 항목은 데이터 변경 전에 사용자에게 확인.

### End of Session — Before ending

세션을 닫기 전 이 4가지를 처리한다.

1. **상태 갱신** — `progress.md`의 'Current Objective'·'Recommended Next Step'·'Last Updated'를 오늘 상황에 맞게 갱신
2. **검증 증거 기록** — 이번 세션의 검증 결과(스냅샷·콘솔·배포)를 `progress.md` 검증 표에 추가
3. **막힌 항목 옮김** — 외부 응답 대기 등 Blockers는 `progress.md` '막혀 있는 항목'에 명시
4. **핸드오프** — 다음 세션이 한 번에 이어갈 만큼 다듬어졌으면 종료. 미흡하면 `session-handoff.md` 템플릿을 채워 `progress.md`나 PR 본문으로 옮긴다

이 절차를 따르면 다음 세션은 `bash init.sh` 한 번 + `progress.md` 한 번 읽기로 깨끗하게 restartable. 즉 Next steps가 항상 한 곳(`progress.md`)에 있다는 의미.

## 절대 하지 말 것

- 사용자가 명시한 도구 태그를 임의 변경
- 일시중단(paused) 프로젝트를 active로 되돌리는 것 (사용자 명시적 지시 필요)
- 진척도(`progress` 점수)를 임의로 부풀려 표시
- `dashboard.html`에서 색 토큰의 다크 base 값 변경 (브랜드 일관성 — 라이트 테마는 `:root[data-theme="light"]`로 별도 추가)
- `refresh-progress.mjs`로 `commits`·`lastUpdate`·`meta.asOf` 외의 필드를 자동 변경
