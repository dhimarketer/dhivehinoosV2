# Apache Configuration Files for Linode Server

## Files to Update

You need to update these files on your Linode server:
- `/etc/apache2/sites-available/dhivehinoos.conf` (HTTPS/443)
- `/etc/apache2/sites-available/dhivehinoos-http.conf` (HTTP/80 redirect)

---

## File 1: `/etc/apache2/sites-available/dhivehinoos.conf`

Replace the entire file with this content:

```apache
<VirtualHost *:443>
    ServerName dhivehinoos.net
    ServerAlias www.dhivehinoos.net
    
    ProxyPreserveHost On
    ProxyRequests Off
    
    # Enable gzip compression
    <Location />
        SetOutputFilter DEFLATE
        SetEnvIfNoCase Request_URI \
            \.(?:gif|jpe?g|png|webp|avif|ico|svg|woff|woff2|ttf|eot)$ no-gzip dont-vary
        SetEnvIfNoCase Request_URI \
            \.(?:exe|t?gz|zip|bz2|sit|rar)$ no-gzip dont-vary
        AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json application/xml+rss application/rss+xml
    </Location>
    
    # Serve media files directly from filesystem with optimized caching
    <Directory /opt/dhivehinoos/media>
        Require all granted
        Options Indexes
    </Directory>
    Alias /media /opt/dhivehinoos/media
    
    # Cache media files with long expiry
    <LocationMatch "^/media/.*\.(jpg|jpeg|png|gif|webp|avif|svg|ico)$">
        Header set Cache-Control "public, max-age=31536000, immutable"
        Header append Vary "Accept"
        Header unset ETag
        FileETag None
    </LocationMatch>
    
    # Backend API routes
    ProxyPass /api/ http://127.0.0.1:8052/api/
    ProxyPassReverse /api/ http://127.0.0.1:8052/api/
    
    # Django Admin
    ProxyPass /admin/ http://127.0.0.1:8052/admin/
    ProxyPassReverse /admin/ http://127.0.0.1:8052/admin/
    
    # Frontend (catch-all for React app) - EXCLUDE media, api, admin
    ProxyPassMatch ^/(?!media|api|admin)(.*)$ http://127.0.0.1:8053/$1
    ProxyPassReverse / http://127.0.0.1:8053/
    
    # Don't cache HTML files from frontend
    <LocationMatch "^/(?!media|api|admin|static).*\.(html)?$">
        Header set Cache-Control "no-cache, no-store, must-revalidate"
        Header set Pragma "no-cache"
        Header set Expires "0"
    </LocationMatch>
    
    # Cache static assets from frontend
    <LocationMatch "^/(?!media|api|admin).*\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webp|avif)$">
        Header set Cache-Control "public, max-age=31536000, immutable"
        Header unset ETag
        FileETag None
    </LocationMatch>
    
    # Security headers
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains" env=HTTPS
    
    # SSL Configuration
    SSLEngine on
    Include /etc/letsencrypt/options-ssl-apache.conf
    SSLCertificateFile /etc/letsencrypt/live/dhivehinoos.net/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/dhivehinoos.net/privkey.pem
    
    # Logging
    ErrorLog ${APACHE_LOG_DIR}/dhivehinoos_ssl_error.log
    CustomLog ${APACHE_LOG_DIR}/dhivehinoos_ssl_access.log combined
</VirtualHost>
```

---

## File 2: `/etc/apache2/sites-available/dhivehinoos-http.conf`

Replace the entire file with this content:

```apache
<VirtualHost *:80>
    ServerName dhivehinoos.net
    ServerAlias www.dhivehinoos.net
    
    ProxyPreserveHost On
    ProxyRequests Off
    
    # Enable gzip compression even for redirects
    <Location />
        SetOutputFilter DEFLATE
        SetEnvIfNoCase Request_URI \
            \.(?:gif|jpe?g|png|webp|avif|ico|svg|woff|woff2|ttf|eot)$ no-gzip dont-vary
        AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
    </Location>
    
    # Backend API routes (will redirect to HTTPS)
    ProxyPass /api/ http://127.0.0.1:8052/api/
    ProxyPassReverse /api/ http://127.0.0.1:8052/api/
    
    # Django Admin (will redirect to HTTPS)
    ProxyPass /admin/ http://127.0.0.1:8052/admin/
    ProxyPassReverse /admin/ http://127.0.0.1:8052/admin/
    
    # Media files (served directly from backend)
    ProxyPass /media/ http://127.0.0.1:8052/media/
    ProxyPassReverse /media/ http://127.0.0.1:8052/media/
    
    # Static files (served directly from backend)
    ProxyPass /static/ http://127.0.0.1:8052/static/
    ProxyPassReverse /static/ http://127.0.0.1:8052/static/
    
    # Frontend (catch-all for React app)
    ProxyPass / http://127.0.0.1:8053/
    ProxyPassReverse / http://127.0.0.1:8053/
    
    # Security headers
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-Frame-Options "SAMEORIGIN"
    
    # Logging
    ErrorLog ${APACHE_LOG_DIR}/dhivehinoos_error.log
    CustomLog ${APACHE_LOG_DIR}/dhivehinoos_access.log combined
    
    # Redirect all HTTP traffic to HTTPS
    RewriteEngine on
    RewriteCond %{SERVER_NAME} =www.dhivehinoos.net [OR]
    RewriteCond %{SERVER_NAME} =dhivehinoos.net
    RewriteRule ^ https://%{SERVER_NAME}%{REQUEST_URI} [END,NE,R=permanent]
</VirtualHost>
```

---

## Steps to Apply

### 1. Enable Required Modules
```bash
sudo a2enmod deflate headers
sudo systemctl restart apache2
```

### 2. Backup Current Configs
```bash
cd /etc/apache2/sites-available
sudo cp dhivehinoos.conf dhivehinoos.conf.backup.$(date +%Y%m%d)
sudo cp dhivehinoos-http.conf dhivehinoos-http.conf.backup.$(date +%Y%m%d)
```

### 3. Update Files
Copy the content above into each file using your preferred editor (nano, vi, etc.)

### 4. Test Configuration
```bash
sudo apache2ctl configtest
```

### 5. Reload Apache
```bash
sudo systemctl reload apache2
```

---

## Notes

- The `dhivehinoos-http-le-ssl.conf` file is auto-generated by certbot - don't modify it
- If certbot regenerates configs, you may need to re-apply these optimizations
- These optimizations work alongside the frontend optimizations in the Docker images

