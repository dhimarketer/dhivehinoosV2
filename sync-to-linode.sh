#!/bin/bash

# Sync updated files to Linode server
# Usage: ./sync-to-linode.sh [linode-ip] [username]

set -e

LINODE_IP=${1:-"your-linode-ip"}
USERNAME=${2:-"root"}

echo "🔄 Syncing updated files to Linode server..."
echo "Server: $USERNAME@$LINODE_IP"

# Files that need to be updated on Linode
FILES_TO_SYNC=(
    "docker/docker-compose.yml"
    "docker/deploy-linode.sh"
    "DEPLOYMENT_GUIDE.md"
)

echo "📁 Creating project directory on Linode..."
ssh $USERNAME@$LINODE_IP "mkdir -p /opt/dhivehinoos/docker"

echo "📤 Copying updated files..."
for file in "${FILES_TO_SYNC[@]}"; do
    if [ -f "$file" ]; then
        echo "   Copying $file..."
        scp "$file" $USERNAME@$LINODE_IP:/opt/dhivehinoos/docker/
    else
        echo "   ⚠️  File $file not found, skipping..."
    fi
done

echo "🔐 Setting permissions..."
ssh $USERNAME@$LINODE_IP "chmod +x /opt/dhivehinoos/docker/deploy-linode.sh"

echo "✅ Files synced successfully!"
echo ""
echo "🚀 To deploy on Linode, run:"
echo "   ssh $USERNAME@$LINODE_IP"
echo "   cd /opt/dhivehinoos/docker"
echo "   ./deploy-linode.sh"
