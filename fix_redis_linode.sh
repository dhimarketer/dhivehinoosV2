#!/bin/bash

# Fix Redis configuration on Linode deployment
# This script updates the docker-compose.yml to enable Redis caching

set -e

echo "🔧 Fixing Redis configuration on Linode..."
echo "=========================================="

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: docker-compose.yml not found!"
    echo "Please run this script from the directory containing docker-compose.yml"
    exit 1
fi

# Backup current docker-compose.yml
echo "💾 Creating backup of docker-compose.yml..."
cp docker-compose.yml docker-compose.yml.backup.$(date +%Y%m%d_%H%M%S)

# Fix the USE_MEMORY_CACHE setting
echo "🔧 Updating USE_MEMORY_CACHE setting..."
if grep -q "USE_MEMORY_CACHE=true" docker-compose.yml; then
    sed -i 's/USE_MEMORY_CACHE=true/USE_MEMORY_CACHE=false/' docker-compose.yml
    echo "✅ Changed USE_MEMORY_CACHE from true to false"
else
    echo "ℹ️  USE_MEMORY_CACHE setting not found or already correct"
fi

# Ensure Redis service is defined
if ! grep -q "dhivehinoos_redis:" docker-compose.yml; then
    echo "❌ Error: Redis service not found in docker-compose.yml!"
    echo "Please check your docker-compose.yml configuration"
    exit 1
fi

echo "✅ Redis service configuration verified"

# Stop services
echo "🛑 Stopping services..."
docker-compose down || true

# Start Redis first
echo "🚀 Starting Redis service..."
docker-compose up -d dhivehinoos_redis

# Wait for Redis to be ready
echo "⏳ Waiting for Redis to be ready..."
for i in {1..20}; do
    if docker-compose exec -T dhivehinoos_redis redis-cli ping > /dev/null 2>&1; then
        echo "✅ Redis is ready!"
        break
    fi
    echo "⏳ Waiting for Redis... ($i/20)"
    sleep 3
done

# Start backend
echo "🚀 Starting backend service..."
docker-compose up -d dhivehinoos_backend

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
for i in {1..30}; do
    if docker-compose exec -T dhivehinoos_backend curl -f http://localhost:8000/api/v1/articles/health/ > /dev/null 2>&1; then
        echo "✅ Backend is ready!"
        break
    fi
    echo "⏳ Waiting for backend... ($i/30)"
    sleep 5
done

# Test Redis connection from backend
echo "🔍 Testing Redis connection from backend..."
if docker-compose exec -T dhivehinoos_backend python -c "
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dhivehinoos_backend.settings')
django.setup()

from django.core.cache import cache
print(f'Cache backend: {cache.__class__.__name__}')

try:
    cache.set('test_key', 'test_value', 10)
    retrieved = cache.get('test_key')
    if retrieved == 'test_value':
        print('✅ Redis cache is working!')
    else:
        print('❌ Redis cache test failed')
    cache.delete('test_key')
except Exception as e:
    print(f'❌ Redis cache error: {e}')
" 2>/dev/null; then
    echo "✅ Redis connection test completed"
else
    echo "❌ Redis connection test failed"
fi

# Start frontend
echo "🚀 Starting frontend service..."
docker-compose up -d dhivehinoos_frontend

# Check final status
echo ""
echo "📊 Final service status:"
docker-compose ps

echo ""
echo "🎉 Redis fix completed!"
echo ""
echo "📋 Service URLs:"
echo "   - Backend API: http://localhost:8052"
echo "   - Frontend: http://localhost:8053"
echo "   - Redis: localhost:8054 (internal only)"
echo "   - Production: https://dhivehinoos.net"
echo ""
echo "🔍 To verify Redis is working:"
echo "   ./check_redis_linode.sh"
echo ""
echo "📊 To monitor logs:"
echo "   docker-compose logs -f dhivehinoos_redis"


