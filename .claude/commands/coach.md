---
description: 프로젝트 단계를 심층 분석하고 정체를 감지해 suggestions.json을 생성한다
---

# /coach — 진척 코칭 + 정체 감지

`projects.json`을 읽어 각 프로젝트를 단계별로 분석하고, 정체된 프로젝트를 찾아 구체적 다음 액션을 제안한다. 결과는 `suggestions.json`에 기록되어 대시보드의 '제안 / 코칭' 패널에 표시된다.

인자로 프로젝트 이름이 주어지면(`$ARGUMENTS`) 해당 프로젝트만 분석하고, 없으면 활성 프로젝트 전체를 분석한다.

## 분석 항목 (프로젝트별)

1. **막힌 단계** — `progress`의 docs/skeleton/features/alpha 중 만점 대비 가장 낮은 항목을 찾는다. features가 낮으면 "골격은 됐으나 실제 동작 코드 부족", alpha가 0이면 "검증·폴리시 미착수" 식으로 해석한다.
2. **속도** — `commits / daysActive`로 일평균 커밋을 계산한다. 0.5 미만이면 저속 신호.
3. **정체(stall)** — `lastUpdate`가 오늘 기준 4일 이상 지났으면 정체로 본다. 특히 `sprint`가 A/B이고 `sprintStatus`가 `inProgress`인데 정체면 severity를 높인다.
4. **우선순위 정합성** — `rank`가 높은데(상위) 진척이 정체면 우선 경고 대상이다.

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
      "detail": "<2-3문장 분석. 수치 근거 포함>",
      "actions": ["<구체적 다음 액션>", "..."]
    }
  ]
}
```

- `type` — 일반 코칭은 `coach`, 정체 감지는 `stall`, 새 방향 제안은 `idea`.
- `severity` — 정체 + Sprint 진행 중이면 `high`/`warn`, 일반 조언은 `info`.
- `actions`는 가능하면 해당 프로젝트의 `nextActions`를 구체화해서 쓴다.
- 항목은 심각도 순으로 정렬하고, 의미 있는 신호만 담는다(모든 프로젝트를 억지로 채우지 않는다).

## 마무리

- `suggestions.json` 저장 후, 정체나 high severity 항목이 있으면 사용자에게 요약해서 알린다.
- 정체 프로젝트가 있으면 "해당 리포로 들어가 함께 작업할까요?"라고 제안한다.
- `progress` 점수를 임의로 바꾸지 않는다. 점수 조정이 필요해 보이면 사용자에게 확인을 받는다.
