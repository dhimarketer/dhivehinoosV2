#!/bin/bash

# Build and Push Docker Images to DockerHub
# Usage: ./build_and_push.sh [dockerhub-username] [version] [/nocache]
#   Normal build: Only rebuilds application code layers (dependencies cached)
#   /nocache: Force full rebuild without using cache (rebuilds dependencies too)

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
cd "$PROJECT_ROOT"

# Verify we're in the correct project structure
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ Error: This script must be run from the project root directory!"
    echo "   Expected directories 'backend/' and 'frontend/' not found."
    echo "   Current directory: $(pwd)"
    echo ""
    echo "   This script should be run on your LOCAL machine, not on the Linode server."
    echo "   On Linode, use 'deploy_linode.sh' instead, which pulls pre-built images."
    exit 1
fi

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
if [ -n "$NO_CACHE" ]; then
    echo "Mode: Full rebuild (no cache - rebuilds dependencies and all layers)"
else
    echo "Mode: Incremental build (with cache - only rebuilds changed application code)"
fi
echo ""

# Build images
# Normal builds use Docker layer caching - dependencies cached, only code changes rebuild
# /nocache builds skip all cache and rebuild everything
echo "🔨 Building backend..."
if [ ! -f "docker/Dockerfile.backend" ]; then
    echo "❌ Error: docker/Dockerfile.backend not found!"
    echo "   Make sure you're running this from the project root."
    exit 1
fi
docker build $NO_CACHE -f docker/Dockerfile.backend -t $BACKEND_IMAGE:$VERSION backend/

echo "🔨 Building frontend..."
if [ ! -f "frontend/Dockerfile" ]; then
    echo "❌ Error: frontend/Dockerfile not found!"
    echo "   Make sure you're running this from the project root."
    exit 1
fi
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