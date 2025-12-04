#!/usr/bin/env bash
set -euo pipefail

# Usage examples:
#   BASE_URL=http://localhost:3001 PUBLIC_ROUTER_AUTH_KEY=... ./curl-tlds.sh

BASE_URL="${BASE_URL:-https://backend.astra.namefi.dev}"
AUTH_TOKEN="${PUBLIC_ROUTER_AUTH_KEY:-}"

header_auth=()
if [[ -n "$AUTH_TOKEN" ]]; then
  header_auth=( -H "Authorization: Bearer $AUTH_TOKEN" )
fi

echo "GET $BASE_URL/v1/public/tlds"

curl -sS -X GET "${BASE_URL}/v1/public/tlds" \
      -H "Accept: application/json" \
      "${header_auth[@]}" | jq .
