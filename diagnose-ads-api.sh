#!/bin/bash

# Comprehensive diagnostic script for ads API 500 errors
# Run this on your Linode server to diagnose the issue

echo "🔍 Comprehensive Ads API Diagnostic"
echo "=================================="

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: docker-compose.yml not found!"
    echo "Please run this script from the docker directory:"
    echo "cd /opt/dhivehinoos/docker"
    exit 1
fi

echo ""
echo "📊 1. Container Status:"
docker-compose ps

echo ""
echo "📋 2. Backend Container Logs (last 50 lines):"
docker-compose logs --tail=50 dhivehinoos_backend

echo ""
echo "🔍 3. Testing Backend Health:"
echo "Testing internal backend (port 8000):"
curl -f http://localhost:8000/api/v1/articles/published/ > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Backend internal health check passed"
else
    echo "❌ Backend internal health check failed"
fi

echo ""
echo "Testing backend through proxy (port 8052):"
curl -f http://localhost:8052/api/v1/articles/published/ > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Backend proxy health check passed"
else
    echo "❌ Backend proxy health check failed"
fi

echo ""
echo "🔍 4. Testing Ads API Endpoints:"
echo "Testing ads admin endpoint:"
curl -s http://localhost:8052/api/v1/ads/admin/ | head -5

echo ""
echo "Testing ads placements endpoint:"
curl -s http://localhost:8052/api/v1/ads/placements/ | head -5

echo ""
echo "Testing ads active endpoint:"
curl -s http://localhost:8052/api/v1/ads/active/?placement=top_banner | head -5

echo ""
echo "🔍 5. Database Connection Test:"
docker-compose exec dhivehinoos_backend python manage.py shell -c "
from ads.models import Ad, AdPlacement;
print(f'AdPlacements count: {AdPlacement.objects.count()}');
print(f'Ads count: {Ad.objects.count()}');
print('AdPlacements:');
for p in AdPlacement.objects.all()[:5]:
    print(f'  - {p.name}: {p.is_active}')
print('Active Ads:');
for a in Ad.objects.filter(is_active=True)[:3]:
    print(f'  - {a.title}: {a.placement}')
" 2>/dev/null || echo "❌ Database connection failed"

echo ""
echo "🔍 6. Django Settings Check:"
docker-compose exec dhivehinoos_backend python manage.py shell -c "
from django.conf import settings;
print(f'DEBUG: {settings.DEBUG}');
print(f'ALLOWED_HOSTS: {settings.ALLOWED_HOSTS}');
print(f'DATABASE: {settings.DATABASES[\"default\"][\"NAME\"]}');
" 2>/dev/null || echo "❌ Django settings check failed"

echo ""
echo "🔍 7. Recent Error Logs:"
if [ -f "/opt/dhivehinoos/logs/django.log" ]; then
    echo "Django logs (last 20 lines):"
    tail -20 /opt/dhivehinoos/logs/django.log
else
    echo "No Django log file found"
fi

echo ""
echo "🔍 8. Container Resource Usage:"
docker stats --no-stream dhivehinoos_backend dhivehinoos_frontend

echo ""
echo "🛠️  Suggested Next Steps:"
echo "1. If backend logs show import errors, run:"
echo "   docker-compose exec dhivehinoos_backend python manage.py check"
echo ""
echo "2. If database errors, run:"
echo "   docker-compose exec dhivehinoos_backend python manage.py migrate"
echo ""
echo "3. If container is unhealthy, restart:"
echo "   docker-compose restart dhivehinoos_backend"
echo ""
echo "4. If all else fails, rebuild:"
echo "   docker-compose down && docker-compose up -d"
echo ""
echo "5. Check Apache logs:"
echo "   sudo tail -f /var/log/apache2/dhivehinoos_ssl_error.log"
