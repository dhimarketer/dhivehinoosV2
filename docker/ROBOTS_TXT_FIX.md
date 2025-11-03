# Fix for robots.txt Issue

## Problem
Even after adding ProxyPass rules, robots.txt is still returning HTML from React Router.

## Solution
The ProxyPassMatch catch-all is being processed before the specific ProxyPass rules. We need to add explicit exclusions to the ProxyPassMatch regex AND ensure the ProxyPass rules are in the right location.

## Updated Config Section

In `/etc/apache2/sites-available/dhivehinoos.conf`, find the section starting with:

```apache
    # Backend API routes
    ProxyPass /api/ http://127.0.0.1:8052/api/
```

Replace everything from there until the end of the ProxyPass section with:

```apache
    # Backend API routes - MUST come first
    ProxyPass /api/ http://127.0.0.1:8052/api/
    ProxyPassReverse /api/ http://127.0.0.1:8052/api/
    
    # Django Admin - MUST come before catch-all
    ProxyPass /admin/ http://127.0.0.1:8052/admin/
    ProxyPassReverse /admin/ http://127.0.0.1:8052/admin/
    
    # robots.txt and sitemap.xml - MUST come before catch-all
    ProxyPass /robots.txt http://127.0.0.1:8052/robots.txt
    ProxyPassReverse /robots.txt http://127.0.0.1:8052/robots.txt
    ProxyPass /sitemap.xml http://127.0.0.1:8052/sitemap.xml
    ProxyPassReverse /sitemap.xml http://127.0.0.1:8052/sitemap.xml
    
    # Frontend (catch-all) - MUST be last and exclude all above routes
    ProxyPassMatch ^/(?!media|api|admin|robots\.txt|sitemap\.xml)(.*)$ http://127.0.0.1:8053/$1
    ProxyPassReverse / http://127.0.0.1:8053/
```

## Alternative: Use Location blocks instead

If the above doesn't work, use Location blocks which have higher precedence:

```apache
    # robots.txt - Use Location block for higher precedence
    <Location /robots.txt>
        ProxyPass http://127.0.0.1:8052/robots.txt
        ProxyPassReverse http://127.0.0.1:8052/robots.txt
    </Location>
    
    # sitemap.xml
    <Location /sitemap.xml>
        ProxyPass http://127.0.0.1:8052/sitemap.xml
        ProxyPassReverse http://127.0.0.1:8052/sitemap.xml
    </Location>
    
    # Backend API routes
    ProxyPass /api/ http://127.0.0.1:8052/api/
    ProxyPassReverse /api/ http://127.0.0.1:8052/api/
    
    # Django Admin
    ProxyPass /admin/ http://127.0.0.1:8052/admin/
    ProxyPassReverse /admin/ http://127.0.0.1:8052/admin/
    
    # Frontend (catch-all)
    ProxyPassMatch ^/(?!media|api|admin|robots\.txt|sitemap\.xml)(.*)$ http://127.0.0.1:8053/$1
    ProxyPassReverse / http://127.0.0.1:8053/
```


