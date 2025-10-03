#!/bin/bash

# Troubleshoot Dhivehinoos deployment on Linode
# Run this script on your Linode server

echo "🔍 Troubleshooting Dhivehinoos deployment..."

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ docker-compose.yml not found. Please run this from the docker directory."
    echo "   cd /opt/dhivehinoos/docker"
    exit 1
fi

echo "📊 Current container status:"
docker-compose ps

echo ""
echo "📋 Backend container logs:"
docker-compose logs dhivehinoos_backend

echo ""
echo "📋 Frontend container logs:"
docker-compose logs dhivehinoos_frontend

echo ""
echo "🔍 Checking if backend is responding:"
if curl -f http://localhost:8052/api/articles/ > /dev/null 2>&1; then
    echo "✅ Backend is responding!"
else
    echo "❌ Backend is not responding. Checking port 8000 directly..."
    if curl -f http://localhost:8000/api/articles/ > /dev/null 2>&1; then
        echo "✅ Backend is responding on port 8000 (internal)"
    else
        echo "❌ Backend is not responding on any port"
    fi
fi

echo ""
echo "🔍 Checking container health:"
docker inspect dhivehinoos_backend --format='{{.State.Health.Status}}' 2>/dev/null || echo "No health check found"

echo ""
echo "🔍 Checking if required directories exist:"
ls -la /opt/dhivehinoos/

echo ""
echo "🔍 Checking environment variables:"
docker-compose config

echo ""
echo "🛠️  Suggested fixes:"
echo "1. If backend logs show database errors, run:"
echo "   docker-compose exec dhivehinoos_backend python manage.py migrate"
echo ""
echo "2. If backend logs show permission errors, run:"
echo "   sudo chown -R 1000:1000 /opt/dhivehinoos/"
echo ""
echo "3. If backend logs show missing dependencies, run:"
echo "   docker-compose down && docker-compose up -d --build"
echo ""
echo "4. To restart everything:"
echo "   docker-compose down && docker-compose up -d"
