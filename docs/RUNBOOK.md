# Incident Runbook (초안)

## 1) API 장애
1. `/healthz` 확인
2. 최근 배포/설정 변경 확인
3. `AD_POLICY_APPROVAL_*` 환경변수 오입력 여부 확인
4. 장애 구간 이벤트 누락 여부 확인
5. 복구 후 KPI 왜곡 구간 마킹

## 2) 데이터 품질 경보
- 증상: `accepted=true` 대비 KPI 지표 급감
- 조치:
  1. `POST /v1/events` 샘플 재현
  2. 저장소 write 경로 점검
  3. 유실률 계산값을 일시적으로 대시보드 배지 표시

## 3) 광고 정책 이슈
- 규제 승인 미완료 시: `non_personalized` 강등 유지
- 보호자 검증 누락 시: `guardian_verification_required` 유지
