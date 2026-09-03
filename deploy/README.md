# 108 Vision — Deploy Kit (VPS-only)

Deploy automatico della piattaforma **108 Vision** su un singolo VPS Hetzner **CX23** (2 vCPU / 4 GB / 40 GB, ~€6.70/mese):

- **AIA platform**: gateway (Hono) + dashboard + client chat + downloads — un solo container nginx statico (`aia-static`);
- **WellBeing API** (.NET 9);
- **LiteLLM** come gateway AI; **Neo4j** come graph KB; **Redis** per cache/queue;
- **PostgreSQL su Neon** (serverless, region eu-central-1) — nessun DB locale sul VPS;
- **RAG su pgvector** (`shared.kb_chunks`) — Qdrant non esiste più;
- il sito marketing **108vision.it / www.108vision.it** (repo `aia-website/`, Astro statico): buildato e servito da `aia-static` sul VPS stesso.

Per capire *perché* questo approccio non fa pagare GitHub Actions: `tracks/infra/VPS-Spiegato-Semplice.md`.

## Struttura

| File | Ruolo |
|---|---|
| `bootstrap.sh` | setup one-shot del VPS (Docker, firewall, swap, utente, clone repo, file, webhook, primo avvio) |
| `deploy.sh` | script di deploy (git pull → build → up → health check → prune), eseguito dal webhook |
| `webhook-server.mjs` | riceve il push da GitHub e lancia `deploy.sh` |
| `bootstrap-neon.sql` | estensioni + schema `shared` + migrations 001→008 sul DB Neon della piattaforma |
| `docker-compose.yml` | infra: Traefik, Redis, Neo4j, LiteLLM |
| `docker-compose.apps.yml` | `aia-gateway` + `aia-static` (sito/dashboard/client/downloads) |
| `docker-compose.wellbeing.yml` | WellBeing API + volume media |
| `litellm-config.yaml` | modelli AI (DeepSeek/Qwen) |
| `.env.example` | template variabili d'ambiente (segreti) |

I Dockerfile delle app vivono nel repo: `aia-platform/apps/gateway/Dockerfile` e `aia-platform/deploy/static.Dockerfile` (+ `static.nginx.conf.template`, 5 vhost con `envsubst` su `AIA_DOMAIN`: sito `www.`+apex, `app.`, `chat.`, `dl.`, default). Il build context di `aia-static` è la **radice del repo** (`108vision`), perché deve vedere sia `aia-platform/` sia `aia-website/`.

## Prerequisiti

- **VPS Hetzner CX23** (2 vCPU, 4 GB RAM, 40 GB NVMe), Ubuntu 24.04 — ~€6.70/mese.
- **Neon** (piano gratuito va bene per partire): progetto in region **eu-central-1**, 3 database: `aia_platform`, `litellm`, `wellbeing`. Usa l'endpoint **pooled** (`...-pooler.eu-central-1.aws.neon.tech`). **Scale to zero OFF** (altrimenti la API .NET e LiteLLM vedono cold start e timeout).
- **DNS** (Aruba o registrar): **tutti i record puntano al VPS** — nessuna dipendenza esterna:

| Record | Punta a |
|---|---|
| `@` `www` `api` `app` `chat` `dl` `llm` `wellbeing` `traefik` | IP del VPS |

Tutti i domini devono risolvere **prima** del primo avvio (Let's Encrypt HTTP-01). L'apex `108vision.it` risponde con 301 → `https://www.108vision.it`.

- Repo `fuzzy77/108vision` e `fuzzy77/WellBeingApp` su GitHub. Se **privati**: `sudo GITHUB_TOKEN=ghp_xxx ./bootstrap.sh`.

## Setup (una volta sola)

```bash
# 1. Collegati al VPS (come root)
ssh -i ~/.ssh/108vision_hetzner root@<IP_SERVER>

# 2. Clona il kit e avvia il bootstrap
git clone https://github.com/fuzzy77/108vision.git /opt/108vision/repos/108vision
cd /opt/108vision/repos/108vision/deploy
sudo ./bootstrap.sh
```

Il bootstrap:
1. installa Docker, configura firewall/swap/timezone, crea l'utente `deploy`;
2. clona i repo, copia i file di deploy, crea `/opt/108vision/.env` **e si ferma**;
3. **compila `/opt/108vision/.env`** con i segreti reali (vedi sotto);
4. rilancia `sudo ./bootstrap.sh` → avvia webhook + primo build.

### Inizializzare Neon (dopo aver compilato `.env`)

```bash
# crea i due DB extra una tantum (il DB aia_platform è quello di default del progetto)
psql "<NEON_DATABASE_URL>" -c 'CREATE DATABASE litellm'
psql "<NEON_DATABASE_URL>" -c 'CREATE DATABASE wellbeing'

# schema piattaforma: estensioni + shared.* + migrations 001→008
sudo -u deploy bash -c 'cd /opt/108vision && set -a && . ./.env && set +a && psql "$NEON_DATABASE_URL" -f bootstrap-neon.sql'
```

- `litellm`: lo schema se lo crea LiteLLM al primo avvio (`DATABASE_URL` impostato).
- `wellbeing`: le tabelle le crea la API .NET (`Catalog__SeedOnStartupIfEmpty` + EF migrate allo startup).

## Segreti (`/opt/108vision/.env`)

Genera con `openssl rand -base64 32`. Servono in particolare:
- **Neon**: `NEON_DATABASE_URL`, `NEON_LITELLM_DATABASE_URL`, `WB_DATABASE_URL` (Npgsql);
- AI: `DEEPSEEK_API_KEY`, `DASHSCOPE_API_KEY`; `WB_DASHSCOPE_API_KEY`, `WB_QWEN3TTS_API_KEY`;
- Social WellBeing: `WB_GOOGLE_CLIENT_SECRET`, `WB_FACEBOOK_APP_SECRET`;
- Infra: `REDIS_PASSWORD`, `NEO4J_PASSWORD`, `LITELLM_MASTER_KEY`, `AIA_JWT_SECRET`, `AIA_AUTH_SECRET`, `WB_JWT_KEY`, `WB_ADMIN_APIKEY`, `TRAEFIK_DASHBOARD_AUTH`.

Il file `.env` **non va mai committato**.

## footprint RAM (limits compose)

| Servizio | Limit |
|---|---|
| traefik | (nessuno) |
| redis | 96M (`maxmemory 64mb`) |
| neo4j | 450M |
| litellm | 400M |
| aia-gateway | 384M |
| aia-static | 48M |
| wellbeing-api | 384M |
| **totale limits** | **~1.76 GB** su 4 GB → margine per build/Docker |

## Deploy automatico

1. GitHub → Settings → Webhooks → Add webhook:
   - URL: `http://<IP_SERVER>:9000/deploy`
   - Content type: `application/json`
   - Secret: quello stampato dal bootstrap (`WEBHOOK_SECRET`)
   - Eventi: `Just the push event`
2. Ogni `git push` su `main` (di `108vision` o `WellBeingApp`) fa: `git pull` → `docker compose build` → `up -d` → health check → `image/builder prune`.

Log: `/var/log/108vision-deploy.log`. Deploy manuale: `sudo /opt/108vision/deploy.sh`.

## Sito 108vision.it (servito dal VPS)

Il sito Astro (`aia-website/`, `output: 'static'`) viene buildato nel container `aia-static` (stage `site: npm ci && astro build`) e servito sul vhost `www.${AIA_DOMAIN}`; l'apex fa 301→www. Nessun adapter/serverless richiesto. Il form lead-magnet chiama `/api/subscribe`, che nginx proxia al gateway (`/api/public/lead/subscribe` → Brevo): richiede `BREVO_API_KEY` nel `.env`. TinaCMS: niente sidecar in produzione — le modifiche ai contenuti passano dal repo (`tinacms dev` in locale → commit → push → deploy).

## Passi manuali (non coperti dal bootstrap)

- **File audio premium WellBeing**: `scp` della cartella `App_Data/package-media/` nel volume `wb_media` (vedi manuale §7.4).
- **Desktop Agent**: il binario va buildato e caricato in `/opt/108vision/public/downloads` (servito da `aia-static` su `dl.`).
- **Migrazioni DB WellBeing**: verifica che `Program.cs` esegua `Migrate()` all'avvio; in caso contrario aggiungere `dotnet ef database update` allo startup.

## Troubleshooting

| Sintomo | Causa / fix |
|---|---|
| `Cold Start` / timeout sulle query | Scale-to-zero Neon attivo → disattivalo; usa sempre l'endpoint `-pooler` |
| `migration ... no such extension vector` | Estensioni non create sul DB giusto → riesegui `bootstrap-neon.sql` |
| `aia-static` unhealthy | `AIA_DOMAIN` mancante nell'env del container (nginx envsubst) → ricrea con compose |
| Build OOM | Esegui prima `docker builder prune -f`; la build dashboard+client è il picco |
| 502/404 su `www.`/`app.`/`chat.` | nginx non matcha lo `server_name`: controlla che il record DNS punti al VPS e che `AIA_DOMAIN` sia corretto |

## Riferimenti

- `tracks/infra/manuale-deploy-completo-hetzner.md` — procedura tecnica completa.
- `tracks/infra/VPS-Spiegato-Semplice.md` — spiegazione semplice di VPS e costi.
- `tracks/infra/VPS-Coolify-Setup-Manual.md` — alternativa Coolify (qui usiamo compose diretto).
