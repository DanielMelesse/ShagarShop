#!/usr/bin/env bash
# Create .env from .env.example on first run so Prisma and NextAuth work.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/.env"
EXAMPLE="$ROOT/.env.example"

if [[ -f "$ENV_FILE" ]]; then
  exit 0
fi

if [[ ! -f "$EXAMPLE" ]]; then
  echo "error: .env.example is missing; cannot create .env" >&2
  exit 1
fi

cp "$EXAMPLE" "$ENV_FILE"
echo "Created .env from .env.example"
