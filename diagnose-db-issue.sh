#!/bin/bash

# Detailed diagnostic script for Dhivehinoos.net database issues
# This script checks database integrity, permissions, and backend connectivity

set -e

LINODE_IP=${1:-"your-linode-ip"}
USERNAME=${2:-"root"}

echo "🔍 Detailed diagnostic for Dhivehinoos.net database issues..."
echo "Server: $USERNAME@$LINODE_IP"

# Check database file details
echo "📁 Database file details:"
ssh $USERNAME@$LINODE_IP "ls -la /opt/dhivehinoos/database/db.sqlite3"
ssh $USERNAME@$LINODE_IP "file /opt/dhivehinoos/database/db.sqlite3"
ssh $USERNAME@$LINODE_IP "du -h /opt/dhivehinoos/database/db.sqlite3"

# Check if database is readable
echo "🔍 Testing database readability..."
ssh $USERNAME@$LINODE_IP "sqlite3 /opt/dhivehinoos/database/db.sqlite3 'SELECT COUNT(*) FROM articles_article;' 2>/dev/null || echo 'Database read error'"

# Check backend container status
echo "🐳 Backend container status:"
ssh $USERNAME@$LINODE_IP "cd /opt/dhivehinoos/docker && docker-compose ps dhivehinoos_backend"

# Check if backend is responding
echo "🔍 Testing backend connectivity..."
ssh $USERNAME@$LINODE_IP "curl -v http://localhost:8052/api/v1/articles/published/ 2>&1 | head -20"

# Check backend logs for errors
echo "📋 Recent backend logs:"
ssh $USERNAME@$LINODE_IP "cd /opt/dhivehinoos/docker && docker-compose logs --tail=50 dhivehinoos_backend"

# Check if database is mounted correctly in container
echo "🔍 Checking database mount in container:"
ssh $USERNAME@$LINODE_IP "cd /opt/dhivehinoos/docker && docker-compose exec dhivehinoos_backend ls -la /app/database/ 2>/dev/null || echo 'Cannot access container'"

# Check environment variables in container
echo "🔍 Checking environment variables:"
ssh $USERNAME@$LINODE_IP "cd /opt/dhivehinoos/docker && docker-compose exec dhivehinoos_backend env | grep -E '(DATABASE|DJANGO)' 2>/dev/null || echo 'Cannot access container'"

# Test Django shell in container
echo "🔍 Testing Django database connection:"
ssh $USERNAME@$LINODE_IP "cd /opt/dhivehinoos/docker && docker-compose exec dhivehinoos_backend python manage.py shell -c \"from articles.models import Article; print(f'Articles in DB: {Article.objects.count()}')\" 2>/dev/null || echo 'Django shell error'"

echo ""
echo "💡 Common issues and fixes:"
echo "   1. If database is corrupted: Restore from backup"
echo "   2. If permissions are wrong: chown -R \$USER:\$USER /opt/dhivehinoos/database"
echo "   3. If container can't access DB: Check volume mounts in docker-compose.yml"
echo "   4. If Django can't connect: Check DATABASE_URL environment variable"
