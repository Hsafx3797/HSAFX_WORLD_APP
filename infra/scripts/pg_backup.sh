#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────
# pg_backup.sh — Automated PostgreSQL backup for HSAFX WORLD
# Designed for cron or GitHub Actions.
#
# Usage:
#   ./infra/scripts/pg_backup.sh                # uses DATABASE_URL env
#   BACKUP_DIR=/mnt/backups ./pg_backup.sh      # custom output dir
#
# Environment Variables:
#   DATABASE_URL          — Required. Postgres connection string.
#   BACKUP_DIR            — Optional. Default: ./backups
#   BACKUP_RETENTION_DAYS — Optional. Default: 30
# ──────────────────────────────────────────────────────────────
set -euo pipefail

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
FILENAME="hsafx_backup_${TIMESTAMP}.sql.gz"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is not set" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"

echo "[$(date -Iseconds)] Starting backup → ${FILENAME}"

# pg_dump with compression
pg_dump "$DATABASE_URL" \
  --no-owner \
  --no-privileges \
  --format=custom \
  --compress=9 \
  | gzip > "${BACKUP_DIR}/${FILENAME}"

SIZE=$(du -h "${BACKUP_DIR}/${FILENAME}" | cut -f1)
echo "[$(date -Iseconds)] Backup complete: ${SIZE}"

# Prune old backups
echo "[$(date -Iseconds)] Pruning backups older than ${RETENTION_DAYS} days..."
find "$BACKUP_DIR" -name "hsafx_backup_*.sql.gz" -mtime +"$RETENTION_DAYS" -delete

REMAINING=$(find "$BACKUP_DIR" -name "hsafx_backup_*.sql.gz" | wc -l)
echo "[$(date -Iseconds)] Done. ${REMAINING} backup(s) retained."
