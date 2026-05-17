---
description: 흩어진 plan/PRD/로드맵을 읽어 projects/{repo}/ 표준 구조로 정규화한다
---

# /sync-project — 프로젝트 문서 표준화

플랫폼(Claude/Codex 등)마다 형식이 제각각인 plan·PRD·로드맵을 읽어, `projects/{repo}/`의 정형 구조로 정리한다. "중구난방 입력 → 정형 출력"이 이 커맨드의 핵심이다.

인자 `$ARGUMENTS` = 대상 리포 이름 (예: `/sync-project habit`). 없으면 어느 프로젝트인지 묻는다.

## 1. 입력 받기

대상 프로젝트의 원본 문서를 사용자에게 요청한다 — 붙여넣기, 로컬 파일 경로, 또는 GitHub 리포 경로 무엇이든 좋다. 형식이 제각각이어도 괜찮다. GitHub 경로면 README·docs를 읽어 온다.

## 2. 표준 구조로 정규화

`projects/{repo}/`에 4개 파일을 쓴다.

- **`project.json`** — `repo`, `displayName`, `currentVersion`, `synced: true`, `versions[]`. 각 버전은 `{id, label, status, target, summary, milestones[]}`.
- **`prd.md`** — `## 개요` / `## 기술 스택` / `## 핵심 기능` / `## 리스크`
- **`roadmap.md`** — 버전별 `##` 섹션 (완료/진행 중/예정 표시 + 마일스톤 목록)
- **`log.md`** — 기존 로그를 보존하고 맨 위에 동기화 기록 한 줄 추가

## 3. 규칙

- 원본에 없는 내용을 지어내지 않는다. 불명확하면 사용자에게 묻는다.
- `versions[].status`는 `done`/`inProgress`/`planned`. 완료 근거가 명확할 때만 `done`.
- `currentVersion`은 현재 `inProgress`인 버전의 `id`.
- 정규화 완료 후 `project.json`의 `synced`를 `true`로 바꾼다 (스캐폴드 → 실데이터 전환 표시).
- `projects.json`(인덱스)의 `progress`·`tool`·`rank` 등은 건드리지 않는다 — 이 커맨드는 `projects/{repo}/`만 다룬다. 진척도 점수 조정이 필요하면 `/coach`로.
