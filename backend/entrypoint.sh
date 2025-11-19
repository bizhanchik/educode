#!/bin/bash
set -e

echo "🚀 Starting EduCode API..."

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL..."
until pg_isready -h postgres -U educode_user -d educode_db > /dev/null 2>&1; do
  echo "  Waiting for database connection..."
  sleep 2
done
echo "✅ PostgreSQL is ready!"

# Run database migrations
echo "🔄 Running database migrations..."
alembic upgrade head
echo "✅ Migrations completed!"

# Execute the main command (passed as arguments to this script)
echo "🎯 Starting application: $@"
exec "$@"
