#!/bin/sh
set -e

# Run prisma generate and migrations if DATABASE_URL is set
if [ -n "$DATABASE_URL" ]; then
  echo "Running prisma generate..."
  npx prisma generate
  echo "Applying prisma migrations..."
  npx prisma migrate deploy || true
fi

# Start the server
node dist/index.js
