# projects.json 스키마

`projects.json`은 대시보드의 단일 진실 소스다. 최상위는 `meta`와 `projects` 두 키로 구성된다.

## meta

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `owner` | string | GitHub 계정 (`sgeniusk`) |
| `ownerName` | string | 표시 이름 (`Gomgomee`) |
| `asOf` | string | 데이터 기준일 `YYYY-MM-DD`. `refresh-progress.mjs`가 갱신 |
| `priorityCriterion` | string | 우선순위 산정 기준 |
| `progressFormula` | string | 진척도 공식 설명 |
| `toolLegend` | object | 도구 태그별 의미 |

## projects[]

각 프로젝트 객체의 필드.

| 필드 | 타입 | 설명 | 변경 규칙 |
| --- | --- | --- | --- |
| `rank` | number | 우선순위 순위 (1이 최상위) | 수동 |
| `name` | string | GitHub 리포 이름 (API 키) | 수동 |
| `displayName` | string | 대시보드 표시 이름 | 수동 |
| `category` | string | `game` / `app` / `content` | 수동 |
| `visibility` | string | `public` / `private` | 수동 |
| `tool` | string | `claude` / `codex` / `hermes` / `hybrid` | ⚠️ 사용자 확인 없이 변경 금지 |
| `status` | string | `active` / `paused` / `archived` | ⚠️ 사용자 명시 지시로만 변경 |
| `sprint` | string | `A` / `B` / `C` / `D` / `defer` — `docs/sprint-plan.md` 기준 | 수동 |
| `sprintStatus` | string | `planned` / `inProgress` / `review` / `done` — Sprint 보드 시드값 | 수동 (보드 UI는 localStorage로 오버라이드) |
| `stack` | string[] | 기술 스택 | 수동 |
| `progress` | object | `docs`(0-25)·`skeleton`(0-25)·`features`(0-30)·`alpha`(0-20)·`total`(합) | ⚠️ 진척도 임의 부풀림 금지. `total`은 4개 합 |
| `commits` | number | 총 커밋 수 | `refresh-progress.mjs`가 자동 갱신 |
| `lastUpdate` | string | 최근 푸시 시각 `YYYY-MM-DDTHH:MMZ` | `refresh-progress.mjs`가 자동 갱신 |
| `firstCommit` | string | 최초 커밋 추정일 (`~` 접두는 추정) | 수동 |
| `daysActive` | number | 활동 일수 | 수동 |
| `eta` | string | 예상 완료 기간 | 수동 |
| `etaClass` | string | `near` / `mid` / `far` / `long` — 색상 매핑 | 수동 |
| `rationale` | string | 현황 판단 근거 | 수동 |
| `risks` | string[] | 리스크 목록 | 수동 |
| `nextActions` | string[] | 다음 액션. 첫 항목은 Sprint 보드 카드의 마일스톤으로 쓰임 | 수동 |
| `url` | string | GitHub 리포 URL | 수동 |
| `pausedReason` | string | `status: paused`일 때만. 중단 사유 | 수동 |

## 변경 금지 항목 요약

`tool`·`status`·`progress` 점수는 사용자 확인 없이 바꾸지 않는다. 자동 갱신 대상은 `commits`·`lastUpdate`·`meta.asOf` 셋뿐이다.
