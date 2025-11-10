#!/bin/bash

# Build and Push Docker Images to DockerHub
# Usage: ./build-and-push.sh [dockerhub-username] [version]

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
echo ""

# Check if logged in to DockerHub
if ! docker info | grep -q "Username"; then
    echo "⚠️  Warning: You may not be logged in to DockerHub"
    echo "   Run 'docker login' if needed"
    echo ""
fi

# Build backend image
echo "🔨 Building backend image..."
docker build -f docker/Dockerfile.backend -t $BACKEND_IMAGE:$VERSION backend/

# Build frontend image
echo "🔨 Building frontend image..."
docker build -f frontend/Dockerfile -t $FRONTEND_IMAGE:$VERSION frontend/

# Tag as latest if version is not already latest
if [ "$VERSION" != "latest" ]; then
    echo "🏷️  Tagging images as latest..."
    docker tag $BACKEND_IMAGE:$VERSION $BACKEND_IMAGE:latest
    docker tag $FRONTEND_IMAGE:$VERSION $FRONTEND_IMAGE:latest
fi

# Push images to DockerHub
echo "📤 Pushing backend image to DockerHub..."
docker push $BACKEND_IMAGE:$VERSION
if [ "$VERSION" != "latest" ]; then
    docker push $BACKEND_IMAGE:latest
fi

echo "📤 Pushing frontend image to DockerHub..."
docker push $FRONTEND_IMAGE:$VERSION
if [ "$VERSION" != "latest" ]; then
    docker push $FRONTEND_IMAGE:latest
fi

echo ""
echo "✅ Successfully built and pushed all images!"
echo ""
echo "🐳 Images pushed:"
echo "   - $BACKEND_IMAGE:$VERSION"
if [ "$VERSION" != "latest" ]; then
    echo "   - $BACKEND_IMAGE:latest"
fi
echo "   - $FRONTEND_IMAGE:$VERSION"
if [ "$VERSION" != "latest" ]; then
    echo "   - $FRONTEND_IMAGE:latest"
fi