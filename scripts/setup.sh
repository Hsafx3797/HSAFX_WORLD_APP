#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# HSAFX World App — Full Project Setup Script (Bash)
#
# Usage:
#   ./scripts/setup.sh              # Full setup
#   ./scripts/setup.sh --no-db      # Skip database
#   ./scripts/setup.sh --with-seed  # Include database seed
#   ./scripts/setup.sh --with-wasm  # Include WASM build
#   ./scripts/setup.sh --all        # Everything incl. seed + WASM
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

# ── Colors ────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# ── Flags ─────────────────────────────────────────────────────
SKIP_DB=false
WITH_SEED=false
WITH_WASM=false

for arg in "$@"; do
  case "$arg" in
    --no-db)     SKIP_DB=true ;;
    --with-seed) WITH_SEED=true ;;
    --with-wasm) WITH_WASM=true ;;
    --all)       WITH_SEED=true; WITH_WASM=true ;;
    --help|-h)
      echo "Usage: ./scripts/setup.sh [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --no-db       Skip database migration"
      echo "  --with-seed   Run database seed after migration"
      echo "  --with-wasm   Build Rust/WASM text-tools"
      echo "  --all         Enable seed + WASM build"
      echo "  --help        Show this help"
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $arg${NC}"
      exit 1
      ;;
  esac
done

# ── Navigate to project root ──────────────────────────────────
cd "$(dirname "$0")/.."
PROJECT_ROOT="$(pwd)"

echo -e "${CYAN}"
echo "  ╔═══════════════════════════════════════════════╗"
echo "  ║    HSAFX WORLD APP — Project Setup            ║"
echo "  ╚═══════════════════════════════════════════════╝"
echo -e "${NC}"

ERRORS=()
WARNINGS=()

# ══════════════════════════════════════════════════════════════
# STEP 1: Check prerequisites
# ══════════════════════════════════════════════════════════════
echo -e "${BOLD}[1/7] Checking prerequisites...${NC}"

# Node.js 20+
if command -v node &>/dev/null; then
  NODE_VERSION=$(node -v | sed 's/v//')
  NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d. -f1)
  if [ "$NODE_MAJOR" -ge 20 ]; then
    echo -e "  ${GREEN}✓${NC} Node.js $NODE_VERSION"
  else
    ERRORS+=("Node.js 20+ required (found $NODE_VERSION)")
    echo -e "  ${RED}✗${NC} Node.js $NODE_VERSION (need 20+)"
  fi
else
  ERRORS+=("Node.js not found. Install from https://nodejs.org/")
  echo -e "  ${RED}✗${NC} Node.js not found"
fi

# pnpm 9+
if command -v pnpm &>/dev/null; then
  PNPM_VERSION=$(pnpm -v)
  PNPM_MAJOR=$(echo "$PNPM_VERSION" | cut -d. -f1)
  if [ "$PNPM_MAJOR" -ge 9 ]; then
    echo -e "  ${GREEN}✓${NC} pnpm $PNPM_VERSION"
  else
    ERRORS+=("pnpm 9+ required (found $PNPM_VERSION)")
    echo -e "  ${RED}✗${NC} pnpm $PNPM_VERSION (need 9+)"
  fi
else
  ERRORS+=("pnpm not found. Install: npm install -g pnpm@9")
  echo -e "  ${RED}✗${NC} pnpm not found"
fi

# Python 3.11+
if command -v python3 &>/dev/null; then
  PY_CMD="python3"
elif command -v python &>/dev/null; then
  PY_CMD="python"
else
  PY_CMD=""
fi

if [ -n "$PY_CMD" ]; then
  PY_VERSION=$($PY_CMD --version 2>&1 | awk '{print $2}')
  PY_MAJOR=$(echo "$PY_VERSION" | cut -d. -f1)
  PY_MINOR=$(echo "$PY_VERSION" | cut -d. -f2)
  if [ "$PY_MAJOR" -ge 3 ] && [ "$PY_MINOR" -ge 11 ]; then
    echo -e "  ${GREEN}✓${NC} Python $PY_VERSION"
  else
    WARNINGS+=("Python 3.11+ recommended (found $PY_VERSION). FastAPI backend may not work.")
    echo -e "  ${YELLOW}⚠${NC} Python $PY_VERSION (recommend 3.11+)"
  fi
else
  WARNINGS+=("Python not found. FastAPI backend will not be set up.")
  echo -e "  ${YELLOW}⚠${NC} Python not found (FastAPI backend skipped)"
fi

# Rust + wasm-pack (optional)
if $WITH_WASM; then
  if command -v rustc &>/dev/null; then
    RUST_VERSION=$(rustc --version | awk '{print $2}')
    echo -e "  ${GREEN}✓${NC} Rust $RUST_VERSION"
  else
    WARNINGS+=("Rust not found. WASM build will be skipped. Install from https://rustup.rs/")
    echo -e "  ${YELLOW}⚠${NC} Rust not found (WASM build skipped)"
    WITH_WASM=false
  fi

  if $WITH_WASM && command -v wasm-pack &>/dev/null; then
    WASM_PACK_VERSION=$(wasm-pack --version | awk '{print $2}')
    echo -e "  ${GREEN}✓${NC} wasm-pack $WASM_PACK_VERSION"
  elif $WITH_WASM; then
    echo -e "  ${YELLOW}⚠${NC} wasm-pack not found, installing..."
    cargo install wasm-pack || {
      WARNINGS+=("Failed to install wasm-pack. WASM build skipped.")
      WITH_WASM=false
    }
  fi
fi

# Abort on hard errors
if [ ${#ERRORS[@]} -gt 0 ]; then
  echo ""
  echo -e "${RED}Setup cannot continue. Fix these issues:${NC}"
  for err in "${ERRORS[@]}"; do
    echo -e "  ${RED}•${NC} $err"
  done
  exit 1
fi

echo ""

# ══════════════════════════════════════════════════════════════
# STEP 2: Install Node.js dependencies
# ══════════════════════════════════════════════════════════════
echo -e "${BOLD}[2/7] Installing Node.js dependencies...${NC}"
pnpm install --frozen-lockfile 2>/dev/null || pnpm install
echo -e "  ${GREEN}✓${NC} Node.js dependencies installed"
echo ""

# ══════════════════════════════════════════════════════════════
# STEP 3: Set up Python virtual environment
# ══════════════════════════════════════════════════════════════
echo -e "${BOLD}[3/7] Setting up Python environment...${NC}"
if [ -n "$PY_CMD" ]; then
  FASTAPI_DIR="$PROJECT_ROOT/backend/fastapi"
  VENV_DIR="$FASTAPI_DIR/.venv"

  if [ ! -d "$VENV_DIR" ]; then
    echo "  Creating virtual environment..."
    $PY_CMD -m venv "$VENV_DIR"
  fi

  # Activate and install
  if [ -f "$VENV_DIR/bin/activate" ]; then
    source "$VENV_DIR/bin/activate"
  elif [ -f "$VENV_DIR/Scripts/activate" ]; then
    source "$VENV_DIR/Scripts/activate"
  fi

  echo "  Installing Python dependencies..."
  pip install --quiet --upgrade pip
  pip install --quiet -r "$FASTAPI_DIR/requirements.txt"
  echo -e "  ${GREEN}✓${NC} Python venv created & dependencies installed"
else
  echo -e "  ${YELLOW}⚠${NC} Skipped (Python not available)"
fi
echo ""

# ══════════════════════════════════════════════════════════════
# STEP 4: Copy .env.example → .env (if not exists)
# ══════════════════════════════════════════════════════════════
echo -e "${BOLD}[4/7] Setting up environment files...${NC}"
ENV_FILES=(
  ".env.example:.env"
  "apps/web/.env.example:apps/web/.env"
  "apps/admin/.env.example:apps/admin/.env"
  "backend/fastapi/.env.example:backend/fastapi/.env"
  "infra/docker/.env.example:infra/docker/.env"
)

ENV_COPIED=0
for pair in "${ENV_FILES[@]}"; do
  SRC="${pair%%:*}"
  DEST="${pair##*:}"
  if [ -f "$PROJECT_ROOT/$SRC" ] && [ ! -f "$PROJECT_ROOT/$DEST" ]; then
    cp "$PROJECT_ROOT/$SRC" "$PROJECT_ROOT/$DEST"
    echo -e "  ${GREEN}✓${NC} Created $DEST from $SRC"
    ENV_COPIED=$((ENV_COPIED + 1))
  elif [ -f "$PROJECT_ROOT/$DEST" ]; then
    echo -e "  ${BLUE}—${NC} $DEST already exists"
  else
    echo -e "  ${YELLOW}⚠${NC} $SRC not found, skipping"
  fi
done

if [ $ENV_COPIED -gt 0 ]; then
  echo ""
  echo -e "  ${YELLOW}⚠ Remember to edit your .env files with real credentials before running the app!${NC}"
fi
echo ""

# ══════════════════════════════════════════════════════════════
# STEP 5: Database migration
# ══════════════════════════════════════════════════════════════
echo -e "${BOLD}[5/7] Database setup...${NC}"
if $SKIP_DB; then
  echo -e "  ${BLUE}—${NC} Skipped (--no-db flag)"
elif [ -z "${DATABASE_URL:-}" ] && [ -f "$PROJECT_ROOT/.env" ]; then
  # Try loading DATABASE_URL from .env
  DB_URL_LINE=$(grep -E '^DATABASE_URL=' "$PROJECT_ROOT/.env" 2>/dev/null || true)
  if [ -n "$DB_URL_LINE" ] && ! echo "$DB_URL_LINE" | grep -q 'your_password_here'; then
    export DATABASE_URL="${DB_URL_LINE#DATABASE_URL=}"
    echo "  Running migrations..."
    pnpm db:generate
    pnpm db:migrate
    echo -e "  ${GREEN}✓${NC} Database migrations complete"
  else
    echo -e "  ${YELLOW}⚠${NC} DATABASE_URL not configured yet — skipping migrations"
    echo -e "  ${YELLOW}  Edit .env with your database URL, then run: pnpm db:generate && pnpm db:migrate${NC}"
  fi
elif [ -n "${DATABASE_URL:-}" ]; then
  echo "  Running migrations..."
  pnpm db:generate
  pnpm db:migrate
  echo -e "  ${GREEN}✓${NC} Database migrations complete"
else
  echo -e "  ${YELLOW}⚠${NC} No DATABASE_URL found — skipping migrations"
  echo -e "  ${YELLOW}  Set DATABASE_URL in .env, then run: pnpm db:generate && pnpm db:migrate${NC}"
fi
echo ""

# ══════════════════════════════════════════════════════════════
# STEP 6: Optional — Seed database
# ══════════════════════════════════════════════════════════════
echo -e "${BOLD}[6/7] Database seed...${NC}"
if $WITH_SEED && ! $SKIP_DB; then
  if [ -n "${DATABASE_URL:-}" ]; then
    echo "  Seeding database..."
    pnpm --filter @hsafx/db seed 2>/dev/null && \
      echo -e "  ${GREEN}✓${NC} Database seeded" || \
      echo -e "  ${YELLOW}⚠${NC} Seed script not found or failed (non-fatal)"
  else
    echo -e "  ${YELLOW}⚠${NC} Skipped — no DATABASE_URL"
  fi
else
  echo -e "  ${BLUE}—${NC} Skipped (use --with-seed or --all to enable)"
fi
echo ""

# ══════════════════════════════════════════════════════════════
# STEP 7: Optional — Build WASM tools
# ══════════════════════════════════════════════════════════════
echo -e "${BOLD}[7/7] WASM tools build...${NC}"
if $WITH_WASM; then
  echo "  Building text-tools WASM package..."
  cd "$PROJECT_ROOT/backend/rust/text-tools"
  wasm-pack build --target web --release
  echo -e "  ${GREEN}✓${NC} WASM text-tools built"
  cd "$PROJECT_ROOT"
else
  echo -e "  ${BLUE}—${NC} Skipped (use --with-wasm or --all to enable)"
fi
echo ""

# ══════════════════════════════════════════════════════════════
# Summary
# ══════════════════════════════════════════════════════════════
echo -e "${CYAN}══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}${BOLD}  ✓ HSAFX World App — Setup Complete!${NC}"
echo -e "${CYAN}══════════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${BOLD}Quick start:${NC}"
echo -e "    ${GREEN}pnpm dev${NC}           Start all dev servers"
echo -e "    ${GREEN}pnpm dev:web${NC}       Start web app only (port 3000)"
echo -e "    ${GREEN}pnpm dev:admin${NC}     Start admin panel only (port 3002)"
echo -e "    ${GREEN}pnpm build${NC}         Build all packages"
echo -e "    ${GREEN}pnpm test${NC}          Run all tests"
echo ""

if [ ${#WARNINGS[@]} -gt 0 ]; then
  echo -e "  ${YELLOW}Warnings:${NC}"
  for warn in "${WARNINGS[@]}"; do
    echo -e "    ${YELLOW}⚠${NC} $warn"
  done
  echo ""
fi

echo -e "  ${BLUE}Docs:${NC} See SETUP.md for detailed configuration instructions."
echo ""
