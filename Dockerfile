# Use a lightweight Nginx web server image
FROM nginx:alpine

# Copy the static assets compiled by GitHub Actions straight into the Nginx web directory
COPY build /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
