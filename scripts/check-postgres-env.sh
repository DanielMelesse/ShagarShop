#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/.env"

if [[ ! -f "$ENV_FILE" ]]; then
  exit 0
fi

if grep -qE '^DATABASE_URL="?postgresql://|^DATABASE_URL="?postgres://' "$ENV_FILE"; then
  exit 0
fi

echo "error: DATABASE_URL must be a PostgreSQL URL (see .env.example)." >&2
echo "ShagarShop no longer uses SQLite. Example:" >&2
echo '  DATABASE_URL="postgresql://shagar:shagar@localhost:5432/shagarshop?schema=public"' >&2
echo "Then run: bun run db:up && bun run db:setup" >&2
exit 1
