# sgeniusk 프로젝트 관리 에이전트 워크스페이스

sgeniusk(Gomgomee)의 진행 중인 게임·앱·콘텐츠 프로젝트를 추적·코칭하는 **프로젝트 관리 에이전트 워크스페이스**. 단순 대시보드를 넘어, 슬래시 커맨드로 데이터 갱신·진척 코칭·새 프로젝트 킥오프를 지원한다.

## 빠른 시작

1. **대시보드 보기** — `dashboard.html`을 브라우저로 열기 (`file://` 또는 `npx serve .`)
2. **데이터 갱신** — `GH_TOKEN="$(gh auth token)" node scripts/refresh-progress.mjs`
3. **Codex 작업량 갱신** — `node scripts/collect-codex-metrics.mjs`
4. **개별 보고서 보기** — `project-pages/index.html`에서 프로젝트별 제작 현황·세션 프롬프트 확인
5. **이어받기** — `progress.md`의 세션 재개 가이드 참고

## 구성

| 계층 | 파일 | 역할 |
| --- | --- | --- |
| 뷰 | `dashboard.html` | 운영실·프로젝트·Codex 작업·리소스 4개 보기, 라이트/다크, 반응형 |
| 스타일 | `dashboard.css` | 기존 색 토큰을 보존한 대시보드 스타일 |
| 뷰 | `project-pages/` | 프로젝트별 제작 현황·홍보용 원페이지 |
| 데이터 | `projects.json` · `suggestions.json` · `usage.json` | 프로젝트·제안·계정 한도 단일 진실 소스 |
| 데이터 | `codex-summary.json` · `codex-metrics.config.json` | 공개 가능한 Codex 집계와 프로젝트 연결 설정 |
| 자동화 | `scripts/collect-codex-metrics.mjs` | root 세션 마지막 누적 토큰을 중복 없이 집계 |
| 자동화 | `scripts/build-dashboard.mjs` | HTML 셸과 file:// FALLBACK 4종 생성 |
| 배포 | `.openai/hosting.json` · `package.json` | Codex Sites용 소유자 전용 배포 패키지 |
| 문서 | `docs/project-session-prompts.md` | 각 프로젝트 세션에서 최신화할 문서와 공통 프롬프트 |
| 에이전트 | `.claude/commands/*.md` | 슬래시 커맨드 |
| 자동화 | `.github/workflows/deploy.yml` | `main` push 시 Pages 배포 |
| 컨텍스트 | `CLAUDE.md` | Claude Code 진입점 |

대시보드는 `fetch`로 4개 JSON을 로드하고, 실패 시 `build-dashboard.mjs`가 삽입한 내장 폴백을 쓴다.

## 자동 갱신과 배포

- GitHub Actions는 매일 08:45·20:45 KST에 GitHub 활동, 뉴스, 프로젝트 로그, 프로젝트 페이지와 30일 분석을 갱신한다.
- Codex 로컬 자동화는 매일 09:00·21:00 KST에 로컬 root 세션 토큰과 계정 한도를 합친 뒤 검증하고 Sites를 다시 배포한다.
- 계정 자격증명이나 GitHub 토큰이 없으면 해당 소스는 기존 값을 보존하며, 자동화 결과에 미확인으로 남긴다.
- Sites 빌드는 `npm run build`가 원본 정적 파일을 임시 공개 디렉터리에 복제하는 방식이라 기존 GitHub Pages 구조와 함께 유지된다.

## 슬래시 커맨드

- `/refresh` — GitHub 활동을 가져와 `projects.json` 갱신 + 제안 재생성
- `/coach` — 프로젝트 단계 심층 분석·정체 감지
- `/weekly-report` — 주간 진척 요약
- `/new-project` — 새 프로젝트 아이디어 구상 + 하네스 엔지니어링 첫 프롬프트

## 완성도 공식

`progress = docs(0-20) + skeleton(0-30) + features(0-30) + alpha(0-20) = 0-100`

이 점수는 기존 데이터 호환을 위해 유지하지만 대시보드에서는 작은 수동 참고값으로만 표시한다. 주 지표는 실제 Codex 토큰 소비·root 세션·최근 활동이다. 토큰은 작업량의 근사치이며 기능 완성률이나 품질을 뜻하지 않는다.

자세한 설명은 `docs/progress-formula.md`, Codex 집계와 예측은 `docs/codex-metrics.md`, 필드 규칙은 `projects.schema.md`.

## 로드맵

v1.x(청사진) → v2.x(보고서·분석·사용량) → v3.0(Codex 작업량 원장과 운영실). 핵심 목표는 여러 프로젝트의 실제 작업량과 다음 결정을 한눈에 보여주는 개인 운영 시스템이다.
