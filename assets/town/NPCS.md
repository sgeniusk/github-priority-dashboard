# NPC + 가구 스프라이트 생성 가이드 (Antigravity)

현재 마을 인테리어는 11개 프로젝트 모두 동일한 룸 템플릿이고 NPC는 Kenney 로그라이크 시트 1행(같은 사람) 색만 다른 상태야. 이걸 다음 시트로 교체하면 코드를 업데이트해서 **각 에이전트가 다른 외형 + sitting/talking 포즈 + 책상·책장 같은 가구**가 인테리어에 들어가게 만들 거야.

## 만들어야 할 파일

| 파일 | 용도 |
| --- | --- |
| `assets/town/npcs.png` | 6명의 다른 NPC × 4 포즈 시트 |
| `assets/town/furniture/desk.png` | 책상 |
| `assets/town/furniture/chair.png` | 의자 |
| `assets/town/furniture/computer.png` | 모니터/노트북 |
| `assets/town/furniture/bookshelf.png` | 책장 |
| `assets/town/furniture/plant.png` | 화분 |
| `assets/town/furniture/rug.png` | 카펫/러그 |

전부 만들 필요 없음 — 만든 만큼만 코드가 자동 인식. 우선 npcs + desk + chair 셋이면 책상 앞 앉기 비주얼은 살아.

---

## 1. npcs.png — 6명 × 4포즈 시트

**크기** — 512×768 PNG, 투명 배경 (RGBA)
**레이아웃** — 6행(캐릭터) × 4열(포즈), 각 셀 **128×128**

### 행 (캐릭터 6명, 위→아래)

| 행 | 캐릭터 |
| --- | --- |
| 1 | 디자이너/아키텍트 — 안경, 단정한 셔츠, 짧은 갈색 머리 |
| 2 | 빌더/엔지니어 — 머리띠, 작업복 오버롤, 어두운 머리 |
| 3 | QA/테스터 — 캐주얼 후드, 짧은 머리, 스니커즈 |
| 4 | 디렉터/PM — 정장 자켓, 단정한 헤어, 차분한 표정 |
| 5 | 크리에이터 — 컬러풀 자켓, 긴 머리, 활기 |
| 6 | 시니어 연구자 — 회색 머리, 가디건/조끼, 안경 |

### 열 (포즈 4가지, 좌→우)

| 열 | 포즈 |
| --- | --- |
| 1 | **STANDING IDLE** — 정면, 팔을 옆에 내린 자세 |
| 2 | **STANDING WALK** — 정면, 한쪽 발 앞으로 (걷는 중) |
| 3 | **SITTING** — 보이지 않는 의자에 앉은 자세, 정면, 손은 무릎/책상 위 (책상은 그리지 X) |
| 4 | **TALKING** — 정면, 한쪽 팔 살짝 들어 손바닥 펴고 (대화 중), 입 약간 벌림 |

### 프롬프트 (그대로 복사)

```
6-row × 4-column character sprite sheet, 512×768 pixels (each cell 128×128).
Six distinct character TYPES per row, four POSES per character across columns.
Fully transparent PNG background (RGBA).

ROW ORDER (top to bottom) — each row is a SINGLE character in 4 poses:
  Row 1: Architect/designer — neat short brown hair, glasses, button-up shirt
  Row 2: Builder/engineer — dark hair with headband, work overall and t-shirt
  Row 3: QA/tester — casual hoodie, short messy hair, sneakers
  Row 4: Director/PM — formal suit jacket, polished hair, calm
  Row 5: Creator — colorful jacket, long flowing hair, lively
  Row 6: Senior researcher — gray hair, knit vest or cardigan, glasses

COLUMN ORDER (left to right) — same character in 4 different poses:
  Col 1: STANDING IDLE — facing camera, arms relaxed at sides, neutral
  Col 2: STANDING WALK — facing camera, one foot stepped forward
  Col 3: SITTING — sitting on an INVISIBLE chair, facing camera, knees bent,
         hands on lap or extended slightly forward (as if working). Do NOT draw
         the chair or desk — only the seated body shape
  Col 4: TALKING GESTURE — facing camera, one arm raised about chest height
         with open palm, mouth slightly open as if mid-sentence

Each cell: character centered, takes about 80% of cell height, fully transparent
background. Bold dark outline, limited cohesive Stardew Valley palette matching
the existing player.png (cute bear 곰곰) and building sprites in
assets/town/buildings/. Crisp pixel-art edges, NO anti-aliasing.

CRITICAL CONSISTENCY: Every cell in the SAME row MUST be the EXACT SAME character
(same face, hair, clothes, colors, proportions) — only the pose changes.
Between different rows, characters must look distinctly different.

Reference style: cozy chibi proportions (~3-head-tall), warm friendly mood.
```

**팁** — 1행(Architect)을 먼저 만들고 결과를 레퍼런스로 첨부해 나머지 5명을 "same style/scale/outline, change to: ..." 로 요청하면 일관성 ↑.

---

## 2. 가구 — 개별 128×128 PNG (선택, 만든 만큼만 사용됨)

각 파일은 같은 폴더(`assets/town/furniture/`)에 저장. 폴더 없으면 만들어.

### 공통 스타일 블록

```
Stardew-style pixel art furniture piece, 128×128 PNG, FULLY TRANSPARENT background.
Single item centered, takes about 80% of canvas. Slight 3/4 top-down view to match
the character/building perspective in the rest of assets/town/. Bold dark outline,
warm cozy palette matching existing buildings. Crisp pixel edges, no anti-aliasing,
no shadow on ground, no extra context — just the item.

Item: [아래 표의 한 줄을 그대로 붙임]
```

### 항목별 한 줄

| 파일 | Item: |
| --- | --- |
| `desk.png` | a small wooden writing desk with one drawer, brown wood top and side panels, viewed slight 3/4 from above |
| `chair.png` | a simple wooden chair with backrest, brown wood, viewed slight 3/4 from front |
| `computer.png` | a retro CRT computer monitor on a small base, dark gray case with a cyan-blue screen glow, sized to sit on a desk |
| `bookshelf.png` | a tall wooden bookshelf with 3 shelves filled with colorful book spines (mix of red, blue, green, brown books) |
| `plant.png` | a small potted leafy green plant in a terracotta clay pot, slightly bushy |
| `rug.png` | a small rectangular rug with simple geometric pattern in warm colors (red, beige, brown), viewed top-down |

**우선순위** — `desk` + `chair` 먼저 (책상 앞 앉은 NPC 핵심), 그다음 `bookshelf` · `plant` · `computer` · `rug`.

---

## 알파 채널 주의 ⚠️

Gemini가 종종 "transparent"를 받아도 RGB 흰색/체커보드로 반환한다. 받은 PNG는 확인 필수.

```bash
python3 -c "
from PIL import Image
for f in ['npcs.png','furniture/desk.png','furniture/chair.png']:
    im = Image.open(f'assets/town/{f}')
    print(f, im.mode, im.size)
"
```

`mode=RGB`로 나오면 후처리 (CHARACTERS.md 마지막의 flood-fill 스크립트 사용 — 회색조+밝은 모서리 연결 컴포넌트 제거).

---

## 우선순위

1. **`npcs.png`** — 인테리어 분위기 가장 크게 바꿈
2. **`furniture/desk.png` + `furniture/chair.png`** — 책상 앞 NPC 비주얼
3. **`furniture/bookshelf.png` + `furniture/plant.png`** — 콘텐츠 동네 방
4. **나머지** — 디테일

전부 만들 필요 없음. 부분만 떨궈도 부분 업그레이드. 다 만들고 알려주면 town.html 코드 업데이트로

- 각 NPC가 다른 외형 (`agents[].name` 해시로 행 선택)
- 일부 NPC는 책상 앞에 앉음 (col 3 sitting 포즈)
- 일부 NPC는 talking 포즈 (서로 마주보고)
- 인테리어에 책상·의자·책장·화분 배치
- 카테고리별 룸 구조 차별화 (game=책상 다수, content=책장, app=책상+화분)

까지 한 번에 처리해줄게.
