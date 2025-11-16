# ---------- builder stage: unzip artifacts ----------
FROM alpine:3.18 AS builder

# install unzip (kept only in builder)
RUN apk add --no-cache unzip

# Create app dir
WORKDIR /app

# Copy zip from build context (fails build if no match)
COPY target/*.zip /tmp/app.zip

# Unzip into /app/build (handle single top-level dir)
RUN set -eux; \
    mkdir -p /app/build; \
    unzip -q /tmp/app.zip -d /tmp/unzipdir; \
    # If archive has a single top-level directory, move its contents.
    FIRST="$(ls -A /tmp/unzipdir | head -n 1 || true)"; \
    if [ -n "$FIRST" ] && [ -d "/tmp/unzipdir/$FIRST" ] && [ "$(ls -A /tmp/unzipdir | wc -l)" -eq 1 ]; then \
      mv /tmp/unzipdir/"$FIRST"/* /app/build/ || true; \
    else \
      mv /tmp/unzipdir/* /app/build/ || true; \
    fi; \
    rm -rf /tmp/app.zip /tmp/unzipdir

# ---------- final stage: nginx serving unzipped content ----------
FROM nginx:stable-alpine3.20-perl

# Copy custom Nginx configuration (optional)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Clean default content
RUN rm -rf /usr/share/nginx/html/*

# Copy the unzipped build from the builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Ensure correct permissions (nginx user)
RUN chown -R nginx:nginx /usr/share/nginx/html

# Optional debug - remove in production
RUN ls -la /usr/share/nginx/html || true

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]


