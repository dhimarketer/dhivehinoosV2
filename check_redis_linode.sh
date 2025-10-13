#!/bin/bash

# Script to check Redis status on Linode deployment
# Run this script on your Linode server to diagnose Redis issues

echo "🔍 Checking Redis status on Linode deployment..."
echo "================================================"

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

echo "📊 Current Docker containers status:"
docker-compose ps

echo ""
echo "🔍 Checking Redis container specifically:"
if docker-compose ps | grep -q "dhivehinoos_redis"; then
    echo "✅ Redis container exists"
    
    # Check if Redis is healthy
    if docker-compose exec -T dhivehinoos_redis redis-cli ping 2>/dev/null | grep -q "PONG"; then
        echo "✅ Redis is responding to ping"
    else
        echo "❌ Redis is not responding to ping"
    fi
    
    # Check Redis info
    echo ""
    echo "📊 Redis server info:"
    docker-compose exec -T dhivehinoos_redis redis-cli info server 2>/dev/null | head -10 || echo "Could not get Redis info"
    
    # Check Redis memory usage
    echo ""
    echo "💾 Redis memory usage:"
    docker-compose exec -T dhivehinoos_redis redis-cli info memory 2>/dev/null | grep -E "(used_memory_human|maxmemory_human)" || echo "Could not get memory info"
    
else
    echo "❌ Redis container not found!"
    echo "Available containers:"
    docker-compose ps
fi

echo ""
echo "🔍 Checking backend Redis connection:"
if docker-compose exec -T dhivehinoos_backend python -c "
import os
print('Environment variables:')
print(f'REDIS_URL: {os.environ.get(\"REDIS_URL\", \"Not set\")}')
print(f'USE_MEMORY_CACHE: {os.environ.get(\"USE_MEMORY_CACHE\", \"Not set\")}')

# Test Django cache
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dhivehinoos_backend.settings')
django.setup()

from django.core.cache import cache
print(f'Cache backend: {cache.__class__.__name__}')

# Test cache operations
try:
    cache.set('test_key', 'test_value', 10)
    retrieved = cache.get('test_key')
    print(f'Cache test: {retrieved == \"test_value\"}')
    cache.delete('test_key')
    print('✅ Redis cache is working!')
except Exception as e:
    print(f'❌ Cache error: {e}')
" 2>/dev/null; then
    echo "✅ Backend Redis connection test completed"
else
    echo "❌ Backend Redis connection test failed"
fi

echo ""
echo "🌐 Testing external Redis port access:"
if curl -s --connect-timeout 5 http://localhost:8054/info > /dev/null 2>&1; then
    echo "✅ Redis port 8054 is accessible externally"
else
    echo "❌ Redis port 8054 is not accessible externally"
    echo "This is normal - Redis should only be accessible internally"
fi

echo ""
echo "📋 Summary:"
echo "- If Redis container is running and responding to ping: ✅ Redis is working"
echo "- If backend cache test passes: ✅ Django can use Redis"
echo "- If Redis port 8054 is not accessible externally: ✅ This is correct (security)"
echo ""
echo "🔧 If Redis is not working, run:"
echo "   docker-compose restart dhivehinoos_redis dhivehinoos_backend"
echo ""
echo "📊 To monitor Redis in real-time:"
echo "   docker-compose logs -f dhivehinoos_redis"


