#!/usr/bin/env bash
# ============================================================
# AIA Platform — Hetzner VPS Setup Script
# ============================================================
# Target: Ubuntu 24.04 LTS (clean install)
# Run as root on a fresh Hetzner VPS.
#
# Usage:
#   curl -sSL https://raw.githubusercontent.com/YOUR_REPO/scripts/setup-vps.sh | bash
#   # OR
#   scp setup-vps.sh root@YOUR_VPS_IP:/root/ && ssh root@YOUR_VPS_IP 'bash /root/setup-vps.sh'
# ============================================================

set -euo pipefail

# --- Configuration ---
APP_USER="aia"
APP_DIR="/opt/aia-platform"
SWAP_SIZE="4G"
SSH_PORT=22

echo "============================================"
echo " AIA Platform — VPS Setup"
echo " Target: Ubuntu 24.04 LTS"
echo "============================================"

# --- System Update ---
echo "[1/8] Updating system packages..."
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq \
    curl wget git unzip htop \
    ufw fail2ban \
    apt-transport-https ca-certificates gnupg lsb-release

# --- Create Application User ---
echo "[2/8] Creating application user: ${APP_USER}..."
if ! id "${APP_USER}" &>/dev/null; then
    useradd -m -s /bin/bash -G sudo "${APP_USER}"
    echo "${APP_USER} ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/${APP_USER}
    chmod 0440 /etc/sudoers.d/${APP_USER}
fi

# --- Install Docker ---
echo "[3/8] Installing Docker..."
if ! command -v docker &>/dev/null; then
    curl -fsSL https://get.docker.com | bash
    systemctl enable docker
    systemctl start docker
    usermod -aG docker "${APP_USER}"
fi

# Verify Docker Compose is available (v2 comes with Docker)
docker compose version

# --- Configure Firewall (UFW) ---
echo "[4/8] Configuring firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow ${SSH_PORT}/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'
ufw --force enable

# --- Configure Fail2Ban ---
echo "[5/8] Configuring fail2ban..."
cat > /etc/fail2ban/jail.local << 'JAIL'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
logpath = %(sshd_log)s
maxretry = 3
JAIL
systemctl enable fail2ban
systemctl restart fail2ban

# --- Setup Swap ---
echo "[6/8] Configuring ${SWAP_SIZE} swap..."
if ! swapon --show | grep -q '/swapfile'; then
    fallocate -l ${SWAP_SIZE} /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    # Optimize swap usage
    echo 'vm.swappiness=10' >> /etc/sysctl.conf
    echo 'vm.vfs_cache_pressure=50' >> /etc/sysctl.conf
    sysctl -p
fi

# --- Kernel Tuning ---
echo "[7/8] Applying kernel tuning..."
cat >> /etc/sysctl.conf << 'SYSCTL'
# Network performance
net.core.somaxconn=65535
net.ipv4.tcp_max_syn_backlog=65535
net.core.netdev_max_backlog=65535
net.ipv4.ip_local_port_range=1024 65535

# File descriptors
fs.file-max=2097152
fs.inotify.max_user_watches=524288
SYSCTL
sysctl -p

# Increase file descriptor limits
cat >> /etc/security/limits.conf << 'LIMITS'
* soft nofile 65535
* hard nofile 65535
LIMITS

# --- Setup Application Directory ---
echo "[8/8] Setting up application directory..."
mkdir -p "${APP_DIR}"
chown "${APP_USER}:${APP_USER}" "${APP_DIR}"

# --- Summary ---
echo ""
echo "============================================"
echo " VPS Setup Complete!"
echo "============================================"
echo ""
echo " Next steps:"
echo ""
echo " 1. Clone your repository:"
echo "    su - ${APP_USER}"
echo "    cd ${APP_DIR}"
echo "    git clone <YOUR_REPO_URL> ."
echo ""
echo " 2. Create .env file:"
echo "    cp .env.example .env"
echo "    nano .env  # Fill in real values"
echo ""
echo " 3. Start services:"
echo "    docker compose up -d"
echo ""
echo " 4. Verify:"
echo "    docker compose ps"
echo "    curl -s http://localhost/health"
echo ""
echo " Server IP: $(curl -s ifconfig.me)"
echo " User: ${APP_USER}"
echo " App dir: ${APP_DIR}"
echo "============================================"
