#!/bin/bash

# Run this script on your Linode server to update the application
# This script pulls the latest code and rebuilds the containers

echo "🚀 Updating Dhivehinoos application on Linode..."

# Navigate to project directory
cd /var/www/dhivehinoos.net

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker stop dhivehinoos-backend dhivehinoos-frontend 2>/dev/null || true
docker rm dhivehinoos-backend dhivehinoos-frontend 2>/dev/null || true

# Build new images
echo "🔨 Building new Docker images..."
docker build -f docker/Dockerfile.backend -t dhivehinoos/backend:latest ./backend
docker build -f docker/Dockerfile.frontend -t dhivehinoos/frontend:latest ./frontend

# Start new containers
echo "🚀 Starting new containers..."
docker run -d --name dhivehinoos-backend \
    -p 8000:8000 \
    -v /var/www/dhivehinoos.net/backend/media:/app/media \
    -v /var/www/dhivehinoos.net/backend/database:/app/database \
    -e USE_MEMORY_CACHE=true \
    -e TESTING=true \
    dhivehinoos/backend:latest

docker run -d --name dhivehinoos-frontend \
    -p 80:80 \
    dhivehinoos/frontend:latest

echo "✅ Update complete!"
echo "🌐 Frontend: http://dhivehinoos.net"
echo "🔧 Backend API: http://dhivehinoos.net:8000"
echo "🔑 Admin credentials: username=admin, password=admin123"
