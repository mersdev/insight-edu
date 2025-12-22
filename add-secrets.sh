#!/bin/bash
set -euo pipefail

# Script to add all GitHub secrets for Cloudflare deployment
# Usage:
#   ./add-secrets.sh                         # reads backend/.env and frontend/.env
#   ENV_BACKEND=backend/.env ENV_FRONTEND=frontend/.env ./add-secrets.sh

set -euo pipefail

ENV_BACKEND=${ENV_BACKEND:-backend/.env}
ENV_FRONTEND=${ENV_FRONTEND:-frontend/.env}

load_env_file() {
  local file=$1
  if [ ! -f "$file" ]; then
    echo "Environment file '$file' not found." >&2
    exit 1
  fi
  set -a
  # shellcheck disable=SC1090
  source "$file"
  set +a
}

require_var() {
  local name=$1
  local source_file=$2
  if [ -z "${!name:-}" ]; then
    echo "Missing required env var: $name (set it in $source_file)" >&2
    exit 1
  fi
}

echo "🔐 Adding GitHub Secrets for Cloudflare Deployment..."
echo "Using backend env: $ENV_BACKEND"
echo "Using frontend env: $ENV_FRONTEND"
echo ""

load_env_file "$ENV_BACKEND"
load_env_file "$ENV_FRONTEND"

# Validate required values
require_var CLOUDFLARE_API_TOKEN "$ENV_BACKEND"
require_var CLOUDFLARE_ACCOUNT_ID "$ENV_BACKEND"
require_var D1_DATABASE_ID "$ENV_BACKEND"
require_var D1_DATABASE_NAME "$ENV_BACKEND"
require_var RESEND_API_KEY "$ENV_BACKEND"
require_var JWT_SECRET "$ENV_BACKEND"
require_var VITE_API_URL "$ENV_FRONTEND"
require_var VITE_GEMINI_API_KEY "$ENV_FRONTEND"

# Core Cloudflare Credentials
echo "Adding Cloudflare credentials..."
gh secret set CLOUDFLARE_API_TOKEN --body "$CLOUDFLARE_API_TOKEN"
gh secret set CLOUDFLARE_ACCOUNT_ID --body "$CLOUDFLARE_ACCOUNT_ID"
gh secret set D1_DATABASE_ID --body "$D1_DATABASE_ID"
gh secret set D1_DATABASE_NAME --body "$D1_DATABASE_NAME"
echo "✓ Cloudflare credentials added"
echo ""

# Resend Email
echo "Adding Resend credentials..."
gh secret set RESEND_API_KEY --body "$RESEND_API_KEY"
if [ -n "${RESEND_AUDIENCE_ID:-}" ]; then
  gh secret set RESEND_AUDIENCE_ID --body "$RESEND_AUDIENCE_ID"
fi
echo "✓ Resend credentials added"
echo ""

# Backend Secrets
echo "Adding backend secrets..."
gh secret set JWT_SECRET --body "$JWT_SECRET"
gh secret set JWT_EXPIRES_IN --body "${JWT_EXPIRES_IN:-24h}"
echo "✓ Backend secrets added"
echo ""

# Frontend Secrets
echo "Adding frontend secrets..."
gh secret set VITE_API_URL --body "$VITE_API_URL"
gh secret set VITE_GEMINI_API_KEY --body "$VITE_GEMINI_API_KEY"
echo "✓ Frontend secrets added"
echo ""

echo "✅ All secrets added successfully"
