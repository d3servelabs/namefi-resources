#!/usr/bin/env bash
set -euo pipefail

# Preflight: ensure Temporal CLI is available
if ! command -v temporal >/dev/null 2>&1; then
  echo "Error: Temporal CLI ('temporal') not found in your PATH." >&2
  echo "Install the Temporal CLI or add it to your PATH before running this script." >&2
  echo "macOS (Homebrew): brew install temporalio/tap/temporal" >&2
  echo "Docs: https://docs.temporal.io/cli" >&2
  exit 1
fi

# Defaults (can be overridden via getopts)
TEMPORAL_ADDRESS=${TEMPORAL_ADDRESS:-127.0.0.1:7233}
TEMPORAL_API_KEY=${TEMPORAL_API_KEY:-}
TEMPORAL_NAMESPACE=${TEMPORAL_NAMESPACE:-default}

usage() {
  echo "Usage: $0 [-a address] [-k api_key] [-n namespace]" >&2
  echo "  -a  Temporal server address (default: ${TEMPORAL_ADDRESS})" >&2
  echo "  -k  Temporal Cloud API key (default: empty)" >&2
  echo "  -n  Temporal namespace (default: ${TEMPORAL_NAMESPACE})" >&2
}

while getopts ":a:k:n:h" opt; do
  case "$opt" in
    a) TEMPORAL_ADDRESS="$OPTARG" ;;
    k) TEMPORAL_API_KEY="$OPTARG" ;;
    n) TEMPORAL_NAMESPACE="$OPTARG" ;;
    h) usage; exit 0 ;;
    \?) echo "Error: Invalid option -$OPTARG" >&2; usage; exit 1 ;;
    :) echo "Error: Option -$OPTARG requires an argument." >&2; usage; exit 1 ;;
  esac
done
shift $((OPTIND - 1))

# Export for downstream tools that honor env vars (not required for this script,  
# kept for compatibility with other tooling that may source these values).  
export TEMPORAL_ADDRESS TEMPORAL_API_KEY TEMPORAL_NAMESPACE  

# Build common CLI args and optional API key flag  
declare -a COMMON_ARGS
declare -a API_KEY_ARGS
COMMON_ARGS=(--address "$TEMPORAL_ADDRESS" --namespace "$TEMPORAL_NAMESPACE")  
API_KEY_ARGS=()  
if [[ -n "${TEMPORAL_API_KEY:-}" ]]; then  
  API_KEY_ARGS=(--api-key "$TEMPORAL_API_KEY")  
fi  

create_sa() {  
  local name="$1" type="$2" 
  # Build command safely to avoid unbound array expansion under 'set -u'
  local list_cmd=(temporal operator search-attribute list "${COMMON_ARGS[@]}")
  if ((${#API_KEY_ARGS[@]})); then
    list_cmd+=("${API_KEY_ARGS[@]}")
  fi
  if "${list_cmd[@]}" | grep -qw -- "$name"; then  
    echo "✓ Search attribute '$name' already exists; skipping"  
  else  
    echo "Creating search attribute '$name' ($type)..."  
    local create_cmd=(temporal operator search-attribute create "${COMMON_ARGS[@]}" --name "$name" --type "$type")
    if ((${#API_KEY_ARGS[@]})); then
      create_cmd+=("${API_KEY_ARGS[@]}")
    fi
    "${create_cmd[@]}"  
  fi  
}

# name/type pairs  
attrs=(  
  caller_type Keyword  
  domain_public_suffix Keyword  
  chain_id Keyword  
  userId Keyword  
  caller Text  
  domainName Text  
)  

for ((i=0; i<${#attrs[@]}; i+=2)); do  
  create_sa "${attrs[i]}" "${attrs[i+1]}"  
done  