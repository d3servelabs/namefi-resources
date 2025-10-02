#!/bin/bash

# Script to sync static files to Google Cloud Storage bucket
# Usage: ./sync-static-to-gcs.sh

set -e

BUCKET_NAME="${LISTMONK_GCS_BUCKET:-namefi-listmonk}"  

STATIC_DIR="./static"
GCS_PATH="gs://${BUCKET_NAME}/static/"

echo "Starting sync of static files to GCS bucket: ${BUCKET_NAME}"
echo "Source directory: ${STATIC_DIR}"
echo "Destination: ${GCS_PATH}"

# Check if static directory exists
if [ ! -d "$STATIC_DIR" ]; then
    echo "Error: Static directory not found at ${STATIC_DIR}"
    exit 1
fi

# Verify gsutil authentication  
if ! gsutil ls "gs://${BUCKET_NAME}/" >/dev/null 2>&1; then  
    echo "Error: Unable to access GCS bucket. Please ensure gsutil is authenticated and you have access to ${BUCKET_NAME}"  
    exit 1  
fi  

# Sync files to GCS bucket
# -r: recursive
# -c: use checksums instead of modification times
# -d: delete files in destination that don't exist in source
gsutil -m rsync -r -c -d "${STATIC_DIR}" "${GCS_PATH}"

echo "✅ Successfully synced static files to GCS bucket"

