#!/bin/sh
set -e

# ── Environment defaults ────────────────────────────────────────────
export BACKEND_SERVICE_HOST="${BACKEND_SERVICE_HOST:-blog-service}"
export BACKEND_SERVICE_PORT="${BACKEND_SERVICE_PORT:-9090}"
export HOSTNAME="0.0.0.0"
export PORT="3000"

# ── Dynamically resolve DNS from current environment ────────────────
# Works for both K8s (CoreDNS) and Docker (127.0.0.11)
export NGINX_RESOLVER=$(cat /etc/resolv.conf | grep nameserver | head -1 | awk '{print $2}')

echo "[*] Backend  : $BACKEND_SERVICE_HOST:$BACKEND_SERVICE_PORT"
echo "[*] Resolver : $NGINX_RESOLVER"

# ── Generate Nginx config from template ─────────────────────────────
envsubst '${BACKEND_SERVICE_HOST} ${BACKEND_SERVICE_PORT} ${NGINX_RESOLVER}' \
    < /etc/nginx/conf.d/default.conf.template \
    > /etc/nginx/http.d/default.conf

# ── Verify substitution ─────────────────────────────────────────────
echo "[*] Nginx config check:"
grep -E "resolver|set \\\$backend" /etc/nginx/http.d/default.conf

# ── Validate Nginx config ───────────────────────────────────────────
nginx -t

# ── Start Nginx ─────────────────────────────────────────────────────
echo "[*] Starting Nginx..."
nginx -g "daemon off;" &

sleep 2

# ── Copy Next.js static assets into standalone ──────────────────────
# standalone output does NOT include these by default
if [ ! -d /app/.next/standalone/.next/static ]; then
    echo "[*] Copying .next/static into standalone..."
    cp -r /app/.next/static /app/.next/standalone/.next/static
fi

if [ ! -d /app/.next/standalone/public ]; then
    echo "[*] Copying public into standalone..."
    cp -r /app/public /app/.next/standalone/public 2>/dev/null || true
fi

# ── Start Next.js standalone server ─────────────────────────────────
echo "[*] Starting Next.js on 0.0.0.0:3000..."
cd /app/.next/standalone
exec node server.js