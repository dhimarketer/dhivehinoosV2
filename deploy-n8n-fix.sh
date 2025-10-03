#!/bin/bash

# Deploy n8n API fix to Linode server
# Usage: ./deploy-n8n-fix.sh [linode-ip] [username]

set -e

LINODE_IP=${1:-"your-linode-ip"}
USERNAME=${2:-"root"}

echo "🔧 Deploying n8n API fix to Linode server..."
echo "Server: $USERNAME@$LINODE_IP"

# Check if IP is provided
if [ "$LINODE_IP" = "your-linode-ip" ]; then
    echo "❌ Please provide your Linode IP address:"
    echo "   ./deploy-n8n-fix.sh YOUR_LINODE_IP [username]"
    exit 1
fi

echo "📥 Pulling updated backend image on Linode..."
ssh $USERNAME@$LINODE_IP "docker pull dhimarketer/backend:latest"

echo "🛑 Stopping current containers..."
ssh $USERNAME@$LINODE_IP "cd /opt/dhivehinoos && docker-compose down || true"

echo "🚀 Starting updated services..."
ssh $USERNAME@$LINODE_IP "cd /opt/dhivehinoos && docker-compose up -d"

echo "⏳ Waiting for services to start..."
sleep 30

echo "🔍 Testing the n8n API endpoint..."
ssh $USERNAME@$LINODE_IP "curl -X POST https://dhivehinoos.net/api/v1/articles/ingest/ -H 'Content-Type: application/json' -H 'X-API-Key: any_key' -d '{\"title\": \"Test from n8n fix\", \"content\": \"This should work now!\"}' -v"

echo ""
echo "✅ n8n API fix deployed!"
echo ""
echo "📊 To check logs:"
echo "   ssh $USERNAME@$LINODE_IP 'cd /opt/dhivehinoos && docker-compose logs -f'"
echo ""
echo "🔍 To test manually:"
echo "   curl -X POST https://dhivehinoos.net/api/v1/articles/ingest/ \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -H 'X-API-Key: any_key' \\"
echo "     -d '{\"title\": \"Test Article\", \"content\": \"Test content\"}'"
