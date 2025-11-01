# Fix 403 Forbidden for robots.txt

## The Issue
Apache found the file but doesn't have permission to read it. This is a file/directory permissions issue.

## Solution - Run these commands on Linode:

```bash
# 1. Check current permissions
ls -la /opt/dhivehinoos/media/robots.txt

# 2. Fix file permissions
sudo chmod 644 /opt/dhivehinoos/media/robots.txt

# 3. Fix directory permissions (make sure Apache can traverse)
sudo chmod 755 /opt/dhivehinoos/media
sudo chmod 755 /opt/dhivehinoos

# 4. Check directory ownership
ls -ld /opt/dhivehinoos/media

# 5. If needed, change ownership (optional - only if above doesn't work)
# sudo chown -R www-data:www-data /opt/dhivehinoos/media
```

## Alternative: Update Apache Config

Also make sure the Directory block has proper permissions:

```apache
<Directory /opt/dhivehinoos/media>
    Require all granted
    Options Indexes
    AllowOverride None
</Directory>
```

