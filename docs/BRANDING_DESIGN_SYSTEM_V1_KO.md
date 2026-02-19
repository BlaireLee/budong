# BUDONG QUEST 브랜딩/디자인 시스템 v1

## 1) 제품 디자인 목표
- 중학생이 5분 안에 "아, 이 서비스가 내 실전 판단에 도움 된다"를 체감하게 만든다.
- 학습 콘텐츠를 정보열람형이 아니라 선택-결과-피드백 루프로 설계한다.
- PM KPI, 학습 KPI, 운영 KPI를 한 화면에서 연결해서 의사결정 시간을 줄인다.

## 2) 브랜드 컨셉
- 브랜드 이름: `BUDONG QUEST`
- 포지셔닝: "실전형 부동산 판단력을 기르는 퀘스트형 학습"
- 브랜드 톤: 명확함, 안전함, 게임적 몰입, 과장 없는 자신감
- 핵심 메시지: "정답 암기보다, 상황에서의 선택력을 훈련한다"

## 3) 좋은 디자인 기준 (운영 기준)
- 이해 속도: 첫 화면 10초 내 핵심 가치 이해
- 실행 가능성: 가입-미션선택-제출 흐름이 중단 없이 이어짐
- 피드백 밀도: 모든 제출에 점수/근거/다음 행동 제안 제공
- 동기 루프: 진행률, 달성 상태, 다음 추천 행동이 항상 보임
- 신뢰성 가시화: 학습지표 + GitHub/Vercel 운영 상태 동시 노출

## 4) 디자인 토큰
- 색상 축
- Primary: `#0F766E`, `#115E59`
- Accent: `#F59E0B`, `#EA580C`
- Support: `#0EA5E9`
- Success/Warning/Danger: `#087443`, `#B54708`, `#B42318`
- Neutral Text: `#111827`, `#1F2937`, `#475467`
- 배경: `#F3F7EA` + `#EAF7F5` 그라디언트
- 타이포
- Heading: `Chakra Petch`
- Body: `IBM Plex Sans KR`
- 컴포넌트 기초
- Radius: `12 / 18 / 26`
- Shadow: `0 14px 34px rgba(16,24,40,.1)`, `0 26px 70px rgba(16,24,40,.12)`
- Motion: `card-rise 0.55s`, hover lift `-1px`

## 5) 핵심 화면 규칙
- 상단: 브랜드 + 사용자 상태 + 아하모먼트 상태 칩
- Hero: 서비스 가치 + 즉시 행동 버튼 + 세션 진행률
- 학습영역: `프로필 -> 미션 -> 실습 -> 광고정책` 4블록
- 인사이트영역: `KPI 스냅샷 + 경쟁력 기준 보드`
- 운영영역: `GitHub CI/Phase/Vercel` 카드

## 6) 경쟁 우위 점검 기준 (주간)
- 점검 방식: 각 항목을 `good/watch/risk`로 평가하고 100점 환산
- 항목
- 첫 가치 도달 속도 (20점): 5분 이내면 good
- 첫 세션 과업 성공률 (20점): 75% 이상 good
- 미션 진행 동기 루프 (15점): 완료율 20% 이상 watch, 35% 이상 good
- 피드백 즉시성 (15점): 제출 즉시 점수/피드백/숙련도 반영
- 운영 신뢰성 (15점): ops status healthy면 good
- 가독성/모바일 대응 (15점): 작은 화면 1열, 큰 클릭 영역, 명확한 대비

## 7) 현재 반영된 구현 범위
- 반영 파일
- `/Users/isohui/Documents/budong/apps/web/src/index.html`
- `/Users/isohui/Documents/budong/apps/web/src/styles.css`
- `/Users/isohui/Documents/budong/apps/web/src/app.js`
- `/Users/isohui/Documents/budong/packages/ui/src/tokens.css`
- 실시간 반영
- 세션 진행률 바
- 첫 미션 완료 시간(아하모먼트)
- 경쟁력 기준 보드 + 점수화
- KPI/운영 상태 카드 시각 일관화

## 8) v1 이후 우선 개선
1. 미션 추천 엔진: 최근 오답 토픽 기반 다음 미션 자동 추천
2. 듀오링고형 동기장치 강화: 일일 연속학습(streak), XP 레벨, 보상 애니메이션
3. 실험 관리: 온보딩 카피/레이아웃 A/B 테스트 자동 태깅
4. 접근성 검증: WCAG 2.2 AA 대비/포커스/터치영역 정기 점검
