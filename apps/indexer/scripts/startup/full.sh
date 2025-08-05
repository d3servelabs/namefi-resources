#!/bin/bash
set -euo pipefail

# Read metadata
export DD_API_KEY=$(curl -s http://metadata.google.internal/computeMetadata/v1/instance/attributes/DD_API_KEY -H "Metadata-Flavor: Google")
export APP_IMAGE=$(curl -s http://metadata.google.internal/computeMetadata/v1/instance/attributes/APP_IMAGE -H "Metadata-Flavor: Google")
export DOMAIN=$(curl -s http://metadata.google.internal/computeMetadata/v1/instance/attributes/DOMAIN -H "Metadata-Flavor: Google")
export EMAIL=$(curl -s http://metadata.google.internal/computeMetadata/v1/instance/attributes/EMAIL -H "Metadata-Flavor: Google")
export DATABASE_URL=$(curl -s http://metadata.google.internal/computeMetadata/v1/instance/attributes/DATABASE_URL -H "Metadata-Flavor: Google")
export USE_WEBSOCKETS=$(curl -s http://metadata.google.internal/computeMetadata/v1/instance/attributes/USE_WEBSOCKETS -H "Metadata-Flavor: Google")

echo "DD_API_KEY=$DD_API_KEY" >> /etc/environment
echo "APP_IMAGE=$APP_IMAGE" >> /etc/environment
echo "DOMAIN=$DOMAIN" >> /etc/environment
echo "EMAIL=$EMAIL" >> /etc/environment
echo "DATABASE_URL=$DATABASE_URL" >> /etc/environment
echo "USE_WEBSOCKETS=$USE_WEBSOCKETS" >> /etc/environment


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


gcloud auth configure-docker us-central1-docker.pkg.dev 

mkdir -p /opt/my-app/nginx/conf.d /opt/my-app/nginx/certbot/conf /opt/my-app/nginx/certbot/www
cd /opt/my-app

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
    labels:
      com.datadoghq.ad.check_names: '["prometheus"]'
      com.datadoghq.ad.init_configs: '[{}]'
      com.datadoghq.ad.instances: >
        [{"prometheus_url":"http://%%host%%:8080/metrics", "namespace":"ponder-indexer", "metrics": ["ponder_*"]}]
      tags: "env:prod,team:infra,service:ponder-indexer"

  nginx:
    image: nginx:stable
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./nginx/certbot/conf:/etc/letsencrypt
      - ./nginx/certbot/www:/var/www/certbot
    depends_on:
      - app

  certbot:
    image: certbot/certbot
    volumes:
      - ./nginx/certbot/conf:/etc/letsencrypt
      - ./nginx/certbot/www:/var/www/certbot
    depends_on:
      - nginx

  datadog-agent:
    image: gcr.io/datadoghq/agent:latest
    restart: always
    environment:
      - DD_API_KEY=${DD_API_KEY}
      - DD_SITE=us5.datadoghq.com
      - DD_DOGSTATSD_NON_LOCAL_TRAFFIC=true
      - DD_CONTAINER_EXCLUDE=name:datadog-agent
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - /proc/:/host/proc/:ro
      - /sys/fs/cgroup:/host/sys/fs/cgroup:ro

  watchtower:
    image: containrrr/watchtower
    restart: always
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - WATCHTOWER_CLEANUP=true
      - WATCHTOWER_POLL_INTERVAL=300
EOF
set +u
# ==== nginx conf ====
envsubst '$DOMAIN' <<'EOF' > nginx/conf.d/app.conf
server {
    listen 80;
    server_name ${DOMAIN};

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name ${DOMAIN};

    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;

    location / {
        proxy_pass http://app:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
EOF
set -u
# ==== renew-cert.sh ====
cat > renew-cert.sh <<'EOF'
#!/bin/bash

cd /opt/my-app || { echo "[!] /opt/my-app not found"; exit 1; }

RENEWED=$(docker compose run --rm certbot renew | grep 'No renewals were attempted' || true)

if [ -z "$RENEWED" ]; then
  echo "[+] Certificate renewed, restarting nginx..."
  docker compose restart nginx
else
  echo "[=] No certs needed renewal."
fi
EOF

chmod +x renew-cert.sh

# Start containers
docker compose up -d


# Add cron job for renewals (skip if already exists)
(crontab -l 2>/dev/null | grep -q "renew-cert.sh" || \
 (crontab -l 2>/dev/null; echo "30 3 * * * /opt/my-app/renew-cert.sh >> /opt/my-app/renew-cert.log 2>&1")) | crontab -

touch setup-cert.sh
echo 'DOMAIN='$DOMAIN > setup-cert.sh
cat > setup-cert.sh <<'EOF'
HOST="localhost"
PORT="80"

echo "Waiting for port $PORT on $HOST to become unavailable..."

# Loop until netcat fails to connect (port is unavailable)
while nc -z "$HOST" "$PORT"; do
  echo "Port $PORT is still available. Waiting..."
  sleep 5 # Wait for 1 second before retrying
done

echo "Port $PORT on $HOST is now unavailable."

# Get initial cert
docker compose run --rm certbot certonly \
  --webroot --webroot-path=/var/www/certbot \
  --email $EMAIL --agree-tos --no-eff-email -d $DOMAIN

docker compose restart nginx
EOF

chmod +x ./setup-cert.sh