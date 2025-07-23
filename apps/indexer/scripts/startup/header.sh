#!/bin/bash
set -euo pipefail

# Read metadata
export DD_API_KEY=$(curl -s http://metadata.google.internal/computeMetadata/v1/instance/attributes/DD_API_KEY -H "Metadata-Flavor: Google")
export APP_IMAGE=$(curl -s http://metadata.google.internal/computeMetadata/v1/instance/attributes/APP_IMAGE -H "Metadata-Flavor: Google")
export DOMAIN=$(curl -s http://metadata.google.internal/computeMetadata/v1/instance/attributes/DOMAIN -H "Metadata-Flavor: Google")
export EMAIL=$(curl -s http://metadata.google.internal/computeMetadata/v1/instance/attributes/EMAIL -H "Metadata-Flavor: Google")

# Install Docker
apt-get update -y && \
  apt-get install -y docker.io docker-buildx-plugin docker-compose-plugin git
systemctl enable docker && systemctl start docker

mkdir -p /opt/my-app/nginx/conf.d /opt/my-app/nginx/certbot/conf /opt/my-app/nginx/certbot/www
cd /opt/my-app
