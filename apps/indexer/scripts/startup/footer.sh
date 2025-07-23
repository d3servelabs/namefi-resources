# Start containers
docker compose up -d

# Get initial cert
docker compose run --rm certbot certonly \
  --webroot --webroot-path=/var/www/certbot \
  --email $EMAIL --agree-tos --no-eff-email -d $DOMAIN

docker compose restart nginx

# Add cron job for renewals (skip if already exists)
(crontab -l 2>/dev/null | grep -q "renew-cert.sh" || \
 (crontab -l 2>/dev/null; echo "30 3 * * * /opt/my-app/renew-cert.sh >> /opt/my-app/renew-cert.log 2>&1")) | crontab -
