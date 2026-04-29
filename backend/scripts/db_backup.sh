#!/bin/bash
set -euo pipefail

export PATH=/usr/local/bin:/usr/bin:/bin

BACKUP_DIR="/opt/backups"
CONTAINER_NAME="educode_postgres"
DB_USER="educode_user"
DB_NAME="educode_db"
KEEP_DAYS=30

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="educode_db_backup_$TIMESTAMP.sql"
TMPFILE="$BACKUP_DIR/$FILENAME.tmp"
FINALFILE="$BACKUP_DIR/$FILENAME"

mkdir -p "$BACKUP_DIR"

if ! docker info >/dev/null 2>&1; then
  echo "$(date): ERROR - Docker is not running"
  exit 1
fi

if ! docker inspect -f '{{.State.Running}}' "$CONTAINER_NAME" >/dev/null 2>&1; then
  echo "$(date): ERROR - Container $CONTAINER_NAME is not running"
  exit 1
fi

echo "$(date): Starting database backup: $FILENAME"

docker exec "$CONTAINER_NAME" \
  pg_dump -U "$DB_USER" "$DB_NAME" > "$TMPFILE"

mv "$TMPFILE" "$FINALFILE"
gzip "$FINALFILE"

echo "$(date): Backup completed: $FINALFILE.gz"

find "$BACKUP_DIR" -name "*.sql.gz" -type f -mtime +$KEEP_DAYS -delete
echo "$(date): Old backups cleaned"
