#!/bin/bash

# PostgreSQL Database Clone Script for Docker
# Run this script on the Ubuntu server (192.168.1.5)

# ===== CONFIGURATION (UPDATE THESE) =====
DOCKER_CONTAINER="postgres"  # UPDATE: nama Docker container PostgreSQL Anda
DB_USER="postgres"            # UPDATE: PostgreSQL username
SOURCE_DB="financetrack"      # UPDATE: nama database existing
TARGET_DB="creditcard"
# ========================================

echo "========================================"
echo "PostgreSQL Docker Database Clone Script"
echo "========================================"
echo ""
echo "Container: $DOCKER_CONTAINER"
echo "Source DB: $SOURCE_DB"
echo "Target DB: $TARGET_DB"
echo ""

# Step 1: Check if container is running
echo "[1/5] Checking if Docker container is running..."
if ! docker ps | grep -q $DOCKER_CONTAINER; then
    echo "❌ Error: Container '$DOCKER_CONTAINER' is not running!"
    echo "Available containers:"
    docker ps --format "table {{.Names}}\t{{.Status}}"
    exit 1
fi
echo "✅ Container is running"

# Step 2: Check if target database already exists
echo ""
echo "[2/5] Checking if target database exists..."
DB_EXISTS=$(docker exec $DOCKER_CONTAINER psql -U $DB_USER -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$TARGET_DB'")

if [ "$DB_EXISTS" = "1" ]; then
    echo "⚠️  Database '$TARGET_DB' already exists!"
    read -p "Do you want to DROP and recreate it? (yes/no): " continue
    if [ "$continue" != "yes" ]; then
        echo "❌ Operation cancelled."
        exit 0
    fi
    echo "Dropping existing database..."
    docker exec $DOCKER_CONTAINER psql -U $DB_USER -d postgres -c "DROP DATABASE $TARGET_DB;"
fi

# Step 3: Create new database
echo ""
echo "[3/5] Creating new database '$TARGET_DB'..."
docker exec $DOCKER_CONTAINER psql -U $DB_USER -d postgres -c "CREATE DATABASE $TARGET_DB WITH ENCODING 'UTF8';"

if [ $? -ne 0 ]; then
    echo "❌ Failed to create database!"
    exit 1
fi
echo "✅ Database created"

# Step 4: Clone data from source to target
echo ""
echo "[4/5] Cloning data from '$SOURCE_DB' to '$TARGET_DB'..."
echo "  - Dumping source database..."
docker exec $DOCKER_CONTAINER pg_dump -U $DB_USER -d $SOURCE_DB > /tmp/db_clone.sql

if [ $? -ne 0 ]; then
    echo "❌ Failed to dump source database!"
    exit 1
fi

echo "  - Restoring to target database..."
docker exec -i $DOCKER_CONTAINER psql -U $DB_USER -d $TARGET_DB < /tmp/db_clone.sql

if [ $? -ne 0 ]; then
    echo "❌ Failed to restore to target database!"
    rm /tmp/db_clone.sql
    exit 1
fi

rm /tmp/db_clone.sql
echo "✅ Data cloned successfully"

# Step 5: Verify
echo ""
echo "[5/5] Verifying clone..."
SOURCE_COUNT=$(docker exec $DOCKER_CONTAINER psql -U $DB_USER -d $SOURCE_DB -tAc "SELECT COUNT(*) FROM \"User\"" 2>/dev/null || echo "0")
TARGET_COUNT=$(docker exec $DOCKER_CONTAINER psql -U $DB_USER -d $TARGET_DB -tAc "SELECT COUNT(*) FROM \"User\"" 2>/dev/null || echo "0")

echo "  Source database users: $SOURCE_COUNT"
echo "  Target database users: $TARGET_COUNT"

if [ "$SOURCE_COUNT" = "$TARGET_COUNT" ]; then
    echo "✅ Verification passed!"
else
    echo "⚠️  User counts don't match, but database was created"
fi

echo ""
echo "========================================"
echo "✅ CLONE COMPLETED!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Update .env file in your Windows machine:"
echo "   DATABASE_URL=\"postgresql://$DB_USER:[password]@192.168.1.5:5432/$TARGET_DB?schema=public\""
echo ""
echo "2. Run Prisma migration from Windows:"
echo "   npx prisma migrate dev --name add-credit-cards-and-installments"
echo ""
echo "3. Restart your dev server"
echo ""
