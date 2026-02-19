# Status Dashboard API

## GET `/v1/ops/status`
개발/배포 진행 상태를 KPI와 함께 반환합니다.

Response (example):
```json
{
  "generated_at": "2026-02-19T00:00:00.000Z",
  "kpis": {
    "walc": 11,
    "activation_rate_24h": 0.63,
    "d7_retention": 0.34,
    "avg_learning_score_improvement": 18,
    "arpdau_krw": 37,
    "arpdau_usd": 0.05,
    "generated_at": "2026-02-19T00:00:00.000Z"
  },
  "ops": {
    "status": "healthy",
    "github": {
      "status": "healthy",
      "repo": "owner/repo",
      "open_pull_requests": 3,
      "phase_progress": [
        { "phase": "phase/0", "total": 5, "done": 5, "completion": 1 },
        { "phase": "phase/1", "total": 8, "done": 6, "completion": 0.75 }
      ]
    },
    "vercel": {
      "status": "healthy",
      "recent_success_rate": 0.8,
      "latest_deployment": {
        "state": "ready",
        "url": "https://..."
      }
    }
  }
}
```
