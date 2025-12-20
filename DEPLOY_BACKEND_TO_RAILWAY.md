# Deploy Backend to Railway

Railway is the easiest way to deploy your Express.js backend. It handles PostgreSQL, environment variables, and automatic deployments from GitHub.

## Step 1: Create Railway Account

1. Go to https://railway.app
2. Sign up with GitHub (recommended)
3. Authorize Railway to access your repositories

## Step 2: Create New Project

1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Select `mersdev/insight-edu` repository
4. Select `backend` directory (if prompted)

## Step 3: Add PostgreSQL Database

1. In Railway dashboard, click "Add Service"
2. Select "PostgreSQL"
3. Railway will automatically create a database
4. Note the connection details

## Step 4: Configure Environment Variables

In Railway dashboard, go to Variables and add:

```
PORT=3000
NODE_ENV=production
DB_HOST=<railway-postgres-host>
DB_PORT=5432
DB_NAME=<database-name>
DB_USER=<database-user>
DB_PASSWORD=<database-password>
JWT_SECRET=xaIZA7sAp7/voAhY6hlIElS0pqYw8wa3sGSNyMklSgY=
JWT_EXPIRES_IN=24h
```

Get PostgreSQL details from Railway's PostgreSQL service variables.

## Step 5: Configure Build & Start Commands

In Railway dashboard, go to Settings:

**Build Command**:
```bash
npm install
```

**Start Command**:
```bash
npm start
```

## Step 6: Deploy

1. Click "Deploy" button
2. Wait for deployment to complete
3. Get your backend URL from Railway dashboard
4. It will be something like: `https://insight-edu-backend-prod.up.railway.app`

## Step 7: Update Frontend Secret

Once backend is deployed, update the frontend API URL:

```bash
gh secret set VITE_API_URL --body "https://your-railway-backend-url"
```

Then push to trigger frontend redeploy:

```bash
git push origin main
```

## Step 8: Verify Deployment

1. Check Railway logs for any errors
2. Test backend health endpoint:
   ```bash
   curl https://your-railway-backend-url/health
   ```
3. Should return: `{"status":"ok","message":"Server is running"}`

## Automatic Deployments

Railway automatically deploys when you push to main branch:

1. Push changes to backend:
   ```bash
   git push origin main
   ```
2. Railway detects changes
3. Automatically rebuilds and deploys
4. Check Railway dashboard for deployment status

## Database Migrations

If you need to run migrations on Railway:

1. Connect to Railway PostgreSQL:
   ```bash
   railway connect postgres
   ```
2. Run migrations:
   ```bash
   psql -h <host> -U <user> -d <database> -f backend/init.sql
   ```

## Troubleshooting

### Deployment fails
- Check Railway logs for error messages
- Verify all environment variables are set
- Ensure `npm start` works locally

### Database connection fails
- Verify `DB_HOST`, `DB_USER`, `DB_PASSWORD` are correct
- Check PostgreSQL service is running in Railway
- Test connection locally first

### Application crashes
- Check Railway logs
- Verify all dependencies are in `package.json`
- Test locally: `npm install && npm start`

## Cost

Railway offers:
- Free tier: $5/month credit
- Pay-as-you-go after that
- PostgreSQL included in free tier

## Alternative Hosting Providers

If you prefer other options:
- **Render**: https://render.com (free tier available)
- **Heroku**: https://heroku.com (paid only now)
- **Fly.io**: https://fly.io (free tier available)
- **DigitalOcean**: https://digitalocean.com (paid, $5/month)

