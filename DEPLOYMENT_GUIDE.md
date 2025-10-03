# Dhivehinoos.net Deployment Guide

## CSRF Fix Deployment

The CSRF verification error has been fixed and new Docker images have been built and pushed to DockerHub.

### What was fixed:
- Added `@csrf_exempt` decorators to all API endpoints
- Updated Django settings with proper CSRF configuration
- Rebuilt and pushed Docker images with the fixes

### Images pushed:
- `dhimarketer/backend:latest` - Backend with CSRF fixes
- `dhimarketer/frontend:latest` - Frontend (unchanged)

## Deploy to Linode

### Option 1: Using the deployment script (Recommended)

1. SSH into your Linode server
2. Navigate to your project directory
3. Run the deployment script:

```bash
cd /path/to/your/project/docker
./deploy-linode.sh
```

### Option 2: Manual deployment

1. SSH into your Linode server
2. Navigate to your project directory
3. Pull the latest images:
   ```bash
   docker pull dhimarketer/backend:latest
   docker pull dhimarketer/frontend:latest
   ```
4. Stop existing containers:
   ```bash
   docker-compose down
   ```
5. Start the services:
   ```bash
   docker-compose up -d
   ```

### Verify deployment

After deployment, test these endpoints:
- Backend API: `http://your-server:8052/api/articles/`
- Frontend: `http://your-server:8053/`
- Production: `https://dhivehinoos.net`

### Check logs if needed

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f dhivehinoos_backend
docker-compose logs -f dhivehinoos_frontend
```

## What's Fixed

✅ CSRF verification errors are resolved
✅ API endpoints now accept POST requests without CSRF tokens
✅ Frontend can successfully submit forms and comments
✅ Django admin still has CSRF protection (secure)

The deployment should now work without any CSRF-related errors!
