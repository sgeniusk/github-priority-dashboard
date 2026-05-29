# Codex 위임 하네스 (Claude ↔ Codex)

이 문서는 이 워크스페이스에서 **구현은 Codex CLI에, 설계·하네스·검증은 Claude Code가** 맡는 작업 방식을 정의한다. 사용자가 "코덱스로 코딩, 클로드로 하네스"라고 지시한 분업을 재현 가능하게 못박는다.

## 역할 분담

| 주체 | 책임 |
| --- | --- |
| **Claude Code** | 문제 진단, 개선 방향 설계, task 브리프 작성(하네스), `codex exec` 구동, 결과 검증(init.sh·preview·git diff), 합격 판정·재지시, 상태 갱신 |
| **Codex CLI** | 브리프 범위 내 실제 코드 편집 |

Claude는 코드를 직접 쓰지 않는다. 단, 검증 중 발견한 한 줄 수준 버그는 직접 고쳐도 되며 그 사실을 브리프 회고에 남긴다.

## 1회 루프

```
Claude: 브리프 작성 (codex/brief-<feature>.md)
  → codex exec --sandbox workspace-write "$(cat codex/brief-<feature>.md)"
  → Claude: git diff 리뷰 + bash init.sh + preview 콘솔 0 + 스크린샷
  → 합격? → progress.md·feature_list.json 갱신 / 불합격? → 재지시(같은 브리프에 수정 지시 append)
```

## 구동 명령 (표준)

```bash
codex exec --sandbox workspace-write --cd /Users/taewookkim/dev/github-priority-dashboard \
  "$(cat codex/brief-<feature>.md)"
```

- `--sandbox workspace-write` — 워크스페이스 파일 편집 허용, 네트워크 불필요한 작업에 적합. 무프롬프트.
- 장시간 작업이면 `run_in_background`로 띄우고 완료 알림을 기다린다.
- 결과 세션 이어가기는 `codex exec resume --last "추가 지시"`.

## 브리프가 항상 담아야 할 것 (self-contained)

1. **목표** — 무엇을, 왜 (1~3줄)
2. **대상 파일·함수·라인** — 정확히. 예: `dashboard.html`의 `renderMasterBoard()` (≈L2366)
3. **데이터 계약** — 입력 JSON 필드, 뷰가 기대하는 형태
4. **변경 금지(불변식)** — 아래 '항상 지킬 제약' 전부
5. **완료 정의(DoD)** — 검증 가능한 체크리스트
6. **검증 방법** — `bash init.sh`, 콘솔 에러 0 등

## 항상 지킬 제약 (CLAUDE.md에서 도출 — 브리프마다 복붙)

- 사용자 지정 **도구 태그 변경 금지** (Formi=codex, 뜬이유=hybrid 등)
- **paused 프로젝트(반짝상점)를 active로 되돌리지 말 것**
- 진척도 점수(`progress.*`)를 임의로 부풀리지 말 것
- `dashboard.html`의 **다크 base 색 토큰 변경 금지** — 라이트 테마는 `:root[data-theme="light"]`로만 추가
- `projects.json`/`suggestions.json`/`usage.json` 갱신 시 `dashboard.html`의 `FALLBACK_*` 상수도 **verbatim 동기화** (`FALLBACK_HISTORY`·`FALLBACK_ACTIVITY`는 제외)
- 모든 JSON은 `JSON.parse` 통과 (`bash init.sh`)
- 한국어 출력은 `:`로 문장 종결 금지 (코드·키값 콜론은 무관)

## 검증 게이트 (Claude가 합격 판정 전 수행)

1. `bash init.sh` — JSON 무결성·파일 존재·기준일
2. `npx serve` 또는 preview 서버로 `dashboard.html`·`town.html` 로드 → **콘솔 에러 0** (전 탭 전환)
3. 변경 화면 스크린샷 1장 이상 — 의도한 시각 변화 확인
4. `git diff --stat` — 범위 밖 파일이 바뀌지 않았는지
5. 위 전부 통과 시에만 progress.md 검증 표에 증거 기록

## 브리프 보관

- `codex/brief-<feature>.md` — 기능별 1파일. 완료 후에도 남겨 회고·재현에 쓴다.
