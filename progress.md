# 진척 — github-priority-dashboard

다음 세션이 이 한 페이지만 보고도 어디까지 했고 뭘 이어가면 되는지 알 수 있도록 유지한다. 상세 백로그는 `feature_list.json`.

**Last Updated**: 2026-05-21 (커스텀 스프라이트 통합 및 대시보드 동기화 완료)

## Current Objective — None (v2.0 완성형 청사진 에이전트 마일스톤 완료)

모든 v2.0 마일스톤 기능(무인 자동화 정기 실행, 회귀 방지 CI, AI 디자인 시스템 스쿨 등록, 폴백 동기화) 개발 및 검증 완료.

## Recommended Next Step

**2026-05-22 09:03 KST 자동 루틴 첫 정기 실행 결과 확인** — 원격 환경의 `GH_TOKEN` 가용성, Gmail 발송/초안 어느 경로가 활성인지 확정.

## 직전에 푼 것

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
| `meta.asOf` | 2026-05-21 | JSON 무결성 및 sync_fallbacks.py 검증 완료 |
| `history.json` 스냅샷 | 3개 (5/16, 5/20, 5/21) | 추세 차트 라인 11개 렌더 확인 |
| `activity.json` 커밋 | 80건 | '활동' 탭 표시 확인 |
| 콘솔 에러 | 0 | Playwright Chromium에서 전 탭 |
| GitHub Pages 배포 | success | 최근 main push 직후 |
| /schedule 루틴 | enabled, next 2026-05-21T00:03Z | 미실행(첫 실행 대기) |

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
