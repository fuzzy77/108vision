#!/usr/bin/env bash
# ============================================================
# AIA Platform — Database Backup Script
# ============================================================
# Creates a compressed PostgreSQL dump and optionally uploads
# to S3-compatible storage.
#
# Usage:
#   ./backup.sh              # Local backup only
#   ./backup.sh --upload     # Local + S3 upload
#
# Environment variables (from .env):
#   POSTGRES_USER, POSTGRES_DB
#   BACKUP_RETENTION_DAYS (default: 30)
#   BACKUP_S3_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
# ============================================================

set -euo pipefail

# --- Configuration ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="${SCRIPT_DIR}/dumps"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="aia_platform_${TIMESTAMP}.sql.gz"

# --- Ensure backup directory exists ---
mkdir -p "${BACKUP_DIR}"

echo "[$(date -Iseconds)] Starting backup..."

# --- Create compressed dump ---
docker compose exec -T postgres pg_dump \
    -U "${POSTGRES_USER:-aia}" \
    -d "${POSTGRES_DB:-aia_platform}" \
    --no-owner \
    --no-privileges \
    --format=plain \
    | gzip > "${BACKUP_DIR}/${BACKUP_FILE}"

FILESIZE=$(du -h "${BACKUP_DIR}/${BACKUP_FILE}" | cut -f1)
echo "[$(date -Iseconds)] Backup created: ${BACKUP_FILE} (${FILESIZE})"

# --- Upload to S3 (optional) ---
if [[ "${1:-}" == "--upload" ]] && [[ -n "${BACKUP_S3_BUCKET:-}" ]]; then
    echo "[$(date -Iseconds)] Uploading to S3: ${BACKUP_S3_BUCKET}..."
    aws s3 cp "${BACKUP_DIR}/${BACKUP_FILE}" "s3://${BACKUP_S3_BUCKET}/backups/${BACKUP_FILE}"
    echo "[$(date -Iseconds)] Upload complete."
fi

# --- Cleanup old local backups ---
echo "[$(date -Iseconds)] Removing local backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "aia_platform_*.sql.gz" -mtime "+${RETENTION_DAYS}" -delete

# --- Summary ---
BACKUP_COUNT=$(find "${BACKUP_DIR}" -name "aia_platform_*.sql.gz" | wc -l)
echo "[$(date -Iseconds)] Backup complete. ${BACKUP_COUNT} local backups retained."
