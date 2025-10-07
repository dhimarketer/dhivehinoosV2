#!/bin/bash

# Backup and restore database script for Dhivehinoos.net
# This script backs up the local database and restores it on Linode

set -e

LINODE_IP=${1:-"your-linode-ip"}
USERNAME=${2:-"root"}
LOCAL_DB_PATH="/home/mine/Documents/codingProjects/dhivehinoosV2/backend/database/db.sqlite3"
REMOTE_DB_PATH="/opt/dhivehinoos/database/db.sqlite3"

echo "🔄 Backing up and restoring database for Dhivehinoos.net..."
echo "Server: $USERNAME@$LINODE_IP"

# Check if local database exists
if [ ! -f "$LOCAL_DB_PATH" ]; then
    echo "❌ Error: Local database not found at $LOCAL_DB_PATH"
    exit 1
fi

echo "📁 Local database found: $LOCAL_DB_PATH"
echo "📊 Database size: $(du -h "$LOCAL_DB_PATH" | cut -f1)"

# Create backup of current remote database (if it exists)
echo "💾 Creating backup of current remote database..."
ssh $USERNAME@$LINODE_IP "if [ -f '$REMOTE_DB_PATH' ]; then cp '$REMOTE_DB_PATH' '$REMOTE_DB_PATH.backup.$(date +%Y%m%d_%H%M%S)'; echo 'Backup created'; else echo 'No existing database to backup'; fi"

# Stop the backend service to avoid database locks
echo "🛑 Stopping backend service..."
ssh $USERNAME@$LINODE_IP "cd /opt/dhivehinoos/docker && docker-compose stop dhivehinoos_backend || true"

# Ensure the database directory exists
echo "📁 Ensuring database directory exists..."
ssh $USERNAME@$LINODE_IP "mkdir -p /opt/dhivehinoos/database"

# Copy the database file
echo "📤 Copying database to Linode..."
scp "$LOCAL_DB_PATH" $USERNAME@$LINODE_IP:"$REMOTE_DB_PATH"

# Set proper permissions
echo "🔐 Setting database permissions..."
ssh $USERNAME@$LINODE_IP "chown -R $USER:$USER /opt/dhivehinoos/database && chmod 644 '$REMOTE_DB_PATH'"

# Start the backend service
echo "🚀 Starting backend service..."
ssh $USERNAME@$LINODE_IP "cd /opt/dhivehinoos/docker && docker-compose up -d dhivehinoos_backend"

# Wait for service to be healthy
echo "⏳ Waiting for backend to be healthy..."
sleep 30

# Test the database connection
echo "🔍 Testing database connection..."
if ssh $USERNAME@$LINODE_IP "curl -f http://localhost:8052/api/v1/articles/published/ > /dev/null 2>&1"; then
    echo "✅ Database restored successfully! Backend is responding."
    
    # Get article count from the API
    echo "📊 Testing article count..."
    ARTICLE_COUNT=$(ssh $USERNAME@$LINODE_IP "curl -s http://localhost:8052/api/v1/articles/published/ | grep -o '\"count\":[0-9]*' | cut -d: -f2" || echo "unknown")
    echo "📰 Articles available: $ARTICLE_COUNT"
else
    echo "❌ Database restoration failed! Backend is not responding."
    echo "📋 Backend logs:"
    ssh $USERNAME@$LINODE_IP "cd /opt/dhivehinoos/docker && docker-compose logs dhivehinoos_backend"
    exit 1
fi

echo ""
echo "🎉 Database backup and restore completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Test the website: https://dhivehinoos.net"
echo "2. Check admin panel: https://dhivehinoos.net/admin"
echo "3. Verify articles are loading correctly"
echo ""
echo "🔄 To run this script again:"
echo "   ./backup-and-restore-db.sh [linode-ip] [username]"
