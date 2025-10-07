#!/bin/bash

# Deploy Dhivehinoos.net to Linode with database handling
# This script ensures the database is properly backed up and restored

set -e

echo "🚀 Deploying Dhivehinoos.net to Linode with database handling..."

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

# Check if database exists, if not create a backup note
if [ ! -f "/opt/dhivehinoos/database/db.sqlite3" ]; then
    echo "⚠️  Warning: No existing database found at /opt/dhivehinoos/database/db.sqlite3"
    echo "📝 This means either:"
    echo "   1. This is a fresh deployment"
    echo "   2. The database was lost or moved"
    echo "   3. You need to restore from backup"
    echo ""
    echo "💡 To restore the database, run:"
    echo "   ./backup-and-restore-db.sh [linode-ip] [username]"
    echo ""
    read -p "Do you want to continue with deployment? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Deployment cancelled."
        exit 1
    fi
else
    echo "✅ Existing database found, creating backup..."
    cp /opt/dhivehinoos/database/db.sqlite3 /opt/dhivehinoos/database/db.sqlite3.backup.$(date +%Y%m%d_%H%M%S)
    echo "💾 Database backed up successfully"
fi

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
    
    # Get article count
    ARTICLE_COUNT=$(curl -s http://localhost:8052/api/v1/articles/published/ | grep -o '"count":[0-9]*' | cut -d: -f2 || echo "unknown")
    echo "📰 Articles available: $ARTICLE_COUNT"
    
    if [ "$ARTICLE_COUNT" = "0" ] || [ "$ARTICLE_COUNT" = "unknown" ]; then
        echo "⚠️  Warning: No articles found in database!"
        echo "💡 You may need to restore the database using:"
        echo "   ./backup-and-restore-db.sh [linode-ip] [username]"
    fi
else
    echo "❌ Backend health check failed!"
    echo "📋 Backend logs:"
    docker-compose logs dhivehinoos_backend
    echo ""
    echo "💡 Common fixes:"
    echo "   1. Check if database file exists: ls -la /opt/dhivehinoos/database/"
    echo "   2. Check database permissions: ls -la /opt/dhivehinoos/database/db.sqlite3"
    echo "   3. Restore database: ./backup-and-restore-db.sh [linode-ip] [username]"
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
echo ""
echo "💾 To backup/restore database:"
echo "   ./backup-and-restore-db.sh [linode-ip] [username]"
