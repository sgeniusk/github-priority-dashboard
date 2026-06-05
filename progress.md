# 진척 — github-priority-dashboard

다음 세션이 이 한 페이지만 보고도 현재 상태와 검증 증거를 이어받을 수 있도록 유지한다. 상세 백로그는 `feature_list.json`.

**Last Updated**: 2026-06-05 (v2.8 프로젝트별 제작 현황 페이지 + 세션 프롬프트)

## Current Objective — None

오늘 작업 완료 상태다. `meta.asOf`는 2026-06-05이고, 전체 16개 프로젝트 중 활성 12개·일시중단 4개, 총 커밋 1605개, 뉴스 14건, history 15스냅샷이다. `project-pages/`에는 16개 프로젝트별 제작 현황 페이지와 index가 생성되어 있다.

## Recommended Next Step

다음 세션 시작 시 `bash init.sh`와 이 파일을 먼저 확인한다. 후보 작업은 자동 refresh 루틴의 원격 `GH_TOKEN` 가용성 확인, `reports.json` 줄글 최신성 점검, 신규 프로젝트 등록 시 `projects/{repo}` 문서 표준화와 project-pages 재생성 확인이다.

## 직전에 푼 것

- **v2.8 프로젝트별 제작 현황 페이지와 세션 프롬프트** — `scripts/build-project-pages.mjs`를 추가해 `projects.json`·`reports.json`·`suggestions.json`·`project-logs.json`에서 `project-pages/index.html`과 16개 프로젝트별 정적 원페이지를 생성했다. 각 페이지는 kami 스타일로 현재 판단, 완성도, 다음 액션, 리스크·코칭, 항상 최신화할 문서, 세션 시작 프롬프트, 최근 근거를 보여준다. `refresh-progress.mjs`가 refresh 후 페이지를 재생성하도록 연결했고, 대시보드 카드와 뉴스 피드의 프로젝트 링크를 새 페이지로 보냈다. `docs/project-session-prompts.md`에는 프로젝트 세션마다 갱신할 문서와 공통 프롬프트를 정리했다.
- **v2.7 완성도·운영 신호 분리와 town 폐기** — 기존 `progress.total`은 산출물 기준 **완성도**로 유지하고, 대시보드에는 모멘텀·건강·신뢰도·다음 마일스톤을 파생 표시했다. KPI는 도구별 개수 대신 활성 프로젝트, 평균 완성도, 건강 위험, 최근 7일 커밋으로 재구성했다. 청사진 카드는 완성도 숫자와 건강 칩, 신뢰도 칩, 건강 근거, 초점 단계, 다음 마일스톤을 한 번에 보이게 바꿨다.
- **불필요 항목 축소** — 마을 탭, `town.html`, `assets/town`, town 전용 Codex 브리프, town-only `agents` 필드, validate의 town 파싱 게이트를 제거했다. 대시보드는 현재 청사진·분석·스프린트·사용량 4탭 + 보고서 링크 구조다.
- **2026-06-05 refresh** — GitHub 활동 refresh와 원격 daily auto-refresh rebase로 `three-kingdoms-deckbuilder` 181→183커밋, `honbul` 97→118커밋, 총 커밋 1605개, `meta.asOf` 2026-06-05, history 15스냅샷, news 14건으로 갱신했다. 완성도 점수는 자동 변경하지 않았다.

## 다음 액션

1. **자동 루틴 확인** — 원격 daily refresh가 2026-06-05 이후에도 `main`에 정상 반영되는지 확인한다.
2. **보고서 문구 점진 개선** — 기존 `reports.json` 줄글 일부는 예전 표현과 현황을 담고 있다. 수동 줄글 갱신 때 “완성도” 표현과 실제 최신 상태를 자연스럽게 맞춘다.
3. **신규 프로젝트 등록 절차 확인** — 신규 등록 시 `projects.json`·`reports.json`·`projects/{repo}` 문서와 FALLBACK 동기화 후 `node scripts/build-project-pages.mjs`를 실행한다.

## 검증 — 마지막으로 확인한 증거

| 항목 | 상태 | 마지막 확인 |
| --- | --- | --- |
| 시작 점검 | 통과 | 2026-06-05 `bash init.sh`, refresh 전 stale 감지 후 갱신 |
| 데이터 refresh | 통과 | 2026-06-05 local refresh + 원격 daily auto-refresh rebase, 총 커밋 1605·뉴스 14건 |
| JSON·스크립트 검증 | 통과 | `node scripts/validate.mjs` |
| 보고서 fallback·file smoke | 통과 | `node scripts/check-report-pages.mjs`, project-pages 존재 검증 포함 |
| dashboard FALLBACK | 통과 | `FALLBACK_PROJECTS`·`FALLBACK_SUGGESTIONS`·`FALLBACK_USAGE` verbatim 일치 |
| 브라우저 콘솔 | 0 | Chromium, dashboard 4탭 + report.html + project-report.html?repo=habit + project-pages/index.html + project-pages/honbul.html |
| 브라우저 HTTP 오류 | 0 | Chromium, 로컬 4xx/5xx 0 |
| 반응형 화면 | 확인 | project-pages/honbul.html 데스크톱 1440px·모바일 390px 스크린샷 확인 |

## Blockers

- **자동 루틴의 원격 환경 GH_TOKEN 가용성 미확인** — 첫 정기 실행 결과로만 최종 확인 가능.

## Files

- `dashboard.html` — 완성도 렌즈·4탭 UI·FALLBACK 상수.
- `project-pages/` — 생성된 프로젝트별 제작 현황 페이지.
- `scripts/build-project-pages.mjs` — project-pages 생성기.
- `docs/project-session-prompts.md` — 각 프로젝트 세션 최신화 프롬프트.
- `projects.json` — 추적 프로젝트 SOT. `agents` 제거 완료.
- `scripts/refresh-progress.mjs` — 활동 refresh. 완성도 점수 자동 변경 금지.
- `scripts/report-gen.mjs` — 새 이벤트는 “완성도” 표현 사용.
- `feature_list.json`·`progress.md` — 이 워크스페이스 자체 백로그·상태.

## Next Session

1. `bash init.sh`로 무결성·기준일을 확인한다.
2. `feature_list.json.active`가 비어 있으면 사용자 다음 지시를 기다린다.
3. `meta.asOf`가 오늘보다 오래됐으면 refresh부터 수행한다.
