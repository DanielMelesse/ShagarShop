#!/usr/bin/env bash
# Smoke-test a deployed ShegerShop base URL.
# Usage: BASE_URL=https://xxx.up.railway.app bash scripts/smoke-production.sh
set -euo pipefail

BASE="${BASE_URL:-${1:-}}"
if [[ -z "$BASE" ]]; then
  echo "Usage: BASE_URL=https://your-host bash scripts/smoke-production.sh" >&2
  exit 1
fi
BASE="${BASE%/}"

fail=0
check() {
  local name="$1" url="$2" expect="$3"
  local code
  code="$(curl -sS -o /tmp/sheger-smoke-body -w "%{http_code}" --max-time 30 "$url" || echo "000")"
  if [[ "$code" == "$expect" ]]; then
    echo "OK  $name ($code)"
  else
    echo "FAIL $name (got $code, want $expect) — $url"
    fail=1
  fi
}

echo "Smoke testing $BASE"
check "homepage" "$BASE/" "200"
check "products API" "$BASE/api/products?page=1&pageSize=5" "200"

if grep -q '"products"' /tmp/sheger-smoke-body 2>/dev/null; then
  echo "OK  products JSON has products array"
else
  echo "FAIL products JSON missing products array"
  fail=1
fi

check "manifest" "$BASE/manifest.webmanifest" "200"

if [[ "$fail" -ne 0 ]]; then
  echo "Smoke test failed."
  exit 1
fi
echo "Smoke test passed."
