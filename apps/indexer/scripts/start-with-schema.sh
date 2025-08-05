#!/bin/bash
set -euo pipefail

# Generate timestamped schema
echo "Generating timestamped schema..."
npx tsx src/generate-schema.ts
echo "Generated schema: .env.schema: $(cat .env.schema)"

# Source the generated schema
if [ -f .env.schema ]; then
    # shellcheck disable=SC1091  
    # file is generated at runtime
    set -a            # auto-export sourced vars
    source .env.schema
    set +a
    echo "Using schema: $DATABASE_SCHEMA"
else
    echo "Failed to generate schema file"
    exit 1
fi

# Start the indexer with the generated schema
echo "Starting Ponder indexer..."
exec npm run start