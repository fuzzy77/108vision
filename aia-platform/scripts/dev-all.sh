#!/usr/bin/env bash
# ============================================================
# dev-all.sh — Start ALL development services in one command
# ============================================================
# Usage:
#   ./scripts/dev-all.sh          # Start everything
#   ./scripts/dev-all.sh --skip-infra   # Skip Docker (if already running)
#   ./scripts/dev-all.sh --stop         # Stop everything
#   ./scripts/dev-all.sh --status       # Show status of all services
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# PID file for tracking background processes
PID_FILE="$ROOT_DIR/.dev-pids"

log() { echo -e "${BLUE}[dev-all]${NC} $1"; }
ok()  { echo -e "${GREEN}[  OK  ]${NC} $1"; }
warn(){ echo -e "${YELLOW}[ WARN ]${NC} $1"; }
err() { echo -e "${RED}[ERROR ]${NC} $1"; }

# --- Stop command ---
stop_all() {
  log "Stopping all dev services..."

  if [ -f "$PID_FILE" ]; then
    while IFS= read -r line; do
      pid=$(echo "$line" | cut -d'|' -f1)
      name=$(echo "$line" | cut -d'|' -f2)
      if kill -0 "$pid" 2>/dev/null; then
        kill "$pid" 2>/dev/null && ok "Stopped $name (PID $pid)"
      fi
    done < "$PID_FILE"
    rm -f "$PID_FILE"
  fi

  # Stop Docker infrastructure
  docker compose -f docker-compose.yml -f docker-compose.dev.yml down 2>/dev/null
  ok "Docker infrastructure stopped"
  exit 0
}

# --- Status command ---
show_status() {
  echo ""
  echo -e "${CYAN}═══════════════════════════════════════════${NC}"
  echo -e "${CYAN}  AIA Platform — Development Status${NC}"
  echo -e "${CYAN}═══════════════════════════════════════════${NC}"
  echo ""

  # Docker services
  echo -e "${BLUE}Docker Infrastructure:${NC}"
  docker compose -f docker-compose.yml -f docker-compose.dev.yml ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || warn "Docker not running"
  echo ""

  # App processes
  echo -e "${BLUE}Application Processes:${NC}"
  if [ -f "$PID_FILE" ]; then
    while IFS= read -r line; do
      pid=$(echo "$line" | cut -d'|' -f1)
      name=$(echo "$line" | cut -d'|' -f2)
      port=$(echo "$line" | cut -d'|' -f3)
      if kill -0 "$pid" 2>/dev/null; then
        echo -e "  ${GREEN}●${NC} $name (PID $pid) → http://localhost:$port"
      else
        echo -e "  ${RED}●${NC} $name (PID $pid) — DEAD"
      fi
    done < "$PID_FILE"
  else
    warn "No PID file found. Run ./scripts/dev-all.sh to start."
  fi

  echo ""

  # Health checks
  echo -e "${BLUE}Health Checks:${NC}"
  check_health "PostgreSQL" "docker compose exec -T postgres pg_isready -U aia -d aia_platform" 2>/dev/null
  check_health "Redis" "docker compose exec -T redis redis-cli ping" 2>/dev/null
  check_health "Qdrant" "curl -sf http://localhost:6333/healthz" 2>/dev/null
  check_health "LiteLLM" "curl -sf http://localhost:4000/health" 2>/dev/null
  check_health "Neo4j" "curl -sf http://localhost:7474" 2>/dev/null
  check_health "Gateway" "curl -sf http://localhost:3000/health" 2>/dev/null
  echo ""
  exit 0
}

check_health() {
  local name="$1"
  local cmd="$2"
  if eval "$cmd" > /dev/null 2>&1; then
    echo -e "  ${GREEN}●${NC} $name"
  else
    echo -e "  ${RED}●${NC} $name"
  fi
}

# --- Parse args ---
SKIP_INFRA=false
for arg in "$@"; do
  case $arg in
    --stop) stop_all ;;
    --status) show_status ;;
    --skip-infra) SKIP_INFRA=true ;;
    --help|-h)
      echo "Usage: ./scripts/dev-all.sh [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --skip-infra   Skip Docker infrastructure (if already running)"
      echo "  --stop         Stop all services"
      echo "  --status       Show status of all services"
      echo "  -h, --help     Show this help"
      exit 0
      ;;
  esac
done

# --- Pre-flight checks ---
log "Running pre-flight checks..."

if ! command -v docker &> /dev/null; then
  err "Docker not found. Install Docker Desktop or Docker Engine."
  exit 1
fi

if ! command -v node &> /dev/null; then
  err "Node.js not found. Install Node.js 20+."
  exit 1
fi

NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  err "Node.js 20+ required. Found: v$NODE_VERSION"
  exit 1
fi

if [ ! -f ".env" ]; then
  warn ".env file not found. Creating from .env.example..."
  if [ -f ".env.example" ]; then
    cp .env.example .env
    warn "Created .env — edit it with your API keys before continuing."
    exit 1
  else
    err "No .env.example found. Create .env manually."
    exit 1
  fi
fi

# Check minimum required API key
if ! grep -q "DEEPSEEK_API_KEY=." .env 2>/dev/null && \
   ! grep -q "OPENAI_API_KEY=." .env 2>/dev/null && \
   ! grep -q "ANTHROPIC_API_KEY=." .env 2>/dev/null; then
  warn "No AI API key found in .env. At least DEEPSEEK_API_KEY is needed."
fi

ok "Pre-flight checks passed"

# --- Step 1: Docker Infrastructure ---
if [ "$SKIP_INFRA" = false ]; then
  echo ""
  log "Starting Docker infrastructure..."
  docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

  # Wait for health
  log "Waiting for services to be healthy..."
  RETRIES=30
  for service in postgres redis qdrant litellm; do
    for i in $(seq 1 $RETRIES); do
      if docker compose ps "$service" 2>/dev/null | grep -q "healthy"; then
        ok "$service is healthy"
        break
      fi
      if [ "$i" -eq "$RETRIES" ]; then
        warn "$service not healthy after ${RETRIES}s — continuing anyway"
      fi
      sleep 1
    done
  done
else
  log "Skipping Docker infrastructure (--skip-infra)"
fi

# --- Step 2: Install dependencies ---
echo ""
log "Checking dependencies..."
if [ ! -d "node_modules" ]; then
  log "Installing npm packages..."
  pnpm install
  ok "Dependencies installed"
else
  ok "Dependencies already installed"
fi

# --- Step 3: Build shared packages ---
echo ""
log "Building shared packages..."
pnpm --filter @aia/shared build 2>/dev/null && ok "@aia/shared built" || warn "@aia/shared build failed"
pnpm --filter @aia/ai-client build 2>/dev/null && ok "@aia/ai-client built" || warn "@aia/ai-client build failed"
pnpm --filter @aia/auth build 2>/dev/null && ok "@aia/auth built" || warn "@aia/auth build failed"
pnpm --filter @aia/graph build 2>/dev/null && ok "@aia/graph built" || warn "@aia/graph build failed"

# --- Step 4: Start application services ---
echo ""
log "Starting application services..."
rm -f "$PID_FILE"

# Gateway (API backend)
log "Starting Gateway (port 3000)..."
cd "$ROOT_DIR/apps/gateway"
npx tsx watch src/index.ts > /tmp/aia-gateway.log 2>&1 &
GATEWAY_PID=$!
echo "$GATEWAY_PID|gateway|3000" >> "$PID_FILE"
cd "$ROOT_DIR"
ok "Gateway started (PID $GATEWAY_PID) → http://localhost:3000"

# Dashboard (admin panel)
log "Starting Dashboard (port 5173)..."
cd "$ROOT_DIR/apps/dashboard"
npx vite --port 5173 > /tmp/aia-dashboard.log 2>&1 &
DASHBOARD_PID=$!
echo "$DASHBOARD_PID|dashboard|5173" >> "$PID_FILE"
cd "$ROOT_DIR"
ok "Dashboard started (PID $DASHBOARD_PID) → http://localhost:5173"

# Client (chat widget)
log "Starting Client (port 5174)..."
cd "$ROOT_DIR/apps/client"
npx vite --port 5174 > /tmp/aia-client.log 2>&1 &
CLIENT_PID=$!
echo "$CLIENT_PID|client|5174" >> "$PID_FILE"
cd "$ROOT_DIR"
ok "Client started (PID $CLIENT_PID) → http://localhost:5174"

# --- Done ---
echo ""
echo -e "${CYAN}═══════════════════════════════════════════${NC}"
echo -e "${CYAN}  AIA Platform — All services running${NC}"
echo -e "${CYAN}═══════════════════════════════════════════${NC}"
echo ""
echo -e "  ${GREEN}Infrastructure:${NC}"
echo -e "    PostgreSQL    → localhost:5432"
echo -e "    Redis         → localhost:6379"
echo -e "    Qdrant        → localhost:6333"
echo -e "    LiteLLM       → localhost:4000"
echo -e "    Neo4j         → localhost:7474 (browser) / :7687 (bolt)"
echo ""
echo -e "  ${GREEN}Applications:${NC}"
echo -e "    Gateway API   → http://localhost:3000"
echo -e "    Dashboard     → http://localhost:5173"
echo -e "    Client        → http://localhost:5174"
echo ""
echo -e "  ${YELLOW}Commands:${NC}"
echo -e "    ./scripts/dev-all.sh --status   Show status"
echo -e "    ./scripts/dev-all.sh --stop     Stop everything"
echo -e "    make psql                        Open DB shell"
echo -e "    make redis                       Open Redis CLI"
echo -e "    tail -f /tmp/aia-gateway.log     Gateway logs"
echo -e "    tail -f /tmp/aia-dashboard.log   Dashboard logs"
echo -e "    tail -f /tmp/aia-client.log      Client logs"
echo ""
