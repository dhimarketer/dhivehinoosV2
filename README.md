# Dhivehinoos.net - Maldivian News Site

A self-hosted news site that receives AI-generated articles from n8n, displays them in a modern 3-column layout with ads, supports moderated comments and IP-based voting, and includes a Chakra UI admin dashboard.

## Features

- **AI Article Ingestion**: Receives articles from n8n via webhook
- **Modern UI**: React frontend with Chakra UI components
- **Comment System**: IP-based moderation with auto-approval for returning users
- **Voting System**: IP-based voting with duplicate prevention
- **Admin Dashboard**: Manage articles, comments, ads, and contact messages
- **Ad Management**: Strategic ad placement throughout the site
- **SEO Optimized**: React Helmet for meta tags and Open Graph
- **Docker Deployment**: Containerized for easy deployment

## Tech Stack

- **Backend**: Django 5 + Django REST Framework
- **Frontend**: React 18 + Vite + Chakra UI
- **Database**: SQLite3
- **Caching**: Redis
- **Deployment**: Docker Compose
- **Web Server**: Apache (reverse proxy)

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Apache web server
- Redis server (existing instance on Linode)

### Development Setup

1. **Backend Development**:
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   python manage.py migrate
   python manage.py runserver
   ```

2. **Frontend Development**:
   ```bash
   cd frontend
   npm install --legacy-peer-deps
   npm run dev
   ```

### Production Deployment

1. **Copy files to Linode server**:
   ```bash
   scp -r . user@your-linode-server:/opt/dhivehinoos/
   ```

2. **Run deployment script**:
   ```bash
   cd /opt/dhivehinoos
   chmod +x deployment/scripts/deploy.sh
   ./deployment/scripts/deploy.sh
   ```

3. **Configure environment variables**:
   - Update `SECRET_KEY` in docker-compose.production.yml
   - Update `API_INGEST_KEY` for n8n webhook
   - Update `ALLOWED_HOSTS` for your domain

## API Endpoints

### Public Endpoints
- `GET /api/v1/articles/published/` - List published articles
- `GET /api/v1/articles/published/{slug}/` - Get article by slug
- `POST /api/v1/comments/create/` - Create comment
- `POST /api/v1/comments/vote/` - Vote on article
- `GET /api/v1/ads/active/` - List active ads
- `POST /api/v1/contact/create/` - Submit contact message

### Admin Endpoints (Authentication Required)
- `GET /api/v1/articles/admin/` - List all articles
- `POST /api/v1/articles/admin/` - Create article
- `PUT /api/v1/articles/admin/{id}/` - Update article
- `DELETE /api/v1/articles/admin/{id}/` - Delete article
- `GET /api/v1/comments/admin/` - List all comments
- `PATCH /api/v1/comments/admin/{id}/` - Approve/reject comment
- `GET /api/v1/ads/admin/` - List all ads
- `POST /api/v1/ads/admin/` - Create ad
- `GET /api/v1/contact/admin/` - List contact messages

### n8n Webhook
- `POST /api/v1/articles/ingest/` - Ingest article from n8n
  - Headers: `X-API-Key: your_api_key`
  - Body: `{"title": "...", "content": "...", "image_url": "..."}`

## Default Admin Credentials

- **Username**: admin
- **Password**: admin123

**⚠️ Change these credentials immediately after deployment!**

## Directory Structure

```
dhivehinoosV2/
├── backend/                 # Django backend
│   ├── articles/           # Article management
│   ├── comments/           # Comments and voting
│   ├── ads/                # Ad management
│   ├── contact/            # Contact messages
│   └── dhivehinoos_backend/ # Django settings
├── frontend/               # React frontend
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   └── theme.js       # Chakra UI theme
├── docker/                # Docker configuration
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   └── docker-compose.production.yml
└── deployment/            # Deployment scripts
    ├── apache/
    └── scripts/
```

## Environment Variables

### Backend
- `SECRET_KEY`: Django secret key
- `DEBUG`: Enable debug mode (False for production)
- `ALLOWED_HOSTS`: Comma-separated list of allowed hosts
- `DATABASE_URL`: Database connection string
- `REDIS_URL`: Redis connection string
- `API_INGEST_KEY`: API key for n8n webhook

### Frontend
- `VITE_API_URL`: Backend API URL

## n8n Integration

Configure n8n to send articles to:
```
POST https://dhivehinoos.net/api/v1/articles/ingest/
Headers:
  X-API-Key: your_api_key
  Content-Type: application/json

Body:
{
  "title": "Article Title",
  "content": "<p>HTML content...</p>",
  "image_url": "https://example.com/image.jpg"
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, please contact the development team or create an issue in the repository.
