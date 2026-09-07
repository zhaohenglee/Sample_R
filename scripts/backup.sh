#!/bin/sh
# Gzipped pg_dump of the finance database with retention-based pruning.
#
# Reads standard libpq env vars (PGHOST, PGUSER, PGPASSWORD, PGDATABASE) --
# in the `backup` compose service these are set to db/finance/finance/finance.
# BACKUP_DIR overrides where dumps land (default /backups inside the
# container, or ./backups when run locally outside Docker). RETENTION_DAYS
# overrides how many days of dumps to keep (default 14).
set -eu

BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
MIN_BYTES=1024

mkdir -p "$BACKUP_DIR"

stamp="$(date -u +%Y%m%d-%H%M%S)"
tmp="$BACKUP_DIR/.finance-$stamp.sql.part"
out="$BACKUP_DIR/finance-$stamp.sql.gz"

# Dump to a plain-text temp file first and check pg_dump's own exit status
# explicitly. Piping straight into gzip hides a pg_dump failure: the
# pipeline's status would come from gzip, which happily writes a small
# valid (but empty) .gz for zero bytes of input, so a dead-DB backup would
# look like a success. --clean --if-exists makes the dump droppable/restorable
# over an existing database (see the "Restore a backup" section in README.md).
if ! pg_dump --clean --if-exists > "$tmp"; then
  echo "backup failed: pg_dump exited non-zero" >&2
  rm -f "$tmp"
  exit 1
fi

# A dump under 1 KB almost certainly means pg_dump produced only its header
# comments (e.g. it connected but the database was empty or truncated
# unexpectedly) rather than a real backup -- treat that as a failure too.
size=$(wc -c < "$tmp" | tr -d ' ')
if [ "$size" -lt "$MIN_BYTES" ]; then
  echo "backup failed: dump is only $size bytes (< $MIN_BYTES), refusing to keep it" >&2
  rm -f "$tmp"
  exit 1
fi

if ! gzip -c "$tmp" > "$out"; then
  rm -f "$tmp" "$out"
  echo "backup failed: gzip or write to $out failed" >&2
  exit 1
fi
rm -f "$tmp"
echo "wrote $out"

# find -mtime +N matches files whose modification time is more than N full
# days old -- i.e. files are pruned once they are older than N full days,
# which is exactly the retention window we want to prune outside.
# -exec ... {} + (not a `for f in $(find ...)` loop) so filenames are never
# passed through word splitting.
count=$(find "$BACKUP_DIR" -maxdepth 1 -name 'finance-*.sql.gz' -mtime "+$RETENTION_DAYS" | wc -l | tr -d ' ')
find "$BACKUP_DIR" -maxdepth 1 -name 'finance-*.sql.gz' -mtime "+$RETENTION_DAYS" -exec rm -f {} +
echo "pruned $count file(s) older than $RETENTION_DAYS days"
