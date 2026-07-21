# Codex Task — v2.5 뉴스 피드 + 프로젝트별 누적 보고서

너는 구현 담당이다. 사용자 피드백 — 기존 일지는 같은 손글을 날짜마다 그대로 스냅샷해 정태적·반복적이라 도움이 안 됐다. 그래서 둘로 나눈다.
- **전체 보고서 = 뉴스 피드** (바뀐 것 중심, 동적)
- **개별 프로젝트 = 누적 보고서 페이지** (devlog식 타임라인 + 그 프로젝트에 도움)

데이터·생성 로직은 Claude가 이미 만들어뒀다. 너는 **뷰 2개 + refresh 연동**을 구현한다. 콘텐츠 문구를 새로 지어내지 말 것.
작업 디렉터리는 `/Users/taewookkim/dev/github-priority-dashboard`.

## 이미 준비된 것 (Claude 작성)

- `scripts/report-gen.mjs` — `buildNews()`·`buildLogs()`·`writeReports({dryRun})` export. 네트워크 불필요, history/activity/projects/suggestions에서 파생. 단독 실행도 됨.
- `news.json` — `{ _comment, generatedAt, _state:{status:{}}, items:[ {date, repo, kind:'progress'|'surge'|'stall'|'status', headline, detail, metric} ] }`. 최신순 정렬, 누적(중복 제거), 최근 120건.
- `project-logs.json` — `{ _comment, generatedAt, logs:{ "<repo>":[ {date, kind:'commit'|'progress'|'note', text, sha?, label?} ] } }`. repo별 시간 오름차순, 누적, repo당 80건. `kind:note`는 큐레이션(보존).
- `reports.json` — 프로젝트 헤더용 줄글: `fields[].services[]{repo,name,tool,status,total,body,goal,advice}`.
- `projects.json` — `projects[]{name,displayName,icon,tool,status,sprint,eta,progress{docs,skeleton,features,alpha,total},nextActions[],risks[],pausedReason?,url}`.
- `suggestions.json` — `items[]{repo,type,severity,title,detail,recommendation,actions[]}`.

## 만들 것 (4개)

### 1) `report.html` → 뉴스 피드로 전환 (기존 일지 날짜 선택기 대체)
- 기존 journal 날짜 선택기 + `FALLBACK_JOURNAL` 렌더 경로를 **뉴스 피드**로 교체한다.
- `news.json` fetch(+ 내장 `FALLBACK_NEWS` 시드, file:// 폴백). items를 **최신순 뉴스 카드**로 렌더 — 날짜·kind 뱃지(progress▲/surge🔥/stall⚠/status)·headline(제목)·detail(한 줄)·metric. 날짜별 구분선(그룹 헤더) 있으면 좋음.
- 각 카드의 `repo`는 **`project-report.html?repo=<repo>`로 링크**(해당 프로젝트 보고서로 드릴인). 헤더 제목은 '프로젝트 뉴스' 류로, `← 대시보드` 링크 유지.
- 빈 상태(items 0) 처리. kami 스타일 유지(파치먼트·잉크블루·세리프·웜그레이).

### 2) `project-report.html` (신규) — 프로젝트별 누적 보고서
- URL 쿼리 `?repo=<repo>`로 대상 결정. 없으면 첫 활성 프로젝트 또는 안내.
- `projects.json`·`reports.json`·`suggestions.json`·`project-logs.json`을 fetch(각 내장 FALLBACK: `FALLBACK_PROJECTS`(projects.json verbatim)·`FALLBACK_REPORTS`(reports.json)·`FALLBACK_SUGGESTIONS`(suggestions.json)·`FALLBACK_LOGS`(project-logs.json)).
- 레이아웃(kami)
  - **헤더** — 프로젝트 이름(reports.name)·도구 뱃지(TOOL 색: claude #ff5b22·codex #3fb950·hermes #bc8cff·hybrid #39c5cf)·status(paused면 '일시중단' 흐림)·진척 total% 막대. reports의 `body`(무엇을)·`goal`(목표·방향) 문단.
  - **도움 패널** — 그 프로젝트에 실질 도움. `reports.advice`(조언), `projects.nextActions`(다음 액션 목록), `projects.risks`/해당 repo `suggestions`(블로커·정체 경고). 잉크블루 콜아웃 톤.
  - **누적 타임라인** — `project-logs.json.logs[repo]`를 **최신순**으로. kind별 구분(commit=커밋 메시지·sha, progress=진척 변동, note=큐레이션 '조언' 등 라벨). devlog처럼 계속 쌓이는 느낌.
  - `← 뉴스` (report.html) + `← 대시보드`(dashboard.html) 링크.
- 다른 프로젝트로 이동할 작은 셀렉터(선택) 있으면 좋음.

### 3) `scripts/refresh-progress.mjs` — 뉴스·로그 자동 갱신 연동
- `report-gen.mjs`의 `writeReports`를 import해, `main()`에서 history/activity upsert 직후(저장 단계, dry-run이면 `writeReports({dryRun:true})`로 preview만) 호출하고 결과를 로그로 출력.
- 기존 `upsertJournal` 호출과 journal 관련 로직은 **제거**(journal은 뉴스+로그로 대체). `journal.json` 파일은 남겨둬도 되나 더는 쓰지 않는다. report.html에서도 journal 의존 제거.

### 4) `.claude/commands/report.md` — 갱신 절차 개정
- `/report`: ① reports.json 줄글(헤더용 body/goal/advice) 갱신 ② `node scripts/report-gen.mjs`로 news.json·project-logs.json 재생성 ③ 중요한 시점이면 project-logs.json에 `kind:note` 큐레이션 노트 수동 추가(보존됨) ④ report.html `FALLBACK_NEWS`·project-report.html `FALLBACK_LOGS` 등 seed 동기화. (news/logs는 누적 아카이브 — history처럼 FALLBACK은 seed로 둔다)

## 변경 금지 (불변식)

- `news.json`·`project-logs.json`·`reports.json`의 텍스트를 새로 지어내지 말 것 — 렌더만. 생성은 report-gen.mjs가 데이터에서 한다.
- 진척 수치·status·tool 부풀림 금지(데이터 그대로).
- refresh-progress.mjs는 projects.json의 commits·lastUpdate·firstCommit·daysActive·meta.asOf 외 필드 자동 변경 금지(기존 규칙). news.json·project-logs.json은 새 파일이라 무관.
- dashboard.html 기능·다크 base 토큰 건드리지 말 것(보고서 링크는 이미 있음 — report.html로).
- 한국어 문장 `:` 종결 금지. 정적으로(빌드 도구 없이) 브라우저에서 바로 열려야 함.

## 완료 정의 (DoD)

- [ ] report.html이 news.json 뉴스 카드를 최신순으로 보여주고, 각 카드 프로젝트명이 project-report.html?repo=로 링크된다(일지 날짜 선택기는 제거됨).
- [ ] project-report.html?repo=honbul 등에서 헤더(이름·도구·진척·body·goal) + 도움 패널(advice·nextActions·블로커) + 누적 타임라인(커밋·진척·노트 최신순)이 보인다.
- [ ] `node scripts/refresh-progress.mjs --dry-run`이 news/logs preview를 출력하고 저장 안 함. 실제 실행 시 news.json·project-logs.json 갱신.
- [ ] file:// 폴백으로도 두 페이지 렌더(FALLBACK_*).
- [ ] `bash init.sh` 통과, report.html·project-report.html 콘솔 에러 0.

## 검증
```bash
node scripts/report-gen.mjs --dry-run
node scripts/refresh-progress.mjs --dry-run 2>&1 | grep -iE "news|logs|일지|journal"
bash init.sh
```
구현 후 변경 요약을 출력하라.
