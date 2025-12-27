# FinanceTrack CI/CD Setup Guide

This document explains the CI/CD pipeline setup using Gitea Actions.

## Overview

The CI/CD pipeline automates the following processes:
- Running tests and linting on every push/PR
- Building and pushing Docker images to registry
- Deploying to production on main/master branch merges

## Pipeline Stages

### 1. Test Stage (`test` job)
- Checks out code
- Sets up Node.js environment
- Installs dependencies
- Runs Prisma operations (generate, db push)
- Executes type checking (`npm run typecheck`)
- Runs linter (`npm run lint`)
- Builds the application

### 2. Build Stage (`build` job)
- Builds Docker image using multi-stage build
- Pushes image to container registry
- Runs only on master/main branch after tests pass
- Uses Docker layer caching for faster builds

### 3. Deploy Stage (`deploy` job)
- Deploys to production server via SSH
- Runs database migrations
- Restarts containers with zero-downtime
- Cleans up old Docker images

## Prerequisites

### 1. Gitea Secrets Configuration

Configure these secrets in your Gitea repository (`Settings > Secrets`):

| Secret Name | Description | Example |
|------------|-------------|---------|
| `REGISTRY_URL` | Container registry URL | `docker.io` or `your-registry.com` |
| `REGISTRY_USERNAME` | Registry username | `username` |
| `REGISTRY_PASSWORD` | Registry password/token | `password` or `token` |
| `DEPLOY_HOST` | Production server IP/hostname | `192.168.1.100` |
| `DEPLOY_USER` | SSH user for deployment | `hibhaqqi` |
| `DEPLOY_KEY` | SSH private key for server access | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `DEPLOY_PORT` | SSH port (optional, defaults to 22) | `22` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `NEXTAUTH_URL` | NextAuth URL | `https://fintrack.example.com` |
| `NEXTAUTH_SECRET` | NextAuth secret | `your-secret-key` |

### 2. Server Setup

On your production server:

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Create deployment directory
mkdir -p ~/code/Financetrack
cd ~/code/Financetrack

# Clone repository
git clone <your-gitea-repo-url> .

# Setup Docker network (if not exists)
docker network create biztrackkos-2_default 2>/dev/null || true
```

### 3. SSH Key Setup

Generate SSH key for CI/CD:

```bash
# On your local machine
ssh-keygen -t ed25519 -C "gitea-ci-cd" -f ~/.ssh/gitea_deploy

# Copy public key to server
ssh-copy-id -i ~/.ssh/gitea_deploy.pub hibhaqqi@your-server-ip

# Add private key to Gitea secrets
cat ~/.ssh/gitea_deploy | pbcopy  # (Mac) or use xclip on Linux
```

Add to Gitea: `Settings > Secrets > New Secret > Name: DEPLOY_KEY`

## Prisma Migration Strategy

### Current Approach: `prisma db push`

We use `prisma db push` instead of migrations for:
- **Simplicity**: No migration history to manage
- **Speed**: Direct schema synchronization
- **Flexibility**: Easy to iterate during development

### When to Use Migrations

If you need production-safe migrations in the future:

1. **Enable Migration Mode**:
   ```bash
   # Remove db push from scripts
   # Use migration commands instead
   npx prisma migrate dev
   npx prisma migrate deploy
   ```

2. **Update CI/CD**:
   ```yaml
   # In deploy stage, replace db push with:
   - npx prisma migrate deploy
   ```

### Migration History Reset

The migrations directory has been reset with a clean baseline (`20241227_init`):
- All old migrations removed
- Single initial migration created from current schema
- Marked as applied in `_prisma_migrations` table

## Local Development

### Running Migrations Locally

```bash
# Option 1: Push schema directly (current approach)
./scripts/migrate.sh

# Option 2: Using npm scripts
npm run migrate  # Uses prisma db push
```

### Building Locally

```bash
# Build the application
npm run build

# Build Docker image
docker build -t financetrack:latest .
```

### Testing Deployment Locally

```bash
# Run the deployment script
./scripts/deploy.sh

# Or manually
docker run -d \
  --name financetrack-web \
  --network biztrackkos-2_default \
  -p 3000:3000 \
  -e DATABASE_URL="$DATABASE_URL" \
  -e NEXTAUTH_URL="$NEXTAUTH_URL" \
  -e NEXTAUTH_SECRET="$NEXTAUTH_SECRET" \
  financetrack:latest
```

## Dockerfile Optimization

The Dockerfile uses multi-stage builds for:

1. **Builder Stage**:
   - Compiles Next.js application
   - Generates Prisma Client
   - Creates production-optimized bundle

2. **Runner Stage**:
   - Minimal image size (~150MB vs ~1GB)
   - Runs as non-root user (security)
   - Only includes production dependencies

### Standalone Output Mode

Next.js configured with `output: 'standalone'`:
- Creates self-contained `.next/standalone` directory
- Automatically copies necessary dependencies
- Reduces image size significantly

## Troubleshooting

### Pipeline Failures

**Test Stage Failures**:
```bash
# Check logs in Gitea Actions
# Run tests locally:
npm run typecheck
npm run lint
npm run build
```

**Build Stage Failures**:
```bash
# Verify registry credentials
# Test Docker build locally:
docker build -t test:latest .
```

**Deploy Stage Failures**:
```bash
# Test SSH connection:
ssh -i ~/.ssh/gitea_deploy hibhaqqi@your-server

# Check server logs:
docker logs financetrack-web
```

### Database Issues

**Migration Conflicts**:
```bash
# Reset local database
PGPASSWORD=rahasia psql -U hihaqqi -h localhost -d financetrack -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
./scripts/migrate.sh
```

**Prisma Client Issues**:
```bash
# Regenerate Prisma Client
npx prisma generate
```

## Monitoring and Logs

### View Application Logs
```bash
# On production server
docker logs -f financetrack-web
```

### View Pipeline Status
- Gitea: `Repository > Actions`
- Click on latest workflow run
- View logs for each job

## Rolling Back

If a deployment fails:

```bash
# On production server
docker stop financetrack-web
docker rm financetrack-web

# Pull previous image version
docker pull financetrack:previous-tag

# Start with previous version
docker run -d --name financetrack-web \
  --network biztrackkos-2_default \
  -p 3000:3000 \
  -e DATABASE_URL="$DATABASE_URL" \
  -e NEXTAUTH_URL="$NEXTAUTH_URL" \
  -e NEXTAUTH_SECRET="$NEXTAUTH_SECRET" \
  financetrack:previous-tag
```

## Best Practices

1. **Always test locally before pushing**
2. **Use feature branches, not direct commits to master**
3. **Review pipeline logs for warnings**
4. **Keep database backups before schema changes**
5. **Monitor container resource usage**
6. **Regular security updates for base images**

## Future Improvements

- [ ] Add integration tests
- [ ] Implement blue-green deployment
- [ ] Add automated database backups
- [ ] Set up monitoring/alerting (Prometheus, Grafana)
- [ ] Implement rollback automation
- [ ] Add staging environment
- [ ] Configure SSL/TLS certificates
