#!/bin/bash

# Build and Push Docker Images to DockerHub
# Usage: ./build-and-push.sh [dockerhub-username] [version] [/nocache]
#   /nocache - Force full rebuild without using cache (rebuilds dependencies too)

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
cd "$PROJECT_ROOT"

# Parse arguments
DOCKERHUB_USERNAME=${1:-"dhimarketer"}
VERSION=${2:-"latest"}
NO_CACHE=""

# Check for /nocache flag
for arg in "$@"; do
    if [ "$arg" = "/nocache" ]; then
        NO_CACHE="--no-cache"
        break
    fi
done

BACKEND_IMAGE="$DOCKERHUB_USERNAME/backend"
FRONTEND_IMAGE="$DOCKERHUB_USERNAME/frontend"

echo "🚀 Building and pushing Docker images..."
echo "Username: $DOCKERHUB_USERNAME"
echo "Version: $VERSION"
[ -n "$NO_CACHE" ] && echo "Mode: Full rebuild (no cache)" || echo "Mode: Incremental build (with cache)"
echo ""

# Build images
echo "🔨 Building backend..."
docker build $NO_CACHE -f docker/Dockerfile.backend -t $BACKEND_IMAGE:$VERSION backend/

echo "🔨 Building frontend..."
docker build $NO_CACHE -f frontend/Dockerfile -t $FRONTEND_IMAGE:$VERSION frontend/

# Tag as latest if needed
if [ "$VERSION" != "latest" ]; then
    docker tag $BACKEND_IMAGE:$VERSION $BACKEND_IMAGE:latest
    docker tag $FRONTEND_IMAGE:$VERSION $FRONTEND_IMAGE:latest
fi

# Push images
echo "📤 Pushing images..."
docker push $BACKEND_IMAGE:$VERSION
docker push $FRONTEND_IMAGE:$VERSION
[ "$VERSION" != "latest" ] && docker push $BACKEND_IMAGE:latest && docker push $FRONTEND_IMAGE:latest

echo ""
echo "✅ Done! Images pushed:"
echo "   - $BACKEND_IMAGE:$VERSION"
echo "   - $FRONTEND_IMAGE:$VERSION"
[ "$VERSION" != "latest" ] && echo "   - $BACKEND_IMAGE:latest" && echo "   - $FRONTEND_IMAGE:latest"