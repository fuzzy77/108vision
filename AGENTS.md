# AGENTS.md

## Cursor Cloud specific instructions

This repo is a **multi-project monorepo** with three independent runnable pieces, each with its own package manager. There is **no root `package.json`**.

| Project | Path | Pkg manager | What it is |
|---------|------|-------------|------------|
| AIA Platform | `aia-platform/` | **pnpm** | Multi-tenant AI platform: `gateway` (Hono API :3000), `dashboard` (React/Vite :5173), `client` (React/Vite :5174), `local-agent` (desktop CLI). Needs Docker infra. |
| AIA Website | `aia-website/` | **npm** | Astro 5 + TinaCMS marketing site (`astro dev` :4321, Tina GraphQL :4001). No backing services. |
| md-to-pdf | `scripts/` | npm | One-shot Puppeteer utility (optional; deps NOT auto-installed — Chromium download is heavy). |

The dependency-refresh update script installs deps for `aia-platform` (pnpm) and `aia-website` (npm). Everything below is startup/run guidance the update script deliberately does **not** do.

### Docker is required for the platform (and is NOT auto-started)
The platform's infra (Postgres, Redis, Qdrant, LiteLLM, Neo4j) runs via `docker compose`. Docker Engine is installed in the environment but `dockerd` does not auto-start. Before running platform infra:
```
docker info >/dev/null 2>&1 || sudo dockerd > /tmp/dockerd.log 2>&1 &
```
If `docker` needs sudo, run `sudo chmod 666 /var/run/docker.sock` once per boot.
Start infra with the dev overlay (from `aia-platform/`): `make up` (i.e. `docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d`). Standard commands live in `aia-platform/Makefile`.

### Two separate `.env` files are needed for the platform (key gotcha)
The gateway runs on the **host** (via `tsx watch`), but `docker-compose` uses **container** hostnames. So:
- `aia-platform/.env` — used by `docker compose`; keep the `.env.example` docker-internal hostnames (`postgres`, `redis`, ...). Auto-created by `make setup` / `dev.mjs`.
- `aia-platform/apps/gateway/.env` — read by the gateway's own `env.ts`; must use **localhost** URLs (the compose dev overlay publishes ports to localhost). Without this file the gateway fails env validation / cannot reach `postgres:5432`.

Minimum `apps/gateway/.env` (both `.env` files are gitignored and persist in the VM snapshot):
```
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
```

### Apply gateway DB migrations after first infra boot (key gotcha)
Postgres only auto-runs the base schema in `infrastructure/postgres/init/`. The gateway's own migrations in `apps/gateway/src/db/migrations/0*.sql` are **not** applied by anything (`make migrate` only re-runs the base init). Skipping them makes auth endpoints return 500 (`column "email_verified" does not exist`). Apply once:
```
for f in aia-platform/apps/gateway/src/db/migrations/0*.sql; do
  docker exec -i aia-postgres psql -U aia -d aia_platform < "$f"
done
```
Migrations are mostly idempotent; `005`/`006` error on objects already created by the base schema — those errors are safe to ignore.

### LiteLLM OOMs at its 512M compose limit in this environment
`docker-compose.yml` caps LiteLLM at 512M, which OOM-kills it here (exit 137, crash loop). Raise it at runtime without editing the repo:
```
docker update --memory 2g --memory-swap 2g aia-litellm && docker restart aia-litellm
```
LiteLLM only matters for actual LLM calls, which also require a provider key (`DEEPSEEK_API_KEY` or `DASHSCOPE_API_KEY`) in `aia-platform/.env`. Neither key is set by default, so chat/embedding calls won't return real completions until one is added; the rest of the platform (auth, DB, dashboard) works without them.

### Package builds emit `dist/` despite type errors — don't "fix" them
`packages/*` and apps compile with `tsc` (`noEmitOnError` is false), so `dist/` is emitted even though several packages have pre-existing type errors. This is expected: `scripts/dev.mjs` wraps each package build in try/catch. The gateway imports the emitted `dist/`, so run `pnpm --filter './packages/*' build` (ignore the non-zero exit) before starting the gateway if `dist/` is missing.

### Running the apps
- Full platform (infra + build shared packages + gateway/dashboard/client): from `aia-platform/`, `make dev` (`node scripts/dev.mjs`). Requires the two `.env` files, migrations, and the LiteLLM memory bump above.
- Gateway only (host): `cd aia-platform/apps/gateway && npx tsx watch src/index.ts`. Health: `curl localhost:3000/health` (all five deps should `pass`).
- Dashboard only: `cd aia-platform/apps/dashboard && npx vite --port 5173` (proxies `/api` → gateway :3000).
- Website: `cd aia-website && npm run dev` (serves :4321; TinaCMS runs in local mode without cloud creds).

### Tests and lint
- Tests: only `apps/local-agent` has tests. Run them there: `cd aia-platform/apps/local-agent && pnpm test` (vitest, ~81 pass). Root `pnpm test` fails early because other workspaces have zero test files (vitest exits 1 on "No test files found") — not an environment problem.
- Lint: **not wired up** — the `lint` scripts call `eslint src/` but ESLint is not a declared dependency and there is no eslint config. Use `tsc` (build) as the type-check instead. Do not assume `make lint` / `pnpm lint` works.

### Auth / first login
The first `POST /api/auth/register` (no invite) becomes the `platform_admin`; further registration is invite-only afterward. A dev admin was seeded during setup: `admin@108vision.it` / `HelloWorld123!` (dashboard at :5173).
