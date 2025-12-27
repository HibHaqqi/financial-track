# Database Migration Fix Complete! ✅

## What Was Fixed

### The Problem
Your `.env` file had `DATABASE_URL` pointing to `bizkos-db:5432` (from your other project), causing migration failures.

### The Solution
Updated configuration to use the correct `financetrack-db` service.

## Updated `.env` File

```env
# ✅ CORRECT - Points to financetrack-db
DATABASE_URL=postgresql://postgres:rahasia@financetrack-db:5432/financetrack

# ❌ WRONG - This was pointing to the other project's database
# DATABASE_URL=postgresql://postgres:rahasia@bizkos-db:5432/financetrack

NEXTAUTH_URL=https://fintrack.3devnest.site
NEXTAUTH_SECRET=jdjdjjdkldldurhchq

POSTGRES_DB=financetrack
POSTGRES_USER=postgres
POSTGRES_PASSWORD=rahasia
POSTGRES_PORT=5432

HOST_PORT=2122
```

## Key Changes

1. ✅ **Database Host**: `bizkos-db` → `financetrack-db`
2. ✅ **Port**: `3000` → `2122` (your chosen port)
3. ✅ **User**: `hihaqqi` → `postgres` (matching your setup)

## How to Run Migrations

### Option 1: Using Docker Compose (Recommended)
```bash
# Start the database first
docker compose up -d db

# Wait a few seconds for it to be ready
sleep 5

# Run migrations
docker compose run --rm financetrack-web npx prisma db push

# Start everything
docker compose up -d --build
```

### Option 2: Local Development (Host Machine)
```bash
# Connect to local PostgreSQL (not Docker)
./scripts/migrate-local.sh
```

### Option 3: Inside Docker Container
```bash
# The script auto-detects Docker environment
./scripts/migrate.sh
```

## Docker Compose Services

Your `docker-compose.yml` now has two services:

```yaml
services:
  financetrack-web:
    container_name: financetrack-web
    ports:
      - "2122:3000"  # Your custom port
    depends_on:
      - db

  db:
    container_name: financetrack-db  # ✅ Correct service name
    image: postgres:15
    ports:
      - "5432:5432"
```

## CI/CD Pipeline Updated

The deployment workflow now:

1. ✅ Stops old containers
2. ✅ Starts database first
3. ✅ Waits for database to be ready (10s)
4. ✅ Runs migrations: `docker compose run --rm financetrack-web npx prisma db push`
5. ✅ Builds and starts application
6. ✅ Shows logs for verification

## Test Your Setup

```bash
# 1. Start database
docker compose up -d db

# 2. Check it's running
docker compose ps

# 3. Run migrations
docker compose run --rm financetrack-web npx prisma db push

# 4. Start app
docker compose up -d --build

# 5. Check logs
docker compose logs -f financetrack-web

# 6. Access your app
# Open browser: http://localhost:2122
```

## Common Issues & Solutions

### Issue: "Can't reach database server"
**Solution**: Make sure database container is running first:
```bash
docker compose up -d db
sleep 5
# Then run migrations
```

### Issue: "Connection refused"
**Solution**: Check `DATABASE_URL` in `.env`:
- Inside Docker: Use `financetrack-db:5432`
- Host machine: Use `localhost:5432`

### Issue: "Database already exists"
**Solution**: This is fine! It means migrations were already applied. The database is in sync.

## Database Connection Strings

| Context | DATABASE_URL |
|---------|--------------|
| `.env` file (Docker) | `postgresql://postgres:rahasia@financetrack-db:5432/financetrack` |
| Local development (host) | `postgresql://postgres:rahasia@localhost:5432/financetrack` |
| CI/CD | Auto-configured by docker compose |

## Quick Reference Commands

```bash
# Start everything
docker compose up -d

# Stop everything
docker compose down

# Restart app only
docker compose restart financetrack-web

# View logs
docker compose logs -f financetrack-web

# Run migrations
docker compose run --rm financetrack-web npx prisma db push

# Rebuild everything
docker compose up -d --build --force-recreate

# Access database directly
docker exec -it financetrack-db psql -U postgres -d financetrack
```

## What Happens During Deploy

When you push to master:

1. 🔄 Git pulls latest code
2. 🛑 Stops old containers
3. 🐳 Starts database container
4. ⏳ Waits 10 seconds for DB to be ready
5. 🗄️ Runs `prisma db push` inside app container
6. 🏗️ Builds and starts new app container
7. 📊 Shows status and logs
8. ✅ Application is live on port 2122!

## Next Steps

1. ✅ `.env` is configured correctly
2. ✅ `docker-compose.yml` has both services
3. ✅ Migration scripts are ready
4. ✅ CI/CD is updated

**Ready to deploy!** Push to master and watch it work 🚀

---

**Need help?** Check:
- `docs/CI-CD-SETUP.md` - Detailed guide
- `.gitea/workflows/README.md` - Quick setup
- `SETUP-COMPLETE.md` - Overview
