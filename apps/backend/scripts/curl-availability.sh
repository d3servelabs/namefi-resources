#!/usr/bin/env bash
set -euo pipefail

# Namefi Astra Availability API - curl examples
# Usage examples:
#   BASE_URL=http://localhost:3001 AVAILABILITY_API_AUTH_KEY=... ./curl-availability.sh get available.today
#   BASE_URL=http://localhost:3001 AVAILABILITY_API_AUTH_KEY=... ./curl-availability.sh bulk available.today,ends.today,promos.today

BASE_URL="${BASE_URL:-http://backend.astra.namefi.dev}"
AUTH_TOKEN="${AVAILABILITY_API_AUTH_KEY:-}"
CMD="${1:-help}"
ARG="${2:-available.today}"

header_auth=()
if [[ -n "$AUTH_TOKEN" ]]; then
  header_auth=( -H "Authorization: Bearer $AUTH_TOKEN" )
fi

case "$CMD" in
  get)
    domain="$ARG"
    echo "GET $BASE_URL/v1/availability?domain=$domain"
    curl -sS -X GET \
      "${BASE_URL}/v1/availability?domain=${domain}" \
      -H "Accept: application/json" \
      "${header_auth[@]}" | jq .
    ;;
  bulk)
    IFS=',' read -r -a domains <<< "$ARG"
    payload=$(jq -n --argjson arr "$(printf '%s\n' "${domains[@]}" | jq -R . | jq -s .)" '{domains: $arr}')
    echo "POST $BASE_URL/v1/availability/bulk"
    curl -sS -X POST \
      "${BASE_URL}/v1/availability/bulk" \
      -H "Content-Type: application/json" \
      -H "Accept: application/json" \
      "${header_auth[@]}" \
      -d "$payload" | jq .
    ;;
  *)
    cat <<USAGE
Usage:
  BASE_URL=... AVAILABILITY_API_AUTH_KEY=... $0 get <domain>
  BASE_URL=... AVAILABILITY_API_AUTH_KEY=... $0 bulk <domain1,domain2,...>

Defaults:
  BASE_URL: http://localhost:3001
  AVAILABILITY_API_AUTH_KEY: unset (requests will be unauthenticated)
USAGE
    ;;

esac
