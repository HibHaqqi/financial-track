# CI/CD Setup Complete! 🎉

Your FinanceTrack project now has a complete CI/CD pipeline powered by Gitea Actions.

## What's Been Done

### ✅ 1. CI/CD Pipeline
Created `.gitea/workflows/ci.yml` - Simple auto-deploy workflow that:
- Triggers on push to main/master branch
- Connects to your VPS via SSH (no SSH keys needed!)
- Pulls latest code
- Runs database migrations
- Restarts Docker containers

### ✅ 2. Prisma Migrations Cleaned Up
- **Removed**: All old migration files (11+ migrations)
- **Created**: Single baseline migration `20241227_init`
- **Strategy**: Using `prisma db push` for simplicity
- **Location**: `prisma/migrations/20241227_init/migration.sql`

### ✅ 3. Docker Configuration
- **Updated**: `docker-compose.yml` with app + db services
- **Simplified**: `Dockerfile` for straightforward builds
- **Added**: `.dockerignore` for faster builds
- **Network**: Dedicated `financetrack-network` for services

### ✅ 4. Deployment Scripts
Created helper scripts:
- `scripts/migrate.sh` - Run database migrations
- `scripts/deploy.sh` - Manual deployment script

### ✅ 5. Documentation
Created comprehensive docs:
- `.gitea/workflows/README.md` - Setup instructions
- `docs/CI-CD-SETUP.md` - Detailed guide
- `docs/QUICK-START.md` - Quick reference

## Quick Start (3 Steps)

### Step 1: Configure Gitea Secrets

Go to your Gitea repository → **Settings** → **Secrets** → **Actions** → **New Secret**

Add these secrets:

```bash
VPS_HOST=192.168.1.100              # Your VPS IP
VPS_USERNAME=hibhaqqi                # SSH username
VPS_PASSWORD=your_password           # SSH password
PROJECT_PATH=/home/hibhaqqi/code/Financetrack
APP_URL=fintrack.3devnest.site       # Your app URL
```

### Step 2: Prepare Your Server

```bash
# SSH into your server
ssh hibhaqqi@your-server

# Install Docker (if not installed)
curl -fsSL https://get.docker.com | sudo sh

# Clone your repository
git clone <your-gitea-repo-url> ~/code/Financetrack
cd ~/code/Financetrack

# Start the application
docker compose up -d
```

### Step 3: Push to Deploy

```bash
# Make any change
git add .
git commit -m "feat: enable CI/CD"
git push origin master
```

That's it! 🚀 Your app will automatically deploy.

## Architecture Overview

```
Developer Push → Gitea → Actions → SSH to VPS → Deploy
                                            ↓
                                    ┌───────────────────┐
                                    │  Docker Compose   │
                                    │                   │
                                    │  ┌─────────────┐  │
                                    │  │ Next.js App │  │
                                    │  │  :3000      │  │
                                    │  └─────────────┘  │
                                    │                   │
                                    │  ┌─────────────┐  │
                                    │  │ PostgreSQL  │  │
                                    │  │  :5432      │  │
                                    │  └─────────────┘  │
                                    └───────────────────┘
```

## Files Modified/Created

### New Files:
- `.gitea/workflows/ci.yml`
- `.gitea/workflows/README.md`
- `scripts/migrate.sh`
- `scripts/deploy.sh`
- `.dockerignore`
- `prisma/migrations/20241227_init/migration.sql`
- `docs/CI-CD-SETUP.md`
- `docs/QUICK-START.md`

### Modified Files:
- `docker-compose.yml` - Added db service
- `Dockerfile` - Simplified build
- `.env` - Added POSTGRES_PORT and HOST_PORT
- `next.config.ts` - Kept original (removed standalone)

## Migration Strategy Change

### Before (Complex)
- 11+ migration files
- Complex migration history
- Risk of conflicts

### After (Simple)
- 1 baseline migration
- Uses `prisma db push`
- Fast and predictable

**Why?** Simpler workflow for a single-developer project. Can switch to traditional migrations if team grows.

## Environment Variables

Your `.env` file should have:

```env
DATABASE_URL=postgresql://hihaqqi:rahasia@localhost:5432/financetrack
NEXTAUTH_URL=https://fintrack.3devnest.site
NEXTAUTH_SECRET=jdjdjjdkldldurhchq

POSTGRES_DB=financetrack
POSTGRES_USER=hihaqqi
POSTGRES_PASSWORD=rahasia
POSTGRES_PORT=5432

HOST_PORT=3000
```

## Common Commands

### Local Development
```bash
# Start services
docker compose up -d

# View logs
docker compose logs -f financetrack-web

# Stop services
docker compose down

# Run migrations
./scripts/migrate.sh
```

### Production Server
```bash
# Check status
docker compose ps

# View logs
docker compose logs --tail=100 financetrack-web

# Restart services
docker compose restart

# Rebuild
docker compose up -d --build
```

## Troubleshooting

### Deployment Fails
1. Check secrets in Gitea
2. SSH to server manually
3. Run: `cd ~/code/Financetrack && git pull && docker compose up -d --build`

### Database Issues
```bash
# Reset database (WARNING: deletes data)
docker compose down -v
docker compose up -d
./scripts/migrate.sh
```

### Container Won't Start
```bash
# Check logs
docker compose logs financetrack-web

# Rebuild
docker compose build --no-cache
docker compose up -d
```

## What Happens on Deploy

1. ✅ Gitea detects push to master
2. ✅ Actions workflow triggers
3. ✅ SSH connects to your VPS
4. ✅ Pulls latest code
5. ✅ Runs `prisma db push` (migrations)
6. ✅ Restarts containers with `docker compose`
7. ✅ Shows logs for verification
8. ✅ Application is live! 🎉

## Next Steps

1. **Test locally**: `docker compose up -d`
2. **Configure secrets**: Add to Gitea
3. **Push changes**: Trigger CI/CD
4. **Monitor logs**: Check deployment
5. **Enjoy!** No more manual deployments 😊

## Security Notes

- SSH password stored in Gitea secrets (encrypted)
- Database not exposed to internet (internal network)
- Services run in isolated Docker network
- No root privileges needed for app container

## Rollback

If something goes wrong:

```bash
# SSH to server
ssh hibhaqqi@your-server

# Revert to previous commit
cd ~/code/Financetrack
git log --oneline -5
git reset --hard <previous-commit-hash>
docker compose up -d --build
```

## Support

- Detailed guide: `docs/CI-CD-SETUP.md`
- Quick reference: `docs/QUICK-START.md`
- Workflow readme: `.gitea/workflows/README.md`

---

**Happy Coding!** 🚀✨
