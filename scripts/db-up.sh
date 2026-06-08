#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v docker >/dev/null 2>&1; then
  echo "error: Docker is not installed." >&2
  echo "Install Docker Desktop: https://www.docker.com/products/docker-desktop/" >&2
  echo "Or use a hosted Postgres (Neon/Supabase) and set DATABASE_URL in .env" >&2
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "error: Docker is installed but not running." >&2
  echo "Start Docker Desktop, wait until it says 'Running', then run:" >&2
  echo "  bun run db:up" >&2
  exit 1
fi

echo "Starting PostgreSQL (docker compose)..."
docker compose up -d postgres

echo "Waiting for Postgres to be ready..."
for _ in $(seq 1 30); do
  if docker compose exec -T postgres pg_isready -U shagar -d shagarshop >/dev/null 2>&1; then
    echo "PostgreSQL is ready on localhost:5432"
    exit 0
  fi
  sleep 1
done

echo "error: Postgres container started but did not become ready in time." >&2
echo "Check logs: docker compose logs postgres" >&2
exit 1
