#!/bin/bash

# Database migration script for FinanceTrack

set -e

echo "🗄️  Running database migrations..."

# Detect if running inside Docker
if [ -f /.dockerenv ]; then
    echo "🐳 Running inside Docker container"
    # Inside Docker, use the service name
    export DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@financetrack-db:5432/${POSTGRES_DB}"
else
    echo "💻 Running on host machine"
    # On host machine, load from .env file
    if [ -f .env ]; then
        export $(cat .env | grep -v '^#' | xargs)
    else
        echo "❌ Error: .env file not found"
        exit 1
    fi
fi

echo "📡 Database: $DATABASE_URL"

# Generate Prisma Client
echo "📝 Generating Prisma Client..."
npx prisma generate

# Push schema to database (using db push instead of migrate for simpler workflow)
echo "🔄 Pushing schema to database..."
npx prisma db push

echo "✅ Database migrations completed successfully!"
