# 캐릭터·동반자 스프라이트 생성 가이드

`town.html`이 다음 3개 파일을 찾아본다. 있으면 그 스프라이트로 교체, 없으면 폴백(이모지/Kenney 정면 단일)으로 동작.

| 파일 | 용도 | 폴백 |
| --- | --- | --- |
| `assets/town/player.png` | 플레이어 — 4방향 워크 사이클 | Kenney 정면 단일 + 좌우 플립 |
| `assets/town/dog.png` | 동반자 강아지 **해치** | 🐶 이모지 |
| `assets/town/cat.png` | 동반자 고양이 **해삐** | 🐱 이모지 |

## 시트 레이아웃 (이 형식 그대로 따라야 자동 인식됨)

### player.png — 4방향 × 2프레임
- **4행 × 2열**, 정사각 프레임
- 행 순서 (위→아래): **down, up, left, right**
- 열 순서 (좌→우): **frame 0 (idle/stand), frame 1 (walk step)**
- 권장 크기: **256×512** (프레임 128×128) 또는 **128×256** (프레임 64×64)
- 투명 배경 PNG, 알파 채널 필수

### dog.png / cat.png — 정면 단일 × 2프레임
- **1행 × 2열**, 정사각 프레임
- 권장 크기: **256×128** (프레임 128×128)
- 투명 배경 PNG, 알파 채널 필수

## 공통 스타일 블록 (3개 모두 같이 적용)

```
Pixel art, 16-bit cozy farm-RPG style (like Stardew Valley / SNES JRPG).
Character/creature sprite, viewed front (or specified direction), centered
in each frame cell. FULLY TRANSPARENT background (PNG alpha). Warm friendly
mood, bold dark outline, limited cohesive palette, crisp hard-edged pixels.
NO anti-aliasing, NO blur, NO drop shadow, NO ground or grass.
Match the visual style of the existing building sprites in
assets/town/buildings/ (cozy chunky Stardew look).
```

## player.png 프롬프트 — 곰곰 (귀여운 곰)

```
4-row × 2-column character sprite sheet, total 256×512 pixels (each cell 128×128).
Row order TOP to BOTTOM: walking DOWN (facing camera), walking UP (facing away),
walking LEFT, walking RIGHT.
Each row has TWO frames: frame 1 = idle/stand pose, frame 2 = one step forward.

Character: 곰곰 (Gomgom), a CUTE LITTLE BEAR — anthropomorphic chibi-style.
Round soft fluffy body, chubby short limbs, two big rounded ears on top of the head,
small dark nose, friendly tiny black-dot eyes, warm caramel/honey-brown fur.
Wearing a simple cozy outfit — overall straps or a comfy shirt in earthy tones
(forest green / warm brown). Roughly 3-head-tall chibi proportions. Charmingly cute,
not scary or realistic — like a Stardew Valley NPC version of a cuddly teddy bear.

Same exact bear character in all 8 cells — only direction and step change.
Each cell: bear centered, takes about 80% of cell height, fully transparent
background. Bold dark outline, limited cohesive Stardew-style palette matching
the existing building sprites in assets/town/buildings/. Crisp pixel-art edges,
NO anti-aliasing.
```

**팁** — 현재 `player.png`(인간 마을사람)을 레퍼런스로 첨부 + "Same exact layout and proportions, replace the character with cute bear 곰곰" 한 줄 덧붙이면 시트 구조 그대로 유지하면서 캐릭터만 바뀜.

## dog.png 프롬프트 (해치 🐶)

```
1-row × 2-column dog sprite sheet, total 256×128 pixels (each cell 128×128).
Two frames: frame 1 = standing, frame 2 = walking (one leg lifted).

Character: a small cute Jindo / shiba-style dog named 해치 (Haechi).
Cream/tan fur, perky ears, fluffy curled tail, gentle eyes, slight smile.
Viewed from the front with slight 3/4 tilt (matches Stardew character view).

Each cell: dog centered, takes about 70% of cell height, fully transparent
background. Bold outline, limited Stardew-style palette, crisp pixel edges.
Same dog in both frames — only legs/tail change.
```

## cat.png 프롬프트 (해삐 🐱)

```
1-row × 2-column cat sprite sheet, total 256×128 pixels (each cell 128×128).
Two frames: frame 1 = standing, frame 2 = walking (one leg lifted).

Character: a small cute Korean shorthair cat named 해삐 (Happy).
White and gray patches, upright triangular ears, curled tail, bright eyes,
calm expression. Viewed from the front with slight 3/4 tilt.

Each cell: cat centered, takes about 70% of cell height, fully transparent
background. Bold outline, limited Stardew-style palette matching the dog sprite,
crisp pixel edges. Same cat in both frames — only legs/tail change.
```

## 일관성 비결 (3개 같이)

1. **건물 11개 시트(`assets/town/buildings/*.png`)를 레퍼런스로 첨부**해서 스타일·아웃라인·팔레트가 같게.
2. **player를 먼저** 생성 → 그걸 다시 레퍼런스로 dog → 그 둘을 레퍼런스로 cat. 일관성 누적.
3. 같은 모델·같은 세션.

## 알파 채널 주의 ⚠️

Gemini 2.5 Flash Image (Nano Banana)는 종종 "transparent background"를 받아도 **체커보드 패턴 그림으로 fake**해서 RGB로 저장한다. 결과물 받은 뒤 반드시 확인:

```bash
python3 -c "
from PIL import Image
for f in ['player.png','dog.png','cat.png']:
    im = Image.open(f'assets/town/{f}')
    print(f, im.mode, im.size)
"
```

`mode=RGB`로 나오면 알파 없는 fake. 후처리 필요:

```python
import numpy as np
from PIL import Image
from scipy import ndimage

def fix(path):
    im = Image.open(path).convert('RGBA')
    arr = np.array(im); h,w = arr.shape[:2]
    r,g,b = arr[:,:,0].astype(int), arr[:,:,1].astype(int), arr[:,:,2].astype(int)
    gray = (np.abs(r-g)<=5) & (np.abs(g-b)<=5) & (np.abs(r-b)<=5)
    bright = arr[:,:,0] >= 180
    labels, _ = ndimage.label(gray & bright)
    bg = set()
    for y,x in [(0,0),(0,w-1),(h-1,0),(h-1,w-1)]:
        if labels[y,x]: bg.add(labels[y,x])
    arr[np.isin(labels, list(bg)), 3] = 0
    Image.fromarray(arr,'RGBA').save(path, 'PNG', optimize=True)

for f in ['player.png','dog.png','cat.png']:
    fix(f'assets/town/{f}')
```

(건물 스프라이트도 같은 이슈가 있어 후처리했음 — 커밋 `06688b1` 참고.)

## 적용

PNG 3개를 위 경로에 넣고 `town.html` 새로고침하면 끝. 자동 인식됨.

- `player.png`만 있으면 → 플레이어만 새 4방향 스프라이트, 동반자는 이모지
- `dog.png`·`cat.png`만 있으면 → 플레이어는 폴백, 동반자만 진짜 강아지·고양이

각자 만들 수 있을 때 PR처럼 하나씩 추가하면 점진적 업그레이드.
