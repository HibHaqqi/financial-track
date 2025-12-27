# CI/CD Quick Reference

## Fast Setup (5 minutes)

### 1. Configure Gitea Secrets
Go to your Gitea repository → Settings → Secrets → Add the following:

```
REGISTRY_URL=docker.io
REGISTRY_USERNAME=your-dockerhub-username
REGISTRY_PASSWORD=your-dockerhub-token
DEPLOY_HOST=your-server-ip
DEPLOY_USER=hibhaqqi
DEPLOY_KEY=<paste-ssh-private-key>
DATABASE_URL=postgresql://hihaqqi:rahasia@localhost:5432/financetrack
NEXTAUTH_URL=https://fintrack.3devnest.site
NEXTAUTH_SECRET=your-secret
```

### 2. Server Setup (One-time)
```bash
# SSH into your server
ssh hibhaqqi@your-server

# Install Docker
curl -fsSL https://get.docker.com | sudo sh

# Clone repo
git clone <your-gitea-repo-url> ~/code/Financetrack
cd ~/code/Financetrack

# Create network
docker network create biztrackkos-2_default
```

### 3. Push to Trigger Pipeline
```bash
# Make some changes
git add .
git commit -m "feat: trigger CI/CD"
git push origin master
```

That's it! The pipeline will:
1. ✅ Run tests
2. ✅ Build Docker image
3. ✅ Deploy to production

## Common Commands

### Local Development
```bash
# Install dependencies
npm install

# Run database migrations
./scripts/migrate.sh

# Start dev server
npm run dev
```

### Manual Deployment
```bash
# On production server
cd ~/code/Financetrack
./scripts/deploy.sh
```

### Database Operations
```bash
# Push schema changes
npx prisma db push

# Generate Prisma Client
npx prisma generate

# Open Prisma Studio
npx prisma studio
```

### Docker Operations
```bash
# View logs
docker logs -f financetrack-web

# Restart container
docker restart financetrack-web

# Stop container
docker stop financetrack-web

# Remove container
docker rm financetrack-web
```

## Pipeline Workflow

```
Push/PR → Test → Build → Deploy (master only)
```

**Test** runs on: all branches
**Build** runs on: master/main
**Deploy** runs on: master/main (after build)

## Troubleshooting

### Pipeline Fails at Test
```bash
# Run locally
npm run typecheck
npm run lint
npm run build
```

### Pipeline Fails at Deploy
```bash
# Check server
ssh hibhaqqi@your-server
docker logs financetrack-web
```

### Database Out of Sync
```bash
# Push current schema
npx prisma db push
```

## Files Created/Modified

✅ `.gitea/workflows/ci.yml` - CI/CD pipeline
✅ `scripts/deploy.sh` - Deployment script
✅ `scripts/migrate.sh` - Migration script
✅ `Dockerfile` - Optimized multi-stage build
✅ `next.config.ts` - Added standalone output
✅ `.dockerignore` - Optimized Docker builds
✅ `prisma/migrations/20241227_init/` - Clean baseline migration

## Migration Strategy Changed

**Before**: Multiple migration files (11 migrations)
**Now**: Single baseline migration + `prisma db push`

**Why?**
- Simpler workflow
- Faster deployments
- Easier to iterate
- No migration conflicts

**To switch to traditional migrations** (if needed):
```bash
npx prisma migrate dev --name feature_name
npx prisma migrate deploy
```

## Need Help?

Full documentation: `docs/CI-CD-SETUP.md`
