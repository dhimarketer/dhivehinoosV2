#!/bin/bash

# Deploy Dhivehinoos.net to Linode
# This script pulls the latest Docker images and restarts the services
# Optimized for faster deployments with parallel operations and smart health checks

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

# Create necessary directories if they don't exist (only if missing - faster)
echo "📁 Ensuring directories exist..."
sudo mkdir -p /opt/dhivehinoos/{database,media/{articles,ads,reusable_images},static,logs,redis}

# Set proper permissions (only if needed - check first)
if [ "$(stat -c '%U:%G' /opt/dhivehinoos 2>/dev/null)" != "1000:1000" ]; then
    echo "🔐 Setting permissions..."
    sudo chown -R 1000:1000 /opt/dhivehinoos/ || echo "⚠️  Warning: Could not set ownership, continuing..."
fi

# Pull latest images in parallel using docker-compose (more efficient)
echo "📥 Pulling latest Docker images..."
if ! docker-compose pull; then
    echo "❌ Failed to pull Docker images!"
    exit 1
fi

# Stop existing containers (graceful shutdown)
echo "🛑 Stopping existing containers..."
docker-compose down || true

# Start services with pull (ensures latest images are used)
echo "🚀 Starting services..."
if ! docker-compose up -d; then
    echo "❌ Failed to start services!"
    echo "📋 Docker Compose logs:"
    docker-compose logs
    exit 1
fi

# Wait for Redis to be ready (optimized - check immediately, then with shorter intervals)
echo "⏳ Waiting for Redis to be ready..."
REDIS_READY=false
for i in {1..15}; do
    if docker-compose exec -T dhivehinoos_redis redis-cli ping > /dev/null 2>&1; then
        echo "✅ Redis is ready!"
        REDIS_READY=true
        break
    fi
    if [ $i -lt 5 ]; then
        sleep 1  # Faster initial checks
    else
        sleep 2  # Slightly longer after initial attempts
    fi
done
if [ "$REDIS_READY" = false ]; then
    echo "⚠️  Warning: Redis may not be fully ready, continuing..."
fi

# Wait for backend to be ready (optimized - use healthcheck endpoint if available)
echo "⏳ Waiting for backend to be ready..."
BACKEND_READY=false
for i in {1..20}; do
    # Try health endpoint first, fallback to published articles endpoint
    if docker-compose exec -T dhivehinoos_backend curl -f http://localhost:8000/api/v1/articles/health/ > /dev/null 2>&1 || \
       docker-compose exec -T dhivehinoos_backend curl -f http://localhost:8000/api/v1/articles/published/ > /dev/null 2>&1; then
        echo "✅ Backend is ready!"
        BACKEND_READY=true
        break
    fi
    if [ $i -lt 5 ]; then
        sleep 2  # Faster initial checks
    else
        sleep 3  # Slightly longer after initial attempts
    fi
done
if [ "$BACKEND_READY" = false ]; then
    echo "⚠️  Warning: Backend may not be fully ready, continuing..."
fi

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

# Test backend health (optimized - shorter waits)
echo "🔍 Testing backend health..."
BACKEND_HEALTHY=false
for i in {1..5}; do
    if curl -f http://localhost:8052/api/v1/articles/health/ > /dev/null 2>&1 || \
       curl -f http://localhost:8052/api/v1/articles/published/ > /dev/null 2>&1; then
        echo "✅ Backend is healthy!"
        BACKEND_HEALTHY=true
        break
    fi
    if [ $i -lt 3 ]; then
        sleep 3  # Faster initial checks
    else
        sleep 5  # Slightly longer after initial attempts
    fi
done
if [ "$BACKEND_HEALTHY" = false ]; then
    echo "❌ Backend health check failed after 5 attempts!"
    echo "📋 Backend logs:"
    docker-compose logs --tail=50 dhivehinoos_backend
    exit 1
fi

# Test frontend (optimized - shorter waits)
echo "🔍 Testing frontend..."
FRONTEND_HEALTHY=false
for i in {1..5}; do
    if curl -f http://localhost:8053/ > /dev/null 2>&1; then
        echo "✅ Frontend is accessible!"
        FRONTEND_HEALTHY=true
        break
    fi
    if [ $i -lt 3 ]; then
        sleep 3  # Faster initial checks
    else
        sleep 5  # Slightly longer after initial attempts
    fi
done
if [ "$FRONTEND_HEALTHY" = false ]; then
    echo "❌ Frontend health check failed after 5 attempts!"
    echo "📋 Frontend logs:"
    docker-compose logs --tail=50 dhivehinoos_frontend
    exit 1
fi

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
