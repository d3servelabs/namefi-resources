#!/bin/bash
# Simulate startup script locally

set -e

echo "[+] Simulating startup script locally..."

export DD_API_KEY=example_key
export APP_IMAGE=ghcr.io/example/app:latest
export DOMAIN=example.com
export EMAIL=you@example.com

mkdir -p /tmp/simulated-startup && cd /tmp/simulated-startup
cp -r /path/to/gcp-deploy/startup/* .

bash header.sh
bash footer.sh

echo "[✓] Simulated startup script executed."
