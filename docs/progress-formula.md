# 진척도 산정 공식

## 공식

`progress = docs(0-25) + skeleton(0-25) + features(0-30) + alpha(0-20) = 0-100`

## 단계별 정의

### docs (0-25)

PRD/스펙/ADR/Implementation plan 등의 문서화 완성도.

| 점수 | 기준 |
| --- | --- |
| 0-5 | README 한두 줄, 또는 이미지 위주 |
| 6-12 | README가 컨셉 + 실행법 + 폴더 구조 설명 |
| 13-19 | PRD 또는 Implementation Spec 1개 + 컨셉 문서 1개 |
| 20-25 | PRD + ADR + 로드맵 + 운영규약(CLAUDE.md) + 벤치마크 분석 등 다층 문서 |

### skeleton (0-25)

빌드/실행 가능한 코드 골격, CI, 디렉토리 구조.

| 점수 | 기준 |
| --- | --- |
| 0-5 | 빈 리포 또는 README만 |
| 6-12 | package.json + 진입 파일 1-2개, 실행은 가능하나 핵심 모듈 비어있음 |
| 13-19 | Vite/Next.js 스캐폴드 + 디자인 토큰 + 라우팅 + 데이터 모델 |
| 20-25 | 모듈 분할 + CI(GitHub Actions) + 하네스 + 자동 테스트 |

### features (0-30)

PRD에 정의된 핵심 기능의 실제 동작 비율.

| 점수 | 기준 |
| --- | --- |
| 0-5 | 기능 거의 미구현, 랜딩/데모 페이지만 |
| 6-12 | 핵심 기능 1-2개가 mock data로 동작 |
| 13-19 | PRD 절반의 기능이 실 데이터로 동작 |
| 20-25 | PRD 80% 기능 동작, 일부 엣지 케이스 미해결 |
| 26-30 | PRD 100% + UX 폴리시 진행 중 |

### alpha (0-20)

알파/베타 등급 검증, 사용자 테스트, 폴리시.

| 점수 | 기준 |
| --- | --- |
| 0-2 | 내부 검증 미실시 |
| 3-7 | 합성 플레이테스트 또는 셀프 QA 보고서 |
| 8-13 | 알파 사용자 테스트 N=5+, 보고서 작성 |
| 14-18 | 알파 N=10+ 종합 보고서, 핵심 버그 수정 완료 |
| 19-20 | 클로즈드 베타 진입 가능 등급 |

## 적용 예시

### Formi (habit) — 75%

- docs: 25 (PRD 2026-05-13 + Alpha report + 10-tester evaluation + i18n plan + roadmap + agent org chart + native readiness plan)
- skeleton: 25 (Vite + React 웹 + Expo SDK 54 모바일, CI npm run ci, i18n 셋업)
- features: 15 (웹 프로토타입 검증 완료, 네이티브 통합 진행 중 = PRD의 절반 동작)
- alpha: 10 (10-tester evaluation 보고서 완료)

### 뜬이유 iOS — 70%

- docs: 25 (RFP + ADR + DesignTokens 정리)
- skeleton: 25 (xcodegen + 디렉토리 구조 + GitHub Actions + harness)
- features: 20 (Wave 1 Foundation 완료, Wave 3 통합도 RisingIssuesView/ViewModel/XCTest 완료)
- alpha: 0 (시뮬레이터 스크린샷 + Acceptance 25개 자가검증 미완)

### BookCircle — 20%

- docs: 10 (REQUIREMENTS + PRODUCT_BRIEF + DESIGN_HANDOFF + IMPL_SPEC)
- skeleton: 10 (Next.js 스캐폴드 + landing/demo UI + Supabase placeholder)
- features: 0 (실 동작 기능 없음, sample data)
- alpha: 0

## 점수 변경 가이드

- 사용자 또는 검증 가능한 외부 신호(GitHub release, TestFlight 등록, 합성 플레이테스트 보고서)에 근거할 것
- 한 번에 5점 이상 점프 시 근거 명시
- 알파 점수는 외부 사용자 N명 이상이 실제 테스트했을 때만 부여
