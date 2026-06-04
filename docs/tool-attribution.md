# 도구별 분류 근거

각 프로젝트가 어떤 AI 개발 도구로 작성되고 있는지의 분류표.

## 분류 (사용자 직접 확인)

| 프로젝트 | 도구 | 근거 |
| --- | --- | --- |
| Formi (habit) | Codex | 사용자 직접 명시 (2026-05-18 Claude→Codex 이동) |
| 뜬이유 iOS | Claude + Codex (Hybrid) | README "Claude Code + Codex CLI 하이브리드" 명시 |
| 시즈폴 (sam-defender-logue) | Claude | 사용자 직접 명시 (2026-06-04 Codex→Claude 이동) |
| 전지적 군주 시점 (samguk-idle-prototype) | Codex | 사용자 직접 명시 |
| 군령: 책략의 전장 / 구주쟁패 (three-kingdoms-deckbuilder) | Codex | 사용자 직접 명시 (2026-06-04 Hermes→Codex 이동) |
| AI Builder School | Claude | 사용자 직접 명시 |
| AI 컴퍼니 타이쿤 | Codex | 사용자 직접 명시 |
| Story X | Claude | 사용자 직접 명시 + README "Claude Code의 프로젝트 서브에이전트" |
| 혼불 (honbul) | Codex | 사용자 직접 명시 (2026-06-04 Hybrid→Codex 이동) |
| BookCircle | Claude (추정) | 사용자 미명시. README의 "Next.js + Supabase" 스택은 Claude Code 호환 |
| Nodeloom | Claude (추정) | 사용자 미명시. 리포에 CLAUDE.md 존재 + Claude 스타일 커밋 |
| 반짝상점 | Claude (추정) | 일시중단 상태 |

## 도구별 특성 메모

### Claude Code

- 강점: 멀티파일 리팩토링, 문서 작성, React/Next.js 풀스택
- 약점: Godot/Swift 같은 비웹 스택은 보조적
- 권장: PRD가 두꺼운 앱, 문서 + 코드를 함께 만드는 프로젝트

### Codex (CLI)

- 강점: 빠른 게임 로직 이터레이션, harness 자동화, 합성 플레이테스트
- 약점: 컨텍스트 유지력이 Claude보다 짧음 (대안: AGENTS.md 활용)
- 권장: 게임 프로토타입, 알고리즘 위주 코드

### Hermes Agent

- 강점: 게임 콘텐츠 데이터 (JSON 카드/이벤트/적) 생성, 밸런싱
- 약점: 코드 리팩토링은 보조 도구 필요
- 권장: Godot/Unity 데이터 드리븐 게임의 콘텐츠 채움

### Claude + Codex (Hybrid)

- 패턴: Claude가 통합/리뷰 + Codex가 병렬 bulk 작성
- 뜬이유 iOS가 채택: Wave 1(Claude foundation) → Wave 2(Codex 4-agent 병렬) → Wave 3(Claude 통합)
- 권장: 큰 스코프를 짧은 시간에 끝내야 하는 프로젝트

## 도구 평균 진척도 (활성 기준)

| 도구 | 프로젝트 수 | 평균 진척도 | 메모 |
| --- | --- | --- | --- |
| Claude | 6 (시즈폴, AI Builder School, Story X, AI 디자인 시스템 스쿨, 해치의 데일리 브리핑, 책담) | 40% | 시즈폴은 Claude 담당으로 이동, paused 프로젝트는 제외 |
| Codex | 5 (Formi, 전지적 군주 시점, 군령: 책략의 전장, AI 컴퍼니 타이쿤, 혼불) | 49% | 게임 프로토타입과 구현 하네스 중심 |
| Hermes | 0 | - | 현재 활성 프로젝트 대표 태그 없음 |
| Hybrid | 1 (뜬이유 iOS) | 65% | 가장 압축적인 진척 |

## 변경 규칙

- 도구 변경은 사용자 명시 지시가 있을 때만
- 추정값은 `(추정)` 표기 + 변경 사유 본 문서에 기록
- 변경 이력:
  - 2026-05-16: 초기 분류 (사용자 직접 입력)
  - 2026-05-18: Formi(habit) Claude→Codex 이동 (사용자 명시). Nodeloom 신규 등록 — Claude(추정). 군령: 책략의 전장 표시명 변경 (구 Mandate of Heroes).
  - 2026-06-04: 사용자 명시로 혼불 Hybrid→Codex, 군령/구주쟁패 Hermes→Codex, 시즈폴 Codex→Claude 이동. AI 컴퍼니 타이쿤과 전지적 군주 시점은 Codex 유지.
