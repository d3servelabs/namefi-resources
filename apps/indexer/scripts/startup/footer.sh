# Start containers
docker compose up -d

# # Get initial cert
# docker compose run --rm certbot certonly \
#   --webroot --webroot-path=/var/www/certbot \
#   --email $EMAIL --agree-tos --no-eff-email -d $DOMAIN

# docker compose restart nginx

# Add cron job for renewals (skip if already exists)
(crontab -l 2>/dev/null | grep -q "renew-cert.sh" || \
 (crontab -l 2>/dev/null; echo "30 3 * * * /opt/ponder/renew-cert.sh >> /opt/ponder/renew-cert.log 2>&1")) | crontab -

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