#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════════════════
# NexusAI — one-time SSL setup script
#
# Run this once on a fresh server BEFORE starting the production stack.
# It generates the DH params file and gets a Let's Encrypt certificate.
#
# Usage:
#   chmod +x infra/setup_ssl.sh
#   ./infra/setup_ssl.sh nexusai.example.com admin@example.com
# ══════════════════════════════════════════════════════════════════════════════
set -euo pipefail

DOMAIN="${1:?Usage: $0 <domain> <email>}"
EMAIL="${2:?Usage: $0 <domain> <email>}"
SSL_DIR="./infra/ssl"

echo "── Step 1: Create ssl/ directory ────────────────────────────────────────"
mkdir -p "$SSL_DIR"

echo "── Step 2: Generate DH parameters (2048-bit) ────────────────────────────"
# This takes ~30 seconds. Only needs to be done once.
if [[ ! -f "$SSL_DIR/dhparam.pem" ]]; then
    openssl dhparam -out "$SSL_DIR/dhparam.pem" 2048
    echo "dhparam.pem generated."
else
    echo "dhparam.pem already exists — skipping."
fi

echo "── Step 3: Start nginx with HTTP-only config for ACME challenge ─────────"
# Use a temporary nginx config that serves port 80 only, so certbot can
# complete the ACME http-01 challenge before the full TLS config is live.
cat > "$SSL_DIR/nginx-acme.conf" << EOF
events { worker_connections 1024; }
http {
    server {
        listen 80;
        server_name $DOMAIN;
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }
        location / { return 200 "ok"; }
    }
}
EOF

docker run -d --rm --name nginx-acme \
    -p 80:80 \
    -v "$(pwd)/$SSL_DIR/nginx-acme.conf:/etc/nginx/nginx.conf:ro" \
    -v "certbot_webroot:/var/www/certbot" \
    nginx:1.27-alpine

echo "── Step 4: Obtain Let's Encrypt certificate ─────────────────────────────"
docker run --rm \
    -v "/etc/letsencrypt:/etc/letsencrypt" \
    -v "certbot_webroot:/var/www/certbot" \
    certbot/certbot certonly \
        --webroot \
        --webroot-path /var/www/certbot \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        -d "$DOMAIN"

echo "── Step 5: Stop temporary nginx ─────────────────────────────────────────"
docker stop nginx-acme

echo ""
echo "✓  SSL setup complete."
echo "   Certificate: /etc/letsencrypt/live/$DOMAIN/fullchain.pem"
echo "   DH params:   $SSL_DIR/dhparam.pem"
echo ""
echo "Now update nginx.conf: replace 'nexusai.example.com' with '$DOMAIN'"
echo "Then start the production stack:"
echo "  docker compose --profile prod up -d"
