---
description: projects.json과 suggestions.json을 바탕으로 reports.json과 report.html 폴백을 갱신한다
---

# /report — 프로젝트 일지 줄글 갱신

`projects.json`과 `suggestions.json`을 읽어 각 서비스의 보고서 문단을 갱신하고, `report.html`의 `FALLBACK_REPORTS`를 `reports.json`과 verbatim으로 동기화한다.

## 절차

1. `projects.json`을 읽어 서비스 목록, `tool`, `status`, `total`, 분야 구분, 기준일을 확인한다.
2. `suggestions.json`을 읽어 각 서비스의 현재 병목, 다음 액션, 주의 신호를 확인한다.
3. 각 서비스의 `body`, `goal`, `progress`, `advice`를 1인칭 존댓말 블로그체로 재작성한다.
4. `reports.json`을 갱신한다. 분야 구조와 서비스 순서는 기존 대시보드 맥락을 따른다.
5. `report.html`의 `const FALLBACK_REPORTS`를 갱신된 `reports.json` 내용과 verbatim으로 동기화한다.
6. 아래 검증을 실행하고 결과를 사용자에게 보고한다.

## 작성 규칙

- 진척 수치, `status`, `tool`은 반드시 `projects.json` 값을 그대로 쓴다.
- 수치, 상태, 배포 여부, 완성도를 부풀리지 않는다.
- `suggestions.json`은 조언과 다음 한 걸음의 근거로만 사용한다.
- 서비스마다 `body`, `goal`, `progress`, `advice` 네 요소를 모두 채운다.
- 문체는 사용자가 자기 프로젝트를 기록하는 1인칭 존댓말 블로그체로 쓴다.
- `report.html`의 렌더링 구조나 디자인은 임의로 바꾸지 않는다. 데이터 폴백만 동기화한다.
- 한국어 UI 문자열을 `:`로 끝내지 않는다.

## 검증

```bash
bash init.sh
node -e "JSON.parse(require('fs').readFileSync('reports.json','utf8')); console.log('reports.json OK')"
```

마무리 보고에는 `reports.json` 갱신 여부, `report.html` 폴백 동기화 여부, 검증 결과를 포함한다.
