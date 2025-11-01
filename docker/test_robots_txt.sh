#!/bin/bash
# Diagnostic script to test robots.txt routing

echo "=== Robots.txt Diagnostic Script ==="
echo ""

echo "1. Testing backend directly..."
curl -s -H "Host: dhivehinoos.net" http://127.0.0.1:8052/robots.txt | head -5
echo ""

echo "2. Checking if robots.txt file exists..."
if [ -f "/opt/dhivehinoos/media/robots.txt" ]; then
    echo "✅ File exists at /opt/dhivehinoos/media/robots.txt"
    echo "Content:"
    cat /opt/dhivehinoos/media/robots.txt
else
    echo "❌ File NOT found at /opt/dhivehinoos/media/robots.txt"
fi
echo ""

echo "3. Checking Apache enabled sites..."
echo "Enabled configs:"
ls -la /etc/apache2/sites-enabled/ | grep dhivehinoos
echo ""

echo "4. Checking Apache virtual hosts..."
apache2ctl -S 2>&1 | grep -A 3 dhivehinoos
echo ""

echo "5. Testing via HTTPS..."
curl -s https://dhivehinoos.net/robots.txt | head -10
echo ""

echo "6. Checking Apache access logs (last 3 lines)..."
tail -3 /var/log/apache2/dhivehinoos_access.log 2>/dev/null || echo "Log file not found"
echo ""

echo "7. Testing backend port connectivity..."
nc -zv 127.0.0.1 8052 2>&1 | head -1
echo ""

echo "8. Testing frontend port connectivity..."
nc -zv 127.0.0.1 8053 2>&1 | head -1
echo ""

echo "9. Checking what Apache config says about robots.txt..."
grep -n "robots" /etc/apache2/sites-available/dhivehinoos.conf /etc/apache2/sites-enabled/dhivehinoos.conf 2>/dev/null | head -10
echo ""

echo "10. Checking for HTTP (port 80) VirtualHost..."
grep -A 10 "<VirtualHost \*:80>" /etc/apache2/sites-available/dhivehinoos*.conf /etc/apache2/sites-enabled/dhivehinoos*.conf 2>/dev/null | grep -E "(VirtualHost|ServerName|ProxyPass|robots)" | head -10
echo ""

echo "=== Diagnosis Complete ==="

