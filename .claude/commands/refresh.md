---
description: GitHub 활동을 가져와 projects.json을 갱신하고 제안을 재생성한다
---

# /refresh — 데이터 갱신 + 제안 리프레시

이 저장소의 대시보드 데이터를 최신 GitHub 활동으로 동기화하고 코칭 제안을 다시 생성한다.

## 절차

1. **갱신 미리보기** — `node scripts/refresh-progress.mjs --dry-run`을 실행해 `lastUpdate`/`commits`/`meta.asOf` 변경 diff를 사용자에게 보여준다.
2. **승인 확인** — 변경 사항이 있으면 사용자에게 적용 여부를 묻는다. 변경이 없으면 그대로 종료.
3. **적용** — 승인되면 `node scripts/refresh-progress.mjs`(플래그 없이)를 실행해 `projects.json`을 저장한다.
4. **FALLBACK 동기화** — `dashboard.html`의 `const FALLBACK_PROJECTS = [...]` 블록을 `projects.json`의 `projects` 배열 verbatim 복사본으로 다시 맞춘다. (`normalizeProjects()`가 중첩 구조를 처리하므로 그대로 복사하면 된다.)
5. **제안 재생성** — `/coach`의 분석 절차를 그대로 수행해 `suggestions.json`을 갱신한다.
6. **커밋** — `projects.json`, `dashboard.html`, `suggestions.json` 변경을 한 커밋으로 묶는다. 메시지 예: `Refresh GitHub data + regenerate suggestions — <오늘 날짜>`.

## 규칙

- `tool`·`status`·`progress`(breakdown 점수)는 **절대 자동 변경하지 않는다**. 자동 갱신 대상은 `commits`·`lastUpdate`·`meta.asOf`뿐이다.
- 인증은 `GH_TOKEN` 환경변수 또는 `gh auth token`을 사용한다. 토큰이 없으면 사용자에게 알린다.
- 자세한 필드 규칙은 `projects.schema.md` 참고.
