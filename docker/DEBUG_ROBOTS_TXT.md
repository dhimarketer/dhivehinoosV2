# Debug robots.txt Issue

## Current Status
- Proxy is working (we get 404 from backend, not HTML from frontend)
- Backend route exists: `path('robots.txt', settings_views.robots_txt_view, name='robots-txt')`

## Test Commands (Run on Linode)

```bash
# 1. Test if backend is responding
curl http://127.0.0.1:8052/

# 2. Test robots.txt directly on backend
curl http://127.0.0.1:8052/robots.txt

# 3. Test through the proxy (with headers)
curl -v https://dhivehinoos.net/robots.txt

# 4. Check backend container logs
docker logs dhivehinoos_backend --tail 20

# 5. Check if backend container is running
docker ps | grep dhivehinoos_backend
```

## Possible Issues

1. **Backend route might need trailing slash** - Try `/robots.txt/` instead
2. **Backend container might not be running**
3. **Path might be getting modified during proxy**

## Quick Fix Option

If backend robots.txt route works but proxy doesn't, we can:
- Create a physical robots.txt file on Linode
- Or fix the proxy path

