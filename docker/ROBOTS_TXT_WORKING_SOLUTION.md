# Working Solution for robots.txt

## The Real Problem

Apache processes directives in this order:
1. Alias
2. Location/LocationMatch
3. ProxyPass/ProxyPassMatch

BUT: When you have `ProxyPass /` as a catch-all, it can override Alias directives for paths that match.

## The Solution

We need to use a **Location block with Filesystem directive** OR use **ProxyPass with negative matching** that actually works.

## Guaranteed Working Config

```apache
<VirtualHost *:443>
    ServerName dhivehinoos.net
    ServerAlias www.dhivehinoos.net
    
    ProxyPreserveHost On
    ProxyRequests Off
    
    # Serve media files
    <Directory /opt/dhivehinoos/media>
        Require all granted
        Options Indexes
    </Directory>
    Alias /media /opt/dhivehinoos/media
    
    # robots.txt - Use Location block to serve from filesystem BEFORE ProxyPass processes
    <Location /robots.txt>
        SetHandler default-handler
        DocumentRoot /opt/dhivehinoos/media
    </Location>
    
    # Backend API routes
    ProxyPass /api/ http://127.0.0.1:8052/api/
    ProxyPassReverse /api/ http://127.0.0.1:8052/api/
    
    # Django Admin
    ProxyPass /admin/ http://127.0.0.1:8052/admin/
    ProxyPassReverse /admin/ http://127.0.0.1:8052/admin/
    
    # Frontend catch-all
    ProxyPass / http://127.0.0.1:8053/
    ProxyPassReverse / http://127.0.0.1:8053/
    
    # ... rest of config
</VirtualHost>
```

OR use RewriteCond to check if file exists:

```apache
RewriteEngine On
RewriteCond /opt/dhivehinoos/media/robots.txt -f
RewriteRule ^/robots\.txt$ /media/robots.txt [L]
```


