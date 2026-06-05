# 에이전트 가이드 — 슬래시 커맨드와 자동 갱신

이 워크스페이스를 단순 대시보드가 아니라 **프로젝트 관리 에이전트**로 쓰는 방법입니다.

## 슬래시 커맨드

Claude Code를 이 폴더에서 열고(`claude`) 아래 커맨드를 입력합니다. 정의 파일은 `.claude/commands/`에 있습니다.

### `/refresh`

GitHub 활동을 가져와 `projects.json`의 `lastUpdate`·`commits`를 갱신하고, `dashboard.html`의 FALLBACK을 동기화한 뒤 뉴스·프로젝트 로그·프로젝트별 정적 페이지를 다시 만듭니다.
- 먼저 변경 diff를 보여주고 승인을 받습니다.
- `tool`·`status`·진척도 점수는 건드리지 않습니다.

### `/coach`

각 프로젝트의 막힌 단계, 개발 속도, 정체 여부를 분석해 `suggestions.json`에 제안을 기록합니다. 결과는 청사진 카드의 블로커 뱃지와 프로젝트별 보고서 도움 패널에 표시됩니다.
- 전체 분석: `/coach`
- 특정 프로젝트만: `/coach habit`

### `/weekly-report`

`projects.json`을 읽어 한 주의 진척 요약(하이라이트·Sprint 현황·주의 신호·다음 주 우선 착수)을 마크다운으로 산출합니다. 원하면 `docs/`에 날짜별 파일로 저장합니다.

### `/new-project`

새 게임/앱/웹 아이디어를 대화로 함께 구상하고, 결정되면 하네스 엔지니어링(PRD 우선, 검증 하네스, 마일스톤 계획)을 고려한 첫 프롬프트를 작성합니다. 원하면 `projects.json`에도 등록합니다.

## 수동 갱신 스크립트

슬래시 커맨드 없이 직접 돌릴 수도 있습니다.

```bash
node scripts/refresh-progress.mjs --dry-run   # 변경 미리보기
node scripts/refresh-progress.mjs             # projects.json 저장
node scripts/build-project-pages.mjs          # 개별 제작 현황 페이지 재생성
```

인증은 `GH_TOKEN` 환경변수 또는 `gh auth token`을 씁니다.

## 자동 갱신 — `/schedule` 루틴

매일 무인으로 `/refresh`를 돌리려면 Claude Code 루틴(클라우드 cron)을 만듭니다.

1. Claude Code에서 `/schedule`을 실행하고, 매일 1회 이 저장소에서 `/refresh`를 수행하는 루틴을 만듭니다.
2. 루틴은 기본적으로 `claude/` 브랜치로 푸시합니다. 매일 PR이 쌓이지 않게 하려면 저장소 설정에서 'unrestricted branch pushes'를 켜 `main`에 직접 커밋하게 합니다 (→ Pages 배포 자동 트리거).
3. 루틴이 비공개 리포 7개의 활동을 읽어야 하므로, 루틴의 GitHub 접근 범위가 전체 리포를 포함하는지 확인합니다. 부족하면 `repo` 스코프 PAT를 루틴 환경변수 `GH_TOKEN`으로 추가합니다.
4. 루틴은 Pro/Max 플랜에서만 쓸 수 있고 최소 주기는 1시간입니다.

## 배포 — GitHub Pages

`.github/workflows/deploy.yml`이 `main` push마다 저장소를 GitHub Pages로 배포합니다. 배포 URL은 `https://sgeniusk.github.io/github-priority-dashboard/` 입니다.

## 사용량 트래커

개인 구독은 사용량 API 자동 수집이 불가하므로 수동으로 기록합니다.
- 대시보드의 '사용량 트래커' 패널에서 사용률·리셋일을 입력하면 이 브라우저(localStorage)에 저장됩니다.
- 'JSON 내보내기' 버튼으로 `usage.json`에 반영할 스니펫을 받아 파일에 붙여넣으면 영구 저장됩니다.
