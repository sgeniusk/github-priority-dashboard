# 진척 — github-priority-dashboard

다음 세션이 이 한 페이지만 보고도 어디까지 했고 뭘 이어가면 되는지 알 수 있도록 유지한다. 상세 백로그는 `feature_list.json`.

**Last Updated**: 2026-05-31 (데이터 refresh — asOf 5/31, Timeer 중단 추가 / v2.1~v2.4 배포 완료 상태 유지)

## Current Objective — None (v2.1·v2.2·v2.3·v2.4 완료, 커밋·푸시·배포 완료)

대시보드 가독성(v2.1)·타운 안정화(v2.2)·kami 보고서(v2.3)·일지 날짜별 아카이브(v2.4) 모두 완료·검증·배포. BookCircle·Nodeloom paused 처리. 다음 작업 대기.

## Recommended Next Step

**다음 세션 시작 시 `bash init.sh` + 이 파일 확인.** 후보 — 일지가 며칠 쌓인 뒤 report.html 날짜 전환 재확인, `/report` 줄글 갱신 자동화 점검, 신규 프로젝트 등록 시 town 플롯(game6·app9·content4 슬롯) 초과 시 자동 확장 점검.

## 직전에 푼 것

- **데이터 refresh + Timeer 중단** (2026-05-31) — `/refresh` 절차로 GitHub 활동 갱신(asOf 5/29→5/31, 커밋/lastUpdate 33건, history 8개 스냅샷, journal 2026-05-31 entry 누적 → report 날짜 선택기 5/31·5/29 2개). Timeer status active→paused(+pausedReason), 활성 13→12·일시중단 4개. suggestions 재생성(tteuniyu 19일 정체로 악화, sam-defender 10일 정체 추가, paused 3개 정체 경고 제외, honbul·chaekdam 신규 가속 반영). FALLBACK_PROJECTS·SUGGESTIONS·JOURNAL 전부 verbatim 동기화.

- **v2.4 일지 날짜별 아카이브** (2026-05-29) — `journal.json`(entries[date]) + `report.html` '일지 날짜' 선택기. `refresh-progress.mjs`에 `upsertJournal()` 추가 — 매 refresh(cron 포함)마다 그날 reports.json 줄글을 date로 upsert(최근 180개, dry-run 안전). 날짜 고르면 그날 일지 kami 렌더. `/report`도 journal upsert. init.sh가 reports·journal 검증. Codex 구현 + Claude 검증(dry-run·날짜 선택기·콘솔 0).
- **BookCircle·Nodeloom 일시중단** (2026-05-29) — status active→paused, pausedReason 추가, FALLBACK·reports 동기화. 활성 15→13. (CI가 pausedReason 필수라 1차 실패→보완.)

- **v2.2 타운 안정화·가독성** (2026-05-29) — `town.html`. 랜덤 재시도 배치 → 동네별 고정 플롯 그리드(game6·app9·content4)로 결정론적 배치, 맵 64×48→82×70 확장, 16채 전부 배치(honbul 포함, 배치 실패 0). 맵 양분하던 세로 강 제거(연못만 유지), 흙 비율 26.5%→11.6%로 잔디 위주 + 또렷한 흙길 리본, 건물에 이름+진척% 라벨·도구색·paused 흐림. 2회 codex 루프(초안→바닥/강 보완). Claude 라이브 검증(콘솔 0·16채 데이터 확인·이동/다리 건너기).
- **v2.3 kami 보고서 페이지** (2026-05-29) — `report.html` 신규. 분야별(게임5·앱8·콘텐츠3) 16개 서비스를 1인칭 존댓말 블로그체로 줄글 표시(내용·목표·진척·조언). 줄글은 Claude가 `reports.json`에 작성, kami 룩(파치먼트·잉크블루·세리프) UI·대시보드 링크·`/report` 커맨드는 Codex 구현. advice는 잉크블루 좌측 바 콜아웃. 콘솔 0 검증.
- **v2.1 대시보드 진척 가독성** (2026-05-29) — 4분할 바 가독성(높이 17px·라이트 색대비·`문서·골격·기능·알파` breakdown·세그먼트 툴팁), 모멘텀 칩(`보합`/`▲+N` + `커밋 N일 전` 색코딩, 점수기반 '정체' 오해 제거), 블로커 뱃지(suggestions high), 헤더 `v2.1·meta.asOf` 동적화. Codex 구현 + Claude 검증(라이트/다크·전탭 콘솔 0).
- **Codex 위임 하네스 도입** (2026-05-29) — `docs/codex-harness.md`(분업 계약·구동 명령·불변식·검증 게이트) + `codex/brief-*.md`. 구현은 Codex(`codex exec --sandbox workspace-write`), 설계·검증은 Claude.
- **AI 디자인 시스템 스쿨 등록 및 폴백 동기화 (v2.0)** (2026-05-21) — `design-system-school` 리포지토리를 `projects.json`에 Rank 12로 등록하고, `/refresh` 명령을 통해 로컬 `FALLBACK_*` 상수 동기화 및 template 폴더 생성 완료.
- **회귀 방지 CI (v2.0)** (2026-05-21) — JSON 스키마 유효성 및 `dashboard.html`/`town.html` 내장 스크립트 컴파일 문법 검사를 수행하는 `validate.mjs` 구현 및 GitHub Actions CI 연동 완료.
- **커스텀 스프라이트 통합(v1.5.1)** (2026-05-21) — 곰곰 플레이어, 6개 NPC, 6개 가구, 8개 환경 커스텀 스프라이트(총 14종) 통합 완료. depth-sorting(Y-Sorting) 개선 및 dashboard.html의 FALLBACK_* 상수 동기화 완료.

- **걸어다니는 마을(v1.5)** (2026-05-19~20) — town.html 게임 페이지 추가. 64×48 유기적 맵, 11개 건물 인테리어, agents=NPC, Kenney Tiny Town + Roguelike Characters CC0
- **데이터 드리프트 교정** (2026-05-19) — story-x-alpha→story-x-beta 이름 교정, Nodeloom 신규 등록(rank 11, 진척도 56% 추정)
- **통합 커밋 피드** (2026-05-19) — refresh-progress.mjs가 activity.json 생성, 대시보드 '활동' 탭 신설, 80건 표시
- **/coach 보고 업그레이드** (2026-05-18) — evidence·confidence·recommendation 구조로 확장(gemmaci 참고)
- **/schedule 루틴 등록** (2026-05-18) — 매일 09:03 KST `/refresh` + `/coach` 실행, 변경/오류 시 sgeniusk@gmail.com 메일
- **추세 차트 1→2 스냅샷** (2026-05-20) — 수동 /refresh로 5/20 스냅샷 추가, 처음으로 선이 그려짐

## 다음 액션 (우선순위순)

1. **2026-05-22 09:03 KST 자동 루틴 첫 정기 실행 결과 확인** — 원격 환경의 `GH_TOKEN` 가용성, Gmail 발송/초안 경로 어느 쪽이 활성인지 확정
2. **신규 프로젝트 추가 시 검증** — `town.html` 내의 자동 충돌 방지 공간 배치 로직 및 depth-sorting 레이어 정상 동작 검증
3. **프로젝트 등록 동기화** — 향후 `design-system-school` 리포지토리에 실제 PRD/Roadmap이 등록되면 `/sync-project` 실행해 동기화

## 검증 — 마지막으로 확인한 증거

| 항목 | 상태 | 마지막 확인 |
| --- | --- | --- |
| JSON 무결성 (6종 + reports.json) | 통과 | 2026-05-29 `bash init.sh` |
| v2.1 카드 가독성 | 검증 | breakdown·모멘텀(`커밋 N일 전`)·블로커 뱃지 렌더, 라이트/다크 정상 |
| v2.1 전 탭 콘솔 | 0 | preview에서 청사진~사용량 전환 |
| v2.3 report.html | 검증 | 16서비스 4요소·advice 잉크블루 콜아웃·paused 표식, 콘솔 0 |
| 대시보드 `보고서` 링크 | 정상 | `<a href=report.html>`, 청사진 탭 로직 무손상 |
| v2.2 town 배치 | 16/16 | 데이터 조회 confirm(honbul 포함), 콘솔 `배치 실패` 0 |
| v2.2 town 가독성 | 검증 | 잔디 위주·흙길 리본·강 제거, 이동/다리 건너기 동작 |
| `meta.asOf` | 2026-05-28 | 헤더 배지 동적 표시 확인 (오늘 5/29 — /refresh 대기) |
| 커밋/배포 | 미수행 | 사용자 요청 시 commit·push (현재 작업트리에만 존재) |

## Blockers (막혀 있는 항목)

- **AI 디자인 시스템 스쿨 리포 정보 미수신** — 사용자 응답 대기. sgeniusk 계정의 가장 최근 리포가 2026-05-16의 Nodeloom·chatgpt-mad-uses까지라 직접 검색으로는 못 찾음.
- **자동 루틴의 원격 환경 GH_TOKEN 가용성 미확인** — 첫 실행 결과로만 검증 가능.

## Files (현재 작업에서 자주 손대는 파일)

- `dashboard.html` — 뷰. CSS·렌더 함수·FALLBACK 상수 모두 여기
- `projects.json` + `dashboard.html`의 `FALLBACK_PROJECTS` — 둘은 verbatim 동기 유지
- `scripts/refresh-progress.mjs` — projects.json·history.json·activity.json 갱신
- `.claude/commands/*.md` — 슬래시 커맨드 정의
- `feature_list.json`·`progress.md` — 이 워크스페이스 자체의 백로그·상태

## Next Session — 시작 절차

이 파일은 다음 세션이 깨끗하게(restartable) 이어가도록 유지한다.

1. `bash init.sh` — 무결성·기준일 점검 (Next steps 한눈에)
2. 위 'Recommended Next Step' 확인
3. `meta.asOf`가 오늘이 아니면 `/refresh`부터

세션을 닫기 전: 'Last Updated', 'Recommended Next Step', 검증 표, Blockers를 갱신한 뒤 커밋. (자세한 절차는 `CLAUDE.md`의 'End of Session' 섹션.)
