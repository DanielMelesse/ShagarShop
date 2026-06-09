#!/usr/bin/env bash
# Test DATABASE_URL connection.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

bash scripts/ensure-env.sh
bash scripts/check-postgres-env.sh

echo "Checking database connection..."
if bash scripts/prisma.sh db execute --stdin <<'SQL' >/dev/null 2>&1
SELECT 1;
SQL
then
  echo "Database is reachable."
  exit 0
fi

echo "error: Cannot connect to DATABASE_URL in .env" >&2
echo "" >&2
echo "Start local Postgres:" >&2
echo "  bun run db:up" >&2
echo "" >&2
echo "Then:" >&2
echo "  bun run db:setup" >&2
exit 1
