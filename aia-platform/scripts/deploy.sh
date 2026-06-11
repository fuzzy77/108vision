#!/usr/bin/env bash
# ============================================================
# AIA Platform — Deployment Script
# ============================================================
# Deploys the latest version to the production VPS.
#
# Prerequisites:
#   - SSH access to VPS configured (~/.ssh/config)
#   - VPS already set up with setup-vps.sh
#
# Usage:
#   ./scripts/deploy.sh                    # Deploy latest from main branch
#   ./scripts/deploy.sh --branch feature/x # Deploy specific branch
# ============================================================

set -euo pipefail

# --- Configuration ---
VPS_HOST="${AIA_VPS_HOST:-aia-vps}"
VPS_USER="${AIA_VPS_USER:-aia}"
APP_DIR="/opt/aia-platform"
BRANCH="${2:-main}"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --branch) BRANCH="$2"; shift 2 ;;
        --host) VPS_HOST="$2"; shift 2 ;;
        *) shift ;;
    esac
done

echo "============================================"
echo " AIA Platform — Deployment"
echo " Host: ${VPS_HOST}"
echo " Branch: ${BRANCH}"
echo " Dir: ${APP_DIR}"
echo "============================================"

# --- Pre-deploy checks ---
echo "[1/5] Running pre-deploy checks..."

# Verify SSH connectivity
if ! ssh -q "${VPS_USER}@${VPS_HOST}" exit 2>/dev/null; then
    echo "ERROR: Cannot connect to ${VPS_USER}@${VPS_HOST}"
    echo "Ensure SSH is configured in ~/.ssh/config"
    exit 1
fi

# --- Pull latest code ---
echo "[2/5] Pulling latest code (branch: ${BRANCH})..."
ssh "${VPS_USER}@${VPS_HOST}" << REMOTE
    set -euo pipefail
    cd ${APP_DIR}
    git fetch origin
    git checkout ${BRANCH}
    git pull origin ${BRANCH}
REMOTE

# --- Backup database ---
echo "[3/5] Creating pre-deploy database backup..."
ssh "${VPS_USER}@${VPS_HOST}" << REMOTE
    set -euo pipefail
    cd ${APP_DIR}
    ./infrastructure/backups/backup.sh
REMOTE

# --- Deploy ---
echo "[4/5] Deploying services..."
ssh "${VPS_USER}@${VPS_HOST}" << REMOTE
    set -euo pipefail
    cd ${APP_DIR}

    # Pull latest images
    docker compose pull

    # Restart services with zero-downtime (recreate only changed)
    docker compose up -d --remove-orphans

    # Wait for health checks
    echo "Waiting for services to be healthy..."
    sleep 10
    docker compose ps
REMOTE

# --- Post-deploy verification ---
echo "[5/5] Verifying deployment..."
ssh "${VPS_USER}@${VPS_HOST}" << REMOTE
    set -euo pipefail
    cd ${APP_DIR}

    # Check all services are running
    UNHEALTHY=\$(docker compose ps --format json | grep -c '"unhealthy"' || true)
    if [[ "\${UNHEALTHY}" -gt 0 ]]; then
        echo "WARNING: ${UNHEALTHY} unhealthy service(s) detected!"
        docker compose ps
        exit 1
    fi

    echo "All services healthy."
REMOTE

echo ""
echo "============================================"
echo " Deployment complete!"
echo " Branch: ${BRANCH}"
echo " Host: ${VPS_HOST}"
echo "============================================"
