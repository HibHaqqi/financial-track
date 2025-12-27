#!/bin/bash

# Database migration script for FinanceTrack

set -e

echo "🗄️  Running database migrations..."

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "❌ Error: .env file not found"
    exit 1
fi

# Generate Prisma Client
echo "📝 Generating Prisma Client..."
npx prisma generate

# Push schema to database (using db push instead of migrate for simpler workflow)
echo "🔄 Pushing schema to database..."
npx prisma db push

echo "✅ Database migrations completed successfully!"
