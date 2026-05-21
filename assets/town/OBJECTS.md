# 환경 오브젝트 스프라이트 생성 가이드

`town.html`이 다음 3개 파일을 찾아본다. 있으면 사용, 없으면 폴백.

| 파일 | 용도 | 폴백 |
| --- | --- | --- |
| `assets/town/tree.png` | 나무 — 모든 나무 위치에 사용 | Kenney 타일 28 (작은 녹색 나무) |
| `assets/town/water.png` | 물 (호수 표면) — 셀당 타일링 | 단조로운 파란 면(Graphics) |
| `assets/town/mush.png` | 버섯/꽃 데코 | Kenney 타일 29 (빨간 버섯 쌍) |

자갈 물가(SHORE) · 흙길 · 잔디는 Kenney가 충분히 예쁘니 그대로 둠.

## 시트 레이아웃

### tree.png — 단일 나무 (큰 디테일)
- **정사각 PNG**, 권장 **256×256** 또는 **512×512**
- 나무 1그루 단독, 정면 또는 살짝 3/4 뷰
- 캔버스의 약 90%를 채우고, **밑동(뿌리)은 캔버스 바닥 가장자리에 닿게** (게임에서 발/뿌리 기준으로 정렬)
- 투명 배경 (PNG RGBA)
- **자동 스케일**: 게임에서 1.7타일 높이(=109px)로 줄여 렌더 → 어떤 원본 해상도든 OK

### water.png — 타일링 물 텍스처
- **정사각 seamless 타일**, 권장 **64×64** 또는 **128×128**
- 게임이 셀(타일)당 1장씩 깔아서 깐다. 따라서 **상하좌우 가장자리가 매끄럽게 이어져야** 함 (seamless / tileable)
- 잔잔한 호수 표면, 미세한 물결 패턴
- 투명 배경 불필요 (불투명 PNG 가능, 알파 있어도 OK)

### mush.png — 버섯/꽃 데코
- **정사각 PNG**, 권장 **64×64** 또는 **128×128**
- 작은 데코 한 무더기 (버섯 1~3송이, 또는 꽃 클러스터)
- 캔버스의 50~70% 정도 채움
- 투명 배경 (PNG RGBA)
- **자동 스케일**: 1타일(64px)로 렌더

## 공통 스타일 블록

```
Pixel art, 16-bit cozy farm-RPG style (like Stardew Valley / SNES JRPG).
Match the visual style of the existing building sprites in
assets/town/buildings/ (cozy chunky Stardew look) and the player/dog/cat
character sprites in assets/town/. Warm friendly mood, bold dark outline,
limited cohesive palette, crisp hard-edged pixels.
NO anti-aliasing, NO blur. Fully transparent background (PNG alpha)
unless specified otherwise.
```

## tree.png 프롬프트

```
A SINGLE large pixel-art tree, 512×512 PNG, fully transparent background.
Big leafy deciduous tree (broadleaf, like an oak or maple), lush rounded
green canopy filling the upper 70% of the canvas, sturdy brown trunk
visible in the lower portion with the BASE of the trunk touching the
BOTTOM EDGE of the canvas (so the tree visually "stands on" the ground).
Centered horizontally. Subtle leaf texture and dark outline. Stardew Valley
cozy painted-pixel style. No grass, no shadow, no ground — just the tree
on a fully transparent background.
```

## water.png 프롬프트

```
A seamless, tileable pixel-art water texture, 128×128 PNG.
Calm lake/pond surface: medium blue base with subtle lighter blue ripples,
small white highlight specks scattered. The texture MUST be perfectly
tileable — top edge matches bottom edge, left matches right, with no
visible seam when tiled in a grid. Stardew Valley cozy painted-pixel style.
NO anti-aliasing, crisp pixels. Background fully opaque (no transparency).
```

## mush.png 프롬프트

```
A small pixel-art cluster of bright red toadstool mushrooms with white
spots, 128×128 PNG, fully transparent background. Two or three mushrooms
of slightly different sizes huddled together, centered in the lower half
of the canvas (tops can reach near upper edge). Cozy storybook style
matching Stardew Valley. Bold dark outline, limited palette. No grass,
no shadow, no ground.
```

## 일관성 비결

1. **건물 시트(`assets/town/buildings/*.png`)와 캐릭터 시트(`player.png`/`dog.png`/`cat.png`)를 레퍼런스로 첨부**해서 스타일 일치.
2. tree → water → mush 순서로 생성, 매번 직전 결과를 추가 레퍼런스로.
3. 같은 모델·같은 세션.

## 알파 채널 주의 ⚠️

Gemini가 종종 "transparent"를 체커보드 그림으로 fake한다. 받은 PNG 모드 확인:

```bash
python3 -c "
from PIL import Image
for f in ['tree.png','mush.png']:  # water는 불투명이라 OK
    im = Image.open(f'assets/town/{f}')
    print(f, im.mode, im.size)
"
```

`mode=RGB`로 나오면 (water는 OK, tree/mush는 fake) — 후처리:

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

# water.png는 불투명 의도라 건드리지 말 것
for f in ['tree.png','mush.png']:
    fix(f'assets/town/{f}')
```

## 적용

PNG를 위 경로에 넣고 `town.html` 새로고침. 자동 인식·교체됨.

- `tree.png`만 추가 → 모든 나무가 새 디자인. 물·버섯은 그대로
- `water.png`만 추가 → 호수만 진짜 픽셀 물결. 나무는 Kenney
- 셋 다 추가 → 풀 비주얼 업그레이드

## 향후 추가할 만한 것 (지금은 코드 슬롯 없음 — 필요하면 알려줘)

- `shore.png` (자갈 물가) — 현재 Kenney 43이 OK
- `flower.png` (꽃 패치) — 잔디 위 데코
- `sign.png` (표지판) — 동네 구분
- `bridge.png` (다리) — 길 위에
- `fence.png` (울타리) — 동네 경계

이 중 하나라도 만들고 싶으면 town.html에 슬롯 추가하면 됨.
