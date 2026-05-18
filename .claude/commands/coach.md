---
description: 프로젝트 단계를 심층 분석하고 정체를 감지해 suggestions.json을 생성한다
---

# /coach — 진척 코칭 + 정체 감지

`projects.json`을 읽어 각 프로젝트를 단계별로 분석하고, 정체된 프로젝트를 찾아 구체적 다음 액션을 제안한다. 결과는 `suggestions.json`에 기록되어 대시보드의 '제안 / 코칭' 패널에 표시된다.

인자로 프로젝트 이름이 주어지면(`$ARGUMENTS`) 해당 프로젝트만 분석하고, 없으면 활성 프로젝트 전체를 분석한다.

## 분석 항목 (프로젝트별)

1. **막힌 단계** — `progress`의 docs/skeleton/features/alpha 중 만점 대비 가장 낮은 항목을 찾는다. features가 낮으면 "골격은 됐으나 실제 동작 코드 부족", alpha가 0이면 "검증·폴리시 미착수" 식으로 해석한다.
2. **속도** — `commits / daysActive`로 일평균 커밋을 계산한다. 0.5 미만이면 저속 신호.
3. **속도 추세** — 최근 활동 밀도가 떨어지는지 본다. `lastUpdate`와 `daysActive`·`commits`를 함께 보고, 초반엔 활발했는데 최근 `lastUpdate`가 멀어졌으면 "식어가는 신호"로 본다(가능하면 직전 분석 대비 커밋 증가폭으로 판단).
4. **정체(stall)** — `lastUpdate`가 오늘 기준 4일 이상 지났으면 정체로 본다.
5. **Sprint 적합성** — 진척도와 배정된 `sprint`가 맞는지 본다. 진척 ≥60%인데 늦은 Sprint(C/D)에 있으면 "당겨야 할 후보", 진척 낮은데 이른 Sprint(A)면 "Sprint 재배정 검토". `sprint`가 `defer`인데 활발히 커밋되면 표기 불일치로 지적한다.
6. **우선순위 정합성** — `rank`가 높은데(상위) 진척이 정체면 우선 경고 대상이다.

### 리스크 에스컬레이션 규칙

severity는 신호가 겹칠수록 올린다.
- `info` — 일반 코칭·관찰.
- `warn` — 정체(4일+) 또는 속도 추세 하락 중 하나.
- `high` — 정체 + `sprint` A/B + `sprintStatus` `inProgress`가 겹치거나, `rank` 상위(1-3)인데 정체. 동반 마감(같은 Sprint의 다른 프로젝트)에 영향을 주는 경우도 `high`.

## suggestions.json 출력 형식

```json
{
  "_comment": "/coach·/refresh가 생성. 수동 편집보다 커맨드 재생성 권장.",
  "generatedAt": "YYYY-MM-DD",
  "items": [
    {
      "repo": "<projects.json의 name>",
      "type": "coach | stall | idea",
      "severity": "high | warn | info",
      "title": "<짧은 제목>",
      "detail": "<2-3문장 분석>",
      "evidence": ["<진단의 근거가 된 관찰 가능한 사실·수치>", "..."],
      "confidence": "high | medium | low",
      "recommendation": "<코치의 판단 — 무엇을 어떻게 할지 한 문장>",
      "actions": ["<구체적 다음 액션>", "..."]
    }
  ]
}
```

- `type` — 일반 코칭은 `coach`, 정체 감지는 `stall`, 새 방향 제안은 `idea`.
- `severity` — 위 '리스크 에스컬레이션 규칙'을 따른다.
- `evidence` — 진단이 기댄 **관찰 가능한 사실**만 짧게 나열한다(예: `마지막 푸시 2026-05-12 — 6일 경과`, `기능 5/30`, `일평균 커밋 0.5`). 해석·의견이 아니라 수치·날짜·상태값이다.
- `confidence` — 진단의 확신도. `high`는 명확한 정체·만점 대비 격차처럼 사실로 단정 가능할 때, `medium`은 추세 해석이 섞일 때, `low`는 데이터가 부족할 때.
- `recommendation` — 중립적 액션 목록과 별개로, **코치의 판단**을 한 문장으로 단언한다(예: "X를 이번 주 최우선으로", "현 상태 유지가 합리적").
- `actions`는 가능하면 해당 프로젝트의 `nextActions`를 구체화해서 쓴다.
- 항목은 심각도 순으로 정렬하고, 의미 있는 신호만 담는다(모든 프로젝트를 억지로 채우지 않는다).

## 마무리

- `suggestions.json` 저장 후, 정체나 high severity 항목이 있으면 사용자에게 요약해서 알린다.
- 정체 프로젝트가 있으면 "해당 리포로 들어가 함께 작업할까요?"라고 제안한다.
- `progress` 점수를 임의로 바꾸지 않는다. 점수 조정이 필요해 보이면 사용자에게 확인을 받는다.
