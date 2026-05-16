# sgeniusk GitHub 프로젝트 우선순위 대시보드

이 폴더는 sgeniusk(Gomgomee)의 진행 중인 게임/앱/콘텐츠 프로젝트 9개의 진척도와 우선순위를 추적하는 단일 페이지 대시보드입니다.

## 빠른 시작

1. **대시보드 보기**: `dashboard.html`을 브라우저로 열기 (file:// 또는 `npx serve .`)
2. **데이터 수정**: `projects.json` 편집
3. **Claude Code로 이어 작업**: `HANDOFF.md` 5단계 가이드 참고

## 파일

| 파일 | 역할 |
| --- | --- |
| `dashboard.html` | 시각화 산출물 (Chart.js, self-contained) |
| `projects.json` | 단일 진실 소스 — 모든 프로젝트 메타데이터 |
| `CLAUDE.md` | Claude Code 진입점 컨텍스트 |
| `HANDOFF.md` | Cowork → Claude Code 핸드오프 절차 |
| `docs/` | 추가 설명 문서 |

## 현재 상태 (2026-05-16)

- **활성**: 9개 (게임 4 · 앱 4 · 콘텐츠 1)
- **일시중단**: 1개 (반짝상점 생존기)
- **완성 임박 Top 3**: Formi (75%) · 뜬이유 iOS (70%) · 시즈폴 (65%)
- **도구 분포**: Claude 4 · Codex 3 · Hermes 1 · Hybrid 1

## 진척도 산정 공식

`progress = docs(0-25) + skeleton(0-25) + features(0-30) + alpha(0-20) = 0-100`

자세한 설명: `docs/progress-formula.md`
