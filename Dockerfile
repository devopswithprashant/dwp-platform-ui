FROM node:22-alpine

WORKDIR /app

# Copy and unzip the Maven artifact
COPY target/*.zip /tmp/app.zip
RUN apk add --no-cache unzip && \
    unzip -q /tmp/app.zip -d /tmp/app_extracted && rm /tmp/app.zip && \
    cp -a /tmp/app_extracted/*/. /app/ && \
    rm -rf /tmp/app_extracted

# Install Nginx and gettext for envsubst
RUN apk add --no-cache nginx gettext

# Copy nginx template to conf.d (entrypoint writes final to http.d)
COPY nginx.conf /etc/nginx/conf.d/default.conf.template

COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

RUN chown -R root:root /app && chmod -R 755 /app

EXPOSE 80 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:80/health || exit 1

ENTRYPOINT ["/app/entrypoint.sh"]