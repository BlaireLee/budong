# API Contract

## POST `/v1/auth/signup`
Request:
```json
{
  "birth_year": 2012,
  "country": "KR",
  "guardian_contact": "010-0000-0000"
}
```
Response:
```json
{
  "user_id": "usr_...",
  "age_band": "13_15",
  "consent_state": {
    "analytics": false,
    "ad_personalization": false,
    "guardian_verified_at": null,
    "updated_at": "2026-02-19T00:00:00.000Z"
  }
}
```

## POST `/v1/consent/guardian`
Request:
```json
{
  "user_id": "usr_...",
  "consent_type": "ad_personalization",
  "proof_token": "proof-123456"
}
```

## GET `/v1/lessons?language=ko|en`
Response:
```json
{
  "lessons": [
    {
      "lesson_id": "kr-lease-basics",
      "topic": "월세 구조 이해",
      "difficulty": "easy",
      "estimated_minutes": 8,
      "language": "ko",
      "version": "1.0.0"
    }
  ]
}
```

## GET `/v1/lessons/{lesson_id}`
Response:
```json
{
  "lesson_id": "kr-lease-basics",
  "topic": "월세 구조 이해",
  "difficulty": "easy",
  "estimated_minutes": 8,
  "language": "ko",
  "version": "1.0.0",
  "scenario": "...",
  "options": ["...", "...", "..."]
}
```

## POST `/v1/simulations/{id}/attempts`
Request:
```json
{
  "user_id": "usr_...",
  "choices": [1],
  "rationale_text": "총 비용이 낮아요"
}
```
Response:
```json
{
  "score": 100,
  "feedback": "장기 거주라면 총비용을 줄이기 유리한 조합입니다.",
  "mastery_update": {
    "topic": "월세 구조 이해",
    "previous_level": "beginner",
    "new_level": "developing",
    "delta": 0.2,
    "mastery_level": 0.4
  }
}
```

## POST `/v1/events`
Request:
```json
{
  "event_name": "lesson_completed",
  "user_id": "usr_...",
  "session_id": "session_...",
  "props": { "lesson_id": "kr-lease-basics" }
}
```
Response:
```json
{
  "accepted": true,
  "event_id": "evt_..."
}
```

## GET `/v1/ads/decision`
Query: `user_id`, optional `country`, optional `placement`
Response:
```json
{
  "ad_mode": "non_personalized",
  "placement": "lesson_feed",
  "reason_code": "regulatory_approval_missing",
  "policy_rule_id": "RULE_010"
}
```

## GET `/v1/kpis`
PM/Design/Tech KPI snapshot을 반환합니다.

## GET `/v1/ops/status`
KPI + GitHub/Vercel 운영 상태를 반환합니다.

주요 필드:
- `ops.github.latest_ci`
- `ops.github.open_pull_requests`
- `ops.github.phase_progress`
- `ops.vercel.latest_deployment`
- `ops.vercel.recent_success_rate`
