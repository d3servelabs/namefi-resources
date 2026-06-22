# Start containers. Caddy obtains and renews the Let's Encrypt certificate for
# $DOMAIN automatically (no certbot, no renewal cron needed).
docker compose up -d
