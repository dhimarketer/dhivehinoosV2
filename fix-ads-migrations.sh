#!/bin/bash

# Fix missing ads database tables on production
# This script runs the necessary migrations for the ads app

set -e

echo "🔧 Fixing missing ads database tables..."

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: docker-compose.yml not found!"
    echo "Please run this script from the docker directory:"
    echo "cd /opt/dhivehinoos/docker"
    exit 1
fi

# Check if backend container is running
if ! docker-compose ps dhivehinoos_backend | grep -q "Up"; then
    echo "❌ Backend container is not running!"
    echo "Starting backend container first..."
    docker-compose up -d dhivehinoos_backend
    sleep 30
fi

echo "📊 Current migration status:"
docker-compose exec dhivehinoos_backend python manage.py showmigrations ads

echo ""
echo "🔄 Running ads migrations..."
docker-compose exec dhivehinoos_backend python manage.py migrate ads

echo ""
echo "📊 Migration status after fix:"
docker-compose exec dhivehinoos_backend python manage.py showmigrations ads

echo ""
echo "🔍 Testing ads debug endpoint..."
if curl -f http://localhost:8052/api/v1/ads/debug/ > /dev/null 2>&1; then
    echo "✅ Ads debug endpoint is working!"
    
    # Show the debug response
    echo "📋 Debug response:"
    curl -s http://localhost:8052/api/v1/ads/debug/ | python3 -m json.tool
else
    echo "❌ Ads debug endpoint still failing"
    echo "📋 Backend logs:"
    docker-compose logs --tail=20 dhivehinoos_backend
fi

echo ""
echo "🎉 Database migration fix completed!"
echo ""
echo "💡 The ads API should now work properly."
echo "   Test the endpoints:"
echo "   curl https://dhivehinoos.net/api/v1/ads/placements/"
echo "   curl https://dhivehinoos.net/api/v1/ads/admin/"
