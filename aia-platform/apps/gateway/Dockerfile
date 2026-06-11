# ============================================================
# AIA Gateway — Multi-stage Dockerfile
# ============================================================
# Stage 1: Build (full dependencies + TypeScript compilation)
# Stage 2: Production (minimal runtime)
# ============================================================

# --- Build Stage ---
FROM node:20-slim AS builder

WORKDIR /app

# Copy root workspace files
COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/ai-client/package.json ./packages/ai-client/
COPY apps/gateway/package.json ./apps/gateway/

# Install all dependencies (including devDependencies for build)
RUN npm install --workspaces --include-workspace-root

# Copy source code
COPY packages/shared/ ./packages/shared/
COPY packages/ai-client/ ./packages/ai-client/
COPY apps/gateway/ ./apps/gateway/

# Build packages in order
RUN npm run build -w packages/shared
RUN npm run build -w packages/ai-client
RUN npm run build -w apps/gateway

# --- Production Stage ---
FROM node:20-slim AS production

WORKDIR /app

# Security: run as non-root
RUN groupadd -r aia && useradd -r -g aia -d /app aia

# Copy workspace structure for production dependencies
COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/ai-client/package.json ./packages/ai-client/
COPY apps/gateway/package.json ./apps/gateway/

# Install production dependencies only
RUN npm install --workspaces --include-workspace-root --omit=dev && \
    npm cache clean --force

# Copy built artifacts
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/ai-client/dist ./packages/ai-client/dist
COPY --from=builder /app/apps/gateway/dist ./apps/gateway/dist

# Copy migration scripts
COPY --from=builder /app/apps/gateway/src/db/migrations ./apps/gateway/migrations

# Set ownership
RUN chown -R aia:aia /app

USER aia

# Environment
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/health/live').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Start
CMD ["node", "apps/gateway/dist/index.js"]
