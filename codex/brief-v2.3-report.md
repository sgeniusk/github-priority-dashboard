# Codex Task — v2.3 보고서(report.html) kami 스타일 다이어리 페이지

너는 이 저장소의 구현 담당이다. 줄글(콘텐츠)은 Claude가 이미 `reports.json`에 작성해두었다. 너는 그 데이터를 보여주는 **kami 스타일 독립 페이지**와 배선만 만든다. 콘텐츠 문구는 절대 새로 지어내지 말고 `reports.json` 그대로 렌더한다.

작업 디렉터리는 `/Users/taewookkim/dev/github-priority-dashboard`.

## 목표

`reports.json`의 분야별 줄글을, 다이어리/블로그처럼 읽히는 kami 스타일 문서 페이지 `report.html`로 렌더한다. 사용자가 자기 서비스들의 현재와 방향을 한 편의 일지로 읽는 페이지다.

## 만들 것 (3개)

### 1) `report.html` (신규, 저장소 루트)
- `fetch('./reports.json')`로 로드하고, 실패 시(file://) 내장 `FALLBACK_REPORTS` 사본을 쓴다. **`FALLBACK_REPORTS`는 `reports.json`의 verbatim 복사본**이어야 한다(dashboard.html의 FALLBACK 패턴과 동일).
- 구조
  - 헤더 — 문서 제목(예: `프로젝트 일지`), `meta.asOf`/`generatedAt` 기반 `데이터 2026-05-28 기준 · 마지막 갱신 …`, 그리고 `intro` 문단. `← 대시보드`로 돌아가는 링크(`dashboard.html`).
  - 분야 섹션 반복 — 각 `fields[]`마다 섹션 제목(`icon` + `label`)과 `intro` 한 줄.
  - 서비스 아티클 반복 — 각 `services[]`를 글 한 편처럼. 제목(`name`) + 작은 도구 뱃지(`tool`) + 진척 표시(`total`%). 그 아래 `body`(문단), `goal`(문단), `progress`(한 줄), `advice`(시각적으로 구분되는 한 줄 — 여백 노트/콜아웃 느낌, 잉크블루 좌측 바 등). `status==='paused'`면 제목 옆에 점선 '일시중단' 표식.
- 진척 표시는 작은 막대나 숫자 정도로 가볍게. 대시보드의 화려한 4분할을 복제하지 말 것 — 여긴 읽는 페이지다.

### 2) 대시보드 → 보고서 링크
- `dashboard.html` 헤더 내비(청사진·마을·순위…)에 `보고서` 링크를 추가한다. 클릭하면 `report.html`로 이동(같은 창). 기존 탭 전환 로직(showTab)을 깨지 말 것 — 이건 탭이 아니라 외부 페이지 링크다.

### 3) `/report` 갱신 커맨드 스캐폴드
- `.claude/commands/report.md`를 만든다. 내용은 "projects.json + suggestions.json을 읽어 각 서비스의 줄글(body/goal/progress/advice)을 **1인칭 존댓말 블로그체**로 재작성해 reports.json을 갱신하고, report.html의 FALLBACK_REPORTS를 verbatim 동기화한다"는 절차를 적은 슬래시 커맨드 정의. 진척 수치·status·tool은 projects.json에서 따오고 부풀리지 말 것을 명시. (실제 줄글 생성은 사람이/Claude가 커맨드로 수행하므로, 여기선 커맨드 문서만 작성)

## kami 디자인 (정확히 지킬 것 — 스킬 토큰 인라인)

- 페이지 배경 파치먼트 `#f5f4ed` (순백 금지). 카드/아티클 컨테이너 아이보리 `#faf9f5`.
- 단일 강조색 잉크블루 `#1B365D` (전체 면적의 ≤5%, 좌측 바·제목 강조·도구 뱃지 정도). 두 번째 채도색 쓰지 말 것.
- 모든 회색은 웜톤만 — 본문 `#141413`, 보조 `#3d3d3a`, 서브텍스트 `#504e49`, 메타/날짜 `#6b6a64`. 쿨그레이(`#f3f4f6` 등) 금지.
- 타이포 — 제목·본문 모두 **세리프**(한글 세리프: `'Nanum Myeongjo', 'Apple SD Gothic Neo' serif` 같은 스택을 CDN/시스템으로. 본문 가독 위주). 라벨·도구뱃지·메타·eyebrow만 산세리프. 세리프는 굵게(bold) 쓰지 말고 weight 500 정도.
- 행간 — 제목 1.15~1.3, 읽는 본문 1.55. 여백 넉넉히. 한 컬럼 아티클 폭은 본문 기준 ~680px로 제한해 읽기 편하게.
- 깊이는 은은한 ring/whisper 그림자만, 하드 드롭섀도 금지.
- 테두리 `#e8e6dc`/`#e5e3d8`.
- 화면 전용 페이지라 시적 한 줄(예: intro)에 절제된 italic은 허용. 남발 금지.
- 다크모드는 선택 — 안 해도 됨. 하면 파치먼트 대신 `#141413` 계열 웜다크.

## 변경 금지 (불변식)

- `reports.json`의 문구를 바꾸거나 새 문구를 지어내지 말 것. 그대로 렌더만.
- 진척 수치·status·tool 부풀리지 말 것 (reports.json 값 그대로).
- `dashboard.html`의 기존 탭·기능·다크 base 색 토큰을 깨지 말 것. 추가는 보고서 링크 하나뿐.
- 한국어 UI 문자열을 `:`로 끝내지 말 것(코드·키값 콜론 무관).
- report.html은 정적 — 빌드 도구 없이 브라우저에서 바로 열려야 함.

## 완료 정의 (DoD)

- [ ] `report.html`이 게임·앱·콘텐츠 3개 섹션에 16개 서비스 줄글을 1인칭 존댓말로 표시.
- [ ] 각 서비스에 body·goal·progress·advice 4요소가 다 보이고 advice가 시각적으로 구분됨.
- [ ] kami 룩 — 파치먼트 배경·세리프·잉크블루 강조·웜그레이·넉넉한 여백.
- [ ] FALLBACK_REPORTS가 reports.json verbatim, fetch 실패해도 동일 렌더.
- [ ] 대시보드 헤더에 `보고서` 링크 → report.html, report.html에 `← 대시보드` 링크.
- [ ] `.claude/commands/report.md` 생성.
- [ ] `bash init.sh` 통과, report.html·dashboard.html 콘솔 에러 0.

## 검증

```bash
bash init.sh
node -e "JSON.parse(require('fs').readFileSync('reports.json','utf8')); console.log('reports.json OK')"
```
구현 후 변경 요약(파일별 무엇을)을 출력하라.
