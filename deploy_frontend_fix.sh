#!/bin/bash

# Deploy updated frontend with timeout fixes to Linode
# This script pulls the latest frontend image and restarts the frontend service

set -e

echo "🚀 Deploying updated frontend to Linode..."
echo "=========================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker daemon is not running!"
    echo "Please start Docker service: sudo systemctl start docker"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: docker-compose.yml not found!"
    echo "Please run this script from the directory containing docker-compose.yml"
    exit 1
fi

# Pull latest frontend image
echo "📥 Pulling latest frontend image..."
if ! docker pull dhimarketer/frontend:latest; then
    echo "❌ Failed to pull frontend image!"
    exit 1
fi

# Stop frontend service
echo "🛑 Stopping frontend service..."
docker-compose stop dhivehinoos_frontend || true

# Remove old frontend container
echo "🧹 Removing old frontend container..."
docker-compose rm -f dhivehinoos_frontend || true

# Start frontend service
echo "🚀 Starting updated frontend service..."
if ! docker-compose up -d dhivehinoos_frontend; then
    echo "❌ Failed to start frontend service!"
    echo "📋 Docker Compose logs:"
    docker-compose logs dhivehinoos_frontend
    exit 1
fi

# Wait for frontend to be ready
echo "⏳ Waiting for frontend to be ready..."
for i in {1..10}; do
    if curl -f http://localhost:8053/ > /dev/null 2>&1; then
        echo "✅ Frontend is ready!"
        break
    fi
    echo "⏳ Waiting for frontend... ($i/10)"
    sleep 5
done

# Check service status
echo "📊 Checking service status..."
docker-compose ps

echo ""
echo "🎉 Frontend deployment completed!"
echo ""
echo "📋 Service URLs:"
echo "   - Frontend: http://localhost:8053"
echo "   - Production: https://dhivehinoos.net"
echo ""
echo "🔍 To check logs:"
echo "   docker-compose logs -f dhivehinoos_frontend"
echo ""
echo "✅ The ECONNABORTED errors should now be fixed!"
echo "   - Added 30-second timeout to API requests"
echo "   - Improved error handling for ads and categories"
echo "   - Timeout errors will no longer show error messages"


