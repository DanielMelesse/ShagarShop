#!/usr/bin/env bash
# Run Prisma CLI with Bun (or a modern Node). Avoids SIGABRT from Homebrew Node 9.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck source=runtime-path.sh
source "$ROOT/scripts/runtime-path.sh"

PRISMA_BIN="$ROOT/node_modules/prisma/build/index.js"

if [[ ! -f "$PRISMA_BIN" ]]; then
  echo "error: Prisma is not installed. Run: bun install" >&2
  exit 1
fi

if command -v bun >/dev/null 2>&1; then
  exec bun --bun "$PRISMA_BIN" "$@"
fi

if ! command -v node >/dev/null 2>&1; then
  echo "error: No working runtime found. Install Bun: https://bun.sh" >&2
  exit 1
fi

NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]" 2>/dev/null || echo 0)"
if [[ "$NODE_MAJOR" -lt 18 ]]; then
  echo "error: Node.js 18+ required (found: $(node -v 2>/dev/null || echo unknown))." >&2
  echo "Install Bun: curl -fsSL https://bun.sh/install | bash" >&2
  exit 1
fi

exec node "$PRISMA_BIN" "$@"
