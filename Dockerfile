# ---------- builder stage: unzip artifacts ----------
FROM alpine:3.18 AS builder

RUN apk add --no-cache unzip

WORKDIR /app

COPY target/*.zip /tmp/app.zip

RUN set -eux; \
    mkdir -p /app/build; \
    unzip -q /tmp/app.zip -d /tmp/unzipdir; \
    FIRST="$(ls -A /tmp/unzipdir | head -n 1 || true)"; \
    if [ -n "$FIRST" ] && [ -d "/tmp/unzipdir/$FIRST" ] && [ "$(ls -A /tmp/unzipdir | wc -l)" -eq 1 ]; then \
      mv /tmp/unzipdir/"$FIRST"/* /app/build/ || true; \
    else \
      mv /tmp/unzipdir/* /app/build/ || true; \
    fi; \
    rm -rf /tmp/app.zip /tmp/unzipdir

# ---------- final stage: Nginx + Node.js ----------
FROM node:22-alpine

WORKDIR /app

# Copy the unzipped build from builder
COPY --from=builder /app/build .

# Install Nginx and gettext for envsubst
RUN apk add --no-cache nginx gettext

# Copy Nginx config as template
COPY nginx.conf /etc/nginx/conf.d/default.conf.template

# Copy entrypoint script
COPY entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Set permissions
RUN chown -R root:root /app && chmod -R 755 /app

USER root

# Nginx on 80, Next.js on 3000
EXPOSE 80 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:80/health || exit 1

ENTRYPOINT ["/docker-entrypoint.sh"]


