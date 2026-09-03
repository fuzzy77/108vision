#!/bin/bash
# Deploy VPS-only: git pull + build sul VPS + riavvio + health check.
# Eseguito dal webhook (o manualmente con: sudo /opt/108vision/deploy.sh)
set -e

DEPLOY_DIR="/opt/108vision"
LOG_FILE="/var/log/108vision-deploy.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

log() { echo "[$TIMESTAMP] $1" | tee -a "$LOG_FILE"; }

log "=== Deploy started ==="
cd "$DEPLOY_DIR"

log "Pulling 108vision..."
cd repos/108vision && git pull origin main && cd "$DEPLOY_DIR"

log "Pulling wellbeing-app..."
cd repos/wellbeing-app && git pull origin main && cd "$DEPLOY_DIR"

log "Rebuilding containers..."
docker compose -f docker-compose.yml \
  -f docker-compose.apps.yml \
  -f docker-compose.wellbeing.yml \
  up -d --build 2>&1 | tee -a "$LOG_FILE"

log "Waiting for health checks..."
sleep 20

UNHEALTHY=$(docker ps --filter "health=unhealthy" --format "{{.Names}}" 2>/dev/null)
if [ -n "$UNHEALTHY" ]; then
    log "ERROR: Unhealthy containers: $UNHEALTHY"
    exit 1
fi

docker image prune -f >> "$LOG_FILE" 2>&1
docker builder prune -f >> "$LOG_FILE" 2>&1
log "=== Deploy completed ==="
