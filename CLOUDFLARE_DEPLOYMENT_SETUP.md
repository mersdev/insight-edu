# Cloudflare Deployment Setup Guide

This guide explains how to set up GitHub Secrets for deploying your Insight EDU application to Cloudflare Pages (frontend) and Cloudflare Workers (backend).

## Prerequisites

- GitHub repository with admin access
- Cloudflare account with API token and Account ID
- GitHub CLI (optional, for command-line setup) or GitHub web interface

## Step 1: Gather Your Credentials

You already have:
- **Cloudflare API Token**: `vDVplcwwlLxxUK6g8Cu67ChP9b68NSkxEWober8n`
- **Cloudflare Account ID**: `d40d7ee9e42d0a12c82a628b40db26ff`

## Step 2: Add GitHub Secrets via Web Interface

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add each secret below:

### Required Secrets for Both Deployments

| Secret Name | Value | Description |
|---|---|---|
| `CLOUDFLARE_API_TOKEN` | `vDVplcwwlLxxUK6g8Cu67ChP9b68NSkxEWober8n` | Your Cloudflare API token |
| `CLOUDFLARE_ACCOUNT_ID` | `d40d7ee9e42d0a12c82a628b40db26ff` | Your Cloudflare account ID |

### Frontend-Specific Secrets

| Secret Name | Value | Description |
|---|---|---|
| `VITE_API_URL` | `https://your-backend-url.workers.dev` | Backend API URL (update after backend deployment) |
| `VITE_GEMINI_API_KEY` | `AIzaSyCNqikNPkqFeJEeHCh8TcrU-Nlp2IakD7E` | Google Gemini API key |

### Backend-Specific Secrets

| Secret Name | Value | Description |
|---|---|---|
| `BACKEND_PORT` | `3000` | Backend server port |
| `DB_HOST` | Your production DB host | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_NAME` | `insight_edu` | Database name |
| `DB_USER` | Your DB username | PostgreSQL user |
| `DB_PASSWORD` | Your DB password | PostgreSQL password |
| `JWT_SECRET` | Generate a strong secret | JWT signing secret (generate new one!) |
| `JWT_EXPIRES_IN` | `24h` | JWT expiration time |

## Step 3: Add Secrets via GitHub CLI (Alternative)

```bash
# Frontend secrets
gh secret set CLOUDFLARE_API_TOKEN --body "vDVplcwwlLxxUK6g8Cu67ChP9b68NSkxEWober8n"
gh secret set CLOUDFLARE_ACCOUNT_ID --body "d40d7ee9e42d0a12c82a628b40db26ff"
gh secret set VITE_API_URL --body "https://your-backend-url.workers.dev"
gh secret set VITE_GEMINI_API_KEY --body "AIzaSyCNqikNPkqFeJEeHCh8TcrU-Nlp2IakD7E"

# Backend secrets
gh secret set BACKEND_PORT --body "3000"
gh secret set DB_HOST --body "your-db-host"
gh secret set DB_PORT --body "5432"
gh secret set DB_NAME --body "insight_edu"
gh secret set DB_USER --body "your-db-user"
gh secret set DB_PASSWORD --body "your-db-password"
gh secret set JWT_SECRET --body "your-strong-jwt-secret"
gh secret set JWT_EXPIRES_IN --body "24h"
```

## Step 4: Workflow Files

Two workflow files have been created:

1. **`.github/workflows/deploy-frontend.yml`**
   - Triggers on push to `main` branch (frontend changes)
   - Builds frontend with Vite
   - Deploys to Cloudflare Pages

2. **`.github/workflows/deploy-backend.yml`**
   - Triggers on push to `main` branch (backend changes)
   - Runs tests
   - Deploys to Cloudflare Workers

## Step 5: Create Cloudflare Projects

### For Frontend (Pages)

1. Go to Cloudflare Dashboard → Pages
2. Create a new project named `insight-edu-frontend`
3. Connect your GitHub repository
4. Build settings:
   - Framework: None (we're using direct upload)
   - Build command: `npm run build`
   - Build output directory: `dist`

### For Backend (Workers)

1. Create a `wrangler.toml` file in the backend directory
2. Configure your Workers project settings

## Step 6: Deploy

Push to the `main` branch to trigger deployments:

```bash
git add .github/workflows/
git commit -m "Add Cloudflare deployment workflows"
git push origin main
```

Monitor deployments in GitHub Actions tab.

## Important Notes

⚠️ **Security**:
- Never commit `.env` files to version control
- Rotate `JWT_SECRET` regularly in production
- Use strong, unique database passwords
- Keep API tokens secure

⚠️ **Database**:
- Cloudflare Workers cannot directly access PostgreSQL
- Consider using a database proxy or API layer
- Alternatively, migrate to a serverless database (e.g., Neon, Supabase)

⚠️ **Environment Variables**:
- Frontend variables prefixed with `VITE_` are exposed in the browser
- Never put sensitive data in frontend environment variables
- Backend secrets are only used during deployment

## Troubleshooting

### Deployment fails with "Project not found"
- Ensure Cloudflare project names match workflow configuration
- Check that API token has correct permissions

### Build fails
- Verify all dependencies are installed
- Check that build commands match `package.json` scripts
- Review GitHub Actions logs for detailed errors

### Environment variables not loading
- Ensure secrets are added to GitHub repository
- Check secret names match exactly (case-sensitive)
- Verify workflow file references correct secret names

