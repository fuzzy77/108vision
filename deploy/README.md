# 108 Vision — Deploy Kit (VPS-only)

Deploy automatico di **tutto** 108 Vision su un singolo VPS Hetzner: sito (Astro), piattaforma AIA (gateway + dashboard + client), **WellBeing API (.NET 9)** e **PostgreSQL condiviso** — con build **sul VPS** (nessun costo GitHub Actions/GHCR).

Per capire *perché* questo approccio non fa pagare GitHub: `tracks/infra/VPS-Spiegato-Semplice.md`.

## Struttura

| File | Ruolo |
|---|---|
| `bootstrap.sh` | setup one-shot del VPS (Docker, firewall, swap, utente, clone repo, file, webhook, primo avvio) |
| `deploy.sh` | script di deploy (git pull → build → up → health check), eseguito dal webhook |
| `webhook-server.mjs` | riceve il push da GitHub e lancia `deploy.sh` |
| `docker-compose.yml` | infra: Traefik, Postgres (+multi-database), Redis, Qdrant, Neo4j, LiteLLM |
| `docker-compose.apps.yml` | gateway, dashboard, client, downloads |
| `docker-compose.website.yml` | sito 108vision.it |
| `docker-compose.wellbeing.yml` | WellBeing API + volume media |
| `init-databases.sql` | crea i DB `litellm` e `wellbeing` al primo avvio |
| `litellm-config.yaml` | modelli AI (DeepSeek/Qwen) |
| `website.Dockerfile` | Dockerfile del sito (copiato dal bootstrap in `aia-website/`) |
| `.env.example` | template variabili d'ambiente (segreti) |

## Prerequisiti

- VPS Hetzner **CX32** (4 vCPU, 8 GB RAM, 80 GB NVMe), Ubuntu 24.04 — ~8 €/mese.
- DNS: i record `@ www api app chat dl llm wellbeing traefik` (tipo A) devono puntare all'IP del VPS **prima** del primo avvio (servono a Let's Encrypt).
- I repo `fuzzy77/108vision` e `fuzzy77/WellBeingApp` su GitHub. Se sono **privati**, passa un token: `sudo GITHUB_TOKEN=ghp_xxx ./bootstrap.sh`.

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

## Segreti (`/opt/108vision/.env`)

Genera con `openssl rand -base64 32`. Servono in particolare:
- `DEEPSEEK_API_KEY`, `DASHSCOPE_API_KEY` (modelli AI);
- `WB_DASHSCOPE_API_KEY`, `WB_QWEN3TTS_API_KEY` (testo + voce del Consigliere WellBeing);
- `WB_GOOGLE_CLIENT_SECRET`, `WB_FACEBOOK_APP_SECRET` (login social);
- `TINA_PUBLIC_CLIENT_ID`, `TINA_TOKEN` (CMS del sito);
- `POSTGRES_PASSWORD`, `REDIS_PASSWORD`, `QDRANT_API_KEY`, `NEO4J_PASSWORD`, `LITELLM_MASTER_KEY`, `AIA_JWT_SECRET`, `AIA_AUTH_SECRET`, `WB_JWT_KEY`, `WB_ADMIN_APIKEY`, `TRAEFIK_DASHBOARD_AUTH`.

Il file `.env` **non va mai committato**.

## Deploy automatico

1. In GitHub → Settings → Webhooks → Add webhook:
   - URL: `http://<IP_SERVER>:9000/deploy`
   - Content type: `application/json`
   - Secret: quello stampato dal bootstrap (`WEBHOOK_SECRET`)
   - Eventi: `Just the push event`
2. Da quel momento ogni `git push` su `main` (di `108vision` o `WellBeingApp`) fa: `git pull` → `docker compose build` → `up -d` → health check.

Log: `/var/log/108vision-deploy.log`. Deploy manuale: `sudo /opt/108vision/deploy.sh`.

## Passi manuali (non coperti dal bootstrap)

- **File audio premium WellBeing**: `scp` della cartella `App_Data/package-media/` nel volume `wb_media` (vedi manuale §7.4).
- **Desktop Agent**: il binario va buildato e caricato in `/opt/108vision/public/downloads`.
- **Migrazioni DB WellBeing**: verifica che `Program.cs` esegua `Migrate()` all'avvio; in caso contrario aggiungere `dotnet ef database update` allo startup.

## Riferimenti

- `tracks/infra/manuale-deploy-completo-hetzner.md` — procedura tecnica completa.
- `tracks/infra/VPS-Spiegato-Semplice.md` — spiegazione semplice di VPS e costi.
