# Codex Task — v2.6 대시보드 중복 정리 (탭 8→5)

너는 구현 담당. 사용자 요청 — 뉴스 피드·프로젝트 페이지(v2.5)와 겹치는 대시보드 탭을 줄인다. `dashboard.html`만 수정.
작업 디렉터리는 `/Users/taewookkim/dev/github-priority-dashboard`.

## 적용할 정리 (4건, 사용자 승인됨)

1. **활동(activity) 탭 제거** — 뉴스 'surge' + project-report 타임라인이 대체.
2. **제안(suggest) 탭 제거** — 뉴스 'stall' + project-report '도움 패널'이 대체.
3. **순위(table) 탭 제거 + 청사진에 정렬/필터/검색 이식** — 같은 데이터 두 레이아웃이라 표를 없애되, 표가 갖던 정렬·필터·검색을 청사진으로 옮긴다.
4. **분석(charts) 축소** — 추세(renderTrend)·스택(renderStacked)만 남기고 도넛(renderDonut)·산점(renderScatter) 제거.

결과 탭은 **청사진·마을·분석·스프린트·사용량 및 설정** 5개.

## 현재 구조 (앵커)

- 내비 버튼 L402-409 (blueprint·town·table·suggest·activity·charts·sprint·usage).
- 섹션: blueprint L424~, table 래퍼 L438 + `#sec-table` L459, `#sec-suggest` L484, `#sec-activity` L490, `#sec-charts` L496.
- 필터/검색 UI는 **table 섹션 안**에 있음 — `#fCat`/`#fTool`/`#fStatus`/`#fSort`(L441-450), 검색 `#sInput`(L2332에서 사용).
- `renderFilters()` L1919 (칩 생성), `getList()` L1933 (cat/tool/status/sort/search 적용), `renderTable()` L1946.
- `renderMasterBoard()` L2465 — 현재 자체 `pct desc` 정렬. 블로커 뱃지에 `SUG`(suggestions) 사용, 모멘텀 칩에 `HIST` 사용.
- init L3374: `renderMasterBoard(); renderKPI(); renderFilters(); renderTable(); renderSuggest(); renderActivity(); renderSprint(); renderUsage();`
- 차트 호출: L2328 setTimeout, L2430 `showTab('charts')`, L3376 setTimeout, L3377 resize.
- `dropC`/`resetSprint` L2189-2190 끝에서 `renderTable()` 호출, `togExp` L2001(표 행 펼침), 검색 L2332.
- showTab 기본 L3375 `localStorage.getItem('tab') || 'blueprint'`. glossary '제안/코칭' L485.

## 구현 지침

### 탭/섹션 제거
- 내비에서 `table`·`suggest`·`activity` 버튼 삭제. 섹션 `#sec-table`(+L438 래퍼)·`#sec-suggest`·`#sec-activity` 삭제.
- `renderTable`·`renderSuggest`·`renderActivity` 함수와 그 호출(init·showTab·dropC·resetSprint·togExp·검색 리스너) 정리. **단, 공유 헬퍼(`pct`·`SPRINTS`·`TCLS`·모멘텀 칩 빌더·`daysSince`·`SUG`·`HIST`)와 데이터 로드(projects·suggestions·history·activity fetch)는 절대 제거 금지** — 청사진 블로커 뱃지가 `SUG`를, 모멘텀이 `HIST`를 쓴다.
- `dropC`/`resetSprint`의 `renderTable()` 호출은 `renderMasterBoard()`로 교체(스프린트 위치 바꾸면 청사진 라벨도 갱신되게).
- showTab 기본값: 저장된 tab이 제거된 탭(table/suggest/activity)이거나 없으면 `'blueprint'`로. glossary '제안/코칭' 항목 제거.

### 청사진에 정렬/필터/검색 이식 (순위 대체)
- table 섹션에 있던 필터칩(`#fCat`/`#fTool`/`#fStatus`/`#fSort`)과 검색(`#sInput`)을 **청사진 섹션(L424 sec-label 아래, `#blueprintBody` 위)**로 옮긴다.
- `renderMasterBoard()`가 자체 정렬 대신 **`getList()`**(필터+정렬+검색 적용)를 쓰게 바꾼다. `setF`·검색 리스너는 이제 `renderMasterBoard()`를 호출(또는 renderFilters+renderMasterBoard).
- 정렬 옵션은 기존대로 진척도/커밋/최근 활동. 카드 가독성(4분할 바·breakdown·모멘텀·블로커 뱃지)은 그대로 유지.

### 분석 축소
- `renderDonut`·`renderScatter` 함수와 그 캔버스/컨테이너(분석 섹션 내 해당 `<canvas>`/블록), 그리고 모든 호출(L2328·L2430·L3376·L3377)을 제거. `renderStacked`·`renderTrend`만 남긴다. 분석 섹션 레이아웃이 빈 칸 없이 정돈되게.

## 변경 금지 (불변식)
- `dashboard.html`만 수정. 데이터·다른 파일 불변.
- 다크 base 색 토큰 변경 금지. 청사진 카드의 4분할·모멘텀·블로커·도구색·paused·헤더 동적 배지 유지.
- 마을·스프린트·사용량 탭, '보고서' 링크(report.html) 정상 유지.
- 한국어 문장 `:` 종결 금지. 빌드 도구 없이 정적으로 열려야 함.

## 완료 정의 (DoD)
- [ ] 내비가 청사진·마을·분석·스프린트·사용량 5개. 활동·제안·순위 없음.
- [ ] 청사진에 정렬·필터·검색이 동작(getList 적용), 카드 가독성 그대로.
- [ ] 분석 탭에 추세·스택 2개만, 빈 칸/깨짐 없음.
- [ ] 제거된 탭 관련 JS 호출·glossary 잔존 없음, 콘솔 에러 0(전 탭 전환).
- [ ] 청사진 블로커 뱃지·모멘텀 칩 여전히 동작(SUG·HIST 보존).
- [ ] `bash init.sh`·`node scripts/validate.mjs` 통과.

## 검증
```bash
node scripts/validate.mjs
bash init.sh
```
구현 후 변경 요약(삭제한 탭·함수, 청사진으로 옮긴 컨트롤, 남긴 차트)을 출력하라.
