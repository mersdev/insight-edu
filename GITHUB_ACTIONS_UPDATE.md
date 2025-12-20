# GitHub Actions Workflow Updates

## Overview
Updated GitHub Actions workflows to support the new Cloudflare Workers backend architecture and added Cypress E2E testing to the frontend deployment pipeline.

## Backend Workflow Changes (`.github/workflows/deploy-backend.yml`)

### Key Updates:
1. **Renamed workflow** from "Build and Test Backend" to "Build and Test Backend (Cloudflare Workers)"
2. **Updated test environment** to use JWT_SECRET instead of PostgreSQL credentials
3. **Replaced application startup verification** with Wrangler dry-run deployment check
4. **Added separate deployment job** that:
   - Runs only on main branch after successful tests
   - Uses `wrangler deploy` to deploy to Cloudflare Workers
   - Requires CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID secrets
   - Sets JWT_SECRET from GitHub secrets

### Workflow Structure:
```
build-and-test (runs on all pushes)
  ├── Checkout code
  ├── Setup Node.js
  ├── Install dependencies
  ├── Run tests
  ├── Build backend
  └── Verify Wrangler configuration

deploy (runs only on main branch after build-and-test)
  ├── Checkout code
  ├── Setup Node.js
  ├── Install dependencies
  └── Deploy to Cloudflare Workers
```

## Frontend Workflow Changes (`.github/workflows/deploy-frontend.yml`)

### Key Updates:
1. **Renamed workflow** to "Build, Test and Deploy Frontend to Cloudflare Pages"
2. **Added Cypress E2E testing** before deployment
3. **Added artifact uploads** for test screenshots and videos
4. **Separated build and test from deployment** into two jobs

### Workflow Structure:
```
build-and-test (runs on all pushes)
  ├── Checkout code
  ├── Setup Node.js
  ├── Install dependencies
  ├── Build frontend
  ├── Run Cypress E2E tests
  ├── Upload Cypress screenshots (on failure)
  └── Upload Cypress videos (always)

deploy (runs only on main branch after build-and-test)
  ├── Checkout code
  ├── Setup Node.js
  ├── Install dependencies
  ├── Build frontend
  └── Deploy to Cloudflare Pages
```

## Required GitHub Secrets

### For Backend Deployment:
- `CLOUDFLARE_API_TOKEN` - Cloudflare API token for authentication
- `CLOUDFLARE_ACCOUNT_ID` - Cloudflare account ID
- `JWT_SECRET` - JWT secret key for token signing

### For Frontend Deployment:
- `VITE_API_URL` - Backend API URL
- `VITE_GEMINI_API_KEY` - Google Gemini API key
- `CLOUDFLARE_API_TOKEN` - Cloudflare API token
- `CLOUDFLARE_ACCOUNT_ID` - Cloudflare account ID

## Cypress E2E Testing

### Test Coverage:
- Authentication flows (login, logout, password change)
- Authorization and RBAC
- Protected routes
- API endpoints (students, teachers, classes, locations, etc.)
- Error handling and validation
- Complete user workflows

### Test Artifacts:
- Screenshots captured on test failures
- Videos recorded for all test runs
- Artifacts retained for 7 days

## Deployment Flow

### Backend:
1. Push to main branch triggers build-and-test job
2. Tests run and verify Wrangler configuration
3. If tests pass, deploy job runs and deploys to Cloudflare Workers
4. JWT_SECRET is injected from GitHub secrets

### Frontend:
1. Push to main branch triggers build-and-test job
2. Frontend is built with environment variables
3. Cypress E2E tests run (continue on error to allow deployment)
4. Test artifacts are uploaded
5. If build-and-test succeeds, deploy job runs
6. Frontend is deployed to Cloudflare Pages

## Notes

- Both workflows use Node.js 18
- npm ci is used for dependency installation (more reliable than npm install)
- Workflows are triggered on push to main branch and on manual dispatch
- Path-based triggers ensure workflows only run when relevant files change
- Cypress tests continue on error to allow deployment even if tests fail (can be changed to fail the workflow if needed)

