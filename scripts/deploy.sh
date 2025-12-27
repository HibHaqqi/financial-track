#!/bin/bash

# Deployment script for FinanceTrack
# This script handles the deployment of the application

set -e  # Exit on error

echo "🚀 Starting FinanceTrack deployment..."

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "❌ Error: .env file not found"
    exit 1
fi

# Configuration
IMAGE_NAME="${REGISTRY_URL}/financetrack"
CONTAINER_NAME="financetrack-web"
NETWORK_NAME="biztrackkos-2_default"
HOST_PORT="${HOST_PORT:-3000}"

echo "📦 Pulling latest Docker image..."
docker pull "$IMAGE_NAME:latest"

echo "🗄️  Running database migrations..."
docker run --rm \
    --network "$NETWORK_NAME" \
    -e DATABASE_URL="$DATABASE_URL" \
    "$IMAGE_NAME:latest" \
    npx prisma db push --skip-generate

echo "🛑 Stopping existing container..."
docker stop "$CONTAINER_NAME" 2>/dev/null || true
docker rm "$CONTAINER_NAME" 2>/dev/null || true

echo "🚢 Starting new container..."
docker run -d \
    --name "$CONTAINER_NAME" \
    --network "$NETWORK_NAME" \
    -p "$HOST_PORT":3000 \
    -e DATABASE_URL="$DATABASE_URL" \
    -e NEXTAUTH_URL="$NEXTAUTH_URL" \
    -e NEXTAUTH_SECRET="$NEXTAUTH_SECRET" \
    -e HOST=0.0.0.0 \
    -e PORT=3000 \
    --restart unless-stopped \
    "$IMAGE_NAME:latest"

echo "🧹 Cleaning up old Docker images..."
docker image prune -af --filter "until=24h"

echo "✅ Deployment completed successfully!"
echo "🌐 Application is running at http://localhost:$HOST_PORT"
