---
description: Claude·Codex 사용량(한도 %·리셋)을 로컬 CLI 자격증명으로 자동 수집해 usage.json을 갱신한다
---

# /usage-refresh — AI 도구 사용량 자동 수집

로컬에 이미 로그인된 Claude Code·Codex CLI의 자격증명을 재사용해 한도 사용률·리셋 시각을 가져와 `usage.json`과 `dashboard.html`의 `FALLBACK_USAGE`를 갱신한다. (수집 방식 출처: kimbyungsu/codex-usage-monitor, MIT)

## 절차

1. **미리보기** — `node scripts/refresh-usage.mjs --dry-run`을 실행해 수집 결과를 사용자에게 보여준다.
2. **적용** — `node scripts/refresh-usage.mjs`(플래그 없이)를 실행한다. 스크립트가 `usage.json` 저장과 `FALLBACK_USAGE` verbatim 동기화를 모두 처리한다.
3. **검증** — `node -e "JSON.parse(require('fs').readFileSync('usage.json','utf8'))"` 통과 + 대시보드 사용량 탭에서 자동 수집 카드 렌더 확인.
4. **커밋** — `usage.json`, `dashboard.html` 변경을 한 커밋으로. 메시지 예: `Refresh AI usage limits — <오늘 날짜>`.

## 수집 내용과 한계

- **Claude**: `~/.claude/.credentials.json`(또는 `CLAUDE_CONFIG_DIR`)의 OAuth 토큰으로 공식 `/usage`와 동일한 엔드포인트 호출. 5시간/주간(+Opus/Sonnet 전용 주간, 적용 시) 윈도우의 사용률 %·리셋 시각. 토큰 만료 시 자동 갱신.
  - ⚠ 비공식 엔드포인트 — 형식 변경 시 수집이 실패할 수 있으며, 그 경우 대시보드는 수동 입력 폴백으로 동작한다.
- **Codex**: 로컬 `codex app-server --stdio` JSON-RPC로 `account/rateLimits/read` 호출. primary(5시간)/secondary(주간) 윈도우의 사용률 %·리셋 시각·플랜.
- **공개 범위 정책**: 한도 %·리셋·플랜만 기록한다. 토큰 수·비용 추정 등 상세 사용 패턴은 수집·커밋하지 않는다 (Pages 공개 저장소).

## 실패 처리

- 한 도구만 실패하면 성공한 쪽만 갱신하고 실패 사유를 사용자에게 알린다 (`--claude-only` / `--codex-only`로 개별 재시도 가능).
- 둘 다 실패하면 `usage.json`을 건드리지 않고 종료(exit 1). Claude는 "Claude Code 한 번 접속", Codex는 "`codex login` 확인"을 안내한다.
- 네트워크 없이 파이프라인을 점검하려면 `node scripts/refresh-usage.mjs --mock <fixture.json> --dry-run`.
