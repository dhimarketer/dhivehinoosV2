#!/bin/bash

# Deploy Dhivehinoos.net to Linode
# This script pulls the latest Docker images and restarts the services

set -e

echo "🚀 Deploying Dhivehinoos.net to Linode..."

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

# Create necessary directories if they don't exist
echo "📁 Creating necessary directories..."
sudo mkdir -p /opt/dhivehinoos/database
sudo mkdir -p /opt/dhivehinoos/media/articles
sudo mkdir -p /opt/dhivehinoos/media/ads
sudo mkdir -p /opt/dhivehinoos/static
sudo mkdir -p /opt/dhivehinoos/logs
sudo mkdir -p /opt/dhivehinoos/redis

# Set proper permissions
echo "🔐 Setting permissions..."
sudo chown -R 1000:1000 /opt/dhivehinoos/ || echo "⚠️  Warning: Could not set ownership, continuing..."

# Pull latest images
echo "📥 Pulling latest Docker images..."
if ! docker pull dhimarketer/backend:latest; then
    echo "❌ Failed to pull backend image!"
    exit 1
fi
if ! docker pull dhimarketer/frontend:latest; then
    echo "❌ Failed to pull frontend image!"
    exit 1
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down || true

# Remove old images to free up space
echo "🧹 Cleaning up old images..."
docker image prune -f || true

# Start services
echo "🚀 Starting services..."
if ! docker-compose up -d; then
    echo "❌ Failed to start services!"
    echo "📋 Docker Compose logs:"
    docker-compose logs
    exit 1
fi

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 30

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

# Run database migrations
echo "🗄️ Running database migrations..."
if docker-compose exec -T dhivehinoos_backend python manage.py migrate; then
    echo "✅ Migrations completed successfully!"
else
    echo "❌ Migration failed! Check logs:"
    docker-compose logs dhivehinoos_backend
    exit 1
fi

# Create default schedules
echo "📅 Creating default publishing schedules..."
if docker-compose exec -T dhivehinoos_backend python manage.py create_default_schedules; then
    echo "✅ Default schedules created successfully!"
else
    echo "⚠️  Warning: Could not create default schedules, continuing..."
fi

# Set up cron job for scheduled article processing
echo "⏰ Setting up cron job for scheduled article processing..."
CRON_JOB="*/5 * * * * docker-compose -f /opt/dhivehinoos/docker-compose.yml exec -T dhivehinoos_backend python manage.py process_scheduled_articles >> /opt/dhivehinoos/logs/scheduling.log 2>&1"

# Check if cron job already exists
if ! crontab -l 2>/dev/null | grep -q "process_scheduled_articles"; then
    # Add the cron job
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    echo "✅ Cron job added successfully!"
else
    echo "✅ Cron job already exists!"
fi

# Collect static files
echo "📁 Collecting static files..."
if docker-compose exec -T dhivehinoos_backend python manage.py collectstatic --noinput; then
    echo "✅ Static files collected successfully!"
else
    echo "❌ Static file collection failed! Check logs:"
    docker-compose logs dhivehinoos_backend
    exit 1
fi

# Check service status
echo "📊 Checking service status..."
docker-compose ps

# Test backend health
echo "🔍 Testing backend health..."
for i in {1..5}; do
    if curl -f http://localhost:8052/api/v1/articles/health/ > /dev/null 2>&1; then
        echo "✅ Backend is healthy!"
        break
    else
        if [ $i -eq 5 ]; then
            echo "❌ Backend health check failed after 5 attempts!"
            echo "📋 Backend logs:"
            docker-compose logs dhivehinoos_backend
            exit 1
        fi
        echo "⏳ Backend not ready yet, retrying... ($i/5)"
        sleep 10
    fi
done

# Test frontend
echo "🔍 Testing frontend..."
for i in {1..5}; do
    if curl -f http://localhost:8053/ > /dev/null 2>&1; then
        echo "✅ Frontend is accessible!"
        break
    else
        if [ $i -eq 5 ]; then
            echo "❌ Frontend health check failed after 5 attempts!"
            echo "📋 Frontend logs:"
            docker-compose logs dhivehinoos_frontend
            exit 1
        fi
        echo "⏳ Frontend not ready yet, retrying... ($i/5)"
        sleep 10
    fi
done

echo ""
echo "🎉 Deployment completed!"
echo ""
echo "📋 Service URLs:"
echo "   - Backend API: http://localhost:8052"
echo "   - Frontend: http://localhost:8053"
echo "   - Django Admin: http://localhost:8052/admin/"
echo "   - Redis: localhost:8054"
echo "   - Production: https://dhivehinoos.net"
echo ""
echo "🔐 Django Admin Access:"
echo "   - URL: http://localhost:8052/admin/"
echo "   - Create superuser: docker-compose exec dhivehinoos_backend python manage.py createsuperuser"
echo ""
echo "📊 To check logs:"
echo "   docker-compose logs -f"
echo ""
echo "🛑 To stop services:"
echo "   docker-compose down"
echo ""
echo "🔄 To restart services:"
echo "   docker-compose restart"
