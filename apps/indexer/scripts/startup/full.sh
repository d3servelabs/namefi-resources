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
  "INSTALL_DOCKER"
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

INSTALL_DOCKER=${INSTALL_DOCKER:-false}

if [ "$INSTALL_DOCKER" = true ]; then
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
fi

systemctl enable docker && systemctl start docker

mkdir -p /opt/ponder
cd /opt/ponder

gcloud auth configure-docker us-central1-docker.pkg.dev
# ==== docker-compose.yml ====
cat > docker-compose.yml <<'EOF'
version: '3.8'

services:
  app:
    image: ${APP_IMAGE}
    restart: always
    expose:
      - "8080"
    ports:
      - "8080:8080"
    environment:
      - DD_ENV=prod
      - DD_SERVICE=ponder-indexer
      - DD_VERSION=1.2.3
      - PORT=8080
      - DATABASE_SCHEMA=indexer
      - PONDER_LOG_LEVEL=info
      - DATABASE_URL=${DATABASE_URL}
      - USE_WEBSOCKETS=${USE_WEBSOCKETS}
      - INFISICAL_TOKEN=${INFISICAL_TOKEN}
    labels:
      com.datadoghq.ad.check_names: '["prometheus"]'
      com.datadoghq.ad.init_configs: '[{}]'
      com.datadoghq.ad.instances: >
        [{"prometheus_url":"http://%%host%%:8080/metrics", "namespace":"ponder-indexer", "metrics": ["ponder_*"]}]
      tags: "env:prod,team:infra,service:ponder-indexer"
      com.datadoghq.ad.logs: '[{"source": "ponder-indexer", "service": "ponder-indexer"}]'

  migration:
    image: ${APP_IMAGE}
    restart: "no"  # Don't restart - run once and exit
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - READY_ENDPOINT=http://app:8080/ready
      - INFISICAL_TOKEN=${INFISICAL_TOKEN}
    command: ["infisical", "run", "--", "npm", "run", "migrate-schema"]
    depends_on:
      - app
    labels:
      tags: "env:prod,team:infra,service:ponder-migration"
      com.datadoghq.ad.logs: '[{"source": "ponder-migration", "service": "ponder-migration"}]'

  caddy:
    image: caddy:2-alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    environment:
      - DOMAIN=${DOMAIN}
      - ACME_EMAIL=${EMAIL}
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - app

  datadog-agent:
    image: gcr.io/datadoghq/agent:latest
    restart: always
    environment:
      - DD_API_KEY=${DD_API_KEY}
      - DD_SITE=us5.datadoghq.com
      - DD_DOGSTATSD_NON_LOCAL_TRAFFIC=true
      - DD_CONTAINER_EXCLUDE=name:datadog-agent,name:caddy
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - /proc/:/host/proc/:ro
      - /sys/fs/cgroup:/host/sys/fs/cgroup:ro

volumes:
  caddy_data:
  caddy_config:
EOF

# ==== Caddyfile ====
# Caddy obtains and renews the Let's Encrypt cert for $DOMAIN automatically.
cat > Caddyfile <<'EOF'
{
	email {$ACME_EMAIL}
}

{$DOMAIN} {
	reverse_proxy app:8080 {
		header_up Host {host}
		header_up X-Real-IP {remote_host}
		header_up X-Forwarded-For {remote_host}
		header_up X-Forwarded-Proto {scheme}
	}
}
EOF

# Start containers
docker compose up -d
