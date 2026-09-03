#!/usr/bin/env bash
# ============================================================
# 108 Vision — Bootstrap VPS Hetzner (VPS-only, zero costi GitHub)
# Eseguito UNA VOLTA su un VPS Ubuntu 24.04 fresco.
#   git clone https://github.com/fuzzy77/108vision.git /opt/108vision/repos/108vision
#   cd /opt/108vision/repos/108vision/deploy
#   sudo ./bootstrap.sh
# ============================================================
set -euo pipefail

DEPLOY_DIR="${DEPLOY_DIR:-/opt/108vision}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel 2>/dev/null || echo "$SCRIPT_DIR/..")"

GITHUB_REPO="https://github.com/fuzzy77/108vision.git"
WELLBEING_REPO="https://github.com/fuzzy77/WellBeingApp.git"

# Se i repo sono privati, passa un token:  sudo GITHUB_TOKEN=ghp_xxx ./bootstrap.sh
if [ -n "${GITHUB_TOKEN:-}" ]; then
  GITHUB_REPO="https://x-access-token:${GITHUB_TOKEN}@github.com/fuzzy77/108vision.git"
  WELLBEING_REPO="https://x-access-token:${GITHUB_TOKEN}@github.com/fuzzy77/WellBeingApp.git"
fi

log() { echo "[bootstrap] $*"; }

if [ "$(id -u)" -ne 0 ]; then
  echo "Esegui come root o con sudo." >&2
  exit 1
fi

# --- 1. Docker ---
if ! command -v docker >/dev/null 2>&1; then
  log "Installo Docker..."
  curl -fsSL https://get.docker.com | sh
fi
systemctl enable --now docker >/dev/null 2>&1 || true

# --- 2. Firewall ---
if command -v ufw >/dev/null 2>&1; then
  ufw allow 22/tcp >/dev/null 2>&1 || true
  ufw allow 80/tcp >/dev/null 2>&1 || true
  ufw allow 443/tcp >/dev/null 2>&1 || true
  ufw allow 9000/tcp >/dev/null 2>&1 || true   # webhook
  ufw --force enable >/dev/null 2>&1 || true
fi

# --- 3. Swap + timezone ---
if [ ! -f /swapfile ]; then
  log "Creo swap 4GB..."
  fallocate -l 4G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi
timedatectl set-timezone Europe/Rome >/dev/null 2>&1 || true

# --- 4. Utente deploy (per webhook + git pull) ---
if ! id -u deploy >/dev/null 2>&1; then
  useradd -m -s /bin/bash deploy
fi
usermod -aG docker deploy

# --- 5. Directory ---
mkdir -p "$DEPLOY_DIR/repos" "$DEPLOY_DIR/public/downloads"

# --- 6. Clona i repo (se mancanti) ---
[ -d "$DEPLOY_DIR/repos/108vision/.git" ] || git clone "$GITHUB_REPO" "$DEPLOY_DIR/repos/108vision"
[ -d "$DEPLOY_DIR/repos/wellbeing-app/.git" ] || git clone "$WELLBEING_REPO" "$DEPLOY_DIR/repos/wellbeing-app"

# --- 7. Copia i file di deploy ---
cp "$SCRIPT_DIR"/docker-compose.yml \
   "$SCRIPT_DIR"/docker-compose.apps.yml \
   "$SCRIPT_DIR"/docker-compose.wellbeing.yml \
   "$SCRIPT_DIR"/litellm-config.yaml \
   "$SCRIPT_DIR"/bootstrap-neon.sql \
   "$DEPLOY_DIR/"

cp "$SCRIPT_DIR"/deploy.sh "$DEPLOY_DIR/deploy.sh"
chmod +x "$DEPLOY_DIR/deploy.sh"
cp "$SCRIPT_DIR"/webhook-server.mjs "$DEPLOY_DIR/webhook-server.mjs"


# --- 8. .env ---
if [ ! -f "$DEPLOY_DIR/.env" ]; then
  cp "$SCRIPT_DIR/.env.example" "$DEPLOY_DIR/.env"
  log "Creato $DEPLOY_DIR/.env — COMPILALO con i segreti, poi rilancia:"
  log "  sudo $0"
  log "  (o direttamente: docker compose up -d --build)"
  exit 0
fi

# --- 9. Webhook server + systemd ---
WEBHOOK_SECRET="$(openssl rand -hex 32)"
cat > /etc/systemd/system/108vision-webhook.service <<EOF
[Unit]
Description=108 Vision deploy webhook
After=network.target

[Service]
Type=simple
User=deploy
WorkingDirectory=$DEPLOY_DIR
Environment=WEBHOOK_SECRET=$WEBHOOK_SECRET
Environment=WEBHOOK_PORT=9000
Environment=DEPLOY_SCRIPT=$DEPLOY_DIR/deploy.sh
ExecStart=/usr/bin/node $DEPLOY_DIR/webhook-server.mjs
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable --now 108vision-webhook >/dev/null 2>&1 || true

# Il deploy (git pull + build) gira come utente 'deploy'
chown -R deploy:deploy "$DEPLOY_DIR"

log "WEBHOOK_SECRET (incollalo nel webhook GitHub): $WEBHOOK_SECRET"

# --- 10. Schema Neon + primo avvio ---
log "DOPO il bootstrap: crea i 3 DB su Neon (console: aia_platform, litellm, wellbeing),"
log "compila \$NEON_* / \$WB_DATABASE_URL in $DEPLOY_DIR/.env, poi esegui lo schema:"
log "  sudo -u deploy bash -c 'cd $DEPLOY_DIR && set -a && . ./.env && set +a && psql \"\$NEON_DATABASE_URL\" -f bootstrap-neon.sql'"

cd "$DEPLOY_DIR"
log "Primo avvio infra..."
docker compose -f docker-compose.yml up -d
log "Build app (può richiedere diversi minuti)..."
docker compose -f docker-compose.yml \
  -f docker-compose.apps.yml \
  -f docker-compose.wellbeing.yml \
  up -d --build

log "Fatto. Stato:"
docker compose -f docker-compose.yml -f docker-compose.apps.yml -f docker-compose.wellbeing.yml ps
