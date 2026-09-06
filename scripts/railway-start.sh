#!/usr/bin/env bash
# Railway / Docker entrypoint: migrate then serve.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "[railway] Applying Prisma migrations..."
bash scripts/prisma.sh migrate deploy

echo "[railway] Starting Next.js..."
# Bind all interfaces so Railway's proxy can reach the app.
export HOSTNAME="${HOSTNAME:-0.0.0.0}"
exec bash scripts/next.sh start -H 0.0.0.0 -p "${PORT:-3000}"
