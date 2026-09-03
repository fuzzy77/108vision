# ============================================================
# 108 Vision — Static stack in un unico nginx:
#   website (www.) + dashboard (app.) + client chat (chat.) + downloads (dl.)
# ============================================================
# Build context: RADICE del repo 108vision (contiene aia-platform/ e aia-website/)
#   dockerfile: aia-platform/deploy/static.Dockerfile
# Serve 5 server blocks (www/apex/app/chat/dl via template nginx) da un solo container.

# --- Build Stage: app + chat (monorepo aia-platform) ---
FROM node:20-alpine AS build

WORKDIR /app

# Workspace manifests (pattern del Dockerfile gateway: npm install, niente lockfile npm)
COPY aia-platform/package.json ./
COPY aia-platform/packages/shared/package.json ./packages/shared/
COPY aia-platform/apps/client/package.json ./apps/client/
COPY aia-platform/apps/dashboard/package.json ./apps/dashboard/

RUN npm install --workspaces --include-workspace-root

# Source
COPY aia-platform/packages/shared/ ./packages/shared/
COPY aia-platform/apps/client/ ./apps/client/
COPY aia-platform/apps/dashboard/ ./apps/dashboard/

# @aia/shared serve al client (workspace:*); la dashboard è autonoma
RUN npm run build -w packages/shared \
 && npm run build -w @aia/client \
 && npm run build -w @aia/dashboard

# --- Build Stage: website (Astro static, output: dist/) ---
FROM node:20-alpine AS site

WORKDIR /site

# Il sito ha il proprio package-lock.json → npm ci deterministico
COPY aia-website/package.json aia-website/package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY aia-website/ ./
RUN npm run build

# --- Serve Stage ---
FROM nginx:1.27-alpine

# envsubst del template usa AIA_DOMAIN (il container lo riceve da compose)
COPY aia-platform/deploy/static.nginx.conf.template /etc/nginx/templates/default.conf.template

COPY --from=build /app/apps/dashboard/dist /usr/share/nginx/html/app
COPY --from=build /app/apps/client/dist /usr/share/nginx/html/chat
COPY --from=site /site/dist /usr/share/nginx/html/site
# /usr/share/nginx/html/downloads arriva dal bind volume del compose

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
