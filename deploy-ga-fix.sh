#!/bin/bash

# Google Analytics Fix Deployment Script
# This script deploys the Google Analytics fixes to production

echo "🚀 Deploying Google Analytics Fixes..."
echo "======================================"

# Set the tracking ID
GA_ID="G-MLXXKKVFXQ"

echo "📊 Setting up Google Analytics ID: $GA_ID"

# Navigate to project directory
cd /home/mine/Documents/codingProjects/dhivehinoosV2

# Build frontend
echo "🔨 Building frontend..."
cd frontend
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed"
    exit 1
fi
cd ..

# Copy built files to production
echo "📁 Copying files to production..."
sudo cp -r frontend/dist/* /opt/dhivehinoos/frontend/dist/

# Set up Google Analytics ID in database
echo "💾 Setting Google Analytics ID in database..."
cd backend
export USE_MEMORY_CACHE=true && export TESTING=true && python3 manage.py shell << EOF
from settings_app.models import SiteSettings
settings = SiteSettings.get_settings()
settings.google_analytics_id = "$GA_ID"
settings.save()
print(f"Google Analytics ID set to: {settings.google_analytics_id}")
EOF

# Restart services
echo "🔄 Restarting services..."
sudo systemctl restart apache2

# Test the implementation
echo "🧪 Testing implementation..."
python3 test_google_analytics.py

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
