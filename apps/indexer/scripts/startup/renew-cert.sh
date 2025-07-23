#!/bin/bash

cd /opt/my-app || { echo "[!] /opt/my-app not found"; exit 1; }

RENEWED=$(docker compose run --rm certbot renew --dry-run | grep 'No renewals were attempted' || true)

if [ -z "$RENEWED" ]; then
  echo "[+] Certificate renewed, restarting nginx..."
  docker compose restart nginx
else
  echo "[=] No certs needed renewal."
fi
