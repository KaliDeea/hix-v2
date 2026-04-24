#!/bin/bash

# HiX App Update Script for VM
# This script automates the process of updating the application on your virtual machine.

echo "🚀 Starting HiX App Update..."

# 1. Pull the latest code (assuming git is configured)
if [ -d ".git" ]; then
    echo "📥 Pulling latest changes from Git..."
    git pull origin main
else
    echo "⚠️ Git repository not found. Skipping git pull. Ensure you have uploaded the latest files."
fi

# 2. Install dependencies
echo "📦 Installing dependencies..."
npm install

# 3. Build the frontend
echo "🏗️ Building frontend..."
npm run build

# 4. Restart the application
if command -v pm2 &> /dev/null; then
    echo "🔄 Restarting app with PM2..."
    # Ensure PM2 uses the package.json start script which sets NODE_ENV=production
    pm2 stop all || true
    pm2 delete all || true
    pm2 start npm --name "hix-app" -- start
else
    echo "⚠️ PM2 not found. Restarting manually..."
    # Kill existing tsx processes if any
    pkill -f "tsx server.ts"
    echo "▶️ Starting server in background..."
    nohup npm start > app.log 2>&1 &
    echo "✅ Server started. Logs available in app.log"
fi

echo "✨ Update complete! Your app should be live at your VM's IP/domain."
