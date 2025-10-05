#!/bin/bash

# Deploy Dhivehinoos.net to Linode
# This script pulls the latest Docker images and restarts the services

set -e

echo "🚀 Deploying Dhivehinoos.net to Linode..."

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: docker-compose.yml not found!"
    echo "Please run this script from the directory containing docker-compose.yml"
    exit 1
fi

# Create necessary directories if they don't exist
echo "📁 Creating necessary directories..."
sudo mkdir -p /opt/dhivehinoos/database
sudo mkdir -p /opt/dhivehinoos/media/articles
sudo mkdir -p /opt/dhivehinoos/media/ads
sudo mkdir -p /opt/dhivehinoos/static
sudo mkdir -p /opt/dhivehinoos/logs

# Set proper permissions
echo "🔐 Setting permissions..."
sudo chown -R $USER:$USER /opt/dhivehinoos/

# Pull latest images
echo "📥 Pulling latest Docker images..."
docker pull dhimarketer/backend:latest
docker pull dhimarketer/frontend:latest

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down || true

# Remove old images to free up space
echo "🧹 Cleaning up old images..."
docker image prune -f || true

# Start services
echo "🚀 Starting services..."
docker-compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 30

# Check service status
echo "📊 Checking service status..."
docker-compose ps

# Test backend health
echo "🔍 Testing backend health..."
if curl -f http://localhost:8052/api/v1/articles/published/ > /dev/null 2>&1; then
    echo "✅ Backend is healthy!"
else
    echo "❌ Backend health check failed!"
    echo "📋 Backend logs:"
    docker-compose logs dhivehinoos_backend
fi

# Test frontend
echo "🔍 Testing frontend..."
if curl -f http://localhost:8053/ > /dev/null 2>&1; then
    echo "✅ Frontend is accessible!"
else
    echo "❌ Frontend health check failed!"
    echo "📋 Frontend logs:"
    docker-compose logs dhivehinoos_frontend
fi

echo ""
echo "🎉 Deployment completed!"
echo ""
echo "📋 Service URLs:"
echo "   - Backend API: http://localhost:8052"
echo "   - Frontend: http://localhost:8053"
echo "   - Production: https://dhivehinoos.net"
echo ""
echo "📊 To check logs:"
echo "   docker-compose logs -f"
echo ""
echo "🛑 To stop services:"
echo "   docker-compose down"
echo ""
echo "🔄 To restart services:"
echo "   docker-compose restart"
