#!/bin/bash

# Quick fix for Linode deployment
# Run this on your Linode server

echo "🔧 Quick fix for Dhivehinoos deployment..."

# Stop current containers
echo "🛑 Stopping current containers..."
docker-compose down

# Pull the updated backend image
echo "📥 Pulling updated backend image..."
docker pull dhimarketer/backend:latest

# Update docker-compose.yml with correct health check
echo "📝 Updating docker-compose.yml..."
cat > docker-compose.yml << 'EOF'
version: '3'

services:
  dhivehinoos_backend:
    image: dhimarketer/backend:latest
    container_name: dhivehinoos_backend
    restart: unless-stopped
    ports:
      - "8052:8000"  # Unique port for dhivehinoos backend
    # Load environment variables from .env file in this directory
    env_file:
      - .env
    volumes:
      - /opt/dhivehinoos/database:/app/database
      - /opt/dhivehinoos/media/articles:/app/media/articles
      - /opt/dhivehinoos/media/ads:/app/media/ads
      - /opt/dhivehinoos/static:/app/static
      - /opt/dhivehinoos/logs:/app/logs
    environment:
      # These explicit variables will override any same-named variables from .env
      - DJANGO_SETTINGS_MODULE=dhivehinoos_backend.settings
      - DEBUG=False
      - ALLOWED_HOSTS=dhivehinoos.net,www.dhivehinoos.net,localhost
      - DATABASE_URL=sqlite:////app/database/db.sqlite3
      - SECRET_KEY=${SECRET_KEY}
      - API_INGEST_KEY=${API_INGEST_KEY}
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/api/v1/articles/published/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  dhivehinoos_frontend:
    image: dhimarketer/frontend:latest
    container_name: dhivehinoos_frontend
    restart: unless-stopped
    ports:
      - "8053:80"  # Unique port for dhivehinoos frontend
    depends_on:
      dhivehinoos_backend:
        condition: service_healthy

# Removed unused 'volumes:' and 'networks:' definitions at the root level
# Using host volumes instead for better control and persistence
EOF

# Start services
echo "🚀 Starting services..."
docker-compose up -d

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 30

# Check status
echo "📊 Checking service status..."
docker-compose ps

# Test endpoints
echo "🔍 Testing endpoints..."
if curl -f http://localhost:8052/api/v1/articles/published/ > /dev/null 2>&1; then
    echo "✅ Backend is working!"
else
    echo "❌ Backend still not working. Checking logs..."
    docker-compose logs dhivehinoos_backend | tail -20
fi

if curl -f http://localhost:8053/ > /dev/null 2>&1; then
    echo "✅ Frontend is working!"
else
    echo "❌ Frontend not working. Checking logs..."
    docker-compose logs dhivehinoos_frontend | tail -20
fi

echo ""
echo "🎉 Quick fix completed!"
echo "Backend: http://localhost:8052"
echo "Frontend: http://localhost:8053"
