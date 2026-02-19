#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

if [[ -f "$ROOT_DIR/.env.local" ]]; then
  set -a
  source "$ROOT_DIR/.env.local"
  set +a
  echo "[env] Loaded .env.local"
fi

echo "[1/4] Running tests"
npm test

echo "[2/4] Building web assets for Vercel"
npm run build:web

echo "[3/4] Bootstrapping GitHub/Vercel integrations"
npm run ops:setup

echo "[4/4] Completed"
echo "- GitHub + Vercel status endpoint: /v1/ops/status"
echo "- Web dashboard section: 6) 개발/배포 현황"
