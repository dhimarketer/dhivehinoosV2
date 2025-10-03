# Dhivehinoos.net Project Implementation Plan

## Project Overview
A self-hosted news site that receives AI-generated articles from n8n, displays them in a modern 3-column layout with ads, supports moderated comments and IP-based voting, and includes a Chakra UI admin dashboard.

## Technical Stack
- **Backend**: Django 5 + Django REST Framework (DRF)
- **Frontend**: React 18 + Vite + Chakra UI
- **Database**: SQLite3
- **Caching**: Redis (existing instance on Linode, DB index 3)
- **Deployment**: Docker Compose
- **Web Server**: Apache (reverse proxy + static/media serving)
- **Admin Auth**: Django session-based login
- **SEO**: React Helmet + Open Graph + canonical URLs
- **Analytics**: Google Analytics 4 (GA4)

## Implementation Phases

### Phase 1: Project Structure & Backend Setup
1. **Create directory structure**
   - `/backend/` - Django application
   - `/frontend/` - React application
   - `/docker/` - Docker configuration files
   - `/deployment/` - Apache config and deployment scripts

2. **Django Backend Setup**
   - Initialize Django project with proper settings
   - Configure SQLite database
   - Set up Redis caching
   - Create Django apps: `articles`, `comments`, `ads`, `contact`

3. **Django Models**
   - `Article` model (title, slug, content, image, status, created_at)
   - `Comment` model (article, author_name, content, ip_address, is_approved, created_at)
   - `Vote` model (article, ip_address, vote_type, created_at)
   - `Ad` model (title, image, destination_url, is_active, created_at)
   - `ContactMessage` model (name, email, message, is_read, created_at)

4. **Django REST Framework**
   - Serializers for all models
   - API views for public endpoints
   - Admin views with session authentication
   - n8n webhook endpoint for article ingestion

### Phase 2: Frontend Development
1. **React Setup**
   - Initialize React 18 with Vite
   - Install and configure Chakra UI
   - Set up routing with React Router
   - Configure environment variables

2. **Public Pages**
   - Homepage with 3-column responsive grid
   - Article detail page with voting and comments
   - Contact form page
   - SEO optimization with React Helmet

3. **Admin Dashboard**
   - Login page with Django session auth
   - Dashboard with sidebar navigation
   - Article management (list, edit, publish)
   - Ad management (upload, toggle, preview)
   - Comment moderation
   - Contact message management

### Phase 3: Integration & Features
1. **n8n Integration**
   - Article ingestion API endpoint
   - Image download and validation
   - Draft status handling

2. **Comment System**
   - IP-based approval logic
   - First-time commenter moderation
   - Auto-approval for returning commenters

3. **Voting System**
   - IP-based voting prevention
   - Vote counting and display
   - Real-time vote updates

4. **Ad System**
   - Ad slot placement (top banner, after every 3rd article)
   - Ad management interface
   - Click tracking

### Phase 4: DevOps & Deployment
1. **Docker Configuration**
   - Django Dockerfile
   - docker-compose.production.yml
   - Volume mounts for persistence

2. **Apache Configuration**
   - Virtual host setup
   - Reverse proxy configuration
   - Static file serving
   - URL rewriting for SPA

3. **Deployment Scripts**
   - Build scripts for frontend
   - Docker deployment commands
   - Apache configuration deployment

## Directory Structure
```
dhivehinoosV2/
├── backend/
│   ├── dhivehinoos_backend/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── articles/
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   ├── comments/
│   ├── ads/
│   ├── contact/
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── utils/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
├── docker/
│   ├── Dockerfile.backend
│   └── docker-compose.production.yml
├── deployment/
│   ├── apache/
│   │   └── dhivehinoos.net.conf
│   └── scripts/
│       └── deploy.sh
└── PROJECT_PLAN.md
```

## Key Features Implementation

### Article Management
- n8n webhook receives articles as drafts
- Admin can edit and publish articles
- Rich text editor for content editing
- Image handling and optimization

### Comment System
- IP-based moderation
- First-time commenters require approval
- Returning commenters auto-approved
- Admin moderation interface

### Voting System
- IP-based vote tracking
- Prevent duplicate votes
- Real-time vote display
- Vote history tracking

### Ad Management
- Upload ad images
- Set destination URLs
- Toggle active/inactive
- Strategic placement in layout

### SEO & Analytics
- React Helmet for meta tags
- Open Graph tags
- Canonical URLs
- Google Analytics 4 integration

## Security Considerations
- API key authentication for n8n webhook
- Django session-based admin auth
- CSRF protection
- IP-based rate limiting
- Input validation and sanitization

## Performance Optimizations
- Redis caching for frequently accessed data
- Image optimization
- Static file serving via Apache
- Database query optimization

## Testing Strategy
- Unit tests for Django models and views
- Integration tests for API endpoints
- Frontend component testing
- End-to-end testing for critical flows

## Deployment Checklist
- [ ] Build React frontend
- [ ] Create Docker images
- [ ] Configure Apache virtual host
- [ ] Set up SSL certificates
- [ ] Configure domain DNS
- [ ] Test n8n webhook integration
- [ ] Verify admin functionality
- [ ] Test comment and voting systems
- [ ] Validate SEO implementation
- [ ] Configure Google Analytics

## Next Steps
1. Create the project structure
2. Set up Django backend with models
3. Implement DRF API endpoints
4. Create React frontend with Chakra UI
5. Implement admin dashboard
6. Set up Docker configuration
7. Create deployment scripts
8. Test and deploy

This plan provides a comprehensive roadmap for building the dhivehinoos.net news site according to the specifications.
