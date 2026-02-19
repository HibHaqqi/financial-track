# Production Deployment Guide - Credit Card Feature

## Overview
This guide covers deploying the credit card and installment features from the `cc` branch to production.

## Pre-Deployment Checklist

- [ ] Backup production database
- [ ] Review all migrations
- [ ] Test migrations on staging/local first
- [ ] Prepare rollback plan
- [ ] Notify users of scheduled maintenance (optional)

## Migration Summary

### Existing Migrations (Already in CC Branch):
1. **20241227_init** - Initial database schema
2. **20251229_add_credit_cards_installments** - Adds CreditCard and Installment tables
3. **20251229_update_cc_logic_linked_wallet** - Adds linkedWalletId to Installment
4. **20251231_add_credit_card_id_to_transaction** - ⚠️ NEW: Adds creditCardId to Transaction table

### Database Changes:
| Table | Change | Type | Safe? |
|-------|--------|------|-------|
| `CreditCard` | NEW TABLE | ✅ Additive | Yes |
| `Installment` | NEW TABLE | ✅ Additive | Yes |
| `Transaction` | ADD `creditCardId` | ✅ Additive (nullable) | Yes |
| `Transaction` | ADD `installmentId` | ✅ Additive (nullable) | Yes |
| `Installment` | ADD `linkedWalletId` | ✅ Additive (nullable) | Yes |
| `User` | ADD `creditCards` relation | ✅ Metadata only | Yes |
| `Wallet` | ADD `installments` relation | ✅ Metadata only | Yes |
| `Category` | ADD `installments` relation | ✅ Metadata only | Yes |

**All changes are ADDITIVE - No existing data will be modified or deleted**

## Step-by-Step Deployment

### Step 1: Backup Production Database

```bash
# SSH into your server
ssh user@your-server

# Navigate to project directory
cd /path/to/Financetrack

# Create backup directory
mkdir -p backups

# Backup the database
docker exec bizkos-db pg_dump -U postgres -d financetrack > backups/backup_$(date +%Y%m%d_%H%M%S).sql

# Verify backup was created
ls -lh backups/
```

### Step 2: Update Environment Configuration

```bash
# Copy server.env to .env (or update existing .env)
cp server.env .env

# Verify .env contents
cat .env
```

**Your `.env` should contain:**
```env
DATABASE_URL=postgresql://postgres:rahasia@bizkos-db:5432/financetrack
NEXTAUTH_URL=https://fintrack.dandelionkos.site
NEXTAUTH_SECRET=jdjdjjdkldldurhchq

POSTGRES_DB=financetrack
POSTGRES_USER=postgres
POSTGRES_PASSWORD=rahasia
```

### Step 3: Merge CC Branch to Master

```bash
# On your local machine
git checkout master
git pull origin master

# Merge cc branch
git merge cc

# Check for conflicts
git status

# If conflicts exist, resolve them, then:
# git add .
# git commit -m "Merge cc branch - resolve conflicts"

# Push to remote
git push origin master
```

### Step 4: Deploy to Production

```bash
# On your server, pull latest code
git pull origin master

# Build and restart containers
docker-compose down
docker-compose up -d --build

# Check logs
docker logs financetrack -f
# Press Ctrl+C to exit logs

# Verify container is running
docker ps | grep financetrack
```

### Step 5: Apply Database Migrations

```bash
# Option A: Using Prisma Migrate Deploy (Recommended for production)
docker exec -it financetrack npx prisma migrate deploy

# Option B: If you need to create migrations first
docker exec -it financetrack npx prisma migrate dev

# Verify migrations were applied
docker exec -it financetrack npx prisma migrate status
```

### Step 6: Regenerate Prisma Client

```bash
# Ensure Prisma client is up to date
docker exec -it financetrack npx prisma generate
```

### Step 7: Verify Deployment

```bash
# Check application health
curl https://fintrack.dandelionkos.site/api/health

# Or check the application directly
curl https://fintrack.dandelionkos.site

# Check database tables were created
docker exec -it bizkos-db psql -U postgres -d financetrack -c "\dt"

# Verify new tables exist
docker exec -it bizkos-db psql -U postgres -d financetrack -c "\d CreditCard"
docker exec -it bizkos-db psql -U postgres -d financetrack -c "\d Installment"

# Check Transaction table has new columns
docker exec -it bizkos-db psql -U postgres -d financetrack -c "\d Transaction"
```

Expected output should show:
- `creditCardId` column in Transaction table
- `installmentId` column in Transaction table
- `CreditCard` table exists
- `Installment` table exists (with `linkedWalletId` column)

## Rollback Plan

If something goes wrong:

### Option 1: Restore Database Backup

```bash
# Stop the application
docker-compose down

# Restore database
docker exec -i bizkos-db psql -U postgres -d financetrack < backups/backup_YYYYMMDD_HHMMSS.sql

# Revert code changes
git checkout master
git reset --hard origin/master  # OR git checkout [previous-commit]

# Restart application
docker-compose up -d --build
```

### Option 2: Rollback Migrations (Not Recommended for Additive Changes)

```bash
# Only use if migrations caused issues
docker exec -it financetrack npx prisma migrate resolve --rolled-back [migration-name]
```

## Post-Deployment Verification

### 1. Test Credit Card Creation
- Login to the application
- Navigate to Credit Cards section
- Create a test credit card
- Verify it appears in the list

### 2. Test Credit Card Transaction
- Create a transaction
- Select "Credit Card" as fund source
- Choose the test credit card
- Verify the transaction is created
- Check that credit card `usedLimit` increased

### 3. Test Installment Feature
- Create an installment transaction
- Verify installment plan is created
- Check monthly payments are calculated correctly

### 4. Check Existing Data
- Verify all existing transactions are intact
- Check all wallets still show correct balances
- Ensure categories and users are unaffected

## Troubleshooting

### Migration Fails

**Error:** "relation already exists"
```bash
# Check if table already exists
docker exec -it bizkos-db psql -U postgres -d financetrack -c "\dt"

# Mark migration as resolved
docker exec -it financetrack npx prisma migrate resolve --applied [migration-name]
```

**Error:** "column already exists"
```bash
# Check column exists
docker exec -it bizkos-db psql -U postgres -d financetrack -c "\d Transaction"

# Mark migration as resolved
docker exec -it financetrack npx prisma migrate resolve --applied [migration-name]
```

### Application Won't Start

```bash
# Check logs
docker logs financetrack --tail 100

# Common issues:
# 1. Database connection error → Verify DATABASE_URL
# 2. Prisma client error → Run `npx prisma generate`
# 3. Port already in use → Check `docker ps`
```

### Database Connection Issues

```bash
# Test database connection from container
docker exec -it financetrack npx prisma db push

# Check database is accessible
docker exec -it financetrack psql postgresql://postgres:rahasia@bizkos-db:5432/financetrack
```

## Migration Files Explained

### 20241227_init/migration.sql
- Creates initial tables: User, Wallet, Transaction, Category
- Creates TransactionType enum
- Sets up foreign keys and indexes

### 20251229_add_credit_cards_installments/migration.sql
- Creates `CreditCard` table
- Creates `Installment` table
- Adds `installmentId` column to Transaction table
- Sets up foreign keys for new relationships

### 20251229_update_cc_logic_linked_wallet/migration.sql
- Removes unique constraint from `Transaction.installmentId`
- Adds `linkedWalletId` column to Installment table
- Allows installments to be linked to wallets for payment

### 20251231_add_credit_card_id_to_transaction/migration.sql (NEW)
- Adds `creditCardId` column to Transaction table
- Creates index on `creditCardId` for performance
- Sets up foreign key to CreditCard table

## Performance Considerations

### Indexes Created:
- `Transaction_creditCardId_idx` - Improves queries filtering by credit card
- `Transaction_installmentId_idx` (unique) - Fast lookup of installment transactions

### Recommendations:
1. Monitor database performance after deployment
2. Check query execution plans for credit card-related queries
3. Consider adding composite indexes if needed

## Security Notes

1. **Database Credentials**: Ensure production passwords are strong
2. **Environment Variables**: Never commit `.env` files
3. **Backup Security**: Store backups in secure location
4. **Migration Logs**: Keep logs for audit trail

## Support & Monitoring

### After Deployment:
- Monitor application logs for 24 hours
- Check database performance metrics
- Review user feedback for any issues
- Have rollback plan ready for first 48 hours

### Useful Commands:

```bash
# View real-time logs
docker logs financetrack -f

# Check database size
docker exec -it bizkos-db psql -U postgres -d financetrack -c "SELECT pg_size_pretty(pg_database_size('financetrack'));"

# Count records in new tables
docker exec -it bizkos-db psql -U postgres -d financetrack -c "SELECT COUNT(*) FROM \"CreditCard\";"
docker exec -it bizkos-db psql -U postgres -d financetrack -c "SELECT COUNT(*) FROM \"Installment\";"

# Check recent transactions with credit cards
docker exec -it bizkos-db psql -U postgres -d financetrack -c "SELECT id, description, amount, \"creditCardId\" FROM \"Transaction\" WHERE \"creditCardId\" IS NOT NULL LIMIT 10;"
```

## Success Criteria

Deployment is successful when:
- ✅ All migrations applied without errors
- ✅ Application starts and responds to requests
- ✅ Existing data is intact
- ✅ New credit card features work correctly
- ✅ No errors in application logs
- ✅ Database performance is acceptable

---

**Last Updated:** December 31, 2025
**Version:** 1.0
**Branch:** cc → master
