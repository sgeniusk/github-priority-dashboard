# 진척 — github-priority-dashboard

다음 세션이 이 한 페이지만 보고도 현재 상태와 검증 증거를 이어받을 수 있도록 유지한다. 상세 백로그는 `feature_list.json`.

**Last Updated**: 2026-06-10 (v2.11 한도 인식 코칭 — /coach가 AI 사용량 반영)

## Current Objective — None

오늘 작업 완료 상태다. `meta.asOf`는 2026-06-10이고, 전체 16개 프로젝트 중 활성 12개·일시중단 4개, 총 커밋 1791개, 뉴스 18건, history 16스냅샷이다. `monthly-analysis.html`은 2026-05-08부터 2026-06-06까지 최근 30일 커밋 1654건을 관찰해 레포별 활동·공백·테마를 보여준다. `project-pages/`에는 16개 프로젝트별 제작 현황 페이지와 index가 생성되어 있다.

## Recommended Next Step

다음 세션 시작 시 `bash init.sh`와 이 파일을 먼저 확인한다. 후보 작업은 `monthly-analysis.html`의 분석 문구를 실제 운영 판단에 맞춰 점진 개선, 자동 refresh 루틴의 원격 `GH_TOKEN` 가용성 확인, `reports.json` 줄글 최신성 점검, 신규 프로젝트 등록 시 `projects/{repo}` 문서 표준화와 project-pages 재생성 확인이다.

## 직전에 푼 것

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

1. **월간 분석 문구 개선** — `monthly-analysis.json`의 정량 결과를 바탕으로 처방 문구를 더 날카롭게 다듬는다.
2. **자동 루틴 확인** — 원격 daily refresh가 2026-06-06 이후에도 `main`에 정상 반영되는지 확인한다.
3. **보고서 문구 점진 개선** — 기존 `reports.json` 줄글 일부는 예전 표현과 현황을 담고 있다. 수동 줄글 갱신 때 “완성도” 표현과 실제 최신 상태를 자연스럽게 맞춘다.
4. **신규 프로젝트 등록 절차 확인** — 신규 등록 시 `projects.json`·`reports.json`·`projects/{repo}` 문서와 FALLBACK 동기화 후 `node scripts/build-project-pages.mjs`와 `node scripts/build-monthly-analysis.mjs`를 실행한다.

## 검증 — 마지막으로 확인한 증거

| 항목 | 상태 | 마지막 확인 |
| --- | --- | --- |
| 시작 점검 | 통과 | 2026-06-10 `bash init.sh` |
| 사용량 자동 수집 | 통과 | 2026-06-10 `node scripts/refresh-usage.mjs` 실기기 실행 — Claude(keychain 토큰 갱신 포함)·Codex 모두 수집, 전부 실패 시 usage.json 미변경+exit 1 확인 |
| 사용량 mock 파이프라인 | 통과 | `node scripts/refresh-usage.mjs --mock scripts/fixtures/usage-mock.json --dry-run` |
| 사용량 탭 자동 카드 | 통과 | 2026-06-10 Playwright Chromium — usageGrid에 자동 수집 카드 2개 렌더, 4탭+report+project-report+project-pages 콘솔 에러 0 |
| 데이터 refresh | 통과 | 2026-06-10 local refresh, 총 커밋 1791·뉴스 18건·history 16스냅샷, monthly-analysis 1782커밋 재생성 |
| 월간 분석 생성 | 통과 | `GH_TOKEN="$(gh auth token)" node scripts/build-monthly-analysis.mjs`, 2026-05-08..2026-06-06, 커밋 1654건 |
| JSON·스크립트 검증 | 통과 | `node scripts/validate.mjs` |
| 보고서 fallback·file smoke | 통과 | `node scripts/check-report-pages.mjs`, monthly-analysis·project-pages 존재 검증 포함 |
| dashboard FALLBACK | 통과 | `FALLBACK_PROJECTS`·`FALLBACK_SUGGESTIONS`·`FALLBACK_USAGE` verbatim 일치 |
| monthly-analysis FALLBACK | 통과 | `FALLBACK_ANALYSIS`와 `monthly-analysis.json` verbatim 일치 |
| 브라우저 콘솔 | 0 | 2026-06-10 Playwright Chromium, dashboard 4탭(사용량 자동 카드 2개) + report.html + project-report.html?repo=habit + project-pages/honbul.html |
| 브라우저 HTTP 오류 | 0 | Chromium, 로컬 4xx/5xx 0 |
| 반응형 화면 | 확인 | monthly-analysis.html 데스크톱 1440px·모바일 390px 스크린샷 확인 |

## Blockers

- **자동 루틴의 원격 환경 GH_TOKEN 가용성 미확인** — 첫 정기 실행 결과로만 최종 확인 가능.

## Files

- `monthly-analysis.html` — 최근 30일 GitHub 관찰 분석 페이지.
- `monthly-analysis.json` — 최근 30일 레포별 커밋·활동일·테마 분석 데이터.
- `scripts/build-monthly-analysis.mjs` — 월간 분석 JSON과 HTML FALLBACK 생성기.
- `dashboard.html` — 완성도 렌즈·4탭 UI·FALLBACK 상수.
- `project-pages/` — 생성된 프로젝트별 제작 현황 페이지.
- `scripts/build-project-pages.mjs` — project-pages 생성기.
- `docs/project-session-prompts.md` — 각 프로젝트 세션 최신화 프롬프트.
- `projects.json` — 추적 프로젝트 SOT. `agents` 제거 완료.
- `scripts/refresh-progress.mjs` — 활동 refresh. 완성도 점수 자동 변경 금지.
- `scripts/refresh-usage.mjs` — Claude·Codex 한도 %·리셋 자동 수집 + FALLBACK_USAGE 동기화 (/usage-refresh).
- `scripts/report-gen.mjs` — 새 이벤트는 “완성도” 표현 사용.
- `feature_list.json`·`progress.md` — 이 워크스페이스 자체 백로그·상태.

## Next Session

1. `bash init.sh`로 무결성·기준일을 확인한다.
2. `feature_list.json.active`가 비어 있으면 사용자 다음 지시를 기다린다.
3. `meta.asOf`가 오늘보다 오래됐으면 refresh부터 수행한다.
