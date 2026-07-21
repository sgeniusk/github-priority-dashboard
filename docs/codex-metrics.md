# Codex 작업량 원장

이 대시보드는 수동 완성도와 실제 작업량을 분리한다. `projects.json.progress`는 기존 문서 호환을 위해 보존하지만, 첫 화면의 주 지표로 사용하지 않는다.

## 수집 방식

`node scripts/collect-codex-metrics.mjs`는 `~/.codex/sessions`와 `~/.codex/archived_sessions`의 JSONL을 읽는다.

- 각 root 세션에서 마지막 `event_msg.payload.type="token_count"`의 누적값 하나만 사용한다.
- 세션 ID가 같은 파일은 가장 최근 이벤트 하나로 중복 제거한다.
- `parent_thread_id`가 있거나 sub-agent·guardian·reviewer 계열인 세션은 제외한다.
- cwd의 경로 세그먼트를 `codex-metrics.config.json` 별칭과 비교해 추적 프로젝트에 연결한다.
- 최근 30일은 세션의 마지막 token_count 시각을 기준으로 묶는다.

## 공개와 비공개 경계

정확한 원장은 `.codex-local/codex-ledger.json`에만 저장하고 `.gitignore`로 제외한다. 여기에는 세션 ID와 cwd가 있어 로컬 분류 교정에만 쓴다.

공개 가능한 `codex-summary.json`에는 프로젝트별 합계만 저장한다. 토큰은 기본 10만 단위로 반올림하며 prompt·응답·제목·세션 ID·cwd를 포함하지 않는다.

## 예측 공식

유한 프로젝트만 초기 P50·P80 토큰 예측을 계산한다.

```text
개인 평균 root 세션 토큰 × 규모 등급별 예상 세션 수
```

규모 등급과 예상 세션 수는 `codex-metrics.config.json`에서 조정한다. 종료점이 고정되지 않은 지속형 프로젝트는 백분율을 표시하지 않는다.

현재 예측 신뢰도는 `low`다. 토큰 소진률은 작업량 예산을 얼마나 썼는지 보여줄 뿐, 기능 완성률이나 품질을 뜻하지 않는다. 프로젝트별 검수 단위의 완료 이력이 쌓이면 규모 등급 대신 실제 완료 분포로 보정한다.

## 운영 명령

```bash
node scripts/collect-codex-metrics.mjs --dry-run
node scripts/collect-codex-metrics.mjs
node scripts/build-dashboard.mjs
node scripts/validate.mjs
```

실제 실행은 `codex-summary.json`과 `dashboard.html` FALLBACK을 함께 갱신한다. `--dry-run`은 파일을 쓰지 않고 집계 범위와 상위 프로젝트만 출력한다.

## 예약 실행

매일 09:00·21:00 KST에 Codex 로컬 자동화가 root 세션 작업량을 다시 집계하고, 사용량·GitHub 활동을 가능한 범위에서 합친 뒤 검증된 버전을 Sites에 배포한다. GitHub Actions는 15분 앞선 08:45·20:45 KST에 원격 활동 데이터를 갱신한다.

자격증명이 없는 소스는 실패 값을 새로 쓰지 않고 마지막 정상값을 보존한다. 자동화 보고에는 최신화하지 못한 소스와 기준시각을 명시한다.
