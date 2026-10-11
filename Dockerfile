# Build phase using Node
FROM node:24-alpine AS build-stage
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production server phase using Nginx to serve the static build files
FROM nginx:alpine
# Copy the compiled React assets straight into Nginx html directory
COPY --from=build-stage /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
    
