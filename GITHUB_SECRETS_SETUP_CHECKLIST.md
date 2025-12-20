# GitHub Secrets Setup Checklist

## Quick Setup Instructions

### Step 1: Go to GitHub Repository Settings
1. Navigate to: `https://github.com/mersdev/insight-edu/settings/secrets/actions`
2. Click **"New repository secret"** for each item below

### Step 2: Add Required Secrets

Copy and paste each secret value exactly as shown:

#### Core Cloudflare Credentials (Required for both deployments)
- [ ] **CLOUDFLARE_API_TOKEN** = `vDVplcwwlLxxUK6g8Cu67ChP9b68NSkxEWober8n`
- [ ] **CLOUDFLARE_ACCOUNT_ID** = `d40d7ee9e42d0a12c82a628b40db26ff`

#### Frontend Secrets (Cloudflare Pages)
- [ ] **VITE_API_URL** = `https://your-backend-workers-url.workers.dev` (update after backend deployment)
- [ ] **VITE_GEMINI_API_KEY** = `AIzaSyCNqikNPkqFeJEeHCh8TcrU-Nlp2IakD7E`

#### Backend Secrets (Cloudflare Workers)
- [ ] **BACKEND_PORT** = `3000`
- [ ] **DB_HOST** = `your-production-database-host`
- [ ] **DB_PORT** = `5432`
- [ ] **DB_NAME** = `insight_edu`
- [ ] **DB_USER** = `your-database-username`
- [ ] **DB_PASSWORD** = `your-database-password`
- [ ] **JWT_SECRET** = `generate-a-strong-random-secret-key` (⚠️ Generate new one!)
- [ ] **JWT_EXPIRES_IN** = `24h`

### Step 3: Verify Secrets Added
1. Go to Settings → Secrets and variables → Actions
2. Confirm all secrets appear in the list (values are hidden)

### Step 4: Create Cloudflare Projects
- [ ] Create Cloudflare Pages project named `insight-edu-frontend`
- [ ] Create Cloudflare Workers project (or use existing)

### Step 5: Deploy
```bash
git push origin main
```
Monitor deployment in GitHub Actions tab.

## Important Notes

⚠️ **JWT_SECRET**: Generate a strong random secret:
```bash
# On macOS/Linux:
openssl rand -base64 32

# Or use Node.js:
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

⚠️ **Database Connection**: 
- Cloudflare Workers cannot directly access PostgreSQL
- Consider using a database proxy or serverless database (Neon, Supabase)

⚠️ **VITE_API_URL**: 
- Update after backend deployment
- Should point to your Cloudflare Workers URL

## Workflow Files Created

✅ `.github/workflows/deploy-frontend.yml` - Deploys to Cloudflare Pages
✅ `.github/workflows/deploy-backend.yml` - Deploys to Cloudflare Workers
✅ `CLOUDFLARE_DEPLOYMENT_SETUP.md` - Detailed setup guide

## Next Steps

1. Add all GitHub Secrets listed above
2. Create Cloudflare Pages and Workers projects
3. Push to main branch to trigger deployments
4. Monitor GitHub Actions for deployment status
5. Update VITE_API_URL after backend deployment succeeds

