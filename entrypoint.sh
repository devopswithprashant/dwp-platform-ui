#!/bin/sh
set -e

# ── Environment defaults ────────────────────────────────────────────
export BACKEND_SERVICE_HOST="${BACKEND_SERVICE_HOST:-blog-service}"
export BACKEND_SERVICE_PORT="${BACKEND_SERVICE_PORT:-8080}"
export AUTH_SERVICE_HOST="${AUTH_SERVICE_HOST:-auth-service}"
export AUTH_SERVICE_PORT="${AUTH_SERVICE_PORT:-8081}"
export HOSTNAME="0.0.0.0"
export PORT="3000"

echo "[*] Backend Service : $BACKEND_SERVICE_HOST:$BACKEND_SERVICE_PORT"
echo "[*] Auth Service    : $AUTH_SERVICE_HOST:$AUTH_SERVICE_PORT"

# ── Identify active Nginx config directory ──────────────────────────
NGINX_CONF_DIR="/etc/nginx/conf.d"
if [ -d "/etc/nginx/http.d" ]; then
    NGINX_CONF_DIR="/etc/nginx/http.d"
fi

mkdir -p "$NGINX_CONF_DIR"

echo "[*] Generating Nginx config at $NGINX_CONF_DIR/default.conf..."

# ── Generate Nginx config from template via envsubst ────────────────
envsubst '${BACKEND_SERVICE_HOST} ${BACKEND_SERVICE_PORT} ${AUTH_SERVICE_HOST} ${AUTH_SERVICE_PORT}' \
    < /etc/nginx/conf.d/default.conf.template \
    > "$NGINX_CONF_DIR/default.conf"

# ── Validate generated Nginx configuration ──────────────────────────
nginx -t

# ── Start Nginx in background ───────────────────────────────────────
echo "[*] Starting Nginx daemon..."
nginx -g "daemon off;" &

# ── Start Next.js standalone Node server ────────────────────────────
echo "[*] Starting Next.js Server on $HOSTNAME:$PORT..."
exec node server.js