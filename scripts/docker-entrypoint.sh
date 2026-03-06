#!/bin/sh
set -eu

echo "Generating Prisma client..."
bunx prisma generate

echo "Applying Prisma schema (db push)..."
retries=20
until bunx prisma db push; do
  retries=$((retries - 1))
  if [ "$retries" -le 0 ]; then
    echo "Database is still unavailable after multiple retries."
    exit 1
  fi

  echo "Database unavailable, retrying in 3s..."
  sleep 3
done

echo "Starting API..."
exec bun run src/index.ts
