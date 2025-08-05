#!/bin/bash
set -euo pipefail

# Generate timestamped schema
echo "Generating timestamped schema..."
npx tsx src/generate-schema.ts > .env.schema.export

# Source the generated schema
if [ -f .env.schema.export ]; then
    # shellcheck disable=SC1091  
    # file is generated at runtime
    set -a            # auto-export sourced vars
    source .env.schema.export
    set +a
    echo "Using schema: $DATABASE_SCHEMA"
else
    echo "Failed to generate schema file"
    exit 1
fi

# Start the indexer with the generated schema
echo "Starting Ponder indexer..."
exec ponder start --log-format json --log-level debug