# Simple Auto Deploy Setup for FinanceTrack

This will automatically deploy your FinanceTrack app when you push to the main/master branch.

## Setup Steps

### Add these secrets to your Gitea repository:

Go to: **Repository Settings → Secrets → Actions**

| Secret Name | Value | Example |
|-------------|-------|---------|
| `VPS_HOST` | Your VPS IP or domain | `192.168.1.100` |
| `VPS_USERNAME` | SSH username | `hibhaqqi` |
| `VPS_PASSWORD` | SSH password | `your_password` |
| `VPS_PORT` | SSH port (optional) | `22` |
| `PROJECT_PATH` | Project path on VPS | `/home/hibhaqqi/code/Financetrack` |
| `APP_URL` | Application URL | `fintrack.dandelionkos.site` |

### Make sure your VPS has:

- Docker and Docker Compose installed
- Your project cloned in the correct path
- `.env` file with your configuration
- PostgreSQL database running (or use the docker-compose db service)

## How it works

When you push to main/master branch:

1. **Connects to your VPS** using username/password (no SSH keys needed!)
2. **Pulls latest code**: `git pull`
3. **Runs database migrations**: `./scripts/migrate.sh` (uses `prisma db push`)
4. **Stops containers**: `docker compose down`
5. **Rebuilds and starts**: `docker compose up -d --build`
6. **Shows logs** for verification

## Docker Compose Services

The application includes:
- **financetrack-web**: Next.js application (port 3000)
- **db**: PostgreSQL 15 database (port 5432)

Both services run in a dedicated Docker network with persistent database storage.

## Database Migration Strategy

We use `prisma db push` instead of traditional migrations for:
- ✅ Simpler workflow
- ✅ Faster deployments
- ✅ No migration history to manage
- ✅ Direct schema synchronization

If you need production-safe migrations in the future, you can switch to:
```bash
npx prisma migrate dev
npx prisma migrate deploy
```

## Local Development

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down

# Run migrations
./scripts/migrate.sh
```

## Deployment Checklist

Before pushing to production:

- [ ] All tests passing locally
- [ ] Environment variables configured
- [ ] Database backup created (for major schema changes)
- [ ] `.env` file exists on server
- [ ] Docker is running on server
- [ ] Firewall allows traffic on port 3000

## Troubleshooting

### Deployment fails

**Check server logs:**
```bash
ssh hibhaqqi@your-server
cd ~/code/Financetrack
docker compose logs --tail=100
```

### Database issues

**Reset database (WARNING: deletes all data):**
```bash
docker compose down -v
docker compose up -d
./scripts/migrate.sh
```

**Restore from backup:**
```bash
PGPASSWORD=rahasia pg_restore -U hihaqqi -h localhost -d financetrack \
  --clean --no-owner --no-acl backup.dump
```

### Container won't start

**Check container status:**
```bash
docker compose ps
docker compose logs financetrack-web
```

**Rebuild without cache:**
```bash
docker compose build --no-cache
docker compose up -d
```

## Architecture

```
┌─────────────────┐
│   Gitea Push    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Gitea Actions   │
│   (CI/CD)       │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  SSH to VPS             │
│  - git pull             │
│  - Run migrations       │
│  - docker compose up    │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Docker Compose         │
│  ┌───────────────────┐  │
│  │  financetrack-web │  │
│  │  (Next.js App)    │  │
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │  db (PostgreSQL)  │  │
│  └───────────────────┘  │
└─────────────────────────┘
```

## Migration from Old Setup

**Previous setup** (before cleanup):
- 11+ migration files in `prisma/migrations/`
- Complex migration history
- Potential conflicts

**Current setup** (after cleanup):
- Single baseline migration: `20241227_init`
- Clean slate with `prisma db push`
- Simple and predictable

## Need Help?

Full documentation: `docs/CI-CD-SETUP.md`
Quick reference: `docs/QUICK-START.md`
