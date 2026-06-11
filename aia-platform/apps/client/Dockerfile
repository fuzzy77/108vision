# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy workspace root files for npm workspaces
COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/client/package.json ./apps/client/

# Install dependencies
RUN npm ci --workspace=@aia/client

# Copy source code
COPY packages/shared/ ./packages/shared/
COPY apps/client/ ./apps/client/

# Build the application
RUN npm run build --workspace=@aia/client

# Production stage
FROM nginx:alpine AS production

# Copy custom nginx config
COPY apps/client/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets
COPY --from=build /app/apps/client/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
