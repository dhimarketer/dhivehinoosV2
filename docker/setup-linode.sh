#!/bin/bash

# Initial setup script for Dhivehinoos.net on Linode
# Run this once to set up the deployment environment

set -e

APP_DIR="/opt/dhivehinoos"

echo "🔧 Setting up Dhivehinoos.net deployment environment..."

# Create app directory
echo "📁 Creating app directory: $APP_DIR"
sudo mkdir -p $APP_DIR
cd $APP_DIR

# Copy docker-compose.yml (you'll need to do this manually)
echo "📋 Please copy docker-compose.yml to this directory:"
echo "   scp /path/to/docker-compose.yml root@your-linode-ip:/opt/dhivehinoos/"
echo ""

# Create directory structure
echo "📁 Creating directory structure..."
sudo mkdir -p database media/{articles,ads} static logs

# Set proper permissions
echo "🔐 Setting permissions..."
sudo chown -R $USER:$USER $APP_DIR

# Create .env file template
echo "📝 Creating .env file template..."
cat > .env << EOF
# Django Settings
SECRET_KEY=your_strong_secret_key_here_change_this
API_INGEST_KEY=your_n8n_api_key_here

# Database
DATABASE_URL=sqlite:////app/database/db.sqlite3

# Domain
ALLOWED_HOSTS=dhivehinoos.net,www.dhivehinoos.net,localhost
EOF

echo "✅ Setup completed!"
echo ""
echo "📝 Next steps:"
echo "1. Edit .env file with your actual secret keys:"
echo "   nano .env"
echo ""
echo "2. Copy docker-compose.yml to this directory"
echo ""
echo "3. Run the deployment script:"
echo "   ./deploy-linode.sh"
echo ""
echo "⚠️  Remember to configure Apache proxy rules for your domain!"
