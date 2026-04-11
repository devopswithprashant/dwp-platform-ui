# ---------- final stage: Nginx + Node.js ----------
FROM node:22-alpine

WORKDIR /app

# Copy and unzip the Maven artifact
COPY target/*.zip /tmp/app.zip
COPY nginx.conf /app/nginx.conf
COPY entrypoint.sh /app/entrypoint.sh
RUN unzip -q /tmp/app.zip -d /app && rm /tmp/app.zip

# Install Nginx and gettext for envsubst
RUN apk add --no-cache nginx gettext

# Move nginx config to correct location
RUN mv /app/nginx.conf /etc/nginx/conf.d/default.conf.template

# Make entrypoint executable
RUN chmod +x /app/entrypoint.sh

# Set permissions
RUN chown -R root:root /app && chmod -R 755 /app

USER root

# Nginx on 80, Next.js on 3000
EXPOSE 80 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:80/health || exit 1

ENTRYPOINT ["/app/entrypoint.sh"]


