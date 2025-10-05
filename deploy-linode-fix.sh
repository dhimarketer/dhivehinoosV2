#!/bin/bash

# Deploy fixes to Linode server
# Run this script on your local machine to deploy the fixes

echo "🚀 Deploying fixes to Linode server..."

# Build and push images locally first
echo "🔨 Building Docker images locally..."
cd /home/mine/Documents/codingProjects/dhivehinoosV2

# Build backend
docker build -f docker/Dockerfile.backend -t dhivehinoos/backend:latest ./backend
echo "✅ Backend image built"

# Build frontend  
docker build -f docker/Dockerfile.frontend -t dhivehinoos/frontend:latest ./frontend
echo "✅ Frontend image built"

# Save images to tar files
echo "💾 Saving images to tar files..."
docker save dhivehinoos/backend:latest -o backend-latest.tar
docker save dhivehinoos/frontend:latest -o frontend-latest.tar

# Copy images to Linode server
echo "📤 Copying images to Linode server..."
scp backend-latest.tar root@dhivehinoos.net:/tmp/
scp frontend-latest.tar root@dhivehinoos.net:/tmp/

# Deploy on Linode server
echo "🚀 Deploying on Linode server..."
ssh root@dhivehinoos.net << 'EOF'
    echo "📥 Loading Docker images..."
    docker load -i /tmp/backend-latest.tar
    docker load -i /tmp/frontend-latest.tar
    
    echo "🛑 Stopping existing containers..."
    docker stop dhivehinoos-backend dhivehinoos-frontend 2>/dev/null || true
    docker rm dhivehinoos-backend dhivehinoos-frontend 2>/dev/null || true
    
    echo "🚀 Starting new containers..."
    docker run -d --name dhivehinoos-backend \
        -p 8000:8000 \
        -v /var/www/dhivehinoos.net/backend/media:/app/media \
        -v /var/www/dhivehinoos.net/backend/database:/app/database \
        -e USE_MEMORY_CACHE=true \
        -e TESTING=true \
        dhivehinoos/backend:latest
    
    docker run -d --name dhivehinoos-frontend \
        -p 80:80 \
        dhivehinoos/frontend:latest
    
    echo "🧹 Cleaning up..."
    rm -f /tmp/backend-latest.tar /tmp/frontend-latest.tar
    
    echo "✅ Deployment complete!"
    echo "🌐 Frontend: http://dhivehinoos.net"
    echo "🔧 Backend API: http://dhivehinoos.net:8000"
EOF

# Clean up local files
echo "🧹 Cleaning up local files..."
rm -f backend-latest.tar frontend-latest.tar

echo "✅ Deployment complete!"
echo "🔑 Admin credentials: username=admin, password=admin123"
echo "🌐 Visit: https://dhivehinoos.net/admin/login"
