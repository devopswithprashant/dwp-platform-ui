FROM nginx:stable-alpine3.20-perl

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Remove default Nginx static files
RUN rm -rf /usr/share/nginx/html/*

# Copy built app from builder stage
#COPY --from=builder /app/build /usr/share/nginx/html
COPY /build /usr/share/nginx/html

RUN ls /usr/share/nginx/html
# Expose port 80
EXPOSE 80

# Start Nginx server
CMD ["nginx", "-g", "daemon off;"]