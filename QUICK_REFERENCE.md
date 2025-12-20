# 🚀 Quick Reference - Cloudflare Deployment

## Generated JWT Secret
```
xaIZA7sAp7/voAhY6hlIElS0pqYw8wa3sGSNyMklSgY=
```
Generated with: `openssl rand -base64 32`

## Cloudflare Credentials
```
API Token:   vDVplcwwlLxxUK6g8Cu67ChP9b68NSkxEWober8n
Account ID:  d40d7ee9e42d0a12c82a628b40db26ff
```

## GitHub Secrets Status
✅ All 12 secrets added to `mersdev/insight-edu`

## Update Database Credentials
```bash
gh secret set DB_HOST --body "your-db-host"
gh secret set DB_USER --body "your-db-user"
gh secret set DB_PASSWORD --body "your-db-password"
```

## Update Backend URL (after deployment)
```bash
gh secret set VITE_API_URL --body "https://insight-edu-backend.workers.dev"
```

## View All Secrets
```bash
gh secret list
```

## Deploy
```bash
git push origin main
```

## Monitor
GitHub Actions → https://github.com/mersdev/insight-edu/actions

## Cloudflare Dashboard
https://dash.cloudflare.com/

## Key Files
- `.github/workflows/deploy-frontend.yml` - Frontend workflow
- `.github/workflows/deploy-backend.yml` - Backend workflow
- `DEPLOYMENT_READY.md` - Full deployment guide
- `GITHUB_SECRETS_ADDED.md` - Secrets verification
- `add-secrets.sh` - Secrets setup script

## Troubleshooting
```bash
# View specific secret (values hidden)
gh secret view SECRET_NAME

# Update a secret
gh secret set SECRET_NAME --body "new-value"

# Delete a secret
gh secret delete SECRET_NAME
```

## Important
⚠️ Update placeholder secrets before deploying
⚠️ Database cannot connect directly to Workers
⚠️ Never commit `.env` files
⚠️ Keep JWT_SECRET secure

