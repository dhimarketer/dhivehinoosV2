#!/bin/bash

# Quick fix script for common database issues on Linode
# This script addresses permissions, container restarts, and database integrity

set -e

LINODE_IP=${1:-"your-linode-ip"}
USERNAME=${2:-"root"}

echo "🔧 Quick fix for Dhivehinoos.net database issues..."
echo "Server: $USERNAME@$LINODE_IP"

# Fix database permissions
echo "🔐 Fixing database permissions..."
ssh $USERNAME@$LINODE_IP "chown -R \$USER:\$USER /opt/dhivehinoos/database"
ssh $USERNAME@$LINODE_IP "chmod 644 /opt/dhivehinoos/database/db.sqlite3"

# Check database integrity
echo "🔍 Checking database integrity..."
ssh $USERNAME@$LINODE_IP "sqlite3 /opt/dhivehinoos/database/db.sqlite3 'PRAGMA integrity_check;'"

# Restart backend service
echo "🔄 Restarting backend service..."
ssh $USERNAME@$LINODE_IP "cd /opt/dhivehinoos/docker && docker-compose restart dhivehinoos_backend"

# Wait for service to be healthy
echo "⏳ Waiting for backend to be healthy..."
sleep 30

# Test API
echo "🔍 Testing API..."
if ssh $USERNAME@$LINODE_IP "curl -f http://localhost:8052/api/v1/articles/published/ > /dev/null 2>&1"; then
    echo "✅ API is working!"
    
    # Get article count
    ARTICLE_COUNT=$(ssh $USERNAME@$LINODE_IP "curl -s http://localhost:8052/api/v1/articles/published/ | grep -o '\"count\":[0-9]*' | cut -d: -f2" || echo "unknown")
    echo "📰 Articles available: $ARTICLE_COUNT"
    
    if [ "$ARTICLE_COUNT" = "0" ]; then
        echo "⚠️  Warning: No articles found!"
        echo "💡 The database might be empty. You may need to restore from backup."
    fi
else
    echo "❌ API is still not working"
    echo "📋 Backend logs:"
    ssh $USERNAME@$LINODE_IP "cd /opt/dhivehinoos/docker && docker-compose logs --tail=20 dhivehinoos_backend"
fi

echo ""
echo "🎉 Quick fix completed!"
echo ""
echo "💡 If issues persist, run the detailed diagnostic:"
echo "   ./diagnose-db-issue.sh $LINODE_IP $USERNAME"
