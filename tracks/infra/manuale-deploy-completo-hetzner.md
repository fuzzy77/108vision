# Manuale Deploy Completo — 108 Vision su Hetzner

**Target:** setup completo di TUTTI i servizi 108 Vision su un singolo VPS Hetzner  
**Server:** Hetzner CX32 — 4 vCPU, 8 GB RAM, 80 GB NVMe, Ubuntu 24.04  
**Costo stimato:** ~8 EUR/mese  
**Tempo stimato setup completo:** 3-4 ore  
**Ultimo aggiornamento:** 2 luglio 2026

---

## Cosa viene deployato

| # | Servizio | Stack | Dominio | Porta interna |
|---|----------|-------|---------|---------------|
| 1 | **108 AI Platform — Gateway** | Node.js + Hono | `api.108vision.it` | 3000 |
| 2 | **108 AI Platform — Dashboard** | React + nginx | `app.108vision.it` | 80 |
| 3 | **108 AI Platform — Client** | React + nginx | `chat.108vision.it` | 80 |
| 4 | **108 AI Platform — Desktop Agent** | Bun compiled binary | `dl.108vision.it` | 80 |
| 5 | **Sito Web 108 Vision** | Astro + TinaCMS | `www.108vision.it` | 4321 |
| 6 | **WellBeing API** | .NET 9 + PostgreSQL | `wellbeing.108vision.it` | 8080 |
| 7 | **Infra: PostgreSQL 16 + pgvector** | Shared, multi-DB | interno | 5432 |
| 8 | **Infra: Redis 7** | Cache condivisa | interno | 6379 |
| 9 | **Infra: Qdrant** | Vector DB | interno | 6333 |
| 10 | **Infra: Neo4j 5 Community** | Graph KB | interno | 7687 |
| 11 | **Infra: LiteLLM** | AI Gateway | `llm.108vision.it` | 4000 |
| 12 | **Infra: Traefik v3** | Reverse proxy + SSL | — | 80/443 |

---

## Indice

1. [Acquisto server e piano](#1-acquisto-server-e-piano)
2. [Setup iniziale del server](#2-setup-iniziale-del-server)
3. [Dominio e DNS](#3-dominio-e-dns)
4. [Infrastruttura Docker Compose](#4-infrastruttura-docker-compose)
5. [Deploy: 108 AI Platform](#5-deploy-108-ai-platform)
6. [Deploy: Sito Web 108vision.it](#6-deploy-sito-web-108visionit)
7. [Deploy: WellBeing API](#7-deploy-wellbeing-api)
8. [Database condiviso — Multi-database setup](#8-database-condiviso--multi-database-setup)
9. [SSL con Traefik e Let's Encrypt](#9-ssl-con-traefik-e-lets-encrypt)
10. [Git Autodeploy con webhook](#10-git-autodeploy-con-webhook)
11. [Backup automatico](#11-backup-automatico)
12. [Monitoring e Health Check](#12-monitoring-e-health-check)
13. [RAM Budget](#13-ram-budget)
14. [Security Hardening](#14-security-hardening)
15. [Troubleshooting](#15-troubleshooting)
16. [Comandi di riferimento rapido](#appendice-a--comandi-di-riferimento-rapido)

---

## 0. Checklist completa — Cosa fare, dove, in che ordine

Prima di iniziare, ecco la mappa di **dove** devi andare per ogni passo:

| # | Cosa | Dove lo fai | Account necessario |
|---|------|-------------|-------------------|
| 1 | Comprare il server | [console.hetzner.com](https://console.hetzner.com) | Account Hetzner (crea se non hai) |
| 2 | Configurare DNS | [admin.aruba.it](https://admin.aruba.it) → Gestione DNS `108vision.it` | Account Aruba (gia hai) |
| 3 | Setup server (SSH, firewall, Docker) | Terminale locale → SSH nel server | Nessuno |
| 4 | Clone repos sul server | Terminale SSH nel server | GitHub deploy key |
| 5 | Creare file .env con secrets | Terminale SSH nel server | API keys: DashScope, DeepSeek |
| 6 | Avviare i container | Terminale SSH nel server | Nessuno |
| 7 | Migrare sito da Vercel | [admin.aruba.it](https://admin.aruba.it) + [vercel.com](https://vercel.com) | Account Aruba + Vercel |
| 8 | Verificare tutto | Browser | Nessuno |

**Tempo totale stimato:** 3-4 ore (la maggior parte e attesa DNS)

---

## 1. Acquisto server Hetzner

### Dove: [console.hetzner.com](https://console.hetzner.com)

1. Vai su console.hetzner.com → crea account se non lo hai
2. **Add Server** → configura cosi:

| Campo | Valore da selezionare |
|---|---|
| Location | **Falkenstein (fsn1)** |
| Image | **Ubuntu 24.04** |
| Type | Shared vCPU → **CX32** (4 vCPU, 8 GB RAM, 80 GB NVMe) |
| Networking | IPv4 + IPv6 (default) |
| SSH Key | Aggiungi la tua (vedi sotto) |
| Backups | Si (opzionale, +20% = ~1.50 EUR/mese) |
| Server name | `108vision-prod` |

3. Clicca **Create & Buy Now**
4. Dopo ~30 secondi il server e pronto — segna l'**IP** dalla pagina

**Costo:** ~7.50 EUR/mese.

### Creare la SSH key (sul tuo PC, prima di comprare il server)

Apri **PowerShell** sul tuo PC Windows:

```powershell
ssh-keygen -t ed25519 -C "108vision-hetzner" -f "$env:USERPROFILE\.ssh\108vision_hetzner"
```

Premi Enter due volte (nessuna passphrase per semplicita).

Poi copia la chiave pubblica:
```powershell
Get-Content "$env:USERPROFILE\.ssh\108vision_hetzner.pub"
```

Incolla questo testo nel campo **SSH Keys** durante la creazione del server su Hetzner.

### Primo accesso (dal tuo PC)

```bash
ssh -i ~/.ssh/108vision_hetzner root@<IP_SERVER>
```

Se chiede "Are you sure you want to continue connecting?" → scrivi `yes`.

### Upgrade futuro

Quando/se servira piu RAM (usage > 6.5 GB costante): Hetzner → Server → Rescale → CX42 (16 GB, ~14 EUR/mese). Zero downtime, 2 click.

---

## 2. Setup iniziale del server

### 2.1 Aggiornamento e pacchetti base

```bash
apt update && apt upgrade -y
apt install -y curl git wget htop unzip ufw fail2ban apache2-utils
```

### 2.2 Utente non-root

```bash
adduser deploy
usermod -aG sudo deploy

mkdir -p /home/deploy/.ssh
cp /root/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

Verifica login da un altro terminale:
```bash
ssh -i ~/.ssh/108vision_hetzner deploy@<IP_SERVER>
```

Poi disabilita root:
```bash
sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
systemctl restart sshd
```

### 2.3 Firewall UFW

```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

### 2.4 Swap (2-4 GB)

```bash
fallocate -l 4G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
echo 'vm.swappiness=10' >> /etc/sysctl.conf
sysctl -p
```

### 2.5 Docker

```bash
curl -fsSL https://get.docker.com | sh
usermod -aG docker deploy
systemctl enable docker
```

Logout e rilogin come `deploy`, poi verifica:
```bash
docker compose version
```

### 2.6 Timezone

```bash
timedatectl set-timezone Europe/Rome
```

---

## 3. Dominio e DNS

### Dove: [admin.aruba.it](https://admin.aruba.it)

1. Login su admin.aruba.it
2. Vai su **Hosting / Domini** → seleziona `108vision.it`
3. Cerca **Gestione DNS** (o "DNS Avanzato")
4. **Elimina** eventuali record A/CNAME preesistenti per `@` e `www` che puntano a Vercel (`76.76.21.21` o `cname.vercel-dns.com`) — li ricreiamo verso Hetzner
5. **Aggiungi** i seguenti record A (uno per uno):

| Nome | Tipo | Valore (il tuo IP Hetzner) | Servizio |
|---|---|---|---|
| `@` | A | `<IP_SERVER>` | Redirect a www |
| `www` | A | `<IP_SERVER>` | Sito web 108 Vision |
| `api` | A | `<IP_SERVER>` | 108 AI Platform — Gateway |
| `app` | A | `<IP_SERVER>` | 108 AI Platform — Dashboard |
| `chat` | A | `<IP_SERVER>` | 108 AI Platform — Client |
| `dl` | A | `<IP_SERVER>` | 108 AI Platform — Downloads |
| `llm` | A | `<IP_SERVER>` | LiteLLM AI Gateway |
| `wellbeing` | A | `<IP_SERVER>` | WellBeing API |
| `traefik` | A | `<IP_SERVER>` | Dashboard Traefik (admin) |

> **Alternativa piu veloce:** un singolo record **wildcard** `*` di tipo A con valore `<IP_SERVER>` copre tutti i sottodomini con un solo record. Su Aruba: Nome = `*`, Tipo = A, Valore = IP.

6. Salva e attendi **15-60 minuti** per la propagazione (i .it possono richiedere fino a 24h nel caso peggiore)

**Verifica dal tuo PC** (dopo 15-30 min):
```bash
nslookup api.108vision.it
nslookup www.108vision.it
nslookup wellbeing.108vision.it
```
Tutti devono restituire l'IP del server Hetzner.

> **IMPORTANTE:** NON toccare i record MX, TXT, DKIM, DMARC che hai gia per Zoho Mail e Brevo — quelli restano invariati. Modifica SOLO i record A/CNAME per hosting web.

---

## 4. Infrastruttura Docker Compose

Da questo punto lavora sempre come utente `deploy`.

### 4.1 Directory di deploy

```bash
sudo mkdir -p /opt/108vision
sudo chown deploy:deploy /opt/108vision
cd /opt/108vision
```

### 4.2 File .env

```bash
cat > /opt/108vision/.env << 'EOF'
# === Database PostgreSQL (condiviso) ===
POSTGRES_USER=admin108
POSTGRES_PASSWORD=<GENERA: openssl rand -base64 32>

# === Redis ===
REDIS_PASSWORD=<GENERA: openssl rand -base64 32>

# === Qdrant ===
QDRANT_API_KEY=<GENERA: openssl rand -base64 32>

# === Neo4j ===
NEO4J_PASSWORD=<GENERA: openssl rand -base64 32>

# === LiteLLM ===
LITELLM_MASTER_KEY=sk-108ai-<GENERA: openssl rand -base64 24>

# === 108 AI Platform ===
AIA_JWT_SECRET=<GENERA: openssl rand -base64 48>
AIA_AUTH_SECRET=<GENERA: openssl rand -base64 64>
AIA_DOMAIN=108vision.it

# === WellBeing API ===
WB_DB_PASSWORD=<GENERA: openssl rand -base64 32>
WB_JWT_KEY=<GENERA: openssl rand -base64 48>
WB_DOMAIN=wellbeing.108vision.it
WB_GOOGLE_CLIENT_ID=25086642155-dc094bf2782sfvkrs7a67mbenu0q7r32.apps.googleusercontent.com
WB_GOOGLE_CLIENT_SECRET=<TUA_SECRET>
WB_FACEBOOK_APP_ID=2192930794868128
WB_FACEBOOK_APP_SECRET=<TUA_SECRET>
WB_ADMIN_APIKEY=<GENERA: openssl rand -base64 32>
WB_DASHSCOPE_API_KEY=<TUA_KEY_DASHSCOPE>
WB_QWEN3TTS_API_KEY=<TUA_KEY_DASHSCOPE>

# === Sito 108vision.it ===
SITE_DOMAIN=www.108vision.it
TINA_PUBLIC_CLIENT_ID=<TUA_TINA_CLIENT_ID>
TINA_TOKEN=<TUA_TINA_TOKEN>

# === AI Provider Keys (LiteLLM) ===
DEEPSEEK_API_KEY=<TUA_KEY>
DASHSCOPE_API_KEY=<TUA_KEY>

# === Traefik ===
ACME_EMAIL=admin@108vision.it
TRAEFIK_DASHBOARD_AUTH=<GENERA: htpasswd -nb admin tuapassword | sed 's/\$/\$\$/g'>
EOF

chmod 600 /opt/108vision/.env
```

### 4.3 docker-compose.yml — Infrastruttura

```bash
cat > /opt/108vision/docker-compose.yml << 'EOF'
version: "3.9"

networks:
  internal:
    driver: bridge

services:
  # === REVERSE PROXY ===
  traefik:
    image: traefik:v3.1
    container_name: traefik
    restart: unless-stopped
    command:
      - "--api.dashboard=true"
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--entrypoints.web.http.redirections.entrypoint.to=websecure"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web"
      - "--certificatesresolvers.letsencrypt.acme.email=${ACME_EMAIL}"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - traefik-certs:/letsencrypt
    networks:
      - internal
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.traefik-dashboard.rule=Host(`traefik.${AIA_DOMAIN}`)"
      - "traefik.http.routers.traefik-dashboard.entrypoints=websecure"
      - "traefik.http.routers.traefik-dashboard.tls.certresolver=letsencrypt"
      - "traefik.http.routers.traefik-dashboard.service=api@internal"
      - "traefik.http.routers.traefik-dashboard.middlewares=traefik-auth"
      - "traefik.http.middlewares.traefik-auth.basicauth.users=${TRAEFIK_DASHBOARD_AUTH}"

  # === DATABASES ===
  postgres:
    image: pgvector/pgvector:pg16
    container_name: postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: aia_platform
    volumes:
      - pg_data:/var/lib/postgresql/data
      - ./init-databases.sql:/docker-entrypoint-initdb.d/init.sql:ro
    networks:
      - internal
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits:
          memory: 1G

  redis:
    image: redis:7-alpine
    container_name: redis
    restart: unless-stopped
    command: redis-server --requirepass ${REDIS_PASSWORD} --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    networks:
      - internal
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits:
          memory: 300M

  qdrant:
    image: qdrant/qdrant:latest
    container_name: qdrant
    restart: unless-stopped
    environment:
      QDRANT__SERVICE__API_KEY: ${QDRANT_API_KEY}
    volumes:
      - qdrant_data:/qdrant/storage
    networks:
      - internal
    deploy:
      resources:
        limits:
          memory: 256M

  neo4j:
    image: neo4j:5-community
    container_name: neo4j
    restart: unless-stopped
    environment:
      NEO4J_AUTH: neo4j/${NEO4J_PASSWORD}
      NEO4J_PLUGINS: '["apoc"]'
      NEO4J_server_memory_heap_initial__size: 128m
      NEO4J_server_memory_heap_max__size: 256m
      NEO4J_server_memory_pagecache_size: 128m
    volumes:
      - neo4j_data:/data
    networks:
      - internal
    deploy:
      resources:
        limits:
          memory: 450M

  # === AI GATEWAY ===
  litellm:
    image: ghcr.io/berriai/litellm:main-latest
    container_name: litellm
    restart: unless-stopped
    environment:
      LITELLM_MASTER_KEY: ${LITELLM_MASTER_KEY}
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/litellm
      DEEPSEEK_API_KEY: ${DEEPSEEK_API_KEY}
      DASHSCOPE_API_KEY: ${DASHSCOPE_API_KEY}
    volumes:
      - ./litellm-config.yaml:/app/config.yaml:ro
    command: ["--config", "/app/config.yaml", "--port", "4000"]
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - internal
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.litellm.rule=Host(`llm.${AIA_DOMAIN}`)"
      - "traefik.http.routers.litellm.entrypoints=websecure"
      - "traefik.http.routers.litellm.tls.certresolver=letsencrypt"
      - "traefik.http.services.litellm.loadbalancer.server.port=4000"
    deploy:
      resources:
        limits:
          memory: 400M

volumes:
  traefik-certs:
  pg_data:
  redis_data:
  qdrant_data:
  neo4j_data:
EOF
```

### 4.4 Script inizializzazione multi-database

```bash
cat > /opt/108vision/init-databases.sql << 'EOF'
-- Crea database e utenti aggiuntivi (il DB principale aia_platform viene creato da POSTGRES_DB)
CREATE DATABASE litellm;
CREATE DATABASE wellbeing;

-- Estensioni
\c aia_platform
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c wellbeing
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
EOF
```

### 4.5 LiteLLM config

```bash
cat > /opt/108vision/litellm-config.yaml << 'EOF'
model_list:
  - model_name: fast-cheap
    litellm_params:
      model: deepseek/deepseek-chat
      api_key: os.environ/DEEPSEEK_API_KEY
  - model_name: balanced
    litellm_params:
      model: deepseek/deepseek-reasoner
      api_key: os.environ/DEEPSEEK_API_KEY
  - model_name: powerful
    litellm_params:
      model: dashscope/qwen-max
      api_key: os.environ/DASHSCOPE_API_KEY
  - model_name: embedding
    litellm_params:
      model: dashscope/text-embedding-v3
      api_key: os.environ/DASHSCOPE_API_KEY

general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
  database_url: os.environ/DATABASE_URL
EOF
```

---

## 5. Deploy: 108 AI Platform

### 5.1 docker-compose.apps.yml — Applicazioni AIA

```bash
cat > /opt/108vision/docker-compose.apps.yml << 'EOF'
version: "3.9"

services:
  aia-gateway:
    build:
      context: ./repos/aia-platform
      dockerfile: apps/gateway/Dockerfile
    container_name: aia-gateway
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 3000
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/aia_platform
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
      QDRANT_URL: http://qdrant:6333
      QDRANT_API_KEY: ${QDRANT_API_KEY}
      NEO4J_URI: bolt://neo4j:7687
      NEO4J_USER: neo4j
      NEO4J_PASSWORD: ${NEO4J_PASSWORD}
      LITELLM_URL: http://litellm:4000
      LITELLM_API_KEY: ${LITELLM_MASTER_KEY}
      BETTER_AUTH_SECRET: ${AIA_AUTH_SECRET}
      BETTER_AUTH_URL: https://api.${AIA_DOMAIN}
      JWT_SECRET: ${AIA_JWT_SECRET}
      CORS_ALLOWED_ORIGINS: https://${AIA_DOMAIN},https://app.${AIA_DOMAIN},https://chat.${AIA_DOMAIN}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - internal
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.aia-gateway.rule=Host(`api.${AIA_DOMAIN}`)"
      - "traefik.http.routers.aia-gateway.entrypoints=websecure"
      - "traefik.http.routers.aia-gateway.tls.certresolver=letsencrypt"
      - "traefik.http.services.aia-gateway.loadbalancer.server.port=3000"
    healthcheck:
      test: ["CMD", "node", "-e", "fetch('http://localhost:3000/health/live').then(r=>r.ok?process.exit(0):process.exit(1)).catch(()=>process.exit(1))"]
      interval: 30s
      timeout: 5s
      start_period: 15s
      retries: 3
    deploy:
      resources:
        limits:
          memory: 384M

  aia-dashboard:
    build:
      context: ./repos/aia-platform/apps/dashboard
      dockerfile: Dockerfile
    container_name: aia-dashboard
    restart: unless-stopped
    depends_on:
      - aia-gateway
    networks:
      - internal
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.aia-dashboard.rule=Host(`app.${AIA_DOMAIN}`)"
      - "traefik.http.routers.aia-dashboard.entrypoints=websecure"
      - "traefik.http.routers.aia-dashboard.tls.certresolver=letsencrypt"
      - "traefik.http.services.aia-dashboard.loadbalancer.server.port=80"
    deploy:
      resources:
        limits:
          memory: 64M

  aia-client:
    build:
      context: ./repos/aia-platform/apps/client
      dockerfile: Dockerfile
    container_name: aia-client
    restart: unless-stopped
    depends_on:
      - aia-gateway
    networks:
      - internal
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.aia-client.rule=Host(`chat.${AIA_DOMAIN}`)"
      - "traefik.http.routers.aia-client.entrypoints=websecure"
      - "traefik.http.routers.aia-client.tls.certresolver=letsencrypt"
      - "traefik.http.services.aia-client.loadbalancer.server.port=80"
    deploy:
      resources:
        limits:
          memory: 64M

  aia-downloads:
    image: nginx:1.27-alpine
    container_name: aia-downloads
    restart: unless-stopped
    volumes:
      - /opt/108vision/public/downloads:/usr/share/nginx/html:ro
    networks:
      - internal
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.aia-downloads.rule=Host(`dl.${AIA_DOMAIN}`)"
      - "traefik.http.routers.aia-downloads.entrypoints=websecure"
      - "traefik.http.routers.aia-downloads.tls.certresolver=letsencrypt"
      - "traefik.http.services.aia-downloads.loadbalancer.server.port=80"
    deploy:
      resources:
        limits:
          memory: 32M
EOF
```

### 5.2 Clone repository AIA Platform

```bash
mkdir -p /opt/108vision/repos
cd /opt/108vision/repos
git clone git@github.com:EliosScoglio/aia-platform.git
```

### 5.3 Directory per Desktop Agent downloads

```bash
mkdir -p /opt/108vision/public/downloads
```

---

## 6. Deploy: Sito Web 108vision.it

Il sito e attualmente su **Vercel** (free tier). Questa sezione copre sia il deploy su Hetzner che la procedura di migrazione da Vercel.

### 6.1 docker-compose.website.yml

```bash
cat > /opt/108vision/docker-compose.website.yml << 'EOF'
version: "3.9"

services:
  website:
    build:
      context: ./repos/aia-website
      dockerfile: Dockerfile
    container_name: website-108vision
    restart: unless-stopped
    environment:
      NODE_ENV: production
      TINA_PUBLIC_CLIENT_ID: ${TINA_PUBLIC_CLIENT_ID}
      TINA_TOKEN: ${TINA_TOKEN}
    networks:
      - internal
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.website.rule=Host(`${SITE_DOMAIN}`) || Host(`108vision.it`)"
      - "traefik.http.routers.website.entrypoints=websecure"
      - "traefik.http.routers.website.tls.certresolver=letsencrypt"
      - "traefik.http.services.website.loadbalancer.server.port=4321"
      # Redirect naked → www
      - "traefik.http.middlewares.www-redirect.redirectregex.regex=^https://108vision\\.it/(.*)"
      - "traefik.http.middlewares.www-redirect.redirectregex.replacement=https://www.108vision.it/$${1}"
      - "traefik.http.routers.website.middlewares=www-redirect"
    healthcheck:
      test: ["CMD", "node", "-e", "fetch('http://localhost:4321').then(r=>r.ok?process.exit(0):process.exit(1)).catch(()=>process.exit(1))"]
      interval: 30s
      timeout: 5s
      start_period: 20s
      retries: 3
    deploy:
      resources:
        limits:
          memory: 256M
EOF
```

### 6.2 Dockerfile per Astro + TinaCMS

Crea `repos/aia-website/Dockerfile`:

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# TinaCMS genera i file statici del CMS, poi Astro builda il sito
RUN npx tinacms build && npx astro build

FROM node:20-alpine AS runtime
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
ENV HOST=0.0.0.0
ENV PORT=4321
EXPOSE 4321
CMD ["node", "./dist/server/entry.mjs"]
```

### 6.3 Clone repository

```bash
cd /opt/108vision/repos
git clone git@github.com:EliosScoglio/108vision.git aia-website
```

### 6.4 Avvio

```bash
cd /opt/108vision
docker compose -f docker-compose.yml -f docker-compose.website.yml up -d --build website
```

Verifica:
```bash
curl -s -o /dev/null -w "%{http_code}" https://www.108vision.it
# Atteso: 200
```

### 6.5 Migrazione da Vercel a Hetzner — Procedura step-by-step

La migrazione deve essere fatta con **zero downtime** per il visitatore. La strategia e:
1. Deployare il sito su Hetzner (senza cambiare DNS)
2. Verificare che funzioni tramite IP diretto
3. Switchare il DNS da Vercel a Hetzner
4. Disattivare il progetto su Vercel

**Step 1: Deploy su Hetzner (senza toccare DNS)**

```bash
# Il sito e gia in docker-compose.website.yml
cd /opt/108vision
docker compose -f docker-compose.yml -f docker-compose.website.yml up -d --build website

# Verifica che il container sia healthy
docker ps --filter name=website-108vision
```

**Step 2: Test tramite IP diretto e header Host**

Siccome il DNS punta ancora a Vercel, testa con curl forzando l'Host header:

```bash
# Dal tuo PC locale (non dal server)
curl -H "Host: www.108vision.it" --resolve "www.108vision.it:443:<IP_SERVER>" \
  https://www.108vision.it -v -k

# Oppure aggiungi temporaneamente al tuo file hosts locale:
# Windows: C:\Windows\System32\drivers\etc\hosts
# Mac/Linux: /etc/hosts
# <IP_SERVER>  www.108vision.it  108vision.it
```

Naviga il sito dal browser con la modifica hosts — verifica:
- [ ] Homepage carica correttamente
- [ ] Pagine interne funzionano (es. `/risorse`)
- [ ] CSS/JS/immagini si caricano
- [ ] Form lead magnet funziona (se chiama API esterne come Brevo)
- [ ] PDF downloadabili

**Step 3: Switch DNS (Aruba)**

Quando il sito su Hetzner funziona perfettamente:

1. Vai su Aruba → Gestione DNS → `108vision.it`
2. **Elimina** i record attuali che puntano a Vercel:
   - Elimina il record A `@` → `76.76.21.21`
   - Elimina il record CNAME `www` → `cname.vercel-dns.com`
3. **Crea** i nuovi record che puntano a Hetzner:

| Tipo | Host | Valore |
|---|---|---|
| A | `@` | `<IP_SERVER>` |
| A | `www` | `<IP_SERVER>` |

4. Attendi propagazione DNS (15-60 minuti, max 24h per i .it)

**Step 4: Verifica post-migrazione**

```bash
# Verifica che il DNS punti al nuovo server
dig +short www.108vision.it
dig +short 108vision.it
# Entrambi devono restituire <IP_SERVER>

# Verifica SSL (Traefik emette il certificato Let's Encrypt al primo accesso)
curl -vI https://www.108vision.it 2>&1 | grep "issuer"
# Atteso: Let's Encrypt (non Vercel)

# Verifica redirect naked → www
curl -I http://108vision.it
# Atteso: 301/308 → https://www.108vision.it
```

**Step 5: Disattiva Vercel**

1. Vai su Vercel → Project Settings → Domains
2. Rimuovi `108vision.it` e `www.108vision.it` dai domini custom
3. (Opzionale) Elimina il progetto su Vercel o lascialo come backup

**Step 6: Rimuovi file hosts locale**

Se hai modificato `/etc/hosts` o `C:\Windows\System32\drivers\etc\hosts` al punto 2, rimuovi la riga aggiunta.

### 6.6 Rollback a Vercel (se qualcosa va storto)

Se dopo la migrazione qualcosa non funziona:

1. Su Aruba → ripristina i record DNS di Vercel:
   - A `@` → `76.76.21.21`
   - CNAME `www` → `cname.vercel-dns.com`
2. Su Vercel → ri-aggiungi i domini custom al progetto
3. Attendi propagazione (15-60 min)

Il sito torna su Vercel. Debug il problema su Hetzner con calma.

### 6.7 Brevo (email marketing) — aggiornamento post-migrazione

Brevo continua a funzionare senza modifiche — i record DNS per email (MX, SPF, DKIM, DMARC) restano invariati perche riguardano la ricezione/invio email, non l'hosting web.

L'unica cosa da verificare: se il form del sito chiama un endpoint API serverless su Vercel (es. `/api/subscribe`), devi spostare quella logica nel container website o nel gateway AIA. Verifica in `aia-website/src/pages/api/` se ci sono route serverless.

---

## 7. Deploy: WellBeing API

### 7.1 Architettura

```
Client MAUI App (Android/iOS/Windows)
  → HTTPS → Traefik → WellBeing API (.NET 9, porta 8080)
                          ├── PostgreSQL (shared, DB "wellbeing")
                          ├── Qwen DashScope (AI text generation)
                          ├── Qwen3 TTS (AI speech synthesis via WebSocket)
                          └── App_Data/package-media (audio files, volume mount)
```

### 7.2 docker-compose.wellbeing.yml

```bash
cat > /opt/108vision/docker-compose.wellbeing.yml << 'EOF'
version: "3.9"

services:
  wellbeing-api:
    build:
      context: ./repos/wellbeing-app
      dockerfile: WellBeingApi/Dockerfile
    container_name: wellbeing-api
    restart: unless-stopped
    environment:
      ASPNETCORE_ENVIRONMENT: Production
      ASPNETCORE_URLS: http://+:8080
      ConnectionStrings__Postgres: "Host=postgres;Port=5432;Database=wellbeing;Username=${POSTGRES_USER};Password=${POSTGRES_PASSWORD}"
      UserDataStorage__Provider: Postgres
      Jwt__Key: ${WB_JWT_KEY}
      Jwt__Issuer: https://${WB_DOMAIN}
      Jwt__Audience: WellBeingApp
      Jwt__ExpirationMinutes: 1440
      Google__ClientId: ${WB_GOOGLE_CLIENT_ID}
      Google__ClientSecret: ${WB_GOOGLE_CLIENT_SECRET}
      Facebook__AppId: ${WB_FACEBOOK_APP_ID}
      Facebook__AppSecret: ${WB_FACEBOOK_APP_SECRET}
      Admin__ApiKey: ${WB_ADMIN_APIKEY}
      QwenDashScopeTextGenerator__ApiKey: ${WB_DASHSCOPE_API_KEY}
      QwenDashScopeTextGenerator__Model: qwen3.6-flash
      QwenDashScopeTextGenerator__Endpoint: https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions
      QwenDashScopeTextGenerator__Stream: "true"
      QwenDashScopeTextGenerator__Temperature: "0.7"
      QwenDashScopeTextGenerator__MaxOutputTokens: "12192"
      QwenDashScopeTextGenerator__SystemPromptPath: Assets/QwenCounselorSystemPrompt2.md
      Qwen3Tts__ApiKey: ${WB_QWEN3TTS_API_KEY}
      Qwen3Tts__EndpointBase: wss://dashscope-intl.aliyuncs.com/api-ws/v1/realtime
      Qwen3Tts__Model: qwen3-tts-vd-realtime-2026-01-15
      Qwen3Tts__Format: wav
      Qwen3Tts__SampleRate: "24000"
      Qwen3Tts__Rate: "0.9"
      AiProviders__TextGenerator: qwen
      AiProviders__SpeechSynthesis: qwen3tts
      AudioEffects__Enabled: "true"
      AudioEffects__Provider: NWaves
      Catalog__Provider: Database
      Catalog__SeedOnStartupIfEmpty: "true"
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - internal
    volumes:
      - wb_media:/app/App_Data/package-media
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.wellbeing.rule=Host(`${WB_DOMAIN}`)"
      - "traefik.http.routers.wellbeing.entrypoints=websecure"
      - "traefik.http.routers.wellbeing.tls.certresolver=letsencrypt"
      - "traefik.http.services.wellbeing.loadbalancer.server.port=8080"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health/live"]
      interval: 30s
      timeout: 10s
      start_period: 45s
      retries: 3
    deploy:
      resources:
        limits:
          memory: 384M

volumes:
  wb_media:
EOF
```

### 7.3 Clone repository WellBeing

```bash
cd /opt/108vision/repos
git clone git@github.com:EliosScoglio/WellBeingApp.git wellbeing-app
```

### 7.4 Caricare i file audio premium

I file MP3 in `App_Data/package-media/` non vanno nell'immagine Docker (troppo grandi). Montali come volume:

```bash
# Copia i file audio dal tuo PC al server
scp -r -i ~/.ssh/108vision_hetzner \
  "c:/CodeM/Personal/WellBeingApp/WellBeingApi/App_Data/package-media/" \
  deploy@<IP_SERVER>:/opt/108vision/wellbeing-media/

# Il volume wb_media nel compose punta a questa directory
# Modifica il volume bind nel compose se preferisci:
# volumes:
#   - /opt/108vision/wellbeing-media:/app/App_Data/package-media:ro
```

### 7.5 Variabili ambiente specifiche da configurare

Le voci di `Qwen3Tts__VoiceIds__*` sono molte. Puoi passarle come environment variables nel compose oppure montare un `appsettings.Production.json`:

```bash
cat > /opt/108vision/repos/wellbeing-app/WellBeingApi/appsettings.Production.json << 'EOF'
{
  "Logging": {
    "LogLevel": {
      "Default": "Warning",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "Qwen3Tts": {
    "VoiceIds": {
      "it": {
        "male": "qwen-tts-vc-wb_clone_it-voice-20260425172605918-d275",
        "female": "qwen-tts-vd-wb_female_it-voice-20260425015149267-f865"
      },
      "en": {
        "male": "qwen-tts-vd-wb_m_en-voice-20260425173320073-58ff",
        "female": "qwen-tts-vc-wb_clone_en_fe-voice-20260425172858464-34b4"
      },
      "es": {
        "male": "qwen-tts-vd-wb_m_es-voice-20260425173355572-2332",
        "female": "qwen-tts-vc-wb_clone_es_fe-voice-20260425172809935-970a"
      }
    },
    "FallbackVoices": {
      "it": { "female": "Serena", "male": "Kai" },
      "en": { "female": "Seren", "male": "Kai" },
      "es": { "female": "Serena", "male": "Kai" },
      "fallback": { "female": "Serena", "male": "Kai" }
    }
  },
  "AiCounselor": {
    "DefaultTextDurationSeconds": 300,
    "TextGenerationMaxRetries": 3,
    "WordsPerMinuteSlow": 70,
    "SilencePaddingLeadSeconds": 5,
    "SilencePaddingTailSeconds": 5,
    "OutputVolumeLinearGain": 1.45
  }
}
EOF
```

---

## 8. Database condiviso — Multi-database setup

Una sola istanza PostgreSQL serve tutti i servizi. Il file `init-databases.sql` (sezione 4.4) crea i database al primo avvio.

| Database | Utente | Usato da |
|---|---|---|
| `aia_platform` | `admin108` | 108 AI Gateway |
| `litellm` | `admin108` | LiteLLM |
| `wellbeing` | `admin108` | WellBeing API |

> Per isolamento maggiore puoi creare utenti dedicati modificando `init-databases.sql`:
> ```sql
> CREATE USER aia_user WITH PASSWORD '<pw>';
> CREATE USER wb_user WITH PASSWORD '<pw>';
> GRANT ALL ON DATABASE aia_platform TO aia_user;
> GRANT ALL ON DATABASE wellbeing TO wb_user;
> ```

---

## 9. SSL con Traefik e Let's Encrypt

Traefik gestisce SSL automaticamente per tutti i servizi via HTTP Challenge.

### Prerequisiti

1. Tutti i record DNS devono risolvere verso `<IP_SERVER>` PRIMA di avviare Traefik
2. Le porte 80 e 443 devono essere aperte (UFW gia configurato)

### Verifica

```bash
# Dopo 30-60 secondi dall'avvio
curl -v https://api.108vision.it/health/live 2>&1 | grep "SSL certificate"
curl -v https://${WB_DOMAIN}/health/live 2>&1 | grep "SSL certificate"
```

### Rate Limit Let's Encrypt

- Max 5 certificati per dominio registrato per 7 giorni
- Usa staging durante i test: aggiungi `--certificatesresolvers.letsencrypt.acme.caserver=https://acme-staging-v02.api.letsencrypt.org/directory` al command di traefik

---

## 10. Git Autodeploy con webhook

### 10.1 Deploy script unificato

```bash
cat > /opt/108vision/deploy.sh << 'EOF'
#!/bin/bash
set -e

DEPLOY_DIR="/opt/108vision"
LOG_FILE="/var/log/108vision-deploy.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

log() { echo "[$TIMESTAMP] $1" | tee -a "$LOG_FILE"; }

log "=== Deploy started ==="
cd "$DEPLOY_DIR"

# Pull repos
log "Pulling aia-platform..."
cd repos/aia-platform && git pull origin main && cd "$DEPLOY_DIR"

log "Pulling wellbeing-app..."
cd repos/wellbeing-app && git pull origin main && cd "$DEPLOY_DIR"

# Rebuild
log "Rebuilding containers..."
docker compose -f docker-compose.yml \
  -f docker-compose.apps.yml \
  -f docker-compose.wellbeing.yml \
  up -d --build 2>&1 | tee -a "$LOG_FILE"

# Health check
log "Waiting for health checks..."
sleep 20

UNHEALTHY=$(docker ps --filter "health=unhealthy" --format "{{.Names}}" 2>/dev/null)
if [ -n "$UNHEALTHY" ]; then
    log "ERROR: Unhealthy containers: $UNHEALTHY"
    exit 1
fi

docker image prune -f >> "$LOG_FILE" 2>&1
log "=== Deploy completed ==="
EOF

chmod +x /opt/108vision/deploy.sh
sudo touch /var/log/108vision-deploy.log
sudo chown deploy:deploy /var/log/108vision-deploy.log
```

### 10.2 Webhook server

Installa e configura come descritto nel manuale originale (`tracks/software-in-mano/prodotti/aia-platform/platform-docs/manuale-deploy-hetzner.md`, sezione 9).

---

## 11. Backup automatico

### 11.1 Script backup tutti i database

```bash
cat > /opt/108vision/backup.sh << 'EOF'
#!/bin/bash
set -e

BACKUP_DIR="/opt/backups"
DATE=$(date '+%Y-%m-%d_%H-%M')
RETENTION_DAYS=30

mkdir -p "$BACKUP_DIR/postgres" "$BACKUP_DIR/volumes"

source /opt/108vision/.env

# Dump di tutti i database
for DB in aia_platform wellbeing litellm; do
    docker exec postgres pg_dump -U "$POSTGRES_USER" -d "$DB" --clean --if-exists --no-owner \
      | gzip > "$BACKUP_DIR/postgres/${DB}_${DATE}.sql.gz"
    echo "[$(date)] Backup $DB: $(du -sh "$BACKUP_DIR/postgres/${DB}_${DATE}.sql.gz" | cut -f1)"
done

# Backup volumi Qdrant e Neo4j (settimanale — controlla il giorno)
if [ "$(date +%u)" = "7" ]; then
    for VOLUME in 108vision_qdrant_data 108vision_neo4j_data; do
        docker run --rm -v "$VOLUME":/data:ro -v "$BACKUP_DIR/volumes":/backup \
            alpine tar czf "/backup/${VOLUME}_${DATE}.tar.gz" -C /data .
    done
fi

# Pulizia vecchi backup
find "$BACKUP_DIR" -name "*.gz" -mtime "+$RETENTION_DAYS" -delete
echo "[$(date)] Backup completato"
EOF

chmod +x /opt/108vision/backup.sh
```

### 11.2 Cron

```bash
crontab -e
# Aggiungi:
0 3 * * * /opt/108vision/backup.sh >> /var/log/108vision-backup.log 2>&1
```

---

## 12. Monitoring e Health Check

### 12.1 Script health check completo

```bash
cat > /opt/108vision/health-check.sh << 'EOF'
#!/bin/bash
echo "=== 108 Vision Health Check — $(date) ==="

echo ""
echo "--- Container Status ---"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Size}}" | sort

echo ""
echo "--- Endpoints ---"
for URL in \
  "https://api.108vision.it/health/live" \
  "https://app.108vision.it" \
  "https://chat.108vision.it" \
  "https://wellbeing.108vision.it/health/live" \
  "https://www.108vision.it"; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$URL" 2>/dev/null || echo "FAIL")
    echo "  $STATUS  $URL"
done

echo ""
echo "--- Resources ---"
free -h | grep -E "Mem|Swap"
df -h / | tail -1 | awk '{print "Disk: " $3 " / " $2 " (" $5 ")"}'

echo ""
echo "--- Top RAM consumers ---"
docker stats --no-stream --format "table {{.Name}}\t{{.MemUsage}}\t{{.MemPerc}}" | sort -k3 -rh | head -10

echo ""
echo "=== Done ==="
EOF

chmod +x /opt/108vision/health-check.sh
```

---

## 13. RAM Budget

### CX32 — 8 GB RAM + 4 GB swap

| Componente | RAM stimata | Note |
|---|---|---|
| OS + Docker daemon | ~700 MB | Kernel, systemd, SSH |
| Traefik v3 | ~50 MB | Reverse proxy |
| PostgreSQL 16 (3 DB) | ~500 MB | shared_buffers=128MB |
| Redis 7 | ~80 MB | maxmemory=128mb |
| Qdrant | ~256 MB | Hard limit 256M |
| Neo4j 5 | ~450 MB | Heap 256m + pagecache 128m |
| LiteLLM | ~400 MB | Hard limit 400M |
| AIA Gateway (Node.js) | ~250 MB | Hard limit 384M |
| AIA Dashboard (nginx) | ~20 MB | File statici |
| AIA Client (nginx) | ~20 MB | File statici |
| AIA Downloads (nginx) | ~10 MB | File statici |
| **WellBeing API (.NET 9)** | ~350 MB | Hard limit 400M |
| Website (Astro/Node) | ~100 MB | Self-hosted |
| **Subtotale** | ~3.2 GB | Carico normale |
| **Buffer disponibile** | ~4.8 GB | Picchi, GC |
| **Swap** | 4 GB | Safety net per picchi |

**Conclusione:** 8 GB + 4 GB swap regge tutto con margine sufficiente per uso moderato. Neo4j funziona con heap ridotto a 256m — adeguato per un knowledge graph piccolo/medio (< 100k nodi).

### Quando fare upgrade

Upgrade al CX42 (16 GB, ~14 EUR/mese) quando: RAM used > 6.5 GB in condizioni normali (non picco). Su Hetzner il rescale e 2 click, zero downtime.

---

## 14. Security Hardening

### 14.1 Fail2ban

```bash
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime  = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
maxretry = 3
bantime  = 86400
EOF

sudo systemctl restart fail2ban
sudo systemctl enable fail2ban
```

### 14.2 Aggiornamenti automatici di sicurezza

```bash
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

### 14.3 SSH solo con chiave

```bash
# Verifica che sia gia cosi (fatto al punto 2.2), altrimenti:
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo systemctl restart sshd
```

### 14.4 Porte database non esposte

Nessuna porta database e esposta nel compose (no `ports:` su postgres, redis, qdrant, neo4j). Sono raggiungibili solo dalla rete Docker interna.

### 14.5 File .env protetto

```bash
chmod 600 /opt/108vision/.env
```

---

## 15. Troubleshooting

| Problema | Causa probabile | Soluzione |
|----------|----------------|-----------|
| Container OOM killed | RAM insufficiente | `docker logs <name>`, riduci limits o upgrade VPS |
| SSL non funziona | DNS non propagato | `dig +short api.108vision.it`, attendi |
| 502 Bad Gateway | Container non avviato | `docker compose logs <service>` |
| WellBeing API crash | JWT key < 16 chars | Verifica `WB_JWT_KEY` (min 32 chars) |
| LiteLLM non parte | DB connection string | Verifica che postgres sia healthy |
| Neo4j "heap too small" | RAM pressure | Riduci heap a 256m |
| Qwen TTS timeout | WebSocket blocked | Verifica che outbound 443 sia aperto |
| Website non builda | TinaCMS token scaduto | Rigenera `TINA_TOKEN` |

---

## Appendice A — Comandi di riferimento rapido

```bash
# === AVVIO COMPLETO ===
cd /opt/108vision
docker compose -f docker-compose.yml \
  -f docker-compose.apps.yml \
  -f docker-compose.wellbeing.yml \
  up -d

# === STOP COMPLETO (senza perdere dati) ===
docker compose -f docker-compose.yml \
  -f docker-compose.apps.yml \
  -f docker-compose.wellbeing.yml \
  stop

# === REBUILD SINGOLO SERVIZIO ===
docker compose -f docker-compose.yml -f docker-compose.wellbeing.yml up -d --build wellbeing-api

# === LOGS ===
docker compose -f docker-compose.yml -f docker-compose.apps.yml -f docker-compose.wellbeing.yml logs -f
docker logs --tail 100 -f wellbeing-api
docker logs --tail 100 -f aia-gateway

# === DATABASE ===
docker exec -it postgres psql -U admin108 -d aia_platform
docker exec -it postgres psql -U admin108 -d wellbeing

# === HEALTH ===
/opt/108vision/health-check.sh

# === DEPLOY MANUALE ===
/opt/108vision/deploy.sh

# === BACKUP MANUALE ===
/opt/108vision/backup.sh

# === SPAZIO DISCO ===
docker system df
df -h
```

---

## Appendice B — Struttura directory sul server

```
/opt/108vision/
├── docker-compose.yml              ← Infra (DB, cache, AI, proxy)
├── docker-compose.apps.yml         ← App 108 AI (gateway, dashboard, client, downloads)
├── docker-compose.wellbeing.yml    ← WellBeing API
├── docker-compose.website.yml      ← Sito 108vision.it (opzione B)
├── .env                            ← SEGRETO (chmod 600)
├── init-databases.sql              ← Script init multi-DB
├── litellm-config.yaml             ← Config AI Gateway
├── deploy.sh                       ← Deploy automatico
├── backup.sh                       ← Backup script
├── health-check.sh                 ← Health check
├── public/
│   └── downloads/                  ← Binari Desktop Agent
├── wellbeing-media/                ← Audio files WellBeing (volume mount)
└── repos/
    ├── aia-platform/               ← Git clone AIA Platform
    ├── aia-website/                ← Git clone sito (opzione B)
    └── wellbeing-app/              ← Git clone WellBeing

/opt/backups/
├── postgres/                       ← Dump giornalieri
└── volumes/                        ← Backup volumi settimanali

/var/log/
├── 108vision-deploy.log
└── 108vision-backup.log
```

---

## Appendice C — Sequenza di primo avvio

```bash
# 1. Setup server (sezione 2) — 20 min
# 2. Configura DNS (sezione 3) — 5 min + attesa propagazione
# 3. Crea directory e file compose (sezione 4) — 15 min
# 4. Genera tutte le password nel .env — 10 min
# 5. Avvia infrastruttura:
docker compose up -d

# 6. Verifica che i DB siano healthy:
docker compose ps

# 7. Clone repos e avvia app:
docker compose -f docker-compose.yml -f docker-compose.apps.yml up -d --build

# 8. Avvia WellBeing:
docker compose -f docker-compose.yml -f docker-compose.wellbeing.yml up -d --build

# 9. Verifica endpoints:
/opt/108vision/health-check.sh

# 10. Configura backup e monitoring
```

---

*108 Vision — Costruiamo la direzione, non solo il codice.*
