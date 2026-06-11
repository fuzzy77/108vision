# 108 AI — Desktop Agent (Docker)
#
# Alternative deployment method for environments where native install is not desired.
# Provides filesystem access to mounted volumes only.
#
# Usage:
#   docker build -t 108ai-desktop .
#   docker run -d \
#     --name 108ai \
#     -e GATEWAY_URL=wss://api.108ai.dev \
#     -e TENANT_ID=<uuid> \
#     -e AUTH_TOKEN=<token> \
#     -v /path/to/data:/data \
#     108ai-desktop

FROM node:20-slim AS builder

WORKDIR /app

# Install dependencies
COPY package.json ./
RUN npm install --omit=dev

# Copy source
COPY tsconfig.json ./
COPY src/ ./src/
COPY scripts/ ./scripts/

# Build
RUN npx tsc

# --- Runtime ---
FROM node:20-slim

WORKDIR /app

# Copy built output and node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Create default config directory
RUN mkdir -p /root/.108ai

# Default data directory (mount point for user data)
RUN mkdir -p /data

# Write default config for Docker mode
RUN echo '{ \
  "gatewayUrl": "", \
  "authToken": "", \
  "tenantId": "", \
  "allowedDirectories": ["/data"], \
  "autoStart": false, \
  "riskPreferences": { \
    "autoApproveReadOnly": true, \
    "autoApproveLowRisk": true, \
    "requireApprovalHighRisk": true \
  }, \
  "maxActionsPerMinute": 10 \
}' > /root/.108ai/config.json

# Entrypoint script that reads env vars
COPY <<'EOF' /app/entrypoint.sh
#!/bin/sh
set -e

# Inject environment variables into config
if [ -n "$GATEWAY_URL" ] && [ -n "$TENANT_ID" ] && [ -n "$AUTH_TOKEN" ]; then
  node -e "
    const fs = require('fs');
    const config = JSON.parse(fs.readFileSync('/root/.108ai/config.json', 'utf-8'));
    config.gatewayUrl = process.env.GATEWAY_URL;
    config.tenantId = process.env.TENANT_ID;
    config.authToken = process.env.AUTH_TOKEN;
    if (process.env.ALLOWED_DIRS) {
      config.allowedDirectories = process.env.ALLOWED_DIRS.split(',');
    }
    fs.writeFileSync('/root/.108ai/config.json', JSON.stringify(config, null, 2));
  "
fi

exec node /app/dist/index.js "$@"
EOF

RUN chmod +x /app/entrypoint.sh

ENTRYPOINT ["/app/entrypoint.sh"]

# Health check: verify process is running
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD pgrep -f "node /app/dist/index.js" > /dev/null || exit 1
