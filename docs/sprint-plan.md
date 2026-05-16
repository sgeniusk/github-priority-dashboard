# 4-6주 권장 스케줄 (2026-05-16 기준)

## Sprint A — Week 1-2 (5/17-5/30)

**목표**: Formi와 뜬이유 iOS를 동시에 알파 출시 직전 상태로 마감

- **Formi (Claude)**: Expo iOS 알파 빌드 → TestFlight 업로드
- **뜬이유 iOS (Hybrid)**: 시뮬레이터 스크린샷 5종 + Acceptance Criteria 25개 자가검증

**Exit 조건**: 두 앱 모두 TestFlight 또는 internal beta 단계 진입

## Sprint B — Week 2-3 (5/24-6/13)

**목표**: 두 개의 Codex 게임 알파 락

- **시즈폴 (Codex)**: P25 루트 정찰 예측 완성 + 알파 완료 백로그 클리어
- **전지적 군주 시점 (Codex)**: v0.16-alpha 게이트 통과 + Vercel 정식 도메인

**Exit 조건**: 두 게임 모두 외부 플레이테스터에게 링크 공유 가능 상태

## Sprint C — Week 3-5 (6/7-6/27)

**목표**: 콘텐츠/벤치마크 채움

- **Mandate of Heroes (Hermes)**: 오리지널 시각 디자인 결정 + 콘텐츠 1차 패스 (영웅 +6, 카드 +30)
- **AI Builder School (Claude)**: 32 lesson 중 우선 12개 본문 완성

**Exit 조건**: Steam Wishlist 페이지 / AI Builder School 첫 코호트 모집 가능

## Sprint D — Week 5-8 (6/21-7/18)

**목표**: 장기 프로젝트 1차 정착

- **AI 컴퍼니 타이쿤 (Codex)**: MVP 1 마일스톤 + 12명 합성 플레이테스트
- **Story X (Claude)**: 1개 매체(웹툰 또는 단편 만화) 깊이 우선 완성

**Exit 조건**: 두 프로젝트 모두 외부 검증 가능한 데모

## 후순위 / Defer

- **BookCircle (Claude)**: Sprint A-D 마감 후 재평가. Supabase 결정 필요
- **반짝상점 (Claude, paused)**: 핵심 4건 마감 후 재개 검토

## 컨텍스트 스위칭 비용 관리

- 동시 진행 ≤ 2개 권장 (Sprint A처럼 도구가 다른 경우만 병행)
- 같은 도구(Codex)로 두 프로젝트를 동시 진행할 때는 명확히 시간대 분리 (예: 오전 시즈폴, 오후 군주)
- Daily handoff note: 각 프로젝트의 다음 액션을 하루 끝나기 전 commit 메시지에 명시

## 리스크 게이트

| 게이트 | 조건 | 미달 시 |
| --- | --- | --- |
| Formi TestFlight | 5/30까지 알파 빌드 거부되면 | iOS 빌드 디버그에 +1주 |
| 뜬이유 iOS 통합 | Paid Intent ≥ 4% AND Waitlist ≥ 100 | monorepo 통합 보류, 독립 운영 |
| 시즈폴 알파 | Hard 승률 게이트(P18) 미통과 | 밸런스 +1 Sprint |
| AI 컴퍼니 타이쿤 MVP | 12명 합성 플레이테스트 만족도 ≥ 3.5/5 | 핵심 루프 재설계 |
