# AIA Platform — Dev Quickstart (canonical)

Questa è la **fonte di verità** per l’avvio in locale del backend “piattaforma” (`aia-platform`).

Serve per evitare divergenze tra documenti diversi: qui trovi i comandi corretti, i file `.env` corretti e i gotcha che impattano davvero l’avvio.

## 0) Scope

- **Dentro scope**: dev in locale di `gateway` (:3000) + `dashboard` (:5173) con infra Docker.
- **Fuori scope**: deploy produzione con Traefik/SSL (vedi documenti di deploy).
- **Nota**: l’`aia-website` è indipendente e si avvia con `npm run dev` (Astro).

## 1) Prerequisiti

- Docker Engine + Docker Compose v2
- Node.js 20+ + pnpm
- API key LLM **opzionale** per avviare (auth/DB/UI funzionano senza), ma **necessaria** per testare risposte AI reali.

## 2) Installa dipendenze (monorepo)

```bash
cd aia-platform
pnpm install
```

## 3) File `.env` (IMPORTANT: 2 file diversi)

### 3.1 Root `.env` (solo per `docker compose`)
Questo file viene letto da `docker compose` (container hostnames come `postgres`, `redis`, `qdrant`, `litellm`).

```bash
cp .env.example .env
```

### 3.2 `apps/gateway/.env` (solo per il gateway che gira sul *host*)
Il `gateway` in dev gira sul **tuo host** (es. `tsx watch`), quindi deve raggiungere infra via **localhost**.

Crealo (o aggiorna):

```bash
cp apps/gateway/.env.example apps/gateway/.env  # se esiste
```

Se non esiste `apps/gateway/.env.example`, crea manualmente `apps/gateway/.env` con valori `localhost`, ad esempio:

```bash
DATABASE_URL=postgresql://aia:changeme_in_production@localhost:5432/aia_platform
REDIS_URL=redis://localhost:6379
QDRANT_URL=http://localhost:6333
LITELLM_URL=http://localhost:4000
LITELLM_MASTER_KEY=sk-108ai-master-changeme
JWT_SECRET=dev_jwt_secret_change_me_min_32_characters_long
NODE_ENV=development
PORT=3000
NEO4J_URL=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=neo4j_dev_password
APP_URL=http://localhost:5173
ENCRYPTION_KEY=<64 hex chars>
```

> Gotcha: se usi `postgres:5432` / `redis:6379` anche per il gateway, l’avvio può fallire perché il gateway sta fuori dal network Docker.

## 4) Avvia infrastruttura Docker

```bash
make up
```

Verifica lo stato:

```bash
make status
```

## 5) Applica le migrazioni DB del gateway (first boot gotcha)

Nel primo avvio, il container Postgres esegue solo gli init scripts “base”.
Le migrazioni aggiuntive del gateway (auth tables, ecc.) **non** vengono applicate automaticamente.

Se salti questo step, gli endpoint auth possono restituire 500 (es. colonne mancanti).

Applica una volta:

```bash
for f in apps/gateway/src/db/migrations/0*.sql; do
  docker exec -i aia-postgres psql -U aia -d aia_platform < "$f"
done
```

> Alcuni errori tipo “relation already exists” sono attesi: le migration SQL sono pensate per essere idempotenti/compatibili con una base già creata.

## 6) Avvia app (host)

### Gateway (:3000)
```bash
cd apps/gateway
pnpm dev
```

### Dashboard (:5173)
```bash
cd ../dashboard
pnpm dev
```

### Verifica
```bash
curl http://localhost:3000/health
```
Deve risultare `status: healthy`.

## 7) Hello-world (autenticazione end-to-end)

Prima registrazione:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@108vision.it","password":"HelloWorld123!","name":"Elios Admin"}'
```

Poi login:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@108vision.it","password":"HelloWorld123!"}'
```

Verifica:

```bash
# usa Authorization: Bearer <token>
curl http://localhost:3000/api/auth/me -H "Authorization: Bearer $TOKEN"
```

## 8) Troubleshooting rapido

### `LiteLLM` OOM in ambienti con limiti stretti
Se LiteLLM crasha (exit 137), aumenta i memory limit a runtime:

```bash
docker update --memory 2g --memory-swap 2g aia-litellm
docker restart aia-litellm
```

### LiteLLM `/health` non “healthy” senza API key provider
LiteLLM può restituire “unhealthy” per `/health` se non hai impostato `DEEPSEEK_API_KEY` o `DASHSCOPE_API_KEY`.
Questo è normale se vuoi solo testare auth/DB/UI.

