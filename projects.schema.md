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
| `progress` | object | `docs`(0-20)·`skeleton`(0-30)·`features`(0-30)·`alpha`(0-20)·`total`(합) | ⚠️ 진척도 임의 부풀림 금지. `total`은 4개 합 |
| `commits` | number | 총 커밋 수 | `refresh-progress.mjs`가 자동 갱신 |
| `lastUpdate` | string | 최근 푸시 시각 `YYYY-MM-DDTHH:MMZ` | `refresh-progress.mjs`가 자동 갱신 |
| `firstCommit` | string | 최초 커밋일 `YYYY-MM-DD` | `refresh-progress.mjs`가 자동 갱신 |
| `daysActive` | number | 활동 일수 (`firstCommit`→`meta.asOf`) | `refresh-progress.mjs`가 자동 갱신 |
| `eta` | string | 예상 완료 기간 | 수동 |
| `etaClass` | string | `near` / `mid` / `far` / `long` — 색상 매핑 | 수동 |
| `rationale` | string | 현황 판단 근거 | 수동 |
| `risks` | string[] | 리스크 목록 | 수동 |
| `nextActions` | string[] | 다음 액션. 첫 항목은 Sprint 보드 카드의 마일스톤으로 쓰임 | 수동 |
| `url` | string | GitHub 리포 URL | 수동 |
| `pausedReason` | string | `status: paused`일 때만. 중단 사유 | 수동 |

## 변경 금지 항목 요약

`tool`·`status`·`progress` 점수는 사용자 확인 없이 바꾸지 않는다. 자동 갱신 대상은 `commits`·`lastUpdate`·`firstCommit`·`daysActive`·`meta.asOf` 다섯이다.

## projects/{repo}/ — 프로젝트별 문서 표준 (v1.2+)

`projects.json`은 가벼운 인덱스고, 프로젝트별 상세 문서는 `projects/{repo}/` 폴더에 둔다. `{repo}`는 `projects.json`의 `name`과 동일하다.

| 파일 | 내용 |
| --- | --- |
| `project.json` | `repo`·`displayName`·`synced`·`versions[]` (+ 동기화 시 `currentVersion`) |
| `prd.md` | `## 개요` / `## 기술 스택` / `## 핵심 기능` / `## 리스크` |
| `roadmap.md` | 버전별 `##` 섹션 (완료/진행 중/예정 + 마일스톤) |
| `log.md` | 작업 로그 (최신 항목이 위) |

### project.json — versions[]

각 버전 객체.

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `id` | string | 버전 식별자 (`foundation`/`alpha`/`release` 등) |
| `label` | string | 표시 이름 (`기반`/`알파`/`v1.0 정식`) |
| `status` | string | `done` / `inProgress` / `planned` |
| `target` | string | 목표 시점 (선택) |
| `summary` | string | 버전 요약 |
| `milestones` | string[] | 마일스톤 목록 |

`versions[]`는 **실제 로드맵 데이터로만** 채운다 — `/sync-project` 전에는 빈 배열이다. 임의 버전은 두지 않는다. `currentVersion`은 동기화 후 현재 `inProgress`인 버전의 `id`. `synced`는 `/sync-project`로 실제 문서가 반영됐으면 `true`, 스캐폴드 상태면 `false`.

### 갱신 방법

`/sync-project {repo}` — 플랫폼별 산재한 plan/PRD/로드맵을 읽어 위 4개 파일을 정규화한다. `project.json`을 직접 손대기보다 커맨드를 쓴다.
