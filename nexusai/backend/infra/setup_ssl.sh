#!/usr/bin/env bash
# NexusAI — One-time SSL setup
# Run this script ONCE on a fresh server before starting nginx.
# Requires: certbot, openssl, nginx installed on the host.
#
# Usage:
#   chmod +x infra/setup_ssl.sh
#   sudo DOMAIN=api.nexusai.app EMAIL=ops@nexusai.app ./infra/setup_ssl.sh

set -euo pipefail

DOMAIN="${DOMAIN:?Set DOMAIN env var, e.g. api.nexusai.app}"
EMAIL="${EMAIL:?Set EMAIL env var for Let's Encrypt notifications}"
NGINX_CONF_DIR="/etc/nginx/conf.d"
SSL_DIR="/etc/nginx/ssl"
DH_PARAMS="$SSL_DIR/dhparam.pem"

echo "▶ Setting up SSL for $DOMAIN"

# ── 1. Create SSL directory ───────────────────────────────────────
mkdir -p "$SSL_DIR"

# ── 2. Generate strong DH params (takes ~30s) ────────────────────
if [ ! -f "$DH_PARAMS" ]; then
  echo "▶ Generating 4096-bit DH params (this may take a minute)..."
  openssl dhparam -out "$DH_PARAMS" 4096
  echo "✅ DH params written to $DH_PARAMS"
else
  echo "ℹ  DH params already exist — skipping"
fi

# ── 3. Obtain Let's Encrypt certificate ──────────────────────────
echo "▶ Obtaining Let's Encrypt certificate for $DOMAIN..."
certbot certonly \
  --standalone \
  --non-interactive \
  --agree-tos \
  --email "$EMAIL" \
  -d "$DOMAIN" \
  --cert-path  "$SSL_DIR/cert.pem" \
  --key-path   "$SSL_DIR/key.pem" \
  --fullchain-path "$SSL_DIR/cert.pem"

echo "✅ Certificate issued"

# ── 4. Install auto-renewal systemd timer ────────────────────────
cat > /etc/systemd/system/certbot-renew.service << 'EOF'
[Unit]
Description=Let's Encrypt certificate renewal
After=network.target

[Service]
Type=oneshot
ExecStart=/usr/bin/certbot renew --quiet --deploy-hook "nginx -s reload"
EOF

cat > /etc/systemd/system/certbot-renew.timer << 'EOF'
[Unit]
Description=Twice-daily Let's Encrypt renewal check

[Timer]
OnCalendar=*-*-* 00,12:00:00
RandomizedDelaySec=3600
Persistent=true

[Install]
WantedBy=timers.target
EOF

systemctl daemon-reload
systemctl enable --now certbot-renew.timer
echo "✅ certbot-renew.timer enabled"

# ── 5. Test nginx config and reload ──────────────────────────────
nginx -t && nginx -s reload
echo "✅ nginx reloaded"
echo ""
echo "Done! SSL is live for https://$DOMAIN"
