# Manuale: VPS Economica + Coolify — Setup Completo

## Obiettivo

Installare e configurare una VPS economica con **Coolify** come piattaforma di deployment self-hosted per:

1. **AIA Platform** (108 Vision) — Hono API + React Dashboard + PostgreSQL (Neon) + Redis + Neo4j + LiteLLM — RAG su pgvector
2. **AIA Website** — Astro statico — servito dalla VPS (§5)
3. **WellBeingApp API** — .NET 9 API + PostgreSQL (Neon) + AI services (Qwen TTS/Text)

---

## 1. Scelta VPS

### Provider consigliati (rapporto prezzo/performance)

| Provider | Piano | vCPU | RAM | Disco | Prezzo/mese | Note |
|----------|-------|------|-----|-------|-------------|------|
| **Hetzner** (consigliato) | **CX23** | 2 | 4 GB | 40 GB NVMe | ~6.70 EUR | Con Postgres su **Neon** (free tier) — scelta attuale |
| **Hetzner** | CX32 | 4 | 8 GB | 80 GB NVMe | ~7-8 EUR | Se si vuole anche Postgres locale |
| **Hetzner** | CX42 | 4 | 16 GB | 160 GB NVMe | ~14 EUR | Carico completo senza Neon |
| **Netcup** | VPS 2000 G11 | 6 | 8 GB | 256 GB | ~9 EUR | Buon rapporto storage/prezzo |

### Requisiti minimi per il carico completo

| Risorsa | Minimo | Consigliato |
|---------|--------|-------------|
| vCPU | 2 | 4 |
| RAM | 4 GB (con Neon) | 8 GB |
| Disco | 40 GB NVMe | 80 GB NVMe |
| OS | Ubuntu 24.04 LTS | Ubuntu 24.04 LTS |
| IPv4 | 1 statico | 1 statico |

> **Raccomandazione (attuale):** Hetzner **CX23** + **Neon** per i database: limiti compose ~1.76 GB totali, margini ampi su 4 GB. `tracks/infra/manuale-deploy-completo-hetzner.md` è la fonte di verità.

---

## 2. Setup Iniziale VPS

### 2.1 Accesso SSH e hardening base

```bash
# Dal tuo PC — prima connessione
ssh root@<IP_VPS>

# Aggiorna il sistema
apt update && apt upgrade -y

# Installa strumenti base
apt install -y curl wget git ufw fail2ban htop

# Crea utente non-root
adduser deploy
usermod -aG sudo deploy

# Configura SSH key (dal tuo PC locale)
# ssh-keygen -t ed25519 -C "deploy@vps"
# ssh-copy-id deploy@<IP_VPS>

# Disabilita login root e password auth
sed -i 's/^PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/^#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart sshd
```

### 2.2 Firewall (UFW)

```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp      # SSH
ufw allow 80/tcp      # HTTP
ufw allow 443/tcp     # HTTPS
ufw allow 8000/tcp    # Coolify UI (temporaneo, poi via reverse proxy)
ufw enable
```

### 2.3 Swap (se 8 GB RAM)

```bash
fallocate -l 4G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# Ottimizza swappiness per workload Docker
echo 'vm.swappiness=10' >> /etc/sysctl.conf
sysctl -p
```

---

## 3. Installazione Coolify

### 3.1 Installazione one-liner

```bash
# Come root o con sudo
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

Questo installa:
- Docker Engine + Docker Compose
- Coolify (container-based, self-updating)
- Traefik come reverse proxy (gestione SSL automatica via Let's Encrypt)

### 3.2 Primo accesso

1. Apri `http://<IP_VPS>:8000` nel browser
2. Crea l'account admin (email + password)
3. Configura il "Server" locale (Coolify lo rileva automaticamente)

### 3.3 Configurazione DNS

Punta i tuoi domini al VPS prima di procedere:

| Record | Nome | Valore |
|--------|------|--------|
| A | `coolify.tuodominio.it` | `<IP_VPS>` |
| A | `api.108vision.it` | `<IP_VPS>` |
| A | `dashboard.108vision.it` | `<IP_VPS>` |
| A | `108vision.it` | `<IP_VPS>` |
| A | `wellbeing-api.tuodominio.it` | `<IP_VPS>` |
| A | `tina.108vision.it` | `<IP_VPS>` |

### 3.4 Configura Coolify con dominio custom

Dalla UI Coolify → Settings:
- **Instance's Domain**: `https://coolify.tuodominio.it`
- Salva → Coolify genererà il certificato SSL via Let's Encrypt

Ora chiudi la porta 8000:
```bash
ufw delete allow 8000/tcp
```

---

## 4. Deployment: AIA Platform (108 Vision)

### 4.1 Architettura servizi

```
┌─────────────────────────────────────────────────┐
│                    Traefik                        │
│         (SSL termination + routing)              │
├────────┬────────┬──────────┬────────────────────┤
│ Gateway│Dashboard│ Client  │    LiteLLM         │
│ (Hono) │(React) │(React)  │  (AI Gateway)      │
├────────┴────────┴──────────┴────────────────────┤
│ PostgreSQL(Neon)│ Redis │Neo4j │ pgvector in Neon │
└──────────────┴─────────┴──────────┴─────────────┘
```

### 4.2 Setup tramite Coolify — Metodo Docker Compose

**Step 1: Crea progetto in Coolify**

Coolify UI → Projects → New Project → "108 Vision Platform"

**Step 2: Aggiungi risorsa "Docker Compose"**

New Resource → Docker Compose → inserisci il seguente compose (adattato per Coolify):

```yaml
# docker-compose.coolify.yml — AIA Platform
version: "3.9"

services:
  # === DATABASES ===
  # PostgreSQL è su Neon (esterno): aia_platform, litellm e wellbeing
  # sono database dello stesso progetto eu-central-1, endpoint -pooler.

  redis:
    image: redis:7-alpine
    restart: always
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5


  neo4j:
    image: neo4j:5-community
    restart: always
    environment:
      NEO4J_AUTH: neo4j/${NEO4J_PASSWORD}
      NEO4J_PLUGINS: '["apoc"]'
      NEO4J_server_memory_heap_initial__size: 256m
      NEO4J_server_memory_heap_max__size: 512m
      NEO4J_server_memory_pagecache_size: 128m
    volumes:
      - neo4j_data:/data
    deploy:
      resources:
        limits:
          memory: 768M

  # === AI GATEWAY ===
  litellm:
    image: ghcr.io/berriai/litellm:main-latest
    restart: always
    environment:
      LITELLM_MASTER_KEY: ${LITELLM_MASTER_KEY}
      DATABASE_URL: ${NEON_LITELLM_DATABASE_URL}
    volumes:
      - ./litellm-config.yaml:/app/config.yaml
    command: ["--config", "/app/config.yaml", "--port", "4000"]

  # === APPLICATION ===
  gateway:
    image: ghcr.io/${GITHUB_USER}/aia-gateway:latest
    # oppure build da repo:
    # build:
    #   context: .
    #   dockerfile: apps/gateway/Dockerfile
    restart: always
    environment:
      NODE_ENV: production
      PORT: 3000
      DATABASE_URL: ${NEON_DATABASE_URL}
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
      NEO4J_URI: bolt://neo4j:7687
      NEO4J_USER: neo4j
      NEO4J_PASSWORD: ${NEO4J_PASSWORD}
      LITELLM_URL: http://litellm:4000
      LITELLM_API_KEY: ${LITELLM_MASTER_KEY}
      BETTER_AUTH_SECRET: ${AUTH_SECRET}
      BETTER_AUTH_URL: https://api.108vision.it
    depends_on:
      redis:
        condition: service_healthy
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.gateway.rule=Host(`api.108vision.it`)"
      - "traefik.http.routers.gateway.tls.certresolver=letsencrypt"
      - "traefik.http.services.gateway.loadbalancer.server.port=3000"

  dashboard:
    image: ghcr.io/${GITHUB_USER}/aia-dashboard:latest
    restart: always
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.dashboard.rule=Host(`dashboard.108vision.it`)"
      - "traefik.http.routers.dashboard.tls.certresolver=letsencrypt"
      - "traefik.http.services.dashboard.loadbalancer.server.port=80"

volumes:
  redis_data:
  neo4j_data:
```

**Step 3: Configura variabili ambiente in Coolify**

Nella sezione "Environment Variables" del progetto:

```env
# Neon (Postgres esterno — eu-central-1, endpoint -pooler, scale-to-zero OFF)
NEON_DATABASE_URL=postgresql://USER:PW@ep-xxx-pooler.eu-central-1.aws.neon.tech/aia_platform?sslmode=require
NEON_LITELLM_DATABASE_URL=postgresql://USER:PW@ep-xxx-pooler.eu-central-1.aws.neon.tech/litellm?sslmode=require
WB_DATABASE_URL=Host=ep-xxx-pooler.eu-central-1.aws.neon.tech;Database=wellbeing;Username=USER;Password=PW

# Redis
REDIS_PASSWORD=<genera-password-32-char>

# Neo4j
NEO4J_PASSWORD=<genera-password-32-char>

# LiteLLM
LITELLM_MASTER_KEY=sk-<genera-key-32-char>

# App
AUTH_SECRET=<genera-secret-64-char>
GITHUB_USER=EliosScoglio

# AI Provider Keys (per litellm-config.yaml)
DEEPSEEK_API_KEY=<tua-key>
DASHSCOPE_API_KEY=<tua-key>
OPENAI_API_KEY=<tua-key-opzionale>
```

**Step 4: LiteLLM Config**

Crea il file `litellm-config.yaml` (caricalo via Coolify file mount o Git):

```yaml
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
```

### 4.3 Build e Deploy da Git

**Alternativa: Deploy diretto da repository Git**

Coolify UI → New Resource → "Application" (non Docker Compose):
- Source: Git Repository → `https://github.com/EliosScoglio/aia-platform`
- Branch: `main`
- Build Pack: Nixpacks (auto-detect Node.js) oppure Dockerfile
- Port: 3000

Per il monorepo, configura build separati per ogni app:
- Gateway: Build Path = `apps/gateway`, Dockerfile = `apps/gateway/Dockerfile`
- Dashboard: Build Path = `apps/dashboard`, Dockerfile = `apps/dashboard/Dockerfile`

---

## 5. Deployment: AIA Website (Astro) — sulla VPS

Il sito è `output: 'static'` (niente adapter serverless): va **buildato e servito dalla VPS**, non da Vercel.

### 5.1 Con il kit deploy/ (strada attuale)

Il sito è già dentro il container `aia-static` del kit `deploy/` (stage `site: npm ci && astro build`, vhost nginx su `www.108vision.it`, apex 301→www). Con Coolify NON serve un resource separato per il sito: basta che i record DNS `@`/`www` puntino alla VPS e che il compose del kit sia deployato.

### 5.2 Coolify standalone (solo sito, senza kit)

Coolify UI → New Resource → Application (Static):

| Campo | Valore |
|-------|--------|
| Source | Git repo URL |
| Branch | `main` |
| Build Pack | Nixpacks |
| Build Command | `cd aia-website && npm ci && npm run build` |
| Output directory | `aia-website/dist` |
| Domain | `www.108vision.it` (+ `108vision.it` con redirect) |

> **NOTA:** `POST /api/subscribe` (form lead → Brevo) richiede il gateway: il proxy nginx del kit (`location = /api/subscribe` → `aia-gateway`) è la via più semplice. Il form NON funziona come sito puramente statico isolato.

TinaCMS: niente sidecar in produzione — contenuti letti da `content/` committato; editing locale con `tinacms dev` → commit → push.

---

## 6. Deployment: WellBeingApp API

### 6.1 Architettura

```
┌───────────────────────────────┐
│          Traefik              │
│    (SSL + routing)            │
├───────────────────────────────┤
│   WellBeingApi (.NET 9)       │
│   Port 8080                   │
├───────────────────────────────┤
│   PostgreSQL 16               │
│   (shared con AIA o dedicato) │
└───────────────────────────────┘
```

### 6.2 Docker Compose per Coolify

```yaml
# docker-compose.coolify.yml — WellBeingApp
version: "3.9"

services:
  wellbeing-api:
    build:
      context: .
      dockerfile: WellBeingApi/Dockerfile
    restart: always
    environment:
      ASPNETCORE_ENVIRONMENT: Production
      ASPNETCORE_URLS: http://+:8080
      ConnectionStrings__Postgres: "${WB_DATABASE_URL}"
      UserDataStorage__Provider: Postgres
      Jwt__Key: ${WB_JWT_KEY}
      Jwt__Issuer: https://wellbeing-api.tuodominio.it
      Jwt__Audience: WellBeingApp
      Jwt__ExpireMinutes: 1440
      QwenDashScopeTextGenerator__ApiKey: ${DASHSCOPE_API_KEY}
      QwenDashScopeTextGenerator__Model: qwen3.6-flash
      Qwen3Tts__ApiKey: ${DASHSCOPE_API_KEY}
      Google__ClientId: ${GOOGLE_CLIENT_ID}
      Facebook__AppId: ${FACEBOOK_APP_ID}
      Facebook__AppSecret: ${FACEBOOK_APP_SECRET}
      Admin__Username: ${WB_ADMIN_USER}
      Admin__Password: ${WB_ADMIN_PASSWORD}
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health/live"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 45s
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.wellbeing.rule=Host(`wellbeing-api.tuodominio.it`)"
      - "traefik.http.routers.wellbeing.tls.certresolver=letsencrypt"
      - "traefik.http.services.wellbeing.loadbalancer.server.port=8080"
    volumes:
      - wb_media:/app/media:ro

volumes:
  wb_media:
```

### 6.3 Dockerfile per WellBeingApi

Se non esiste già nel progetto, crealo:

```dockerfile
# WellBeingApi/Dockerfile
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copia solution e progetti per restore
COPY *.sln .
COPY WellBeingApi/*.csproj WellBeingApi/
COPY WellBeing/*.csproj WellBeing/
COPY SharedStuff/*.csproj SharedStuff/
RUN dotnet restore WellBeingApi/WellBeingApi.csproj

# Copia tutto e builda
COPY . .
RUN dotnet publish WellBeingApi/WellBeingApi.csproj -c Release -o /app/publish --no-restore

# Runtime image
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/publish .
EXPOSE 8080
ENTRYPOINT ["dotnet", "WellBeingApi.dll"]
```

### 6.4 Variabili ambiente Coolify

```env
# Neon (database wellbeing sullo stesso progetto)
WB_DATABASE_URL=Host=ep-xxx-pooler.eu-central-1.aws.neon.tech;Database=wellbeing;Username=USER;Password=PW

# JWT (minimo 32 caratteri!)
WB_JWT_KEY=<genera-key-64-char-alfanumerica>

# AI Services
DASHSCOPE_API_KEY=<tua-key-alibaba-dashscope>

# Social Login
GOOGLE_CLIENT_ID=<tuo-google-oauth-client-id>
FACEBOOK_APP_ID=<tuo-facebook-app-id>
FACEBOOK_APP_SECRET=<tuo-facebook-app-secret>

# Admin
WB_ADMIN_USER=admin
WB_ADMIN_PASSWORD=<genera-password-sicura>
```

### 6.5 Database: tutto su Neon

Con Neon non serve un DB condiviso locale: `aia_platform`, `litellm` e `wellbeing`
sono tre database dello stesso progetto (eu-central-1). Crea `wellbeing` dalla console
Neon (o `psql "$NEON_DATABASE_URL" -c 'CREATE DATABASE wellbeing'`); le tabelle li
popola da sé la API .NET al primo avvio.

---

## 7. Configurazione Condivisa

### 7.1 PostgreSQL su Neon (setup multi-database)

```bash
# dal terminale locale o dal VPS, una tantum
psql "<NEON_DATABASE_URL>" -c 'CREATE DATABASE litellm'
psql "<NEON_DATABASE_URL>" -c 'CREATE DATABASE wellbeing'

# estensioni + schema shared + migrations 001→008 (kit deploy/)
psql "<NEON_DATABASE_URL>" -f bootstrap-neon.sql
```

Regole: endpoint **`-pooler`** ( PgBouncer — la API .NET e LiteLLM aprono troppe
connessioni per il direct endpoint), **scale-to-zero OFF**, `sslmode=require`.
LiteLLM e la API .NET migrano il proprio schema automaticamente al primo avvio.

### 7.2 Backup automatico

Crea uno script di backup giornaliero via Coolify "Scheduled Task" o cron:

```bash
#!/bin/bash
# /opt/backup/backup-dbs.sh
BACKUP_DIR="/opt/backup/daily"
DATE=$(date +%Y%m%d_%H%M)
mkdir -p $BACKUP_DIR

# PostgreSQL — ora su Neon: dump remoto (PITR Nativo di Neon copre il restore point-in-time)
pg_dump "$NEON_DATABASE_URL" > "$BACKUP_DIR/aia_$DATE.sql"

# Comprimi e ruota (mantieni ultimi 7 giorni)
gzip "$BACKUP_DIR/pg_all_$DATE.sql"
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

# Opzionale: upload su S3/Backblaze B2
# rclone copy $BACKUP_DIR remote:backups/
```

Cron (aggiungi a `/etc/crontab` o via Coolify):
```
0 3 * * * root /opt/backup/backup-dbs.sh
```

### 7.3 Monitoring

Coolify include monitoring base. Per qualcosa in piu:

```yaml
# Aggiungi al docker-compose principale
services:
  uptime-kuma:
    image: louislam/uptime-kuma:1
    restart: always
    volumes:
      - uptime_data:/app/data
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.uptime.rule=Host(`status.tuodominio.it`)"
      - "traefik.http.routers.uptime.tls.certresolver=letsencrypt"
      - "traefik.http.services.uptime.loadbalancer.server.port=3001"

volumes:
  uptime_data:
```

---

## 8. Stima Risorse e Costi

### 8.1 Consumo RAM stimato

| Servizio | RAM stimata |
|----------|-------------|
| Coolify + Traefik | ~500 MB |
| ~~PostgreSQL (shared)~~ | **su Neon — 0 MB sul VPS** |
| Redis | ~96 MB (limit) |
| ~~Qdrant~~ | **rimossa — RAG su pgvector in Neon** |
| Neo4j | ~450 MB (limit) |
| LiteLLM | ~400 MB (limit) |
| AIA Gateway (Node.js) | ~384 MB (limit) |
| AIA Static (Nginx dashboard+client+dl) | ~48 MB (limit) |
| WellBeingApi (.NET 9) | ~384 MB (limit) |
| **TOTALE limits** | **~1.76 GB** |

Con OS + buffer: **~2.5-3 GB** → CX23 (4 GB) funziona.

### 8.2 Costo mensile totale

| Voce | Costo |
|------|-------|
| VPS Hetzner CX23 (4 GB) | 6.70 EUR |
| Neon (free tier / Launch) | 0-19 EUR |
| Domini (se non già posseduti) | ~1-2 EUR/mese ammortizzato |
| Backup storage (Backblaze B2) | ~1 EUR |
| **TOTALE** | **~7-27 EUR/mese** |

### 8.3 Configurazione "Risparmio massimo" (4 GB RAM)

Con Postgres su Neon il margine è già ampio. Se serve ancora:
- disabilita Neo4j (`GRAPH_EXTRACTION_ENABLED=false`)
- `docker builder prune -f` prima della build
- swap 4 GB (già nel bootstrap)

---

## 9. Checklist Deployment

### Pre-deployment

- [ ] VPS ordinata e accessibile via SSH
- [ ] DNS propagato (verifica con `dig +short tuodominio.it`)
- [ ] SSH key configurata, root login disabilitato
- [ ] Firewall attivo (solo 22, 80, 443)
- [ ] Coolify installato e accessibile via HTTPS

### AIA Platform

- [ ] Docker Compose caricato in Coolify
- [ ] Variabili ambiente configurate
- [ ] litellm-config.yaml montato
- [ ] Database creato con estensione pgvector
- [ ] Migrations eseguite (`npm run db:migrate` o automatico al primo avvio)
- [ ] Health check attivo: `curl https://api.108vision.it/health`
- [ ] Dashboard raggiungibile: `https://dashboard.108vision.it`

### AIA Website

- [ ] Sito buildato e servito dalla VPS (container `aia-static` del kit deploy/)
- [ ] TinaCMS configurato e funzionante
- [ ] Dominio `108vision.it` puntato correttamente

### WellBeingApp API

- [ ] Dockerfile funzionante (testato localmente con `docker build`)
- [ ] Docker Compose caricato in Coolify
- [ ] Database PostgreSQL creato
- [ ] JWT key configurata (minimo 32 chars)
- [ ] API key Qwen/DashScope configurate
- [ ] Google OAuth Client ID configurato
- [ ] Health check attivo: `curl https://wellbeing-api.tuodominio.it/health/live`
- [ ] Test login social funzionante

### Post-deployment

- [ ] Backup script configurato e testato
- [ ] Uptime monitoring attivo
- [ ] SSL certificati validi (verifica con `curl -vI https://...`)
- [ ] Coolify auto-update abilitato

---

## 10. Troubleshooting Rapido

| Problema | Causa probabile | Soluzione |
|----------|----------------|-----------|
| Container OOM killed | RAM insufficiente | Aumenta swap o riduci limiti servizi |
| SSL non funziona | DNS non propagato | Attendi 5-10 min, verifica con `dig` |
| 502 Bad Gateway | Container non avviato o health check fallito | `docker logs <container>` |
| DB connection refused | Neon endpoint unreachable / scale-to-zero | Verifica URL `-pooler`, scale-to-zero OFF |
| LiteLLM 401 | Master key errata | Verifica variabile `LITELLM_MASTER_KEY` |
| .NET API crash all'avvio | JWT key troppo corta | Usa minimo 32 caratteri alfanumerici |
| Cold start / timeout DB | Neon scale-to-zero attivo | Disattivalo; usa endpoint `-pooler` |

---

## 11. Comandi Utili Post-Installazione

```bash
# Stato servizi
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Logs di un servizio
docker logs --tail 100 -f <container_name>

# Accesso shell PostgreSQL (Neon, dal terminale locale)
psql "$NEON_DATABASE_URL"

# Accesso Redis CLI
docker exec -it $(docker ps -qf "name=redis") redis-cli -a <password>

# Disk usage
docker system df
docker volume ls

# Pulizia immagini inutilizzate
docker image prune -a --filter "until=168h"

# Restart servizio specifico (via Coolify UI o):
docker compose -f <path> restart <service>
```

---

## 12. Upgrade e Manutenzione

### Aggiornamento Coolify
Coolify si auto-aggiorna. Per forzare:
```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

### Aggiornamento OS
```bash
apt update && apt upgrade -y
# Riavvio se kernel update
reboot
```

### Aggiornamento applicazioni
- **Via Coolify UI**: abilita "Auto Deploy" sul branch `main` → ogni push triggera rebuild
- **Manuale**: Coolify UI → Application → "Redeploy"

---

*Ultimo aggiornamento: 2026-06-12*
