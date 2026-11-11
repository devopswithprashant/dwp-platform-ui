# ==========================================
# STAGE 1: Install Dependencies
# ==========================================
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy npm manifests for dependency layer caching
COPY package.json package-lock.json ./

# Install dependencies from the committed npm lockfile
RUN npm ci --no-audit --no-fund --foreground-scripts

# ==========================================
# STAGE 2: Build Application
# ==========================================
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1

# Build Next.js app (Requires output: 'standalone' in next.config.js)
RUN npm run build



# ==========================================
# STAGE 3: Minimal Production Runtime
# ==========================================
FROM alpine:3.20 AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install bare Node.js runtime (no npm/yarn/pnpm bloat) and Nginx
RUN apk upgrade --no-cache musl musl-utils && \
    apk add --no-cache nodejs nginx gettext

# Pre-create Nginx & cache folders with permissive runtime permissions
RUN mkdir -p /etc/nginx/conf.d \
             /etc/nginx/http.d \
             /var/cache/nginx \
             /var/log/nginx \
             /var/run/nginx \
             /app/.next/cache && \
    chmod -R 777 /var/cache/nginx /var/log/nginx /var/run /etc/nginx/conf.d /etc/nginx/http.d /app

# Copy standalone server & required static assets from builder
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public* ./public/

# Copy Nginx configuration template and runtime entrypoint
COPY nginx.conf /etc/nginx/conf.d/default.conf.template
COPY entrypoint.sh /app/entrypoint.sh

RUN chmod +x /app/entrypoint.sh

EXPOSE 80 3000

ENTRYPOINT ["/app/entrypoint.sh"]
