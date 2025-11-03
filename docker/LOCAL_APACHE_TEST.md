# Local Apache Configuration Test

## Issue Analysis

The problem is that even `Alias` directives aren't working, which suggests:

1. **HTTP VirtualHost interference** - Port 80 VirtualHost might be catching requests first
2. **Config file not active** - The edited config might not be the one actually loaded
3. **Frontend container intercepting** - The React Router rewrite might be catching it before Apache can serve it
4. **Order of directive processing** - ProxyPass might be processing before Alias

## Root Cause Hypothesis

Looking at the access logs, we see requests going to the frontend container (port 8053). The catch-all `ProxyPass /` is matching BEFORE any Alias or specific ProxyPass rules.

The issue is likely that:
- When Apache processes `ProxyPass /`, it matches everything including `/robots.txt`
- The Alias directive might not override an existing ProxyPass
- We need to ensure robots.txt is handled BEFORE the catch-all ProxyPass

## Solution Strategy

1. **Use Location blocks with higher precedence** - These process before ProxyPass
2. **Ensure physical file exists** - Verify the file is where we think it is
3. **Check HTTP VirtualHost** - Make sure port 80 isn't interfering
4. **Verify config is active** - Ensure we're editing the right file

## Next Steps

Run the diagnostic script on Linode to gather information, then we can create a proper fix.


