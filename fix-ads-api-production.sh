#!/bin/bash

# Fix ads API 500 errors on production
# This script rebuilds and deploys the backend with the latest ads API fixes

set -e

echo "🔧 Fixing ads API 500 errors on production..."

# Check if we're in the right directory
if [ ! -f "backend/manage.py" ]; then
    echo "❌ Error: backend/manage.py not found!"
    echo "Please run this script from the project root directory"
    exit 1
fi

echo "📦 Building new backend Docker image with ads API fixes..."

# Build and push new backend image
cd docker
docker build -f Dockerfile.backend -t dhimarketer/backend:latest ../backend/
docker push dhimarketer/backend:latest

echo "✅ New backend image built and pushed to DockerHub"

echo "🚀 Deploying to production..."
echo "Run this command on your Linode server:"
echo ""
echo "cd /opt/dhivehinoos/docker"
echo "docker pull dhimarketer/backend:latest"
echo "docker-compose down"
echo "docker-compose up -d"
echo ""
echo "Then test the endpoints:"
echo "curl https://dhivehinoos.net/api/v1/ads/admin/"
echo "curl https://dhivehinoos.net/api/v1/ads/placements/"
echo ""
echo "🎉 Deployment script ready!"
