# sgeniusk 프로젝트 관리 에이전트 워크스페이스

sgeniusk(Gomgomee)의 진행 중인 게임·앱·콘텐츠 프로젝트를 추적·코칭하는 **프로젝트 관리 에이전트 워크스페이스**. 단순 대시보드를 넘어, 슬래시 커맨드로 데이터 갱신·진척 코칭·새 프로젝트 킥오프를 지원한다.

## 빠른 시작

1. **대시보드 보기** — `dashboard.html`을 브라우저로 열기 (`file://` 또는 `npx serve .`)
2. **데이터 갱신** — `GH_TOKEN="$(gh auth token)" node scripts/refresh-progress.mjs`
3. **이어받기** — `HANDOFF.md`의 세션 재개 가이드 참고

## 구성

| 계층 | 파일 | 역할 |
| --- | --- | --- |
| 뷰 | `dashboard.html` | SVG 차트 기반 대시보드, 라이트/다크, 반응형 |
| 데이터 | `projects.json` · `suggestions.json` · `usage.json` | 단일 진실 소스 |
| 에이전트 | `.claude/commands/*.md` | 슬래시 커맨드 |
| 자동화 | `.github/workflows/deploy.yml` | `main` push 시 Pages 배포 |
| 컨텍스트 | `CLAUDE.md` | Claude Code 진입점 |

대시보드는 `fetch`로 3개 JSON을 로드하고, 실패 시 내장 폴백을 쓴다.

## 슬래시 커맨드

- `/refresh` — GitHub 활동을 가져와 `projects.json` 갱신 + 제안 재생성
- `/coach` — 프로젝트 단계 심층 분석·정체 감지
- `/weekly-report` — 주간 진척 요약
- `/new-project` — 새 프로젝트 아이디어 구상 + 하네스 엔지니어링 첫 프롬프트

## 완성도 공식

`progress = docs(0-20) + skeleton(0-30) + features(0-30) + alpha(0-20) = 0-100`

대시보드는 이 점수를 완성도로 표시하고, 모멘텀·건강·신뢰도는 별도 운영 신호로 파생해 보여준다.

자세한 설명은 `docs/progress-formula.md`, 필드 규칙은 `projects.schema.md`.

## 로드맵

v1.0(베이스라인) → v1.1(안정화) → v1.2(문서 표준) → v1.3(청사진 뷰) → v1.4(자동 분석) → v2.0(완성형 에이전트). 핵심 목표는 모든 프로젝트의 버전 여정을 한눈에 보여주는 거대한 청사진이다.
