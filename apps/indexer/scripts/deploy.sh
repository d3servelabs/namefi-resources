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
INSTANCE_NAME="ponder-indexer"
ZONE="us-central1-a"
MACHINE_TYPE="e2-medium"
IMAGE_PROJECT="ubuntu-os-cloud"
IMAGE_FAMILY="ubuntu-2004-lts"
TAGS="http-server,https-server,prometheus"
# Guard-rails – fail fast when mandatory vars are absent
: "${DD_API_KEY:?Environment variable DD_API_KEY is required}"
: "${APP_IMAGE:?Environment variable APP_IMAGE is required}"
DOMAIN="indexer.namefi.io"
EMAIL="dev@namefi.io"

# ==== Build startup script from templates ====

STARTUP_SCRIPT=$(mktemp)
{
  cat $BASE_DIR/startup/header.sh
  echo ""
  echo "# ==== docker-compose.yml ===="
  echo 'cat > docker-compose.yml <<EOF'
  cat $BASE_DIR/startup/docker-compose.yml
  echo 'EOF'
  echo ""
  echo "# ==== nginx conf ===="
  # echo 'cat > nginx/conf.d/app.conf <<EOF'
  # cat $BASE_DIR/startup/nginx.conf
  # echo 'EOF'
  echo 'envsubst '"'"'$DOMAIN'"'"' <<EOF > nginx/conf.d/app.conf'
  cat $BASE_DIR/startup/nginx.conf
  echo 'EOF'
  echo ""
  echo "# ==== renew-cert.sh ===="
  echo 'cat > renew-cert.sh <<EOF'
  cat $BASE_DIR/startup/renew-cert.sh
  echo 'EOF'
  echo 'chmod +x renew-cert.sh'
  echo ""
  cat $BASE_DIR/startup/footer.sh
} > "$STARTUP_SCRIPT"


# ==== GCP Metadata key-value encoding ====
METADATA="^@^DD_API_KEY=$DD_API_KEY@APP_IMAGE=$APP_IMAGE@DOMAIN=$DOMAIN@EMAIL=$EMAIL"

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
    --metadata-from-file startup-script="$STARTUP_SCRIPT"
else
  gcloud compute instances set-metadata "$INSTANCE_NAME" \
    --zone="$ZONE" \
    --metadata="$METADATA" \
    --metadata-from-file startup-script="$STARTUP_SCRIPT"
  gcloud compute instances reset "$INSTANCE_NAME" --zone="$ZONE"
fi

rm "$STARTUP_SCRIPT"
echo "✅ GCP instance '$INSTANCE_NAME' $ACTION complete"
