# GitHub 프로젝트 우선순위 대시보드 — Claude Code 컨텍스트

이 폴더는 sgeniusk(Gomgomee)의 GitHub 프로젝트 진척도와 우선순위를 추적하는 단일 페이지 대시보드 + 데이터 패키지입니다. Cowork에서 분석한 결과를 Claude Code로 이어 작업하기 위해 핸드오프됩니다.

## 컨텍스트 요약

- **소유자**: sgeniusk (Gomgomee)
- **데이터 기준일**: 2026-05-16
- **활성 프로젝트**: 9개 (게임 4, 앱 4, 콘텐츠 1)
- **일시중단**: 1개 (jewelry-webtoon-cloud — 핵심 마감 후 재개)
- **제외**: tteuniyu 메인 monorepo (사용자 요청으로 분석에서 제외, tteuniyu-ios는 유지)

## 폴더 구조

```
handoff/
├── CLAUDE.md            # 이 파일 — Claude Code 진입점 컨텍스트
├── HANDOFF.md           # 핸드오프 절차와 명령어 가이드
├── README.md            # 사람용 개요
├── projects.json        # 단일 진실 소스 (Source of Truth)
├── dashboard.html       # 산출물 (Chart.js 기반 self-contained HTML)
└── docs/
    ├── progress-formula.md       # 진척도 산정 공식 설명
    ├── tool-attribution.md       # 도구별 분류 근거
    └── sprint-plan.md            # 4-6주 권장 스케줄
```

## Claude Code가 알아야 할 핵심 규약

### 1. 진척도 공식

`progress = docs(0-25) + skeleton(0-25) + features(0-30) + alpha(0-20)`

- **docs**: PRD, README, ADR, Implementation Spec의 완성도
- **skeleton**: 빌드/실행 가능한 코드 골격, CI, 디렉토리 구조
- **features**: PRD에 정의된 핵심 기능의 실제 동작 비율
- **alpha**: 사용자 테스트, 폴리시, 알파/베타 등급 검증

값을 변경할 때는 `projects.json`의 `breakdown` 필드를 수정하고 `total`을 합으로 갱신.

### 2. 도구 태그

| 태그 | 의미 | 색상 (UI) |
| --- | --- | --- |
| `claude` | Claude Code로 작성 | 오렌지 (#db6d28) |
| `codex` | Codex CLI로 작성 | 초록 (#3fb950) |
| `hermes` | Hermes Agent로 작성 | 보라 (#bc8cff) |
| `hybrid` | Claude + Codex 하이브리드 | 시안 (#39c5cf) |

### 3. 사용자 직접 제공 매핑 (변경 금지 — 사용자 확인 없이 수정 X)

- Formi (habit) → claude
- 뜬이유 iOS → hybrid (README 명시)
- 시즈폴 (sam-defender-logue) → codex
- 전지적 군주 시점 (samguk-idle-prototype) → codex
- Mandate of Heroes (three-kingdoms-deckbuilder) → hermes
- AI Builder School → claude
- AI 컴퍼니 타이쿤 → codex
- Story X → claude
- BookCircle → claude (사용자 미지정, 기본값)
- 반짝상점 → claude, status=paused

### 4. 상태 (status) 필드

- `active`: 활발한 개발 중
- `paused`: 일시중단. UI에 점선 뱃지 + 50% 투명도로 표시
- `archived`: (미사용, 추후 정의)

## 자주 쓰는 작업

### A. 진척도 갱신
```bash
# 1) GitHub에서 최근 활동 확인
gh repo list sgeniusk --json name,pushedAt --limit 30

# 2) projects.json의 해당 프로젝트 breakdown/lastUpdate/commits 수정
# 3) dashboard.html이 자동으로 같은 데이터를 임포트하도록 빌드 (현재는 인라인 — 동기화 필요)
```

### B. 신규 프로젝트 추가
1. `projects.json`의 `projects` 배열에 객체 추가
2. `rank` 재정렬 (우선순위 기준)
3. `dashboard.html`의 `const projects = [...]` 배열도 동기화 (TODO: 외부 JSON 로드로 리팩토링)

### C. 도구 태그 변경
사용자에게 명시적으로 확인 받은 뒤에만 변경. `tool-attribution.md`에 변경 사유 기록.

## 권장 다음 작업 (Claude Code에서)

1. **JSON 외부 로딩 리팩토링**: `dashboard.html`이 `fetch('./projects.json')`으로 데이터를 가져오게 변경 → projects.json만 갱신하면 대시보드가 자동 반영
2. **GitHub Actions 자동 갱신**: 매일 자정 GitHub API로 모든 프로젝트의 commits/lastUpdate를 자동 수집해 projects.json 업데이트 → 대시보드를 GitHub Pages로 배포
3. **진척도 자동 추정**: 각 리포의 README/PRD를 파싱해 docs/skeleton/features/alpha 점수를 추천. 사용자 검수 후 확정.
4. **Sprint 트래커 추가**: 현재는 권장 시퀀스만 나열. Sprint별 시작일/종료일/체크리스트를 별도 섹션으로.

## 절대 하지 말 것

- 사용자가 명시한 도구 태그를 임의 변경
- 일시중단(paused) 프로젝트를 active로 되돌리는 것 (사용자 명시적 지시 필요)
- 진척도를 임의로 부풀려 표시
- dashboard.html에서 컬러 토큰의 base 색상 변경 (브랜드 일관성)
