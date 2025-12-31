#!/bin/bash

# Production Deployment Script for FinanceTrack
# This script automates the deployment process

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}FinanceTrack Production Deployment${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
    echo -e "${YELLOW}Note: You may need sudo privileges for some operations${NC}"
fi

# Step 1: Backup Database
echo -e "${YELLOW}Step 1: Creating database backup...${NC}"
mkdir -p $BACKUP_DIR

# Check if database container is running
if docker ps | grep -q bizkos-db; then
    docker exec bizkos-db pg_dump -U postgres -d financetrack > $BACKUP_FILE
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Backup created: $BACKUP_FILE${NC}"
        echo -e "  Size: $(du -h $BACKUP_FILE | cut -f1)"
    else
        echo -e "${RED}✗ Backup failed! Aborting deployment.${NC}"
        exit 1
    fi
else
    echo -e "${RED}✗ Database container 'bizkos-db' not running!${NC}"
    echo -e "Please start the database and try again."
    exit 1
fi

echo ""

# Step 2: Update Environment
echo -e "${YELLOW}Step 2: Checking environment configuration...${NC}"

if [ -f "server.env" ]; then
    cp server.env .env
    echo -e "${GREEN}✓ Environment configured from server.env${NC}"
else
    echo -e "${YELLOW}⚠ server.env not found, using existing .env${NC}"
fi

echo ""

# Step 3: Pull Latest Code
echo -e "${YELLOW}Step 3: Pulling latest code from repository...${NC}"
git pull origin master
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Code updated successfully${NC}"
else
    echo -e "${RED}✗ Git pull failed! Aborting deployment.${NC}"
    exit 1
fi

echo ""

# Step 4: Build and Restart Container
echo -e "${YELLOW}Step 4: Rebuilding and restarting container...${NC}"
docker-compose down
docker-compose up -d --build

# Wait for container to be ready
echo -e "Waiting for container to start..."
sleep 10

if docker ps | grep -q financetrack; then
    echo -e "${GREEN}✓ Container restarted successfully${NC}"
else
    echo -e "${RED}✗ Container failed to start! Check logs with: docker logs financetrack${NC}"
    echo -e "${YELLOW}Rolling back...${NC}"
    docker exec -i bizkos-db psql -U postgres -d financetrack < $BACKUP_FILE
    exit 1
fi

echo ""

# Step 5: Apply Migrations
echo -e "${YELLOW}Step 5: Applying database migrations...${NC}"
docker exec -it financetrack npx prisma migrate deploy

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Migrations applied successfully${NC}"
else
    echo -e "${RED}✗ Migration failed!${NC}"
    echo -e "${YELLOW}Please check logs and restore backup if needed:${NC}"
    echo -e "  docker exec -i bizkos-db psql -U postgres -d financetrack < $BACKUP_FILE"
    exit 1
fi

echo ""

# Step 6: Regenerate Prisma Client
echo -e "${YELLOW}Step 6: Regenerating Prisma client...${NC}"
docker exec -it financetrack npx prisma generate

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Prisma client regenerated${NC}"
else
    echo -e "${YELLOW}⚠ Prisma generation failed (non-critical)${NC}"
fi

echo ""

# Step 7: Verify Deployment
echo -e "${YELLOW}Step 7: Verifying deployment...${NC}"

# Check if new tables exist
CREDIT_CARD_EXISTS=$(docker exec -it bizkos-db psql -U postgres -d financetrack -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'CreditCard');" | xargs)
INSTALLMENT_EXISTS=$(docker exec -it bizkos-db psql -U postgres -d financetrack -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Installment');" | xargs)

if [ "$CREDIT_CARD_EXISTS" = "t" ] && [ "$INSTALLMENT_EXISTS" = "t" ]; then
    echo -e "${GREEN}✓ New tables verified${NC}"
else
    echo -e "${RED}✗ New tables not found!${NC}"
    exit 1
fi

# Check if columns exist
CREDIT_CARD_ID_COLUMN=$(docker exec -it bizkos-db psql -U postgres -d financetrack -t -c "SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'Transaction' AND column_name = 'creditCardId');" | xargs)

if [ "$CREDIT_CARD_ID_COLUMN" = "t" ]; then
    echo -e "${GREEN}✓ New columns verified${NC}"
else
    echo -e "${YELLOW}⚠ creditCardId column not found (may have been added earlier)${NC}"
fi

echo ""

# Final Summary
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Application URL: https://fintrack.3devnest.site"
echo -e "Backup location: $BACKUP_FILE"
echo ""
echo -e "Next steps:"
echo -e "  1. Test the application"
echo -e "  2. Check logs: docker logs financetrack -f"
echo -e "  3. Verify credit card features work"
echo ""
echo -e "To rollback if needed:"
echo -e "  docker exec -i bizkos-db psql -U postgres -d financetrack < $BACKUP_FILE"
echo -e "  git checkout [previous-commit]"
echo -e "  docker-compose down && docker-compose up -d --build"
echo ""
