# PostgreSQL Database Clone Script
# Clone existing database to 'creditcard' database for testing

# INSTRUCTIONS:
# 1. Update the variables below with your actual database credentials
# 2. Run this script in PowerShell
# 3. After cloning, update your .env file to use the new database

# ===== CONFIGURATION (UPDATE THESE) =====
$DB_HOST = "localhost"
$DB_PORT = "5432"
$DB_USER = "postgres"  # Update with your PostgreSQL username
$SOURCE_DB = "financetrack"  # Update with your current database name
$TARGET_DB = "creditcard"
# ========================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PostgreSQL Database Clone Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Source Database: $SOURCE_DB" -ForegroundColor Yellow
Write-Host "Target Database: $TARGET_DB" -ForegroundColor Yellow
Write-Host ""

# Step 1: Check if target database already exists
Write-Host "[1/4] Checking if target database exists..." -ForegroundColor Green
$checkDb = "SELECT 1 FROM pg_database WHERE datname='$TARGET_DB'"
$dbExists = psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -tAc $checkDb 2>$null

if ($dbExists -eq "1") {
    Write-Host "⚠️  Database '$TARGET_DB' already exists!" -ForegroundColor Red
    $continue = Read-Host "Do you want to DROP and recreate it? (yes/no)"
    if ($continue -ne "yes") {
        Write-Host "❌ Operation cancelled." -ForegroundColor Red
        exit
    }
    Write-Host "Dropping existing database..." -ForegroundColor Yellow
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "DROP DATABASE $TARGET_DB;"
}

# Step 2: Create new database
Write-Host "[2/4] Creating new database '$TARGET_DB'..." -ForegroundColor Green
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE DATABASE $TARGET_DB WITH ENCODING 'UTF8';"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to create database!" -ForegroundColor Red
    exit 1
}

# Step 3: Clone schema and data
Write-Host "[3/4] Cloning schema and data from '$SOURCE_DB'..." -ForegroundColor Green
$dumpFile = "temp_db_clone.sql"

# Dump source database
Write-Host "  - Dumping source database..." -ForegroundColor Cyan
pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $SOURCE_DB -f $dumpFile

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to dump source database!" -ForegroundColor Red
    exit 1
}

# Restore to target database
Write-Host "  - Restoring to target database..." -ForegroundColor Cyan
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $TARGET_DB -f $dumpFile

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to restore to target database!" -ForegroundColor Red
    Remove-Item $dumpFile
    exit 1
}

# Clean up dump file
Remove-Item $dumpFile
Write-Host "  - Cleanup completed" -ForegroundColor Cyan

# Step 4: Apply new migrations
Write-Host "[4/4] Database cloned successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ CLONE COMPLETED!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Update your .env file:" -ForegroundColor White
Write-Host "   DATABASE_URL='postgresql://$DB_USER:[password]@$DB_HOST:$DB_PORT/$TARGET_DB?schema=public'" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Run Prisma migration for new features:" -ForegroundColor White
Write-Host "   npx prisma migrate dev --name add-credit-cards-and-installments" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Generate Prisma Client:" -ForegroundColor White
Write-Host "   npx prisma generate" -ForegroundColor Cyan
Write-Host ""
