#!/bin/bash

# Rebuild and deploy frontend with correct API URL
# This script rebuilds the frontend Docker image and pushes it to Docker Hub

set -e

echo "🔨 Rebuilding frontend with correct API URL..."

# Build the frontend Docker image
echo "📦 Building frontend Docker image..."
cd /home/mine/Documents/codingProjects/dhivehinoosV2/frontend
docker build -t dhimarketer/frontend:latest .

# Push to Docker Hub
echo "📤 Pushing to Docker Hub..."
docker push dhimarketer/frontend:latest

echo "✅ Frontend image rebuilt and pushed!"
echo ""
echo "🚀 Now deploy to Linode:"
echo "   ssh root@[your-linode-ip]"
echo "   cd /opt/dhivehinoos"
echo "   docker pull dhimarketer/frontend:latest"
echo "   docker-compose restart dhivehinoos_frontend"
