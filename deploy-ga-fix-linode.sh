#!/bin/bash

# Google Analytics Fix Deployment Script for Linode
# Run these commands on your Linode server via SSH

echo "🚀 Deploying Google Analytics Fixes to Linode..."
echo "==============================================="

# Set the tracking ID
GA_ID="G-MLXXKKVFXQ"

echo "📊 Setting up Google Analytics ID: $GA_ID"

# Navigate to project directory
cd /opt/dhivehinoos

# Pull latest changes from Docker Hub
echo "📥 Pulling latest Docker images..."
docker-compose -f docker/docker-compose.production.yml pull

# Stop current containers
echo "🛑 Stopping current containers..."
docker-compose -f docker/docker-compose.production.yml down

# Start containers with new images
echo "🚀 Starting containers with updated images..."
docker-compose -f docker/docker-compose.production.yml up -d

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
sleep 30

# Set up Google Analytics ID in database
echo "💾 Setting Google Analytics ID in database..."
docker-compose -f docker/docker-compose.production.yml exec backend python manage.py shell << EOF
from settings_app.models import SiteSettings
settings = SiteSettings.get_settings()
settings.google_analytics_id = "$GA_ID"
settings.save()
print(f"Google Analytics ID set to: {settings.google_analytics_id}")
EOF

# Test the implementation
echo "🧪 Testing implementation..."
docker-compose -f docker/docker-compose.production.yml exec backend python -c "
import requests
import re

# Test GA4 ID format
ga4_pattern = r'^G-[A-Z0-9]{8,10}$'
is_valid = bool(re.match(ga4_pattern, '$GA_ID'))
print(f'GA4 ID validation: {\"✓\" if is_valid else \"✗\"}')

# Test settings API
try:
    response = requests.get('http://localhost:8000/api/v1/settings/public/')
    if response.status_code == 200:
        data = response.json()
        print(f'Settings API: ✓')
        print(f'Current GA ID: {data.get(\"google_analytics_id\", \"Not set\")}')
    else:
        print(f'Settings API: ✗ ({response.status_code})')
except Exception as e:
    print(f'Settings API error: {e}')
"

# Check container status
echo "📊 Container status:"
docker-compose -f docker/docker-compose.production.yml ps

echo ""
echo "✅ Google Analytics fix deployed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Visit https://dhivehinoos.net/admin/settings to verify the GA ID is set"
echo "2. Check Google Analytics Real-time reports in 5-10 minutes"
echo "3. Wait 24-48 hours for historical data to appear"
echo ""
echo "🔍 To verify tracking is working:"
echo "1. Open Google Analytics → Real-time → Overview"
echo "2. Visit your website"
echo "3. You should see active users in real-time"
echo ""
echo "📊 Your GA4 Configuration:"
echo "   Stream Name: dhivehinoos"
echo "   Stream URL: https://www.dhivehinoos.net"
echo "   Measurement ID: $GA_ID"
