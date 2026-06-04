#!/usr/bin/env bash
# Run Next.js with a working runtime. Avoids SIGABRT from Homebrew Node 9.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck source=runtime-path.sh
source "$ROOT/scripts/runtime-path.sh"

NEXT_BIN="$ROOT/node_modules/next/dist/bin/next"
CMD="${1:-dev}"
shift || true

if [[ ! -f "$NEXT_BIN" ]]; then
  echo "error: Next.js is not installed. Run: bun install (or npm install)" >&2
  exit 1
fi

if command -v bun >/dev/null 2>&1; then
  exec bun --bun "$NEXT_BIN" "$CMD" "$@"
fi

if ! command -v node >/dev/null 2>&1; then
  echo "error: No working Node.js found. Install Bun (https://bun.sh) or Node 20+." >&2
  exit 1
fi

NODE_VERSION="$(node -p "process.versions.node.split('.')[0]" 2>/dev/null || echo 0)"
if [[ "$NODE_VERSION" -lt 18 ]]; then
  echo "error: Node.js 18+ is required (found: $(node -v 2>/dev/null || echo unknown))." >&2
  echo "Install Bun: curl -fsSL https://bun.sh/install | bash" >&2
  exit 1
fi

exec node "$NEXT_BIN" "$CMD" "$@"
