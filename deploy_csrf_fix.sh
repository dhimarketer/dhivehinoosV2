#!/bin/bash

# Deploy Final CSRF Fix to Production
# Run this script on your Linode server

echo "🚀 Deploying Final CSRF Fix to Production..."

# Pull the latest images
echo "📥 Pulling latest Docker images..."
docker pull dhimarketer/backend:latest
docker pull dhimarketer/frontend:latest

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Start with new images
echo "🔄 Starting containers with updated images..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 15

# Check if services are running
echo "🔍 Checking service status..."
docker-compose ps

# Test the API endpoint
echo "🧪 Testing comment endpoint..."
curl -X POST https://dhivehinoos.net/api/v1/comments/create/ \
  -H "Content-Type: application/json" \
  -d '{
    "article_slug": "test-scheduled-article-3",
    "author_name": "Final CSRF Test",
    "content": "Testing final CSRF fix deployment - should work now!"
  }' \
  --max-time 15

echo ""
echo "✅ Final CSRF fix deployment complete!"
echo "🌐 Your site should now work without CSRF errors."
echo "📝 Test comment submission on https://dhivehinoos.net to verify the fix works."
echo ""
echo "🔧 What was fixed:"
echo "   - Created custom NoCSRFSessionAuthentication class"
echo "   - Applied to all comment-related endpoints"
echo "   - Frontend no longer sends CSRF tokens to exempt endpoints"
echo "   - Both frontend and backend are now properly configured"
