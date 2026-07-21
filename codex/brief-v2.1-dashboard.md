# Codex Task — v2.1 대시보드 진척 가독성 리디자인

너는 이 저장소의 구현 담당이다. 아래 범위만 정확히 구현한다. 설계·검증은 Claude가 한다.
작업 디렉터리는 `/Users/taewookkim/dev/github-priority-dashboard`. 편집 대상은 사실상 `dashboard.html` 하나다.

## 목표

대시보드 카드만 보고 "이 프로젝트가 어디까지 왔고, 지금 움직이는지, 뭐가 막혔는지"를 한눈에 파악하게 만든다. 데이터는 이미 다 있는데 카드가 총점 %만 크게 보여줘서 진척의 '구성'과 '속도'가 안 읽힌다.

## 대상 함수·라인 (dashboard.html)

- `renderMasterBoard()` ≈ L2366 — 청사진 카드(첫 화면). **여기가 핵심.**
- `renderTable()` ≈ L1845 — 순위 탭의 테이블 행. 같은 4분할 바를 쓴다.
- `mapProject(p)` ≈ L1748 — 뷰 모델. 필요하면 필드 추가.
- 전역 `HIST = FALLBACK_HISTORY` ≈ L2631, 로드 후 `HIST = hist` ≈ L3269 — `HIST.snapshots`는 날짜 오름차순 배열, 각 원소 `{date, projects:{<repo>:{total,commits}}}`.
- 헤더 배지 L385 `<span class="hbadge" ...>v1.1 · 2026-05-16</span>` — 하드코딩, 고쳐야 함.
- seg 색 토큰 L22(`:root`)·L30(`[data-theme]`), `.stk-bar`/`.seg` CSS L108-110.

## 구현 항목 (4개)

### ① 4분할 바 가독성
- `.stk-bar` 높이를 10px → 16~18px로 키운다.
- 바 아래(또는 위)에 한 줄 breakdown 텍스트를 추가한다. 예: `문서 20 · 골격 25 · 기능 15 · 알파 10` (값이 0인 항목도 표기). docs=문서, skeleton=골격, features=기능, alpha=알파.
- 각 세그먼트에 `title` 속성(hover 툴팁)으로 `문서 PRD·Spec 20/20` 식 라벨을 단다.
- 라이트 테마에서 docs(`--s1`)·skeleton(`--s2`) 색이 거의 구분 안 됨 → **라이트 테마 한정**으로 두 색 대비를 키운다. 단 legend(L460-463)·도움말(L583+)과 색 의미가 어긋나지 않게 같은 토큰을 쓴다.

### ② 모멘텀 칩 (history.json 기반)
- `HIST.snapshots`에서 각 프로젝트(repo)의 진척 변화를 계산해 카드에 칩으로 표시한다.
  - **주간 변화**: 최신 스냅샷 total − (최신 기준 약 7일 전에 가장 가까운 스냅샷의 total). `▲ +N` 초록 / `▼ −N` 빨강 / `0`이면 `─`.
  - **정체 일수**: total이 마지막으로 바뀐 스냅샷 이후 경과일. 변화 없이 오래면 `정체 Nd`(앰버/회색).
- 기준 '오늘'은 `projects.json`의 `meta.asOf`를 쓴다(데이터 기준일). 로드 시 `META`(또는 유사) 전역에 `meta`를 담아 재사용하라. 스냅샷이 1개뿐이면 모멘텀 칩은 생략(빈 상태 처리).

### ③ 블로커 신호 (suggestions 기반)
- `SUG.items` 중 `repo`가 이 카드이고 `severity==='high'`인 항목이 있으면 카드에 `⚠ 정체`/제목 요약 뱃지를 단다(빨강 계열). hover/title로 해당 `title`을 보여준다. 없으면 표시 안 함.

### ④ 헤더 버전·날짜 동기화
- L385 하드코딩 `v1.1 · 2026-05-16`을 `meta.asOf` 기반으로 갱신한다. 형식 예: `데이터 2026-05-28 기준`. 버전 문자열은 `v2.1`로 갱신하되, 날짜는 항상 `meta.asOf`에서 동적으로 채운다(다시 고착되지 않게).

## 데이터 계약 (이미 존재)

- `mapProject` 결과: `d`(docs) `sc`(skeleton) `fn`(features) `al`(alpha) `repo`(=name) `last`(lastUpdate yyyy-mm-dd) 보유.
- `progress` 합 = total. `pct(p) = d+sc+fn+al`.
- `SUG`(suggestions.json) `items[]`: `{repo,type,severity,title,detail,...}`.

## 변경 금지 (불변식 — 위반 0)

- 사용자 지정 도구 태그 변경 금지.
- paused 프로젝트(반짝상점)를 active로 되돌리지 말 것.
- 진척도 점수(`progress.*`)·`projects.json` 데이터 자체를 바꾸지 말 것. 이 작업은 **뷰(dashboard.html)만** 손댄다.
- `dashboard.html`의 **다크 테마 base 색 토큰 변경 금지**. 색 조정은 라이트 테마 쪽에서만.
- JSON 파일을 건드리지 않으므로 FALLBACK 동기화는 이번엔 불필요(JSON은 그대로다).
- 한국어 문장을 `:`로 끝내지 말 것(코드·키값 콜론은 무관).
- 기존 다른 탭(제안·활동·분석·스프린트·사용량) 기능을 깨뜨리지 말 것.

## 완료 정의 (DoD)

- [ ] 청사진 카드에 ① breakdown 텍스트 + 굵어진 4분할 바, ② 모멘텀 칩, ③ 블로커 뱃지(해당 시)가 보인다.
- [ ] 순위 탭 행에도 breakdown/모멘텀이 일관되게 반영(최소한 바 가독성은 동일 적용).
- [ ] 헤더 배지가 `meta.asOf` 날짜를 동적으로 표시(`v2.1` + 데이터 기준일).
- [ ] 라이트·다크 모드 모두 색·대비 정상.
- [ ] `bash init.sh` 통과, `dashboard.html` 로드 시 콘솔 에러 0, 전 탭 전환 정상.

## 검증

```bash
bash init.sh
node -e "new Function(require('fs').readFileSync('dashboard.html','utf8').match(/<script>([\\s\\S]*)<\\/script>/)[1])" 2>&1 | head   # 스크립트 문법 sanity (참고용)
```
구현 후 변경 요약(무엇을 어디에 추가/수정했는지)을 마지막에 출력하라.
