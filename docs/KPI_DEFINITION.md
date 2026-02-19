# KPI Definitions

## PM
- `WALC`: 최근 7일 내 미션 완료한 고유 학생 수
- `Activation(24h)`: 가입 후 24시간 내 첫 미션 완료 비율
- `D7 Retention`: 가입 7일차 세션 재방문 비율
- `Learning Gain`: 사용자별 첫 점수 대비 최신 점수 평균 상승
- `ARPDAU`: 일일 활성 사용자당 광고 매출

## Tech Lead
- API p95 지연시간: 추후 APM으로 측정 (현재 로깅 포인트 준비)
- 가용성: `/healthz` 기반 uptime 측정
- 이벤트 유실률: `POST /v1/events` accepted vs 저장 성공 비교

## Product Designer
- 첫 과업 성공률: 첫 미션 점수 임계치 이상 비율
- 첫 아하 모먼트 시간: 가입 시점부터 첫 미션 완료까지 시간
- 미션 정답률: lesson_id별 평균 score
- 중단률: 시작 이벤트 대비 완료 이벤트 누락 비율
