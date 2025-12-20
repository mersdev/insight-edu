# Deployment Architecture - Insight EDU

## Overview

Your application has two distinct components with different deployment requirements:

### Frontend (React + Vite)
- **Type**: Static site
- **Deployment Target**: Cloudflare Pages ✅
- **Status**: Ready to deploy

### Backend (Express.js + PostgreSQL)
- **Type**: Traditional Node.js server
- **Deployment Target**: NOT Cloudflare Workers ❌
- **Reason**: Express.js requires persistent Node.js runtime; Workers are serverless functions
- **Status**: Requires traditional Node.js hosting

---

## Why Backend Can't Use Cloudflare Workers

Cloudflare Workers are **serverless functions**, not traditional servers:

| Feature | Cloudflare Workers | Express.js Backend |
|---------|-------------------|-------------------|
| Runtime | Serverless (V8 isolate) | Node.js process |
| Database | Limited (D1, KV) | PostgreSQL (direct) |
| Persistent Connections | ❌ No | ✅ Yes |
| Dependencies | Limited | Full npm ecosystem |
| Execution Time | Max 30 seconds | Unlimited |
| Memory | Limited | Configurable |

---

## Deployment Options for Backend

### Option 1: Railway (Recommended - Easiest)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### Option 2: Render
1. Go to https://render.com
2. Create new Web Service
3. Connect GitHub repository
4. Set build command: `npm install`
5. Set start command: `npm start`
6. Add environment variables

### Option 3: Heroku
```bash
heroku login
heroku create insight-edu-backend
git push heroku main
```

### Option 4: Self-hosted (VPS)
- DigitalOcean, Linode, AWS EC2, etc.
- Use PM2 or systemd for process management
- Set up reverse proxy (Nginx)

---

## Current Workflow Status

### Frontend Workflow ✅
- **File**: `.github/workflows/deploy-frontend.yml`
- **Status**: Fixed and ready
- **Action**: Builds React app → Deploys to Cloudflare Pages
- **Trigger**: Push to main branch

### Backend Workflow ⚠️
- **File**: `.github/workflows/deploy-backend.yml`
- **Status**: Updated to build & test only
- **Action**: Installs deps → Runs tests → Verifies startup
- **Trigger**: Push to main branch
- **Note**: Does NOT deploy (requires manual setup)

---

## Next Steps

1. **Deploy Frontend** (Ready now):
   ```bash
   git push origin main
   # Monitor: GitHub Actions → deploy-frontend workflow
   ```

2. **Set up Backend Hosting**:
   - Choose a hosting provider (Railway recommended)
   - Deploy backend there
   - Get backend URL

3. **Update Frontend API URL**:
   ```bash
   gh secret set VITE_API_URL --body "https://your-backend-url.com"
   ```

4. **Push to trigger frontend redeploy**:
   ```bash
   git push origin main
   ```

---

## Environment Variables

### Frontend (Cloudflare Pages)
- `VITE_API_URL` - Backend API URL
- `VITE_GEMINI_API_KEY` - Google Gemini API key

### Backend (Your hosting provider)
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (production/development)
- `DB_HOST` - PostgreSQL host
- `DB_PORT` - PostgreSQL port
- `DB_NAME` - Database name
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password
- `JWT_SECRET` - JWT signing secret
- `JWT_EXPIRES_IN` - Token expiration (e.g., 24h)

---

## Monitoring Deployments

### Frontend
- GitHub Actions: https://github.com/mersdev/insight-edu/actions
- Cloudflare Dashboard: https://dash.cloudflare.com/

### Backend
- Depends on your hosting provider
- Check provider's dashboard for logs and status

---

## Troubleshooting

### Frontend deployment fails
- Check GitHub Actions logs
- Verify `VITE_API_URL` and `VITE_GEMINI_API_KEY` secrets
- Ensure `frontend/dist` directory is created

### Backend won't start
- Check environment variables are set
- Verify PostgreSQL is accessible
- Check logs in your hosting provider

### API calls fail from frontend
- Verify backend URL in `VITE_API_URL`
- Check CORS configuration in backend
- Ensure backend is running and accessible

