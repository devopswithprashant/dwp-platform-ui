#!/bin/sh
set -e

# Export backend service configuration for Nginx
export BACKEND_SERVICE_HOST="${BACKEND_SERVICE_HOST:-blog-service}"
export BACKEND_SERVICE_PORT="${BACKEND_SERVICE_PORT:-9090}"

echo "[*] Backend Service: $BACKEND_SERVICE_HOST:$BACKEND_SERVICE_PORT"

# Substitute environment variables in Nginx config
envsubst < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

# Start Nginx in background
echo "[*] Starting Nginx..."
nginx -g "daemon off;" &
NGINX_PID=$!

# Wait for Nginx to start
sleep 2

# Start Next.js standalone
echo "[*] Starting Next.js server on port 3000..."
cd /app
exec node .next/standalone/server.js

