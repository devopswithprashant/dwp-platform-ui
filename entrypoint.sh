#!/bin/sh
set -e

# Export defaults if not set
BACKEND_SERVICE_HOST="${BACKEND_SERVICE_HOST:-blog-service}"
BACKEND_SERVICE_PORT="${BACKEND_SERVICE_PORT:-9090}"

echo "[*] Backend Service: $BACKEND_SERVICE_HOST:$BACKEND_SERVICE_PORT"

# Substitute environment variables in nginx config
envsubst < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

# Start Nginx in background
echo "[*] Starting Nginx..."
nginx -g "daemon off;" &
NGINX_PID=$!

# Wait for Nginx to start
sleep 2

# Start Next.js standalone
echo "[*] Starting Next.js server on port 3000..."
exec node .next/standalone/server.js
