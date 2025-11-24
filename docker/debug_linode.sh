#!/bin/bash

# Debug script for Linode server
# Run this on your Linode server to diagnose issues

echo "========================================="
echo "🔍 Dhivehinoos Frontend Debug Script"
echo "========================================="
echo ""

# 1. Check current running containers
echo "1️⃣ Checking running containers..."
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"
echo ""

# 2. Check frontend container image details
echo "2️⃣ Frontend container image details..."
docker inspect dhivehinoos_frontend --format='{{.Config.Image}}' 2>/dev/null || echo "Container not found"
docker images | grep frontend
echo ""

# 3. Check when frontend image was last pulled/updated
echo "3️⃣ Frontend image creation time..."
docker inspect dhimarketer/frontend:latest --format='{{.Created}}' 2>/dev/null || echo "Image not found locally"
echo ""

# 4. Check frontend container logs (last 50 lines)
echo "4️⃣ Frontend container logs (last 50 lines)..."
docker logs --tail 50 dhivehinoos_frontend 2>&1 | head -50
echo ""

# 5. Check if files were updated in the container
echo "5️⃣ Checking key frontend files in container..."
echo "--- HomePage.jsx (checking slice logic) ---"
docker exec dhivehinoos_frontend grep -A 2 "slice(1)" /usr/share/nginx/html/assets/*.js 2>/dev/null | head -5 || echo "Could not find slice logic in built files"
echo ""

echo "--- TopNavigation.jsx (checking allCategories) ---"
docker exec dhivehinoos_frontend grep -o "allCategories" /usr/share/nginx/html/assets/*.js 2>/dev/null | head -1 || echo "Could not find allCategories in built files"
echo ""

echo "--- AdComponent.jsx (checking max-width) ---"
docker exec dhivehinoos_frontend grep -o "max-w-\[1400px\]" /usr/share/nginx/html/assets/*.js 2>/dev/null | head -1 || echo "Could not find updated max-width in built files"
echo ""

# 6. Check nginx configuration
echo "6️⃣ Checking nginx configuration..."
docker exec dhivehinoos_frontend cat /etc/nginx/conf.d/default.conf 2>/dev/null | grep -A 5 "location /" | head -10 || echo "Could not read nginx config"
echo ""

# 7. Check if we need to pull latest images
echo "7️⃣ Checking Docker Hub for latest image..."
echo "Latest image on Docker Hub (this may take a moment)..."
docker pull dhimarketer/frontend:latest 2>&1 | tail -5
echo ""

# 8. Compare local vs remote image
echo "8️⃣ Comparing local vs remote image..."
LOCAL_IMAGE_ID=$(docker images dhimarketer/frontend:latest --format "{{.ID}}" 2>/dev/null | head -1)
echo "Local image ID: $LOCAL_IMAGE_ID"
echo ""

# 9. Check browser cache headers
echo "9️⃣ Checking cache headers in nginx..."
docker exec dhivehinoos_frontend cat /etc/nginx/conf.d/default.conf 2>/dev/null | grep -i "cache\|expires" || echo "No explicit cache headers found"
echo ""

# 10. Check file timestamps in container
echo "🔟 Checking built file timestamps..."
docker exec dhivehinoos_frontend ls -lh /usr/share/nginx/html/assets/*.js 2>/dev/null | head -5 || echo "Could not list asset files"
echo ""

echo "========================================="
echo "📋 Recommended Actions:"
echo "========================================="
echo "1. If image is outdated, run: docker-compose pull frontend"
echo "2. Restart frontend container: docker-compose restart dhivehinoos_frontend"
echo "3. Or recreate containers: docker-compose up -d --force-recreate dhivehinoos_frontend"
echo "4. Clear browser cache or use incognito mode"
echo "5. Check if nginx is caching: docker exec dhivehinoos_frontend nginx -t"
echo ""



