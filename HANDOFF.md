# Claude Code 핸드오프 가이드

Cowork에서 분석/생성한 대시보드를 Claude Code로 이어 작업하기 위한 단계별 가이드입니다.

## 1단계 — 환경 준비

### Claude Code 설치 (이미 설치되어 있다면 스킵)

```bash
# npm 글로벌 설치 (가장 일반적)
npm install -g @anthropic-ai/claude-code

# 또는 Homebrew
brew install anthropics/claude/claude-code

# 인증
claude
# 브라우저가 열리고 anthropic.com 로그인 → 토큰 자동 설정
```

### GitHub CLI (선택 — 데이터 자동 갱신용)

```bash
brew install gh
gh auth login -h github.com
# sgeniusk 계정 토큰 인증
```

## 2단계 — 폴더 이동

이 핸드오프 패키지(`handoff/` 폴더)를 사용자가 관리하기 좋은 위치로 옮깁니다.

```bash
# 예: 개발 폴더로 이동
mkdir -p ~/dev/github-priority-dashboard
cp -R "<현재 outputs 경로>/handoff/"* ~/dev/github-priority-dashboard/
cd ~/dev/github-priority-dashboard

# Git 초기화 (선택)
git init
git add .
git commit -m "Initial handoff from Cowork — 2026-05-16 baseline"
```

## 3단계 — Claude Code 진입

```bash
cd ~/dev/github-priority-dashboard
claude
```

Claude Code가 같은 폴더의 `CLAUDE.md`를 자동으로 읽어 컨텍스트로 사용합니다. 다음 첫 메시지로 시작하면 됩니다.

```
이 폴더의 CLAUDE.md를 읽고, projects.json과 dashboard.html의 동기화 상태를 확인해줘. 
오늘 GitHub의 최근 활동을 가져와서 lastUpdate와 commits를 갱신하고 싶어.
```

## 4단계 — 자주 쓸 첫 프롬프트 (복사해서 사용)

### A. 데이터 자동 갱신

```
gh CLI로 sgeniusk의 9개 활성 리포지토리의 최신 pushedAt과 commits 수를 가져와서 
projects.json의 lastUpdate, commits 필드를 갱신해줘. 
변경 전후 diff를 보여주고 내가 승인하면 저장해줘.
```

### B. 대시보드 → JSON 외부 로딩으로 리팩토링

```
dashboard.html이 현재 projects 배열을 HTML 안에 인라인으로 가지고 있어. 
이걸 fetch('./projects.json')으로 외부 JSON을 로드하도록 리팩토링해줘. 
파일 시스템에서 직접 열어도(file://) 작동해야 하고, 
fetch가 실패하면 인라인 fallback이 동작하게 안전망도 둬줘.
```

### C. 진척도 자동 추정 스크립트

```
scripts/estimate-progress.js를 만들어줘. 
각 리포지토리의 README와 PRD를 GitHub API로 가져와서 다음 기준으로 점수를 추천:
- docs: PRD/ADR/spec 문서 개수와 길이
- skeleton: src/, app/ 디렉토리 파일 수, package.json 존재 여부, CI yml 존재 여부
- features: 핵심 기능 키워드 매칭 (PRD에서 정의된 기능 vs 코드에 구현된 기능)
- alpha: alpha/beta/v0.x 태그 존재, TestFlight/Vercel 배포 URL 명시 여부
출력은 projects.json의 breakdown 필드 형식. 자동 덮어쓰지 말고 추천만 제시.
```

### D. GitHub Pages로 자동 배포

```
이 폴더를 GitHub 리포지토리로 만들고, 
- main 브랜치 push마다 GitHub Pages로 dashboard.html 배포
- 매일 06:00 KST에 GitHub Actions가 sgeniusk의 모든 리포 활동을 수집해 projects.json을 자동 커밋
구성해줘.
```

### E. Sprint 트래커 추가

```
dashboard.html에 'Sprint Board' 섹션을 추가해줘.
각 Sprint(A, B, C, D)를 칸반 보드 형태로 표시:
- 컬럼: 계획됨 / 진행 중 / 검토 / 완료
- 카드: 프로젝트 + 마일스톤
- 드래그앤드롭으로 상태 변경 가능 (localStorage에 저장)
projects.json에 sprint 필드 추가.
```

## 5단계 — Claude Code 슬래시 커맨드 활용

`~/.claude/commands/` 에 자주 쓰는 워크플로우를 슬래시 커맨드로 저장하면 편합니다.

### 예시: `/refresh-progress` 커맨드

```bash
mkdir -p ~/.claude/commands
cat > ~/.claude/commands/refresh-progress.md <<'EOF'
---
description: GitHub 활동을 가져와 projects.json의 lastUpdate/commits 갱신
---
다음 작업을 수행해줘:
1. gh repo list sgeniusk --json name,pushedAt,defaultBranchRef --limit 30 실행
2. projects.json의 각 프로젝트의 lastUpdate를 pushedAt으로 갱신
3. 각 리포의 커밋 수는 gh api repos/sgeniusk/{name}/commits --jq 'length' 사용
4. 변경 전후 diff를 보여주고 사용자 승인 후 저장
EOF
```

이후 Claude Code에서 그냥 `/refresh-progress` 입력하면 실행됩니다.

## 6단계 — 정기 워크플로우 추천

| 주기 | 작업 | 명령 |
| --- | --- | --- |
| 매일 | 진척도 자동 갱신 (commits, lastUpdate) | `/refresh-progress` |
| 매주 월요일 | Sprint 회고 + 다음 주 계획 | "이번 주 Sprint A 진행 상황 보고서 작성해줘" |
| 매월 1일 | 우선순위 재산정 | "projects.json 전체 rank를 진척도 + ETA + 비즈니스 임팩트로 재정렬해줘" |
| 마일스톤 도달 시 | 해당 프로젝트의 alpha 점수 갱신 | "Formi가 TestFlight 알파 출시했어. breakdown.alpha를 10 → 15로 올려줘" |

## 7단계 — Cowork으로 돌아오고 싶을 때

Claude Code에서 작업한 결과를 다시 Cowork으로 가져오려면:

1. `projects.json`을 Cowork 채팅에 첨부
2. "이 데이터로 새 대시보드 한 페이지를 다시 만들어줘"
3. Cowork이 다른 시각화 옵션(예: PowerPoint, Word 보고서, Excel 트래커)을 제안

## 트러블슈팅

### "Claude Code가 CLAUDE.md를 안 읽는 것 같아요"

- 폴더 루트에 `CLAUDE.md`가 있어야 합니다. 하위 폴더는 자동 인식 안 됨
- `claude` 명령을 그 폴더에서 실행했는지 확인 (`pwd`)
- 명시적으로 `claude` 시작 후 "CLAUDE.md 읽고 시작해줘"라고 한 번 더 지시

### "dashboard.html이 file://에서 fetch가 안 돼요"

- 브라우저 CORS 정책 때문. 다음 중 하나:
  - 4단계의 프롬프트 B를 실행해 fallback 추가
  - 또는 `npx serve .` 로 로컬 서버에서 열기 (`http://localhost:3000`)

### "projects.json과 dashboard.html이 따로 노는 거 같아요"

- 4단계 프롬프트 B를 한 번 실행해 외부 JSON 로딩으로 만들면 해결
- 그 전까지는 두 파일을 둘 다 수정해야 함

## 부록 — Claude Code 기본 명령어 (자주 쓰는 것만)

| 명령 | 설명 |
| --- | --- |
| `claude` | 현재 폴더에서 새 세션 시작 |
| `claude -c` | 직전 세션 이어가기 |
| `claude --help` | 옵션 확인 |
| `/init` | 현재 코드베이스에서 CLAUDE.md 자동 생성 |
| `/clear` | 컨텍스트 초기화 |
| `/compact` | 컨텍스트 압축 |
| `/cost` | 현재 세션 비용 확인 |
| `Esc` (두 번) | 진행 중인 작업 중단 |
| `Shift+Tab` | Plan 모드 토글 (실행 전 계획만) |

자세한 사용법은 https://docs.claude.com/claude-code 참고.
