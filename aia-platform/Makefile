# ============================================================
# AIA Platform — Development Commands
# ============================================================
# Usage: make <target>
# ============================================================

.PHONY: up down logs psql redis status restart clean build deploy backup

# --- Development ---

up:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

up-prod:
	docker compose -f docker-compose.yml up -d

down:
	docker compose down

logs:
	docker compose logs -f

logs-service:
	@read -p "Service name: " svc; docker compose logs -f $$svc

status:
	docker compose ps

restart:
	docker compose restart

clean:
	docker compose down -v --remove-orphans

# --- Database ---

psql:
	docker compose exec postgres psql -U aia -d aia_platform

pg-dump:
	docker compose exec postgres pg_dump -U aia aia_platform > ./infrastructure/backups/dump_$$(date +%Y%m%d_%H%M%S).sql

migrate:
	@echo "Running init scripts (idempotent)..."
	docker compose exec postgres psql -U aia -d aia_platform -f /docker-entrypoint-initdb.d/01-extensions.sql
	docker compose exec postgres psql -U aia -d aia_platform -f /docker-entrypoint-initdb.d/02-schemas.sql

# --- Redis ---

redis:
	docker compose exec redis redis-cli

redis-monitor:
	docker compose exec redis redis-cli monitor

# --- Qdrant ---

qdrant-health:
	curl -s http://localhost:6333/healthz | python3 -m json.tool || echo "Qdrant not reachable"

qdrant-collections:
	curl -s http://localhost:6333/collections | python3 -m json.tool || echo "Qdrant not reachable"

# --- LiteLLM ---

llm-health:
	curl -s http://localhost:4000/health | python3 -m json.tool || echo "LiteLLM not reachable"

llm-models:
	curl -s -H "Authorization: Bearer $${LITELLM_MASTER_KEY}" http://localhost:4000/v1/models | python3 -m json.tool

llm-test:
	@echo "Testing fast-cheap model..."
	curl -s -X POST http://localhost:4000/v1/chat/completions \
		-H "Content-Type: application/json" \
		-H "Authorization: Bearer $${LITELLM_MASTER_KEY}" \
		-d '{"model": "fast-cheap", "messages": [{"role": "user", "content": "Say hello in 5 words"}]}' | python3 -m json.tool

# --- Build ---

build:
	npm run build --workspaces --if-present

lint:
	npm run lint --workspaces --if-present

test:
	npm run test --workspaces --if-present

# --- Deploy ---

deploy:
	./scripts/deploy.sh

backup:
	./infrastructure/backups/backup.sh

# --- Setup ---

setup:
	@echo "=== AIA Platform Setup ==="
	@test -f .env || (cp .env.example .env && echo "Created .env from .env.example — edit it with your keys")
	npm install
	@echo "=== Setup complete. Run 'make up' to start services ==="

# --- Help ---

help:
	@echo ""
	@echo "AIA Platform — Available commands:"
	@echo ""
	@echo "  Development:"
	@echo "    make up            Start all services (dev mode)"
	@echo "    make down          Stop all services"
	@echo "    make logs          Follow all logs"
	@echo "    make status        Show service status"
	@echo "    make restart       Restart all services"
	@echo "    make clean         Stop and remove all data (volumes)"
	@echo ""
	@echo "  Database:"
	@echo "    make psql          Open PostgreSQL shell"
	@echo "    make pg-dump       Dump database to backups/"
	@echo "    make migrate       Re-run init scripts"
	@echo ""
	@echo "  Redis:"
	@echo "    make redis         Open Redis CLI"
	@echo "    make redis-monitor Watch Redis commands in real-time"
	@echo ""
	@echo "  AI Gateway:"
	@echo "    make llm-health    Check LiteLLM health"
	@echo "    make llm-models    List available models"
	@echo "    make llm-test      Send test completion request"
	@echo ""
	@echo "  Build & Deploy:"
	@echo "    make build         Build all workspaces"
	@echo "    make deploy        Deploy to production VPS"
	@echo "    make backup        Run database backup"
	@echo ""
