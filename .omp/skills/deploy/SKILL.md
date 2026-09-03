---
name: deploy
description: Deploy VPS-only 108 Vision — bootstrap, webhook, compose, backup e troubleshooting del kit in deploy/.
---

# Deploy 108 Vision (VPS-only)

## Quando usare

Attiva `/skill:deploy` per: setup di un VPS, deploy, debug dei container, backup, o qualsiasi cosa tocchi `deploy/` o il server Hetzner.

## Architettura (VPS only)

- Un solo VPS Hetzner **CX23** (2 vCPU/4 GB/40 GB, ~€6.70/mese) + Docker Compose.
- **PostgreSQL su Neon** (eu-central-1, endpoint `-pooler`, scale-to-zero OFF) — niente DB locale; RAG su **pgvector** (`shared.kb_chunks`), Qdrant rimossa.
- Build **sul VPS** (niente GitHub Actions/GHCR) → paghi solo Hetzner, zero GitHub.
- Sito marketing **108vision.it/www.** (repo `aia-website/`, Astro statico) servito da `aia-static` sul VPS; apex → 301 www. DNS: **tutti** i record (`@ www api app chat dl llm wellbeing traefik`) → IP VPS.
- Repo: monorepo `fuzzy77/108vision` + `fuzzy77/WellBeingApp`.
- Perché: `tracks/infra/VPS-Spiegato-Semplice.md`. Procedura: `tracks/infra/manuale-deploy-completo-hetzner.md`.

## File del kit (`deploy/`)

| File | Ruolo |
|---|---|
| `bootstrap.sh` | setup one-shot del VPS |
| `deploy.sh` | git pull → build → up → health check |
| `webhook-server.mjs` | riceve il push GitHub → lancia `deploy.sh` |
| `docker-compose.yml` | infra: Traefik, Redis, Neo4j, LiteLLM |
| `docker-compose.apps.yml` | `aia-gateway` + `aia-static` (sito/dashboard/client/downloads in un nginx) |
| `docker-compose.wellbeing.yml` | WellBeing API (.NET 9) |
| `bootstrap-neon.sql` | estensioni + schema `shared` + migrations 001→008 su Neon |
| `.env.example` | template segreti |

## Comandi

```bash
# Sul VPS (una volta)
git clone https://github.com/fuzzy77/108vision.git /opt/108vision/repos/108vision
cd /opt/108vision/repos/108vision/deploy && sudo ./bootstrap.sh
# compila /opt/108vision/.env, poi RILANCIA bootstrap.sh

# Deploy manuale
sudo /opt/108vision/deploy.sh

# Log / stato
tail -f /var/log/108vision-deploy.log
cd /opt/108vision && docker compose ps
docker logs -f aia-gateway
```

## Flusso deploy automatico

`git push` → GitHub webhook (`http://<IP>:9000/deploy`, secret HMAC) → `deploy.sh` → `git pull` + `docker compose build` + `up -d` + health check.

## Troubleshooting

| Sintomo | Causa probabile | Fix |
|---|---|---|
| certificato SSL non emesso | DNS non puntano all'IP prima del primo avvio | verifica record A, poi `docker compose up -d traefik` |
| container unhealthy | build fallita o env mancante | `docker logs <nome>`; controlla `.env` |
| webhook 401 | secret non combacia | verifica `WEBHOOK_SECRET` nel service + GitHub |
| schema Neon mancante | `bootstrap-neon.sql` non eseguito | `sudo -u deploy bash -c 'cd /opt/108vision && set -a && . ./.env && set +a && psql "$NEON_DATABASE_URL" -f bootstrap-neon.sql'` |

## Backup

- DB: PITR/branch nativi di Neon. `backup.sh` (cron) dumpa Neo4j/Redis/config; vedi manuale §11.
- Ripristino neon: `psql` da branch/backup Neon.
- Prima di `down -v` o `prune`: **backup**.

## Regole

- Segreti SOLO in `/opt/108vision/.env` — mai nel repo.
- Build sul VPS = zero costi GitHub (non reintrodurre GHCR/Actions).
- Passi manuali noti: audio premium WellBeing (scp), binario Desktop Agent, `Migrate()` EF Core all'avvio.
