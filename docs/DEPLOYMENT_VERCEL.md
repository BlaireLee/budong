# Vercel Deployment Architecture

## Runtime shape
- Static web assets are built into `public/` via `npm run build:web`
- API runs as a serverless function at `/api/index.js`
- Routes `/v1/*` and `/healthz` are rewritten to `/api` by `vercel.json`

## Key files
- `/Users/isohui/Documents/budong/vercel.json`
- `/Users/isohui/Documents/budong/api/index.js`
- `/Users/isohui/Documents/budong/scripts/build-web.js`
- `/Users/isohui/Documents/budong/.github/workflows/deploy-vercel.yml`

## Required Vercel env vars
- `AD_POLICY_APPROVAL_KR`
- `AD_POLICY_APPROVAL_US`
- `GITHUB_OWNER`
- `GITHUB_REPO`
- `GITHUB_TOKEN`
- `VERCEL_TOKEN`
- `VERCEL_PROJECT_ID`
- `VERCEL_TEAM_ID` (optional)

## Verification
1. Open deployed URL and check dashboard section 6.
2. Call `/v1/ops/status` and verify `ops.github` + `ops.vercel` are populated.
3. Confirm `/healthz` returns `{ "status": "ok" }`.
