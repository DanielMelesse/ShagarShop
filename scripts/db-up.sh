#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v docker >/dev/null 2>&1; then
  echo "error: Docker is not installed." >&2
  echo "" >&2
  echo "Install Docker Desktop:" >&2
  echo "  https://www.docker.com/products/docker-desktop/" >&2
  echo "Then run: bun run db:up" >&2
  exit 1
fi

docker_ready() {
  docker info >/dev/null 2>&1
}

if ! docker_ready; then
  if [[ "$(uname -s)" == "Darwin" ]] && [[ -d "/Applications/Docker.app" ]]; then
    echo "Docker Desktop is installed but not running. Starting it..."
    open -a Docker >/dev/null 2>&1 || true
    echo "Waiting for Docker to start (up to 60s)..."
    for _ in $(seq 1 60); do
      if docker_ready; then
        break
      fi
      sleep 1
    done
  fi
fi

if ! docker_ready; then
  echo "error: Docker is not running." >&2
  echo "" >&2
  echo "On Mac: open Docker Desktop from Applications and wait until it shows Running." >&2
  echo "Then run: bun run db:up" >&2
  exit 1
fi

echo "Starting PostgreSQL (docker compose)..."
if ! compose_out="$(docker compose up -d postgres 2>&1)"; then
  echo "$compose_out" >&2
  echo "" >&2
  if echo "$compose_out" | grep -qiE 'no such host|lookup registry|failed to resolve reference|connection refused|network is unreachable'; then
    echo "error: Docker could not pull postgres:16-alpine (network/DNS issue)." >&2
    echo "" >&2
    echo "Your compose file is fine — Docker cannot reach Docker Hub." >&2
    echo "" >&2
    echo "Try:" >&2
    echo "  1. Check internet (open https://hub.docker.com in a browser)" >&2
    echo "  2. Restart Docker Desktop" >&2
    echo "  3. Docker Desktop → Settings → Network → DNS: 8.8.8.8 or 1.1.1.1" >&2
    echo "  4. If on VPN, disconnect or allow Docker through it" >&2
    echo "  5. Test: docker pull postgres:16-alpine" >&2
    echo "" >&2
    echo "Or ask Gordon: docker ai \"help me fix this compose error\"" >&2
  else
    echo "error: docker compose up failed." >&2
    echo "Try: docker ai \"help me fix this compose error\"" >&2
  fi
  exit 1
fi
echo "$compose_out"

echo "Waiting for Postgres to be ready..."
for _ in $(seq 1 30); do
  if docker compose exec -T postgres pg_isready -U sheger -d shegershop >/dev/null 2>&1; then
    # Volume may predate sheger credentials (old shagar/shagarshop init).
    if ! docker compose exec -T postgres \
      psql -U sheger -d shegershop -c 'SELECT 1' >/dev/null 2>&1; then
      echo "error: Postgres is running but role/db 'sheger'/'shegershop' are missing." >&2
      echo "Your Docker volume was likely created with older credentials." >&2
      echo "" >&2
      echo "Reset local DB (wipes data) then re-run setup:" >&2
      echo "  docker compose down -v" >&2
      echo "  bun run db:up && bun run db:setup" >&2
      exit 1
    fi
    echo "PostgreSQL is ready on localhost:5432"
    echo "Next: bun run db:setup"
    exit 0
  fi
  sleep 1
done

echo "error: Postgres container started but did not become ready in time." >&2
echo "Check logs: docker compose logs postgres" >&2
exit 1
