# Apache Configuration Update Instructions for Linode

## Overview
This document explains how to update your Apache configuration on the Linode server to include performance optimizations.

## Files Modified
1. `docker/dhivehinoos-optimized.conf` - New optimized configuration file

## Steps to Update Apache Configuration on Linode

### 1. Enable Required Apache Modules
On your Linode server, ensure mod_deflate and mod_headers are enabled:

```bash
sudo a2enmod deflate
sudo a2enmod headers
sudo systemctl restart apache2
```

### 2. Backup Current Configuration
```bash
cd /etc/apache2/sites-available
sudo cp dhivehinoos.conf dhivehinoos.conf.backup
sudo cp dhivehinoos-http.conf dhivehinoos-http.conf.backup
```

### 3. Update the Configuration Files

#### Option A: Replace dhivehinoos.conf with optimized version
Copy the optimized configuration from the repository to your server:

```bash
# On your local machine, the optimized config is at:
# docker/dhivehinoos-optimized.conf

# On Linode server:
cd /etc/apache2/sites-available
sudo nano dhivehinoos.conf
# Copy the HTTPS VirtualHost block from dhivehinoos-optimized.conf
```

#### Option B: Manually update dhivehinoos.conf
Edit `/etc/apache2/sites-available/dhivehinoos.conf` and add these sections:

**Inside the `<VirtualHost *:443>` block, add after `ProxyRequests Off`:**

```apache
# Enable gzip compression
<Location />
    SetOutputFilter DEFLATE
    SetEnvIfNoCase Request_URI \
        \.(?:gif|jpe?g|png|webp|avif|ico|svg|woff|woff2|ttf|eot)$ no-gzip dont-vary
    SetEnvIfNoCase Request_URI \
        \.(?:exe|t?gz|zip|bz2|sit|rar)$ no-gzip dont-vary
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json application/xml+rss application/rss+xml
</Location>

# Cache media files with long expiry
<LocationMatch "^/media/.*\.(jpg|jpeg|png|gif|webp|avif|svg|ico)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
    Header append Vary "Accept"
    Header unset ETag
    FileETag None
</LocationMatch>

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

# Security headers (add before </VirtualHost>)
Header always set X-Frame-Options "SAMEORIGIN"
Header always set X-Content-Type-Options "nosniff"
Header always set X-XSS-Protection "1; mode=block"
Header always set Referrer-Policy "strict-origin-when-cross-origin"
Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains" env=HTTPS
```

#### Update dhivehinoos-http.conf
Edit `/etc/apache2/sites-available/dhivehinoos-http.conf` and add before the `RewriteEngine` section:

```apache
# Enable gzip compression even for redirects
<Location />
    SetOutputFilter DEFLATE
    SetEnvIfNoCase Request_URI \
        \.(?:gif|jpe?g|png|webp|avif|ico|svg|woff|woff2|ttf|eot)$ no-gzip dont-vary
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</Location>

# Security headers
Header always set X-Content-Type-Options "nosniff"
Header always set X-Frame-Options "SAMEORIGIN"
```

### 4. Test Configuration
```bash
sudo apache2ctl configtest
```

### 5. Reload Apache
```bash
sudo systemctl reload apache2
# OR
sudo service apache2 reload
```

### 6. Verify Changes
Check that compression is working:
```bash
curl -H "Accept-Encoding: gzip" -I https://dhivehinoos.net | grep -i "content-encoding"
# Should show: content-encoding: gzip
```

Check cache headers:
```bash
curl -I https://dhivehinoos.net/assets/index-*.js | grep -i cache-control
# Should show: Cache-Control: public, max-age=31536000, immutable
```

## What These Optimizations Do

1. **Gzip Compression**: Reduces file sizes by 70-90% for text-based assets
2. **Cache Headers**: 
   - HTML files: Never cached (always fresh)
   - Static assets: Cached for 1 year (immutable)
   - Media files: Cached with content negotiation support
3. **Security Headers**: Added HSTS, X-Frame-Options, etc.
4. **ETag Removal**: Prevents unnecessary 304 requests, uses Cache-Control instead

## Troubleshooting

If you get errors after reloading:

1. Check Apache error log:
   ```bash
   sudo tail -f /var/log/apache2/error.log
   ```

2. Verify modules are enabled:
   ```bash
   apache2ctl -M | grep -E "deflate|headers"
   ```

3. Check syntax:
   ```bash
   sudo apache2ctl configtest
   ```

4. Restore backup if needed:
   ```bash
   sudo cp dhivehinoos.conf.backup dhivehinoos.conf
   sudo systemctl reload apache2
   ```

## Notes

- The `dhivehinoos-http-le-ssl.conf` file is auto-generated by certbot, don't modify it directly
- If certbot regenerates configs, you may need to re-apply these optimizations
- These optimizations work alongside the frontend optimizations in the Docker images

