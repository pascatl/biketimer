# Build stage
FROM node:20-alpine as build

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package.json ./

# Install dependencies
RUN npm install --legacy-peer-deps --verbose

# Copy source code
COPY . .

# Build-time env vars (VITE_ prefix makes them available via import.meta.env)
ARG VITE_APP_NAME
ARG VITE_KEYCLOAK_URL
ARG VITE_KEYCLOAK_REALM
ARG VITE_KEYCLOAK_CLIENT_ID
ENV VITE_APP_NAME=$VITE_APP_NAME
ENV VITE_KEYCLOAK_URL=$VITE_KEYCLOAK_URL
ENV VITE_KEYCLOAK_REALM=$VITE_KEYCLOAK_REALM
ENV VITE_KEYCLOAK_CLIENT_ID=$VITE_KEYCLOAK_CLIENT_ID

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration as template (KEYCLOAK_URL is substituted at runtime)
COPY nginx.conf /etc/nginx/conf.d/default.conf.template

# Expose port
EXPOSE 80

# Substitute ${KEYCLOAK_URL} in nginx conf, then start nginx
CMD ["/bin/sh", "-c", "envsubst '${KEYCLOAK_URL}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
