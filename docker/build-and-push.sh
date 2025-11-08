#!/bin/bash

# Build and Push Docker Images to DockerHub
# Usage: ./build-and-push.sh [dockerhub-username]

set -e

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
# Get the project root (parent of docker directory)
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Change to project root
cd "$PROJECT_ROOT"

# Configuration
DOCKERHUB_USERNAME=${1:-"dhimarketer"}
BACKEND_IMAGE="$DOCKERHUB_USERNAME/backend"
FRONTEND_IMAGE="$DOCKERHUB_USERNAME/frontend"
VERSION=${2:-"latest"}

echo "🚀 Building and pushing Docker images to DockerHub..."
echo "Username: $DOCKERHUB_USERNAME"
echo "Backend Image: $BACKEND_IMAGE:$VERSION"
echo "Frontend Image: $FRONTEND_IMAGE:$VERSION"
echo "Project root: $PROJECT_ROOT"

# Login to DockerHub (you'll need to run this manually first)
echo "📝 Please make sure you're logged in to DockerHub:"
echo "   docker login"
echo ""

# Apply migrations locally before building (if venv exists)
if [ -d "backend/venv" ]; then
    echo "🗄️ Applying database migrations locally..."
    cd backend
    source venv/bin/activate
    python manage.py migrate
    echo "✅ Migrations applied successfully!"
    cd ..
else
    echo "⚠️  No venv found, skipping local migrations (will run in container)"
fi

# Build backend image
echo "🔨 Building backend image..."
docker build -f docker/Dockerfile.backend -t $BACKEND_IMAGE:$VERSION backend/
docker tag $BACKEND_IMAGE:$VERSION $BACKEND_IMAGE:latest

# Build frontend image (no cache to ensure fresh build)
echo "🔨 Building frontend image (no cache)..."
docker build --no-cache -f frontend/Dockerfile -t $FRONTEND_IMAGE:$VERSION frontend/
docker tag $FRONTEND_IMAGE:$VERSION $FRONTEND_IMAGE:latest

# Push images to DockerHub
echo "📤 Pushing backend image to DockerHub..."
docker push $BACKEND_IMAGE:$VERSION
docker push $BACKEND_IMAGE:latest

echo "📤 Pushing frontend image to DockerHub..."
docker push $FRONTEND_IMAGE:$VERSION
docker push $FRONTEND_IMAGE:latest

echo "✅ Successfully built and pushed all images!"
echo ""
echo "🐳 Images pushed:"
echo "   - $BACKEND_IMAGE:$VERSION"
echo "   - $BACKEND_IMAGE:latest"
echo "   - $FRONTEND_IMAGE:$VERSION"
echo "   - $FRONTEND_IMAGE:latest"
echo ""
echo "🚀 To deploy on Linode, use:"
echo "   docker-compose up -d"