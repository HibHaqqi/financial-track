#!/bin/bash

# Local database migration script (run from host machine)
# This connects to the local PostgreSQL database, not Docker

set -e

echo "🗄️  Running local database migrations..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    exit 1
fi

# For local development, we need to use localhost
# Temporarily override DATABASE_URL for local execution
export DATABASE_URL="postgresql://postgres:rahasia@localhost:5432/financetrack"

echo "📡 Using local database: $DATABASE_URL"

# Generate Prisma Client
echo "📝 Generating Prisma Client..."
npx prisma generate

# Push schema to database
echo "🔄 Pushing schema to database..."
npx prisma db push

echo "✅ Local database migrations completed successfully!"
