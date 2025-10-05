#!/bin/bash

# Deploy authentication fix to production server
# This script updates the production server with the new authentication system

echo "🚀 Deploying authentication fix to production..."

# Set production API URL for frontend
echo "📝 Updating frontend API configuration..."
cd frontend
sed -i 's|http://localhost:8000/api/v1|https://dhivehinoos.net/api/v1|g' src/services/api.js
sed -i 's|http://localhost:8000/api/v1|https://dhivehinoos.net/api/v1|g' src/pages/admin/AdminLogin.jsx

# Build frontend
echo "🔨 Building frontend..."
npm run build

# Deploy to production
echo "📤 Deploying to production server..."
rsync -avz --delete dist/ root@dhivehinoos.net:/var/www/dhivehinoos.net/

# Update backend on production
echo "🔧 Updating backend on production server..."
cd ../backend

# Copy new auth app
scp -r custom_auth root@dhivehinoos.net:/var/www/dhivehinoos.net/backend/

# Update settings and URLs
scp dhivehinoos_backend/settings.py root@dhivehinoos.net:/var/www/dhivehinoos.net/backend/dhivehinoos_backend/
scp dhivehinoos_backend/urls.py root@dhivehinoos.net:/var/www/dhivehinoos.net/backend/dhivehinoos_backend/

# Restart services on production
echo "🔄 Restarting services on production server..."
ssh root@dhivehinoos.net "cd /var/www/dhivehinoos.net/backend && source venv/bin/activate && python manage.py migrate && systemctl restart apache2"

echo "✅ Authentication fix deployed successfully!"
echo "🔑 Admin credentials: username=admin, password=admin123"
echo "🌐 Visit: https://dhivehinoos.net/admin/login"
