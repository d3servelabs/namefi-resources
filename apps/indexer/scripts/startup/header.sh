#!/bin/bash
set -euo pipefail

# Read metadata
# Define array of environment variables to fetch
env_vars=(
  "DD_API_KEY"
  "APP_IMAGE" 
  "DOMAIN"
  "EMAIL"
  "INFISICAL_TOKEN"
#   "DATABASE_URL" 
#   "USE_WEBSOCKETS"
)

# Loop through and fetch each variable from metadata
for var in "${env_vars[@]}"; do
  # Fetch value from metadata server
  value=$(curl -s "http://metadata.google.internal/computeMetadata/v1/instance/attributes/${var}" -H "Metadata-Flavor: Google")
  
  # Export to current shell
  export "$var=$value"
  
  # Add to /etc/environment
  echo "$var=$value" >> /etc/environment
done

# Add Docker's official GPG key:
apt-get update
apt-get install -y ca-certificates curl
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

# Add the repository to Apt sources:
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}") stable" | \
 tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update -y

# Install Docker
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl enable docker && systemctl start docker

mkdir -p /opt/my-app/nginx/conf.d /opt/my-app/nginx/certbot/conf /opt/my-app/nginx/certbot/www
cd /opt/my-app

gcloud auth configure-docker us-central1-docker.pkg.dev 