#!/usr/bin/env bash
# Staging deploy script for Muchi Bari
# Usage: ./deploy-staging.sh

set -euo pipefail

DIR="/var/www/muchibari-staging"
BACKEND_DIR="/var/www/muchibaribackend-staging"
PM2_NAME="muchibari-frontend-staging"
BACKEND_PM2="project-backend-staging"

echo "=== Staging deploy started $(date) ==="

# 1. Kill any next dev processes on port 3001
echo "--- Killing existing next dev on :3001 ---"
fuser -k 3001/tcp 2>/dev/null || true
pkill -f "next dev.*3001" 2>/dev/null || true

# 2. Kill existing PM2 staging process
echo "--- Removing old PM2 staging process ---"
pm2 delete "$PM2_NAME" 2>/dev/null || true
pm2 delete "$BACKEND_PM2" 2>/dev/null || true

# 3. Clean build cache
echo "--- Cleaning build cache ---"
cd "$DIR"
rm -rf .next/cache/turbopack .next/lock 2>/dev/null || true

# 4. Pull latest
echo "--- Pulling latest ---"
git pull origin main

# 5. Install deps (use pnpm)
echo "--- Installing deps ---"
pnpm install --frozen-lockfile

# 6. Build
echo "--- Building ---"
npm run build

# 7. Start frontend
echo "--- Starting frontend PM2 ---"
PORT=3001 pm2 start npm --name "$PM2_NAME" -- start

# 8. Start backend (if not already)
if ! pm2 list | grep -q "$BACKEND_PM2"; then
  echo "--- Starting backend PM2 ---"
  cd "$BACKEND_DIR"
  PORT=5001 pm2 start index.js --name "$BACKEND_PM2"
fi

# 9. Save PM2
pm2 save

echo "=== Staging deploy complete $(date) ==="
echo "Frontend: http://127.0.0.1:3001"
echo "Backend:  http://127.0.0.1:5001"
echo "Domain:   https://staging.muchibaribd.com"
