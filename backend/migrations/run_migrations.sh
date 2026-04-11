#!/bin/bash
# ── Run all SQL migration files in sorted order ──────────────────────────────
# Postgres docker-entrypoint-initdb.d runs scripts alphabetically, but only
# files directly inside that folder. This script is placed there and iterates
# over the mounted migrations directory to execute them in sorted order.
#
# Usage: mounted as /docker-entrypoint-initdb.d/run_migrations.sh
#        with /migrations mounted containing *.sql files
# ─────────────────────────────────────────────────────────────────────────────

set -e

MIGRATION_DIR="/migrations"

if [ ! -d "$MIGRATION_DIR" ]; then
  echo "⚠️  Migration directory $MIGRATION_DIR not found – skipping."
  exit 0
fi

for f in $(find "$MIGRATION_DIR" -name '*.sql' -type f | sort); do
  echo "▶ Running migration: $(basename "$f")"
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$f"
done

echo "✅ All migrations applied."
