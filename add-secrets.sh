#!/bin/bash

# Script to add all GitHub secrets for Cloudflare deployment

echo "🔐 Adding GitHub Secrets for Cloudflare Deployment..."
echo ""

# Core Cloudflare Credentials
echo "Adding Cloudflare credentials..."
gh secret set CLOUDFLARE_API_TOKEN --body "vDVplcwwlLxxUK6g8Cu67ChP9b68NSkxEWober8n"
gh secret set CLOUDFLARE_ACCOUNT_ID --body "d40d7ee9e42d0a12c82a628b40db26ff"
echo "✓ Cloudflare credentials added"
echo ""

# Frontend Secrets
echo "Adding frontend secrets..."
gh secret set VITE_API_URL --body "https://your-backend-workers-url.workers.dev"
gh secret set VITE_GEMINI_API_KEY --body "AIzaSyCNqikNPkqFeJEeHCh8TcrU-Nlp2IakD7E"
echo "✓ Frontend secrets added"
echo ""

# Backend Secrets
echo "Adding backend secrets..."
gh secret set BACKEND_PORT --body "3000"
gh secret set DB_HOST --body "your-production-database-host"
gh secret set DB_PORT --body "5432"
gh secret set DB_NAME --body "insight_edu"
gh secret set DB_USER --body "your-database-username"
gh secret set DB_PASSWORD --body "your-database-password"
gh secret set JWT_SECRET --body "xaIZA7sAp7/voAhY6hlIElS0pqYw8wa3sGSNyMklSgY="
gh secret set JWT_EXPIRES_IN --body "24h"
echo "✓ Backend secrets added"
echo ""

echo "✅ All secrets added successfully!"
echo ""
echo "⚠️  IMPORTANT: Update these secrets with your actual values:"
echo "   - VITE_API_URL: Update after backend deployment"
echo "   - DB_HOST: Your production database host"
echo "   - DB_USER: Your database username"
echo "   - DB_PASSWORD: Your database password"
echo ""
echo "To update a secret, run:"
echo "   gh secret set SECRET_NAME --body 'new-value'"

