# 건물 스프라이트 생성 가이드

`town.html`의 11개 건물을 AI 생성 이미지로 교체하는 방법.

## 동작 방식

`town.html`은 시작할 때 `assets/town/buildings/<repo>.png` 를 찾는다.
- 파일이 **있으면** → 그 이미지를 건물로 사용
- **없으면** → Kenney 타일 조합 건물로 자동 폴백

즉 11개를 한 번에 다 만들 필요 없다. 만든 것부터 하나씩 교체된다.

## 파일 규칙

- 위치 — `assets/town/buildings/`
- 파일명 — 아래 표의 `repo` 이름 그대로 + `.png` (예: `habit.png`)
- 형식 — **투명 배경 PNG**, 정사각형 권장 (512×512 또는 1024×1024)

## 생성 방법 (Gemini / ChatGPT / Midjourney 등)

1. 아래 **공통 스타일 블록**을 먼저 붙이고, 그 뒤에 건물별 `Building:` 한 줄을 붙여 생성한다.
2. **일관성이 핵심** — 1번 건물을 먼저 만들고, 2~11번은 그 이미지를 *레퍼런스로 첨부*해서
   "identical pixel-art style, scale, lighting and outline as the reference image — change the building to: …" 로 요청한다.
3. 11개 모두 **같은 모델·같은 세션**에서 만들면 스타일이 덜 흔들린다.

## 공통 스타일 블록 (모든 건물에 동일하게)

```
Pixel art, 16-bit cozy farm-RPG style (like Stardew Valley / SNES JRPG).
A SINGLE small building viewed front-on with a slight top-down tilt.
Centered, filling about 85% of a SQUARE frame, on a FULLY TRANSPARENT
background (PNG alpha). Warm friendly mood, bold dark outline, limited
cohesive palette, crisp hard-edged pixels. NO anti-aliasing, NO blur,
NO drop shadow, NO ground or grass or terrain, NO characters, NO text.
Just the building, nothing else.
```

## 건물별 프롬프트 (`Building:` 한 줄을 위 블록 뒤에 붙일 것)

| repo (파일명) | 프로젝트 | Building: |
| --- | --- | --- |
| `habit.png` | Formi (포미) | a cozy two-story cottage with a calm teal-blue roof and a small potted plant beside the door |
| `tteuniyu-ios.png` | 뜬이유 iOS | a tidy modern townhouse with a navy-blue roof and a tiny wooden sign shaped like a rising line chart |
| `sam-defender-logue.png` | 삼국지: 시즈폴 | a fortified stone house with a small watchtower on one side and a dark crimson roof |
| `samguk-idle-prototype.png` | 전지적 군주 시점 | a grand house with a deep red roof and a small royal banner with a crown emblem |
| `three-kingdoms-deckbuilder.png` | 군령: 책략의 전장 | a strategist's house with a brick-red roof and a hanging sign shaped like a playing card |
| `ai-builder-school.png` | AI Builder School | a friendly little schoolhouse with a green roof and a small bell tower |
| `ai-company-tycoon-boundaryless.png` | AI 컴퍼니 타이쿤 | a small 3-floor office building with a red roof and large glass windows |
| `story-x-beta.png` | Story X | a whimsical storybook cottage with a blue roof and a sign shaped like an open book |
| `BookCircle.png` | BookCircle | a small library cottage with a blue roof and a big window showing bookshelves inside |
| `jewelry-webtoon-cloud.png` | 반짝상점 생존기 | a charming tiny jewelry shop with a green roof and a sparkling gem sign (slightly closed, shutters down) |
| `Nodeloom.png` | Nodeloom | a quaint craftsman house with a blue roof and a woven rope-knot decoration over the door |

## 적용

PNG를 위 경로에 넣고 `town.html`을 새로고침하면 끝. 별도 코드 수정 불필요.
지형 타일과 캐릭터는 그대로 Kenney 에셋을 쓴다 (타일·애니메이션 일관성 때문).
