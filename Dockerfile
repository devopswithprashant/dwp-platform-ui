# ==========================================
# STAGE 1: Install Dependencies
# ==========================================
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files for aggressive Docker layer caching
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./

# Install dependencies based on preferred package manager
RUN \
  if [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  elif [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  else echo "Lockfile not found." && exit 1; \
  fi

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
# STAGE 3: Minimal Production Runtime (~110-130 MB)
# ==========================================
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install lightweight Nginx and gettext for envsubst
RUN apk add --no-cache nginx gettext

# Pre-create Nginx & cache folders with permissive runtime permissions
RUN mkdir -p /etc/nginx/conf.d \
             /etc/nginx/http.d \
             /var/cache/nginx \
             /var/log/nginx \
             /var/run/nginx \
             /app/.next/cache && \
    chmod -R 777 /var/cache/nginx /var/log/nginx /var/run /etc/nginx/conf.d /etc/nginx/http.d /app


# Copy standalone output and static assets
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy public folder safely (will not fail if public directory does not exist)
COPY --from=builder /app/public* ./public/


# Copy Nginx configuration template and runtime entrypoint
COPY nginx.conf /etc/nginx/conf.d/default.conf.template
COPY entrypoint.sh /app/entrypoint.sh

# Set execution rights
RUN chmod +x /app/entrypoint.sh

EXPOSE 80 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:80/health || exit 1

ENTRYPOINT ["/app/entrypoint.sh"]