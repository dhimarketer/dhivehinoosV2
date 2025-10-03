#!/bin/bash

# Dhivehinoos.net Deployment Script
# This script deploys the application to /opt/dhivehinoos/ on the Linode server

set -e

echo "🚀 Starting Dhivehinoos.net deployment..."

# Create directory structure
echo "📁 Creating directory structure..."
sudo mkdir -p /opt/dhivehinoos/{database,media/{articles,ads},static,logs,frontend/dist}

# Copy docker-compose file
echo "🐳 Copying Docker configuration..."
sudo cp docker/docker-compose.production.yml /opt/dhivehinoos/

# Copy Apache configuration
echo "🌐 Configuring Apache..."
sudo cp deployment/apache/dhivehinoos.net.conf /etc/apache2/sites-available/
sudo a2ensite dhivehinoos.net.conf
sudo systemctl reload apache2

# Set permissions
echo "🔐 Setting permissions..."
sudo chown -R 1000:1000 /opt/dhivehinoos/database
sudo chmod -R 755 /opt/dhivehinoos/database

# Build and start containers
echo "🔨 Building and starting containers..."
cd /opt/dhivehinoos
sudo docker-compose -f docker-compose.production.yml up -d --build

echo "✅ Deployment complete!"
echo "🌐 Site should be available at http://dhivehinoos.net"
echo "📊 Admin panel: http://dhivehinoos.net/admin/"
echo "🔑 Default admin credentials: admin / admin123"

# Show container status
echo "📋 Container status:"
sudo docker-compose -f docker-compose.production.yml ps
