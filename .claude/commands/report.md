---
description: reports.json 줄글과 뉴스·프로젝트 로그 시드를 갱신한다
---

# /report — 프로젝트 뉴스와 누적 보고서 갱신

`reports.json`은 프로젝트별 헤더 문단(`body`, `goal`, `advice`)의 원천이고, `news.json`·`project-logs.json`은 `scripts/report-gen.mjs`가 history/activity/projects/suggestions에서 재생성하는 누적 아카이브다.

## 절차

1. `projects.json`과 `suggestions.json`을 읽어 서비스 목록, `tool`, `status`, `total`, 병목, 다음 액션, 기준일을 확인한다.
2. 프로젝트 헤더에 필요한 `reports.json` 줄글만 갱신한다. 서비스마다 `body`, `goal`, `advice`를 채우고 진척 수치·상태·도구는 데이터 그대로 둔다.
3. `node scripts/report-gen.mjs`를 실행해 `news.json`과 `project-logs.json`을 재생성한다.
4. 중요한 시점이면 `project-logs.json`의 해당 repo 배열에 `kind: "note"` 큐레이션 노트를 수동 추가한다. 기존 `kind: "note"` 항목은 생성기가 보존한다.
5. `report.html`의 `FALLBACK_NEWS`와 `project-report.html`의 `FALLBACK_PROJECTS`·`FALLBACK_REPORTS`·`FALLBACK_SUGGESTIONS`·`FALLBACK_LOGS` 시드를 각 JSON 파일과 동기화한다. `news.json`·`project-logs.json`은 history처럼 누적 아카이브이며 FALLBACK은 file://용 seed다.
6. 아래 검증을 실행하고 결과를 사용자에게 보고한다.

## 작성 규칙

- `news.json`·`project-logs.json`·`reports.json`의 기존 텍스트를 임의로 새로 지어내지 않는다.
- 진척 수치, `status`, `tool`은 반드시 원천 데이터 값을 그대로 쓴다.
- 수치, 상태, 배포 여부, 완성도를 부풀리지 않는다.
- `suggestions.json`은 조언과 다음 한 걸음의 근거로만 사용한다.
- 한국어 UI 문자열을 `:`로 끝내지 않는다.

## 검증

```bash
node scripts/report-gen.mjs --dry-run
node scripts/check-report-pages.mjs
bash init.sh
```

마무리 보고에는 `reports.json` 갱신 여부, `news.json`·`project-logs.json` 재생성 여부, report 페이지 FALLBACK 동기화 여부, 검증 결과를 포함한다.
