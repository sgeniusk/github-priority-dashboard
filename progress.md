# 진척 — github-priority-dashboard

다음 세션이 이 한 페이지만 보고도 현재 상태와 검증 증거를 이어받을 수 있도록 유지한다. 상세 백로그는 feature_list.json.

**Last Updated**: 2026-07-23 21:28 KST (저녁 Codex 집계·생성 검증 완료, 원격 활동·usage 수집은 미확인)

## Current Objective — 집중 프로젝트 포트폴리오 Sites 동기화 대기

`삼국지가 머지`와 `Loom · 유튜브 운영 시스템`을 현재 집중 프로젝트로 등록하고 프로젝트 보기와 운영실 의사결정 큐를 두 항목 중심으로 재편했다. 기존 16개 프로젝트의 status는 사용자 확인 없이 바꾸지 않고 정리 검토 범위로 분리했다. 2026-07-23 저녁 자동 수집 실측은 root 797세션, 추적 프로젝트 연결 517세션, 분류 대기 280세션이다. GitHub 토큰이 없어 직접 활동 수집은 실행하지 않았으며 원격 자동 refresh 기준 프로젝트 활동 기준일은 2026-07-23이다. Claude와 Codex usage 수집은 각각 자격증명 부재와 app-server 종료로 실패해 기존 usage.json을 보존했다.

## Recommended Next Step

GitHub 토큰을 준비해 다음 자동화에서 원격 프로젝트 활동도 직접 수집한다. 그 뒤 사용자와 기존 16개 항목을 빠르게 훑어 `계속`·`일시중단`·`보관` 목록을 확정한다. 명시된 항목만 status를 바꾸고, 집중 목록은 실제 우선순위가 바뀔 때 수동 갱신한다.

## 직전에 푼 것

- **2026-07-21 v3.2 집중 프로젝트 포트폴리오 재편** — 실제 Codex 작업선과 로컬 저장소를 확인해 `삼국지가 머지`와 `Loom · 유튜브 운영 시스템`을 rank 1·2의 집중 프로젝트로 등록했다. 프로젝트 보기는 집중 2개를 기본으로 보여주며 활성 전체 14개·정리 검토 16개·전체 18개를 전환할 수 있다. 두 cwd 별칭을 연결해 Codex 원장은 root 792·연결 517·미분류 275세션으로 개선됐다. 삼국지가 머지는 대형 유한 프로젝트 P50 대비 36%, Loom은 완성 백분율 없는 지속 운영형으로 표시한다. 새 항목의 수동 완성도는 임의 점수 대신 미산출로 처리하고, 로컬 전용 프로젝트는 GitHub refresh·30일 분석에서 제외한다. 기존 16개 status는 변경하지 않았다. init·validate·보고서 fallback·Sites build와 인앱 브라우저 전 보기·필터·새 상세 페이지 검증을 통과했고 콘솔 오류는 0건이다. main의 GitHub Pages와 Regression Prevention CI는 성공했다. Codex Sites는 별도 소스 저장소 푸시 권한 검토가 사용 한도로 거절돼 배포를 보류했다.
- **2026-07-21 v3.1 Sites 배포 + 하루 2회 자동 갱신** — 기존 정적 앱을 유지한 Sites 어댑터를 추가해 소유자 전용 주소로 배포했다. GitHub Actions는 08:45·20:45 KST, Codex 자동화는 09:00·21:00 KST에 실행된다. 원격 rebase 뒤 달라진 projects 데이터를 기준으로 report·project-report FALLBACK 자동 동기화도 report-gen에 추가했다. root 토큰 원장은 791세션, 프로젝트 연결 500세션으로 재수집했다. main의 GitHub Pages와 Regression Prevention CI가 모두 성공했고 Sites 핵심 페이지와 JSON도 실서비스에서 확인했다. usage 수집은 자격증명 부재로 실패했으며 기존 값을 변경하지 않았다.
- **2026-07-18 v3.0 Codex 작업량 원장 + 운영실 재구축** — `scripts/collect-codex-metrics.mjs`를 추가해 `~/.codex/sessions`·`archived_sessions` 17GB를 ripgrep 단일 패스로 검색하고, 세션별 마지막 누적 토큰만 사용했다. 세션 ID로 중복 제거, `parent_thread_id`·sub-agent/guardian/reviewer 계열 제외, cwd 별칭으로 16개 프로젝트에 연결했다. 공개 `codex-summary.json`은 10만 토큰 반올림·프로젝트 합계만 담고 exact 원장은 `.codex-local/`로 격리했다. 예측은 개인 평균 root 세션 토큰(현재 약 2290만) × 규모별 예상 세션 수로 P50·P80을 만들되 신뢰도 low와 해석 주의를 항상 표시한다. `dashboard.html`은 `build-dashboard.mjs` 생성 셸로 바꾸고 CSS·JS를 분리해 운영실·프로젝트·Codex 작업·리소스 4개 보기, 검색·필터·정렬·테마를 구현했다. 기존 색 토큰과 프로젝트·보고서 링크는 보존했다. 실제 인앱 브라우저에서 4개 보기·검색·라이트/다크를 확인했고 콘솔 오류 0이었다. 로컬 QA는 끝났으나 GitHub/usage 소스가 각각 7일·32일 오래됐고 아직 commit·push·Pages 배포는 하지 않았다.
- **2026-07-01 인터뷰 기반 리프레시 + 7/01 재수집** — 사용자와 프로젝트별 인터뷰로 4개를 리프레시했다. Story X 45→50(6종 매체 엔진→Dive X 상향식 대화 스토리텔링·작품화), 타이쿤 40→75(웹→Unity 방치형 타이쿤·성장 시각화, **과소평가 교정**), 혼불 19→39(Pre-production→Unity 벽돌깨기·"본연의 연출" 우선, **과소평가**), 시즈폴 60→20(Unity 타워디펜스·버그·"첫 장면" 체감, **과대평가 교정**). 세 게임 stack을 Unity+C#로 교정. 인터뷰 중 **실제 날짜가 2026-07-01**임을 확인(대시보드는 6/18에 정체) — refresh를 7/01 기준으로 재실행해 커밋·날짜·asOf를 실제화(총 2273→2563커밋, story-x +105·타이쿤 +81·책담 +53·honbul +51, Formi가 6/24 부활). 인터뷰로 고친 점수·정체성·스택은 refresh가 안 건드려 보존됐다. FALLBACK(dashboard·project-report·report)·project-pages 재동기화. **핵심 교훈** — 대시보드가 GitHub 커밋만 봐서 게임의 Unity 전환·로컬 미push 작업(혼불 44·시즈폴)·완성도(과소/과대 양방향)를 못 잡았다. 인터뷰가 이를 보정. 이어 `suggestions.json`을 7/01 기준으로 재생성 — 정체 6건에 미push 착시(시즈폴·전지적·군령을 정체가 아니라 push 필요로 분류)·usage 15일 낡음을 반영했고, `check-report-pages`의 낡은 'Godot' 기대를 '벽돌깨기'로 갱신했다.
- **2026-06-18 refresh + 제안 재생성** — 작업 중 자정을 넘겨 원격 daily auto-refresh(2026-06-18, projects/activity/history만)가 먼저 push됐다. 그 위로 rebase한 뒤 6/18 기준으로 refresh를 재실행 — `story-x-beta` 369커밋, `cmds-daily-briefing` 59커밋, 총 커밋 2273개, `meta.asOf` 2026-06-18, history 24스냅샷, news 35건, monthly-analysis(2026-05-20..2026-06-18, 1556커밋)·project-pages 재생성했다. `/coach`로 `suggestions.json`을 재생성 — tteuniyu-ios 36일·habit 22일·sam-defender-logue(rank 3) 6일 정체(stall·high), three-kingdoms 11일·design-system 19일·ai-builder 기능 병목(warn), ai-company·honbul 활동-진척 불일치(info). Codex 주간 65%·Claude 40%라 한도 경고는 없었다. `dashboard.html`의 FALLBACK_PROJECTS·FALLBACK_SUGGESTIONS, `project-report.html`의 fallback-projects/suggestions/logs 시드, `report.html`의 FALLBACK_NEWS를 verbatim 동기화했다. 완성도 점수는 자동 변경하지 않았다.
- **2026-06-16 usage-refresh** — `.claude/commands/usage-refresh.md` 절차에 따라 `node scripts/refresh-usage.mjs --dry-run` 후 적용했다. Claude OAuth 토큰은 Keychain에서 갱신·저장됐고, Claude는 5시간 6%·주간 40%·Sonnet 주간 3%, Codex는 5시간 2%·주간 65%로 수집됐다. `usage.json`과 `dashboard.html` `FALLBACK_USAGE`를 verbatim 동기화했다.
- **2026-06-16 refresh** — GitHub 활동 refresh로 `ai-company-tycoon-boundaryless` 446→461커밋, `story-x-beta` 336→366커밋, `cmds-daily-briefing` 51→56커밋, `chaekdam` 114→121커밋, 총 커밋 2267개, `meta.asOf` 2026-06-16, history 22스냅샷, news 30건으로 갱신했다. `project-pages/`와 `monthly-analysis`도 재생성했고, JSON 관련 FALLBACK seed를 verbatim 동기화했다. 완성도 점수는 자동 변경하지 않았다.
- **2026-06-14 refresh** — GitHub 활동 refresh로 `sam-defender-logue` 197→204커밋, `ai-company-tycoon-boundaryless` 401→446커밋, `story-x-beta` 273→336커밋, `cmds-daily-briefing` 46→51커밋, `chaekdam` 76→114커밋, `honbul` 130→229커밋, 총 커밋 2210개, `meta.asOf` 2026-06-14, history 20스냅샷, news 28건으로 갱신했다. `project-pages/`와 `monthly-analysis`도 재생성했고, JSON 관련 FALLBACK seed를 verbatim 동기화했다. 완성도 점수는 자동 변경하지 않았다.
- **v2.11 한도 인식 코칭** — `/coach` 분석 항목에 '도구 한도(usage.json)'를 추가했다(주간 ≥70% warn, ≥85% high, 리셋 24시간 이내 하향, `auto` 48시간 초과 시 분석 생략+`/usage-refresh` 권고). `type:"usage"` 제안은 해당 도구 최다 소비 active 프로젝트의 repo에 달고, 다른 제안의 recommendation에도 한도 상황을 반영한다. 2026-06-10 데이터로 `suggestions.json`을 재생성 — Codex 주간 78% 경고(usage·warn, tycoon에 부착), tteuniyu-ios 29일·habit 15일 정체(stall·high), design-system-school 12일(warn), honbul·ai-builder-school 기능 병목(info). FALLBACK_SUGGESTIONS·project-report fallback-suggestions 동기화, project-pages 재생성.
- **2026-06-10 refresh** — 총 커밋 1660→1791, 뉴스 18건, history 16스냅샷, monthly-analysis(5/12~6/10, 1782커밋) 재생성. 원격 daily auto-refresh 4일치 위로 rebase(충돌 3건은 로컬 최신 확인 후 로컬 채택), report.html·project-report.html의 FALLBACK 시드 수동 동기화.
- **v2.10 AI 사용량 자동 수집 (/usage-refresh)** — kimbyungsu/codex-usage-monitor(MIT)의 수집 방식을 이식해 `scripts/refresh-usage.mjs`를 추가했다. Claude는 공식 `/usage`와 동일한 OAuth usage 엔드포인트(파일 자격증명 + macOS Keychain 폴백, 토큰 만료 시 자동 갱신·재저장), Codex는 로컬 `codex app-server --stdio` JSON-RPC(`account/rateLimits/read`)로 한도 사용률 %·리셋 시각을 수집한다. usage.json에는 한도 %·리셋·플랜만 기록하고 토큰·비용 상세는 수집하지 않는다(Pages 공개 저장소 정책). 대시보드 사용량 카드는 `auto` 데이터가 있으면 윈도우별(5시간/주간/모델별) 미니 게이지·수집 시각·26시간 초과 신선도 경고를 렌더하고 수동 % 입력을 숨긴다. 실측 적용 결과: Claude Max 주간 49%(5시간 19%, Sonnet 4%), Codex Pro 주간 78%(5시간 2%) — 기존 수동값 "ChatGPT Plus"가 실측 "Pro"로 교정됐다. `.claude/commands/usage-refresh.md` 커맨드와 `scripts/fixtures/usage-mock.json`(오프라인 테스트 fixture)도 추가.
- **v2.9 최근 30일 GitHub 관찰 분석 사이트** — `scripts/build-monthly-analysis.mjs`를 추가해 추적 레포 전체의 최근 30일 커밋을 GitHub API로 수집하고 `monthly-analysis.json`과 `monthly-analysis.html`의 `FALLBACK_ANALYSIS`를 동기화했다. 페이지는 상단 증거 카드, 30일 활동 리듬 차트, 운영 진단, 레포별 관찰 기록, 테마·도구 분포, 다음 30일 처방을 보여준다. `refresh-progress.mjs`가 refresh 후 월간 분석까지 재생성하도록 연결했고, 대시보드와 프로젝트 페이지 생성 템플릿에 `30일 분석` 링크를 추가했다.
- **2026-06-06 refresh** — GitHub 활동 refresh로 `three-kingdoms-deckbuilder` 183→186커밋, `ai-builder-school` 100→120커밋, `story-x-beta` 178→190커밋, `cmds-daily-briefing` 36→38커밋, `chaekdam` 15→28커밋, `honbul` 118→123커밋, 총 커밋 1660개, `meta.asOf` 2026-06-06, history 15스냅샷, news 15건으로 갱신했다. 완성도 점수는 자동 변경하지 않았다.
- **v2.8 프로젝트별 제작 현황 페이지와 세션 프롬프트** — `scripts/build-project-pages.mjs`를 추가해 `projects.json`·`reports.json`·`suggestions.json`·`project-logs.json`에서 `project-pages/index.html`과 16개 프로젝트별 정적 원페이지를 생성했다. 각 페이지는 kami 스타일로 현재 판단, 완성도, 다음 액션, 리스크·코칭, 항상 최신화할 문서, 세션 시작 프롬프트, 최근 근거를 보여준다. `refresh-progress.mjs`가 refresh 후 페이지를 재생성하도록 연결했고, 대시보드 카드와 뉴스 피드의 프로젝트 링크를 새 페이지로 보냈다. `docs/project-session-prompts.md`에는 프로젝트 세션마다 갱신할 문서와 공통 프롬프트를 정리했다.
- **v2.7 완성도·운영 신호 분리와 town 폐기** — 기존 `progress.total`은 산출물 기준 **완성도**로 유지하고, 대시보드에는 모멘텀·건강·신뢰도·다음 마일스톤을 파생 표시했다. KPI는 도구별 개수 대신 활성 프로젝트, 평균 완성도, 건강 위험, 최근 7일 커밋으로 재구성했다. 청사진 카드는 완성도 숫자와 건강 칩, 신뢰도 칩, 건강 근거, 초점 단계, 다음 마일스톤을 한 번에 보이게 바꿨다.
- **불필요 항목 축소** — 마을 탭, `town.html`, `assets/town`, town 전용 Codex 브리프, town-only `agents` 필드, validate의 town 파싱 게이트를 제거했다. 대시보드는 현재 청사진·분석·스프린트·사용량 4탭 + 보고서 링크 구조다.
- **2026-06-05 refresh** — GitHub 활동 refresh와 원격 daily auto-refresh rebase로 `three-kingdoms-deckbuilder` 181→183커밋, `honbul` 97→118커밋, 총 커밋 1605개, `meta.asOf` 2026-06-05, history 15스냅샷, news 14건으로 갱신했다. 완성도 점수는 자동 변경하지 않았다.

## 다음 액션

1. **Codex Sites 배포** — 소스 저장소 푸시 권한을 승인받아 최종 SHA를 저장·배포하고 production 상태를 확인한다.
2. **기존 항목 정리 인터뷰** — 16개 항목을 `계속`·`일시중단`·`보관`으로 사용자와 확정한다.
3. **usage 자격증명 복구** — Claude OAuth와 Codex app-server 접근을 복구한 뒤 usage.json을 갱신한다.
4. **예측 재보정** — 완료된 유한 프로젝트의 실제 root 세션 토큰 표본이 쌓이면 P50·P80 배수를 다시 계산한다.

## 검증 — 마지막으로 확인한 증거

| 항목 | 상태 | 마지막 확인 |
| --- | --- | --- |
| 시작 점검 | 통과·경고 2 | 2026-07-23 JSON·핵심 파일 통과, GitHub 토큰 없음·projects asOf 2026-07-22 경고 |
| Codex 집계 | 통과 | 2026-07-23 root 797·프로젝트 연결 517·분류 대기 280 |
| 공개 경계 | 통과 | exact 원장 `.codex-local/` Git 제외, 공개 `codex-summary.json`에 prompt·sessionId·cwd 없음·10만 토큰 반올림 |
| JSON·스크립트 검증 | 통과 | 2026-07-23 21:28 KST Codex 스키마·외부 JS·dashboard FALLBACK 일치 |
| 보고서 fallback·file smoke | 통과 | 2026-07-23 21:28 KST 전체 PASS |
| 브라우저 전 보기 | 통과 | 2026-07-21 인앱 브라우저 — 운영실·프로젝트·Codex 작업·리소스, 집중·활성 전체·정리 검토 필터, 새 상세·누적 페이지 |
| 브라우저 콘솔 | 0 | 2026-07-21 전 보기·필터·새 상세·보고서 순회 후 error 로그 0 |
| Sites build | 통과 | 2026-07-23 21:28 KST vinext production build 완료 |
| Pages·CI | 통과 | 2026-07-21 main Pages·Regression CI success |
| Codex Sites | 대기 | production build·패키지 통과, 별도 소스 저장소 네트워크 권한 승인 필요 |

## Blockers

- **계정 한도 소스가 오래됨** — projects.meta.asOf는 2026-07-20까지 갱신됐지만 usage.json은 2026-06-16이다. 이번 수집은 Claude 자격증명 부재와 Codex app-server 종료로 실패해 기존 값을 보존했다.
- **Codex Sites 소스 동기화 대기** — 별도 Sites Git 저장소로 최종 SHA를 푸시하려면 샌드박스 밖 네트워크 권한이 필요하다. 자동 검토는 Codex 사용 한도로 거절됐으며 사용자 승인 뒤 재개한다.
- **Codex 분류 대기 275세션** — 다른 작업 공간의 토큰도 전체 합계에는 포함되지만 현재 프로젝트에는 연결되지 않았다. 공개 데이터에는 경로를 노출하지 않고 로컬 원장에서만 별칭 후보를 확인한다.
- **기존 16개 항목 정리 미확정** — 사용자 확인 전에는 status를 바꾸지 않고 `정리 검토` 범위로만 분리했다.
- **예측 신뢰도 low** — P50·P80은 개인 평균 세션 토큰과 규모 등급의 초기 추정이다. 완료된 검수 단위 이력을 쌓기 전에는 완성률로 해석하지 않는다.

## Files

- `monthly-analysis.html` — 최근 30일 GitHub 관찰 분석 페이지.
- `monthly-analysis.json` — 최근 30일 레포별 커밋·활동일·테마 분석 데이터.
- `scripts/build-monthly-analysis.mjs` — 월간 분석 JSON과 HTML FALLBACK 생성기.
- `dashboard.html` — 생성된 4개 보기 셸과 JSON FALLBACK.
- `dashboard.css` — 기존 색 토큰을 보존한 운영실·프로젝트·원장·리소스 반응형 스타일.
- `scripts/dashboard.js` — 데이터 로드, 4개 보기, 검색·필터·정렬·테마 렌더러.
- `scripts/build-dashboard.mjs` — dashboard 셸과 projects·suggestions·usage·codex FALLBACK 생성기.
- `scripts/collect-codex-metrics.mjs` — 로컬 Codex root 세션 토큰 집계기.
- `codex-summary.json` — 공개 가능한 반올림 프로젝트 토큰 합계.
- `codex-metrics.config.json` — cwd 별칭, 지속형 여부, 유한 프로젝트 규모 등급.
- `project-pages/` — 생성된 프로젝트별 제작 현황 페이지.
- `scripts/build-project-pages.mjs` — project-pages 생성기.
- `docs/project-session-prompts.md` — 각 프로젝트 세션 최신화 프롬프트.
- `projects.json` — 추적 프로젝트 SOT. `agents` 제거 완료.
- `scripts/refresh-progress.mjs` — 활동 refresh. 완성도 점수 자동 변경 금지.
- `scripts/refresh-usage.mjs` — Claude·Codex 한도 %·리셋 자동 수집 + dashboard 재생성.
- `scripts/report-gen.mjs` — 새 이벤트는 “완성도” 표현 사용.
- `feature_list.json`·`progress.md` — 이 워크스페이스 자체 백로그·상태.

## Next Session

1. 시작 점검으로 무결성과 기준일을 확인한다.
2. feature_list.json의 active가 null인지 확인하고 이 문서의 자동화 시각과 검증 증거를 읽는다.
3. 최근 자동화 실행에서 데이터·검증·push 중 실패한 단계가 있는지 확인한다.
4. 자격증명이 준비되면 usage를 갱신하고 미분류 cwd 상위 목록을 정리한다.
