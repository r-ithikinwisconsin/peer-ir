#!/bin/sh
set -eu

DB_URL="postgres://postgres:${POSTGRES_PASSWORD}@db:5432/postgres"

echo "migrator: waiting for auth.users (GoTrue's own migrations)…"
i=0
until psql "$DB_URL" -tAc "SELECT to_regclass('auth.users') IS NOT NULL" 2>/dev/null | grep -q '^t$'; do
  i=$((i + 1))
  if [ "$i" -gt 120 ]; then
    echo "migrator: auth.users never appeared — giving up"
    exit 1
  fi
  sleep 1
done

psql "$DB_URL" -v ON_ERROR_STOP=1 <<'SQL'
CREATE SCHEMA IF NOT EXISTS supabase_migrations;
CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ DEFAULT now()
);
SQL

for f in $(ls /migrations/*.sql | sort); do
  name=$(basename "$f" .sql)
  version="${name%%_*}"
  applied=$(psql "$DB_URL" -tAc "SELECT 1 FROM supabase_migrations.schema_migrations WHERE version = '$version'")
  if [ "$applied" = "1" ]; then
    echo "migrator:  -> $name (skipped)"
    continue
  fi
  echo "migrator:  -> $name"
  psql "$DB_URL" -v ON_ERROR_STOP=1 -f "$f"
  psql "$DB_URL" -v ON_ERROR_STOP=1 -c "INSERT INTO supabase_migrations.schema_migrations(version) VALUES ('$version')"
done

echo "migrator: done."
