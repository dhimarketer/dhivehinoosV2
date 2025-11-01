# Docker Configuration Files

## Server-Specific Configs (NOT for Docker Images)

These files are for configuring Apache on your Linode server and should NOT be included in Docker builds:

- `dhivehinoos-optimized.conf` - Optimized Apache config for Linode server
- `dhivehinoos.net.conf` - Apache config template for Linode server  
- `APACHE_UPDATE_INSTRUCTIONS.md` - Instructions for updating Apache on Linode
- `LINODE_APACHE_CONFIG.md` - Apache config documentation
- `LINODE_FILES_TO_UPDATE.md` - Guide for updating server configs

**These files are excluded from Docker builds via `.dockerignore`**

## Docker Build Files

These files ARE used in Docker builds:

- `Dockerfile.backend` - Backend container build file
- `Dockerfile.frontend` - (not in this dir, see `frontend/Dockerfile`)
- `docker-compose.yml` - Docker compose configuration
- `apache.conf` - Internal Apache config for frontend container (copy of `frontend/apache.conf`)

## Usage

- **For Docker builds**: Use the build scripts which properly set build contexts
- **For Linode server**: Copy the optimized config files to `/etc/apache2/sites-available/`

