# 세션 재개 가이드

이 워크스페이스를 다른 Claude Code 세션에서 이어받을 때 쓰는 짧은 가이드.

## 1. 컨텍스트 로드

이 폴더에서 `claude`를 실행하면 `CLAUDE.md`가 자동 로드된다 — 에이전트 시스템, 데이터 규약, 절대 금지사항이 모두 거기 있다. 먼저 그것을 따른다.

## 2. 현재 상태 파악

- `projects.json` — 추적 중인 프로젝트와 진척도. 단일 진실 소스
- `meta.asOf` — 데이터 기준일. 오래됐으면 `/refresh`로 갱신
- `dashboard.html` — 뷰. 로컬에서 `npx serve .` 후 열거나 `file://`로 직접 열기

## 3. 자주 쓰는 흐름

| 목적 | 커맨드 |
| --- | --- |
| GitHub 활동 갱신 + 제안 재생성 | `/refresh` |
| 정체 점검·진척 코칭 | `/coach` |
| 주간 진척 요약 | `/weekly-report` |
| 새 프로젝트 킥오프 | `/new-project` |

## 4. 배포

`main`에 push하면 `.github/workflows/deploy.yml`이 GitHub Pages로 자동 배포한다.

## 5. 더 보기

- 슬래시 커맨드·루틴 상세 — `docs/agent-guide.md`
- 데이터 필드 규칙 — `projects.schema.md`
- 로드맵(v1.0 → v2.0) — 진행 중
