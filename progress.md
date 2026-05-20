# 진척 — github-priority-dashboard

다음 세션이 이 한 페이지만 보고도 어디까지 했고 뭘 이어가면 되는지 알 수 있도록 유지한다. 상세 백로그는 `feature_list.json`.

**Last Updated**: 2026-05-21 (하네스 재정비 + 5/20 수동 /refresh 후)

## Current Objective — v2.0 완성형 청사진 에이전트 (inProgress)

진행 중인 단일 feature(`v2.0-blueprint-polish`). v1.4까지 마감, 남은 도착 지점은 무인 자동화 안정 + 회귀 방지 CI + 폴리시.

## Recommended Next Step

**2026-05-21 09:03 KST 자동 루틴 첫 정기 실행 결과 확인** — 원격 환경의 `GH_TOKEN` 가용성, Gmail 발송/초안 어느 경로가 활성인지 확정. 결과에 따라 다음 작업이 갈린다.

## 직전에 푼 것

- **데이터 드리프트 교정** (2026-05-19) — story-x-alpha→story-x-beta 이름 교정, Nodeloom 신규 등록(rank 11, 진척도 56% 추정)
- **통합 커밋 피드** (2026-05-19) — refresh-progress.mjs가 activity.json 생성, 대시보드 '활동' 탭 신설, 80건 표시
- **/coach 보고 업그레이드** (2026-05-18) — evidence·confidence·recommendation 구조로 확장(gemmaci 참고)
- **/schedule 루틴 등록** (2026-05-18) — 매일 09:03 KST `/refresh` + `/coach` 실행, 변경/오류 시 sgeniusk@gmail.com 메일
- **추세 차트 1→2 스냅샷** (2026-05-20) — 수동 /refresh로 5/20 스냅샷 추가, 처음으로 선이 그려짐

## 다음 액션 (우선순위순)

1. **2026-05-21 09:03 KST 자동 루틴 첫 정기 실행 결과 확인** — 원격 환경의 `GH_TOKEN` 가용성, Gmail 발송/초안 경로 어느 쪽이 활성인지 확정
2. **Nodeloom 메타 확정** — 사용자가 rank·sprint·tool·progress 점수를 확인하면 임시값을 정식값으로 교체
3. **AI 디자인 시스템 스쿨 등록** — 리포 이름/URL 확보 후 projects.json 등록 + 폴더 스캐폴드 (사용자 응답 대기)
4. **회귀 방지 CI** — JSON 스키마 + dashboard.html 파싱 GitHub Actions 추가
5. **최종 폴리시** — 빈 상태·로딩·에러 일관성, FALLBACK 동기화 자동화 검토

## 검증 — 마지막으로 확인한 증거

| 항목 | 상태 | 마지막 확인 |
| --- | --- | --- |
| `meta.asOf` | 2026-05-20 | refresh-progress.mjs 실행 후 |
| `history.json` 스냅샷 | 2개 (5/16, 5/20) | 추세 차트 라인 11개 렌더 확인 |
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
