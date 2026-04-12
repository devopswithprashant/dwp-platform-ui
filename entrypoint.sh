#!/bin/sh
set -e

export BACKEND_SERVICE_HOST="${BACKEND_SERVICE_HOST:-blog-service}"
export BACKEND_SERVICE_PORT="${BACKEND_SERVICE_PORT:-9090}"

# Force Next.js to bind on all interfaces so nginx can reach it
export HOSTNAME="0.0.0.0"
export PORT="3000"

echo "[*] Backend Service: $BACKEND_SERVICE_HOST:$BACKEND_SERVICE_PORT"

envsubst '${BACKEND_SERVICE_HOST} ${BACKEND_SERVICE_PORT}' \
    < /etc/nginx/conf.d/default.conf.template \
    > /etc/nginx/http.d/default.conf

nginx -t

echo "[*] Starting Nginx..."
nginx -g "daemon off;" &
NGINX_PID=$!

sleep 2

# Copy static files into standalone if not already there
if [ ! -d /app/.next/standalone/.next/static ]; then
    echo "[*] Copying static files into standalone..."
    cp -r /app/.next/static /app/.next/standalone/.next/static
fi

if [ ! -d /app/.next/standalone/public ]; then
    echo "[*] Copying public folder into standalone..."
    cp -r /app/public /app/.next/standalone/public 2>/dev/null || true
fi

echo "[*] Starting Next.js on 0.0.0.0:3000..."
cd /app/.next/standalone
exec node server.js