# Codex Task — v2.4 일지 아카이브 (날짜별 일지 + 리프레시 누적)

너는 구현 담당이다. 사용자 요청 — "일지는 리프레시 할 때마다 쌓이도록 일자별로 볼 수 있는 방식으로". 즉 보고서(일지)를 매 리프레시마다 그날 entry로 누적하고, report.html에서 날짜를 골라 그날 일지를 보게 한다.
작업 디렉터리는 `/Users/taewookkim/dev/github-priority-dashboard`.

## 데이터 (이미 준비됨 — Claude가 시드)

- `reports.json` — 현재(최신) 일지 줄글. 구조 `{_comment, generatedAt, meta:{asOf}, intro, fields:[{key,label,icon,intro,services:[{repo,name,tool,status,total,body,goal,progress,advice}]}]}`.
- `journal.json` (신규, 이미 시드됨) — 일자별 아카이브. 구조 `{_comment, entries:[{date, generatedAt, intro, fields}]}`. 현재 1개 entry(2026-05-29). **entry는 그날의 reports.json 줄글(intro+fields) 스냅샷 + date.**

## 만들 것 (3개)

### 1) `scripts/refresh-progress.mjs` — 일지 누적 (핵심)
- 기존 `upsertHistory(data)` (≈L80-100)를 미러링해 **`upsertJournal(data)`**를 추가한다.
  - `reports.json`을 읽는다(없으면 스킵하고 로그만). 
  - entry `{ date: data.meta.asOf, generatedAt: reports.generatedAt, intro: reports.intro, fields: reports.fields }`를 만든다 (date는 refresh가 갱신한 오늘자 `data.meta.asOf`).
  - `journal.json`을 읽어(없으면 `{_comment, entries:[]}`로 init) `entries`에서 같은 date면 교체, 없으면 push. date 오름차순 정렬, 최근 **180개** 유지. `JSON.stringify(.., null, 2) + '\n'`로 저장.
  - 한 줄 로그 반환(예: `journal.json 일지 upsert — <date>, entries N개.`).
- `main()`에서 `upsertHistory` 호출 직후(저장 단계, dry-run 아닐 때만) `console.log(upsertJournal(data))` 호출. **dry-run이면 저장하지 말 것.** 파일 상단 주석(자동 갱신 대상 설명)에 journal.json도 추가.
- 이로써 매 `/refresh`(및 cron)마다 그날 일지가 자동 누적된다.

### 2) `report.html` — 날짜별 열람 UI
- 이제 **`journal.json`을 fetch**해서 렌더한다(기존 reports.json 단일 렌더 대체). `file://` 폴백용 `FALLBACK_JOURNAL`(= journal.json verbatim 시드)을 내장. journal 로드 실패 시 FALLBACK_JOURNAL 사용. entries가 0개면 빈 상태 메시지.
- **날짜 선택 UI** — entries를 최신순으로 나열한 선택기(상단 `<select>` 또는 좌측 날짜 리스트). 기본 선택 = 가장 최근 date.
- 선택된 date의 entry(intro + fields)를 **기존 kami 레이아웃 그대로** 렌더(분야 섹션·서비스 아티클·body/goal/progress/advice·일시중단 표식). 헤더의 "데이터 …기준 · 마지막 갱신"은 선택된 entry의 date 기준으로 표기.
- 날짜를 바꾸면 본문이 그 날짜 일지로 교체된다. `← 대시보드` 링크 유지.
- entries가 1개뿐이어도 선택기는 그 1개를 보여주고 정상 동작해야 한다(향후 누적되면 자동으로 늘어남).

### 3) `.claude/commands/report.md` — 갱신 시 일지도 누적
- `/report`가 reports.json을 재작성한 뒤, **journal.json에 오늘자(meta.asOf) entry를 upsert**하고 report.html의 FALLBACK_JOURNAL을 최신 journal.json으로 시드 동기화하도록 절차에 추가한다. (refresh-progress.mjs의 upsertJournal과 동일 로직)

## kami 디자인 (기존 유지)
- 파치먼트 배경·잉크블루 강조·세리프·웜그레이·넉넉한 여백. 날짜 선택기도 같은 톤(산세리프 라벨, 절제된 잉크블루). 새 이미지 파일 만들지 말 것.

## 변경 금지 (불변식)
- `journal.json`·`reports.json`의 줄글 문구를 새로 지어내지 말 것 — 스냅샷/렌더만.
- 진척 수치·status·tool은 데이터 그대로(부풀림 금지).
- refresh-progress.mjs는 projects.json의 commits·lastUpdate·firstCommit·daysActive·meta.asOf 외 필드를 바꾸지 말 것(기존 규칙). journal.json은 새 파일이라 무관.
- dashboard.html의 기능·다크 base 토큰 건드리지 말 것.
- 한국어 문장을 `:`로 끝내지 말 것. PixiJS/빌드도구 없이 정적으로 열려야 함.

## 완료 정의 (DoD)
- [ ] `node scripts/refresh-progress.mjs --dry-run`이 journal 누적을 미리보기로 보고, 저장은 안 함. 실제 실행 시 journal.json에 오늘자 entry upsert.
- [ ] report.html에 날짜 선택기가 있고, 선택 시 해당 날짜 일지가 kami 레이아웃으로 렌더됨. 기본은 최신 날짜.
- [ ] journal.json fetch 실패(file://)해도 FALLBACK_JOURNAL로 동일 렌더.
- [ ] `.claude/commands/report.md`에 journal upsert 절차 추가.
- [ ] `bash init.sh` 통과(journal.json 포함되면 JSON 파싱 OK), report.html 콘솔 에러 0.

## 검증
```bash
node scripts/refresh-progress.mjs --dry-run 2>&1 | tail -20
node -e "JSON.parse(require('fs').readFileSync('journal.json','utf8'));console.log('journal OK')"
bash init.sh
```
구현 후 변경 요약을 출력하라.
