#!/bin/bash

cd /opt/ponder || { echo "[!] /opt/ponder not found"; exit 1; }

RENEWED=$(docker compose run --rm certbot renew | grep 'No renewals were attempted' || true)

if [ -z "$RENEWED" ]; then
  echo "[+] Certificate renewed, restarting nginx..."
  docker compose restart nginx
else
  echo "[=] No certs needed renewal."
fi
