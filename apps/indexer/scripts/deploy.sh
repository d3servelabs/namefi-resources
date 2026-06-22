#!/bin/bash
BASE_DIR=$(dirname "$0")
set -euo pipefail

# Usage: ./deploy.sh create|update

ACTION="${1:-}"
if [[ "$ACTION" != "create" && "$ACTION" != "update" ]]; then
  echo "Usage: $0 create|update"
  exit 1
fi

# ==== Configuration ====
INSTANCE_NAME="${2:-ponder-indexer}"
ZONE="us-central1-a"
MACHINE_TYPE="e2-medium"
IMAGE_PROJECT="ubuntu-os-cloud"
IMAGE_FAMILY="ubuntu-2204-lts"
TAGS="http-server,https-server,prometheus"
# Guard-rails – fail fast when mandatory vars are absent
: "${DD_API_KEY:?Environment variable DD_API_KEY is required}"
: "${APP_IMAGE:?Environment variable APP_IMAGE is required}"

if [[ "$INSTANCE_NAME" == "ponder-indexer-prod" ]]; then
DOMAIN="indexer.namefi.io"
else
DOMAIN="indexer.namefi.dev"
fi

EMAIL="dev@namefi.io"

# ==== Build startup script from templates ====
export EOF_WITH_QUOTES="'EOF'"

STARTUP_SCRIPT=$(mktemp)
{
  cat $BASE_DIR/startup/header.sh
  echo ""
  echo "# ==== docker-compose.yml ===="
  echo 'cat > docker-compose.yml <<'$EOF_WITH_QUOTES
  cat $BASE_DIR/startup/docker-compose-without-migration.yml
  echo ""
  echo 'EOF'
  echo ""
  echo "# ==== Caddyfile ===="
  # Caddy reads {$DOMAIN}/{$ACME_EMAIL} from the caddy container's env (set in the
  # compose file), so the Caddyfile is written literally — no envsubst needed.
  echo 'cat > Caddyfile <<'$EOF_WITH_QUOTES
  cat $BASE_DIR/startup/Caddyfile
  echo 'EOF'
  echo ""
  cat $BASE_DIR/startup/footer.sh
} > "$STARTUP_SCRIPT"


# ==== GCP Metadata key-value encoding ====
METADATA="DD_API_KEY=$DD_API_KEY,APP_IMAGE=$APP_IMAGE,DOMAIN=$DOMAIN,EMAIL=$EMAIL"

# ==== Run create or update ====
if [[ "$ACTION" == "create" ]]; then
  gcloud compute instances create "$INSTANCE_NAME" \
    --zone="$ZONE" \
    --machine-type="$MACHINE_TYPE" \
    --image-family="$IMAGE_FAMILY" \
    --image-project="$IMAGE_PROJECT" \
    --tags="$TAGS" \
    --scopes=https://www.googleapis.com/auth/cloud-platform \
    --metadata="$METADATA" \
    --metadata-from-file=startup-script="$STARTUP_SCRIPT"
else
  gcloud compute instances add-metadata "$INSTANCE_NAME" \
    --zone="$ZONE" \
    --metadata="$METADATA" \
    --metadata-from-file=startup-script="$STARTUP_SCRIPT"
  gcloud compute instances reset "$INSTANCE_NAME" --zone="$ZONE"
fi

rm "$STARTUP_SCRIPT"
echo "✅ GCP instance '$INSTANCE_NAME' $ACTION complete"
