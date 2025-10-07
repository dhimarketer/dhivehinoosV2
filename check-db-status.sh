#!/bin/bash

# Check database status on Linode
# This script helps diagnose database issues

set -e

LINODE_IP=${1:-"your-linode-ip"}
USERNAME=${2:-"root"}

echo "🔍 Checking database status on Linode..."
echo "Server: $USERNAME@$LINODE_IP"

# Check if database file exists
echo "📁 Checking database file..."
ssh $USERNAME@$LINODE_IP "if [ -f '/opt/dhivehinoos/database/db.sqlite3' ]; then
    echo '✅ Database file exists'
    echo '📊 Database size: \$(du -h /opt/dhivehinoos/database/db.sqlite3 | cut -f1)'
    echo '🔐 Database permissions: \$(ls -la /opt/dhivehinoos/database/db.sqlite3)'
else
    echo '❌ Database file not found at /opt/dhivehinoos/database/db.sqlite3'
fi"

# Check directory permissions
echo "📁 Checking database directory permissions..."
ssh $USERNAME@$LINODE_IP "ls -la /opt/dhivehinoos/database/"

# Check if backend container is running
echo "🐳 Checking backend container status..."
ssh $USERNAME@$LINODE_IP "cd /opt/dhivehinoos/docker && docker-compose ps dhivehinoos_backend"

# Check backend logs for database errors
echo "📋 Checking backend logs for database errors..."
ssh $USERNAME@$LINODE_IP "cd /opt/dhivehinoos/docker && docker-compose logs dhivehinoos_backend | tail -20"

# Test API endpoint
echo "🔍 Testing API endpoint..."
if ssh $USERNAME@$LINODE_IP "curl -f http://localhost:8052/api/v1/articles/published/ > /dev/null 2>&1"; then
    echo "✅ API is responding"
    
    # Get article count
    ARTICLE_COUNT=$(ssh $USERNAME@$LINODE_IP "curl -s http://localhost:8052/api/v1/articles/published/ | grep -o '\"count\":[0-9]*' | cut -d: -f2" || echo "unknown")
    echo "📰 Articles available: $ARTICLE_COUNT"
    
    if [ "$ARTICLE_COUNT" = "0" ]; then
        echo "⚠️  Warning: No articles found in database!"
    fi
else
    echo "❌ API is not responding"
fi

echo ""
echo "💡 If database issues are found:"
echo "   1. Restore database: ./backup-and-restore-db.sh $LINODE_IP $USERNAME"
echo "   2. Check container logs: ssh $USERNAME@$LINODE_IP 'cd /opt/dhivehinoos/docker && docker-compose logs -f'"
echo "   3. Restart services: ssh $USERNAME@$LINODE_IP 'cd /opt/dhivehinoos/docker && docker-compose restart'"
