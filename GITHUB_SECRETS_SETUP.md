# GitHub Secrets Setup Guide

## Overview
This guide explains how to set up the required GitHub Secrets for automated deployment of the Insight EDU application.

## Required Secrets

### 1. Cloudflare Secrets (Required for both backend and frontend)

#### CLOUDFLARE_API_TOKEN
- **Purpose**: Authenticate with Cloudflare API
- **How to get**:
  1. Go to https://dash.cloudflare.com/profile/api-tokens
  2. Click "Create Token"
  3. Use "Edit Cloudflare Workers" template
  4. Grant permissions for:
     - Account.Workers Scripts (Edit)
     - Account.Workers KV Storage (Edit)
     - Account.Workers Routes (Edit)
     - Account.D1 (Edit)
  5. Copy the token

#### CLOUDFLARE_ACCOUNT_ID
- **Purpose**: Identify your Cloudflare account
- **How to get**:
  1. Go to https://dash.cloudflare.com/
  2. Click on any domain or account
  3. Copy the Account ID from the right sidebar
  4. Format: 32-character alphanumeric string

### 2. Backend Secrets

#### JWT_SECRET
- **Purpose**: Sign and verify JWT tokens
- **How to generate**:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- **Security**: Keep this secret and never commit to repository

### 3. Frontend Secrets

#### VITE_API_URL
- **Purpose**: Backend API endpoint URL
- **Example**: `https://insight-edu-backend.workers.dev/api`
- **Note**: Update after deploying backend to Cloudflare Workers

#### VITE_GEMINI_API_KEY
- **Purpose**: Google Gemini API for AI features
- **How to get**:
  1. Go to https://aistudio.google.com/app/apikey
  2. Create a new API key
  3. Copy the key

## Setting Up Secrets in GitHub

### Step 1: Navigate to Repository Settings
1. Go to your GitHub repository
2. Click "Settings" tab
3. Click "Secrets and variables" → "Actions"

### Step 2: Add Each Secret
1. Click "New repository secret"
2. Enter the secret name (exactly as listed above)
3. Paste the secret value
4. Click "Add secret"

### Step 3: Verify All Secrets Are Added
You should have these secrets configured:
- ✅ CLOUDFLARE_API_TOKEN
- ✅ CLOUDFLARE_ACCOUNT_ID
- ✅ JWT_SECRET
- ✅ VITE_API_URL
- ✅ VITE_GEMINI_API_KEY

## Workflow Execution

### Backend Deployment
1. Push changes to `backend/` directory
2. GitHub Actions automatically:
   - Installs dependencies
   - Runs tests
   - Verifies Wrangler configuration
   - Deploys to Cloudflare Workers (if on main branch)

### Frontend Deployment
1. Push changes to `frontend/` directory
2. GitHub Actions automatically:
   - Installs dependencies
   - Builds the application
   - Runs Cypress E2E tests
   - Uploads test artifacts
   - Deploys to Cloudflare Pages (if on main branch)

## Troubleshooting

### Deployment Fails with "Invalid API Token"
- Verify CLOUDFLARE_API_TOKEN is correct
- Check token has required permissions
- Regenerate token if needed

### Tests Fail in GitHub Actions
- Check VITE_API_URL is correct
- Verify backend is deployed and accessible
- Review Cypress test artifacts in Actions tab

### Frontend Build Fails
- Verify VITE_GEMINI_API_KEY is set
- Check VITE_API_URL format is correct
- Review build logs in Actions tab

## Security Best Practices

1. **Never commit secrets** to repository
2. **Rotate secrets regularly** (every 90 days)
3. **Use strong JWT_SECRET** (32+ characters)
4. **Limit API token permissions** to minimum required
5. **Monitor secret usage** in Cloudflare dashboard
6. **Revoke old tokens** when rotating

## Updating Secrets

To update a secret:
1. Go to Settings → Secrets and variables → Actions
2. Click the secret name
3. Click "Update secret"
4. Enter new value
5. Click "Update secret"

Changes take effect on next workflow run.

