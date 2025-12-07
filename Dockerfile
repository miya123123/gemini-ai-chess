# Build stage
FROM node:20-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Set a placeholder for the API key during build. 
# This will be replaced at runtime by entrypoint.sh
ENV VITE_GEMINI_API_KEY=__GEMINI_API_KEY__

RUN npm run build

# Production stage
FROM nginx:alpine

# Copy the built assets from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy entrypoint script
COPY entrypoint.sh /docker-entrypoint.d/40-inject-env.sh
RUN chmod +x /docker-entrypoint.d/40-inject-env.sh

# Cloud Run sets the PORT env var, but Nginx is configured to listed on 8080 in nginx.conf
# We don't strictly need EXPOSE for Cloud Run, but it's good practice
EXPOSE 8080

# The default nginx image runs /docker-entrypoint.sh which runs scripts in /docker-entrypoint.d/
# So our script will be executed automatically
CMD ["nginx", "-g", "daemon off;"]
