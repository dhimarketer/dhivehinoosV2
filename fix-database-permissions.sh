#!/bin/bash

# Fix database permissions for Dhivehinoos.net
# This script fixes the "readonly database" error that prevents n8n from writing

set -e

LINODE_IP=${1:-"your-linode-ip"}
USERNAME=${2:-"root"}

echo "🔧 Fixing database permissions for Dhivehinoos.net..."
echo "Server: $USERNAME@$LINODE_IP"

# Stop the backend container first
echo "🛑 Stopping backend container..."
ssh $USERNAME@$LINODE_IP "cd /opt/dhivehinoos/docker && docker-compose stop dhivehinoos_backend"

# Fix database permissions - the container runs as user 1000 (django)
echo "🔐 Fixing database permissions..."
ssh $USERNAME@$LINODE_IP "chown -R 1000:1000 /opt/dhivehinoos/database"
ssh $USERNAME@$LINODE_IP "chmod -R 755 /opt/dhivehinoos/database"
ssh $USERNAME@$LINODE_IP "chmod 664 /opt/dhivehinoos/database/db.sqlite3"

# Also fix media and logs permissions
echo "🔐 Fixing media and logs permissions..."
ssh $USERNAME@$LINODE_IP "chown -R 1000:1000 /opt/dhivehinoos/media"
ssh $USERNAME@$LINODE_IP "chown -R 1000:1000 /opt/dhivehinoos/logs"
ssh $USERNAME@$LINODE_IP "chmod -R 755 /opt/dhivehinoos/media"
ssh $USERNAME@$LINODE_IP "chmod -R 755 /opt/dhivehinoos/logs"

# Check database integrity
echo "🔍 Checking database integrity..."
ssh $USERNAME@$LINODE_IP "sqlite3 /opt/dhivehinoos/database/db.sqlite3 'PRAGMA integrity_check;'"

# Start the backend container
echo "🚀 Starting backend container..."
ssh $USERNAME@$LINODE_IP "cd /opt/dhivehinoos/docker && docker-compose up -d dhivehinoos_backend"

# Wait for service to be healthy
echo "⏳ Waiting for backend to be healthy..."
sleep 30

# Test API endpoints
echo "🔍 Testing API endpoints..."

# Test articles API
if ssh $USERNAME@$LINODE_IP "curl -f http://localhost:8052/api/v1/articles/published/ > /dev/null 2>&1"; then
    echo "✅ Articles API is working!"
else
    echo "❌ Articles API failed"
fi

# Test ads API
if ssh $USERNAME@$LINODE_IP "curl -f http://localhost:8052/api/v1/ads/active/ > /dev/null 2>&1"; then
    echo "✅ Ads API is working!"
else
    echo "❌ Ads API failed"
fi

# Test n8n ingest endpoint
if ssh $USERNAME@$LINODE_IP "curl -f http://localhost:8052/api/v1/articles/ingest/ > /dev/null 2>&1"; then
    echo "✅ n8n ingest API is working!"
else
    echo "❌ n8n ingest API failed"
fi

# Show recent logs
echo "📋 Recent backend logs:"
ssh $USERNAME@$LINODE_IP "cd /opt/dhivehinoos/docker && docker-compose logs --tail=10 dhivehinoos_backend"

echo ""
echo "🎉 Database permissions fix completed!"
echo ""
echo "💡 The 'readonly database' error should now be resolved."
echo "   n8n workflows should be able to write to the database."
