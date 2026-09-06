#!/usr/bin/env bash
# Guided production checklist for Railway + R2 + shegershop.com
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RAILWAY_BIN="${RAILWAY_BIN:-$ROOT/scripts/bin/railway}"
if [[ ! -x "$RAILWAY_BIN" ]]; then
  RAILWAY_BIN="$(command -v railway || true)"
fi

echo "=== ShegerShop production setup ==="
echo ""

if [[ -z "${RAILWAY_BIN}" ]]; then
  echo "Railway CLI missing. Download from https://github.com/railwayapp/cli/releases"
  echo "Place binary at scripts/bin/railway"
  exit 1
fi

if ! "$RAILWAY_BIN" whoami >/dev/null 2>&1; then
  echo "1) Log in to Railway (browser will open):"
  echo "   $RAILWAY_BIN login"
  exit 1
fi

echo "Logged in as: $($RAILWAY_BIN whoami)"
echo ""
echo "Next steps (run from repo root):"
echo "  $RAILWAY_BIN init"
echo "  $RAILWAY_BIN add --database postgres"
echo "  $RAILWAY_BIN variables set NEXTAUTH_SECRET=\"\$(openssl rand -base64 32)\""
echo "  $RAILWAY_BIN variables set PAYMENT_MODE=mock SMS_PROVIDER=console"
echo "  $RAILWAY_BIN up"
echo "  $RAILWAY_BIN domain"
echo "  $RAILWAY_BIN run bun prisma/seed.ts"
echo ""
echo "See docs/production.md for R2 and shegershop.com DNS."
