#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# HSAFX World App — Database Setup Script
# Runs migrations + seed for a target environment
#
# Usage:
#   DATABASE_URL=... ./infra/scripts/db-setup.sh
#   DATABASE_URL=... ./infra/scripts/db-setup.sh --seed-only
#   DATABASE_URL=... ./infra/scripts/db-setup.sh --migrate-only
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [ -z "${DATABASE_URL:-}" ]; then
  echo -e "${RED}ERROR: DATABASE_URL is required${NC}"
  echo "Usage: DATABASE_URL=postgresql://... $0"
  exit 1
fi

MODE="${1:-full}"
cd "$(dirname "$0")/../.."

echo -e "${YELLOW}═══════════════════════════════════════${NC}"
echo -e "${YELLOW} HSAFX World App — Database Setup${NC}"
echo -e "${YELLOW}═══════════════════════════════════════${NC}"
echo ""

# Mask the password in the URL for display
DISPLAY_URL=$(echo "$DATABASE_URL" | sed -E 's/:\/\/([^:]+):[^@]+@/:\/\/\1:****@/')
echo -e "  Target: ${GREEN}${DISPLAY_URL}${NC}"
echo ""

if [ "$MODE" != "--seed-only" ]; then
  echo -e "${GREEN}▸ Running migrations...${NC}"
  pnpm --filter @hsafx/db push
  echo -e "${GREEN}  ✓ Migrations complete${NC}"
  echo ""
fi

if [ "$MODE" != "--migrate-only" ]; then
  echo -e "${GREEN}▸ Running seed...${NC}"
  pnpm --filter @hsafx/db seed
  echo ""
fi

echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN} Database setup complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
