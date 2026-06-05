# 프로젝트 세션 최신화 프롬프트

각 프로젝트 세션을 시작할 때 이 문서를 기준으로 “오늘 무엇을 만들었고, 어떤 문서를 최신화해야 하는지”를 닫는다. 실제 프로젝트 저장소의 문서와 이 대시보드의 `projects/{repo}/` mirror 문서가 어긋나지 않게 만드는 것이 목표다.

## 항상 최신화할 문서

| 위치 | 문서 | 갱신 기준 |
| --- | --- | --- |
| 프로젝트 저장소 | `README.md` | 한 줄 정체성, 실행 방법, 현재 상태, 배포 URL이 바뀌면 갱신 |
| 프로젝트 저장소 | `PRD.md` 또는 `docs/prd.md` | 목표, 핵심 기능, 기술 스택, 리스크가 새로 확정되면 갱신 |
| 프로젝트 저장소 | `ROADMAP.md` 또는 `docs/roadmap.md` | 버전, 마일스톤, 완료·진행·예정 상태가 바뀌면 갱신 |
| 프로젝트 저장소 | `CHANGELOG.md` 또는 `docs/changelog.md` | 사용자 관점의 기능 변화, 릴리즈 후보, 배포 변경이 있으면 갱신 |
| 프로젝트 저장소 | `TESTING.md` 또는 `docs/testing.md` | 테스트 명령, 하네스, 수동 검증 절차가 바뀌면 갱신 |
| 이 대시보드 | `projects/{repo}/prd.md` | 프로젝트 저장소 PRD의 요약 mirror |
| 이 대시보드 | `projects/{repo}/roadmap.md` | 프로젝트 저장소 로드맵의 요약 mirror |
| 이 대시보드 | `projects/{repo}/log.md` | 최신 작업과 검증 결과를 맨 위에 누적 |
| 이 대시보드 | `projects/{repo}/project.json` | `versions`, `currentVersion`, `synced` 상태를 로드맵과 일치 |
| 이 대시보드 | `projects.json` | `rationale`, `risks`, `nextActions`, `eta`, `progress` 변경안만 증거 기반으로 제안 |
| 이 대시보드 | `reports.json` | 사용자에게 보고할 `body`, `goal`, `progress`, `advice` 갱신안을 제안 |

`projects.json`의 `commits`, `lastUpdate`, `firstCommit`, `daysActive`, `meta.asOf`는 refresh 스크립트가 갱신한다. 프로젝트 세션에서 직접 바꾸지 않는다.

## 공통 세션 시작 프롬프트

아래 프롬프트에서 `{프로젝트명}`, `{repo}`, `{담당도구}`, `{현재완성도}`만 바꿔 각 세션에 넣는다. 개별 완성본은 `project-pages/{repo}.html`에도 들어간다.

```text
이 세션은 "{프로젝트명}" ({repo}) 최신화 세션입니다.
담당 도구는 {담당도구}이고, 현재 대시보드 완성도는 {현재완성도}%입니다.

먼저 프로젝트 저장소의 README, PRD, ROADMAP, CHANGELOG, TESTING 문서를 확인하고, 이 대시보드의 mirror 문서인 projects/{repo}/prd.md, roadmap.md, log.md, project.json과 어긋나는 내용을 기록해 주세요.

이번 세션에서 할 일입니다.
1. 실제 작업 증거를 먼저 확인합니다. 커밋, 실행 화면, 테스트, 배포 URL, 실패 로그 중 하나 이상을 근거로 삼습니다.
2. PRD에는 새로 확정된 목표, 핵심 기능, 기술 스택, 리스크만 반영합니다.
3. roadmap.md에는 완료, 진행 중, 예정 상태를 실제 산출물 기준으로 조정합니다.
4. log.md에는 오늘의 변경과 검증 결과를 최신 항목으로 맨 위에 추가합니다.
5. project.json에는 currentVersion, versions, synced 값을 roadmap.md와 같은 상태로 맞춥니다.
6. 완성도 점수는 부풀리지 않습니다. docs, skeleton, features, alpha 점수 변경은 산출물 증거가 있을 때만 제안합니다.
7. 대시보드 반영안으로 projects.json의 rationale, risks, nextActions, eta 변경안과 reports.json의 body, goal, progress, advice 갱신안을 마지막에 따로 적습니다.
```

## 프로젝트별 담당 기준

| repo | 프로젝트 | 담당 | 세션에서 먼저 닫을 문서 |
| --- | --- | --- | --- |
| `habit` | Formi (포미) | Codex | Expo 알파 빌드 상태, 알파 피드백, TestFlight 준비 로그 |
| `tteuniyu-ios` | 뜬이유 iOS | Hybrid | Xcode 빌드, 시뮬레이터 스크린샷, RFP 인수 기준 검증 |
| `sam-defender-logue` | 삼국지: 시즈폴 (Siege Fall) | Claude | 콘텐츠 ID, 하네스, 알파 백로그 정리 |
| `samguk-idle-prototype` | 전지적 군주 시점 | Codex | 20분·24시간 합성 플레이테스트와 밸런스 곡선 |
| `three-kingdoms-deckbuilder` | 군령: 책략의 전장 | Codex | 오리지널 비주얼 방향, 카드·이벤트 볼륨, 런 검증 |
| `ai-builder-school` | AI Builder School | Claude | 우선 레슨 본문, 커리큘럼 맵, 콘텐츠 무결성 |
| `ai-company-tycoon-boundaryless` | AI 컴퍼니 타이쿤 | Codex | 실제 플레이 가능한 MVP 1 루프와 Vercel 미리보기 |
| `story-x-beta` | Story X | Claude | 골든 케이스 매체 하나, 캐논 관리, 스토리 엔진 검증 |
| `BookCircle` | BookCircle | Claude | 재개 트리거, 책담과의 관계, Supabase 연결 계획 |
| `jewelry-webtoon-cloud` | 반짝상점 생존기 | Claude | 재개 트리거, 산출물 README 고정, 파일럿 보존 상태 |
| `Nodeloom` | Nodeloom | Claude | 20인 페르소나 피드백, 대형 트리 렌더 성능, CLI parity |
| `design-system-school` | AI 디자인 시스템 스쿨 | Claude | PRD, 커리큘럼 구조, AI Builder School과의 공유 기준 |
| `cmds-daily-briefing` | 해치의 데일리 브리핑 | Claude | Hermes action queue 종단 테스트와 데이터 소스 일관성 |
| `Timeer` | Timeer | Claude | 한 줄 정체성, MVP 기능 하나, 기본 Vite 템플릿 탈피 |
| `chaekdam` | 책담 (Chaekdam) | Claude | BookCircle과의 관계, Supabase 인증·RLS, 모임 데이터 모델 |
| `honbul` | 혼불 (Honbul) | Codex | Godot 벽돌깨기 코어 슬라이스, 카드 모델, 30분 런 페이싱 |

## 대시보드 반영 원칙

- 완성도는 산출물 기준이다. 활동량이나 커밋 수만으로 올리지 않는다.
- 담당 도구 태그와 paused 상태는 사용자 지시 없이 바꾸지 않는다.
- 프로젝트 세션에서는 변경안을 제안하고, 이 대시보드 저장소에서는 검증 게이트를 통과한 뒤 반영한다.
- JSON을 바꾸면 관련 FALLBACK과 `project-pages/`를 다시 동기화한다.
