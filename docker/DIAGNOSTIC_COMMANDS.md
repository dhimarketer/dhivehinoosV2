# Diagnostic Commands for Linode SSH

## Check Frontend Container Status
```bash
# Check if container is running and view logs
docker logs dhivehinoos_frontend --tail 50

# Check recent errors
docker logs dhivehinoos_frontend --tail 100 | grep -i error

# Follow logs in real-time
docker logs -f dhivehinoos_frontend
```

## Inspect Container Contents
```bash
# Check what files are in the container's web root
docker exec dhivehinoos_frontend ls -la /usr/local/apache2/htdocs/

# Check if index.html exists
docker exec dhivehinoos_frontend cat /usr/local/apache2/htdocs/index.html

# Check if assets directory exists
docker exec dhivehinoos_frontend ls -la /usr/local/apache2/htdocs/assets/

# List all files recursively
docker exec dhivehinoos_frontend find /usr/local/apache2/htdocs -type f
```

## Test Apache Configuration
```bash
# Check Apache config syntax
docker exec dhivehinoos_frontend httpd -t

# Check if Apache modules are loaded
docker exec dhivehinoos_frontend httpd -M | grep -E "(rewrite|headers|deflate)"

# View Apache virtual host config
docker exec dhivehinoos_frontend cat /usr/local/apache2/conf/extra/httpd-vhosts.conf
```

## Test Direct Container Access
```bash
# Test if frontend responds on container port
curl -I http://localhost:8053/

# Test with verbose output
curl -v http://localhost:8053/

# Test a specific asset file
curl -I http://localhost:8053/assets/index-*.js

# Check what the container returns
curl http://localhost:8053/ 2>&1 | head -20
```

## Check Apache Error Logs
```bash
# View Apache error log
docker exec dhivehinoos_frontend tail -50 /usr/local/apache2/logs/error_log

# View Apache access log
docker exec dhivehinoos_frontend tail -50 /usr/local/apache2/logs/access_log

# Search for specific errors
docker exec dhivehinoos_frontend grep -i "undefined\|error\|not found" /usr/local/apache2/logs/error_log
```

## Verify Build Output
```bash
# Check the actual built index.html content
docker exec dhivehinoos_frontend cat /usr/local/apache2/htdocs/index.html | head -30

# Check if script tag is injected correctly
docker exec dhivehinoos_frontend grep -i "script\|src" /usr/local/apache2/htdocs/index.html

# List all built JS files
docker exec dhivehinoos_frontend ls -lh /usr/local/apache2/htdocs/assets/*.js

# Check file permissions
docker exec dhivehinoos_frontend ls -la /usr/local/apache2/htdocs/assets/
```

## Network and Proxy Checks
```bash
# Check if Apache on Linode can reach frontend container
curl -I http://127.0.0.1:8053/

# Test from within the container itself
docker exec dhivehinoos_frontend wget -O- http://localhost/ 2>&1 | head -20

# Check if port 8053 is accessible
netstat -tlnp | grep 8053
```

## Restart and Rebuild (if needed)
```bash
# Restart just the frontend container
docker restart dhivehinoos_frontend

# Check container status after restart
docker ps | grep dhivehinoos_frontend

# If needed, pull latest image and recreate
cd /opt/dhivehinoos
docker-compose pull dhivehinoos_frontend
docker-compose up -d dhivehinoos_frontend
```

## Quick Diagnostic Script
```bash
# Run all checks at once
echo "=== Container Status ==="
docker ps | grep dhivehinoos_frontend

echo -e "\n=== Files in htdocs ==="
docker exec dhivehinoos_frontend ls -la /usr/local/apache2/htdocs/ | head -10

echo -e "\n=== index.html exists? ==="
docker exec dhivehinoos_frontend test -f /usr/local/apache2/htdocs/index.html && echo "YES" || echo "NO"

echo -e "\n=== Assets directory exists? ==="
docker exec dhivehinoos_frontend test -d /usr/local/apache2/htdocs/assets && echo "YES" || echo "NO"

echo -e "\n=== Apache config test ==="
docker exec dhivehinoos_frontend httpd -t

echo -e "\n=== Recent errors ==="
docker logs dhivehinoos_frontend --tail 20 | grep -i error || echo "No errors found"

echo -e "\n=== Direct container test ==="
curl -I http://localhost:8053/ 2>&1 | head -5
```

