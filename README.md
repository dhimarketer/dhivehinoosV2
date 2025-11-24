# Dhivehinoos.net - Maldivian News Site

A comprehensive, self-hosted news platform that receives AI-generated articles from n8n, displays them with multiple customizable themes, supports article categorization, scheduling, email subscriptions, RSS feeds, moderated comments, IP-based voting, and includes a full-featured admin dashboard.

## Project Overview

Dhivehinoos.net is a production-ready news website platform built for the Maldivian diaspora. It features automated article ingestion, intelligent categorization, flexible publishing schedules, multiple visual themes, and comprehensive content management capabilities.

## Core Features

### Content Management
- **AI Article Ingestion**: Receives articles from n8n via secure webhook API
- **Article Categorization**: Automatic categorization using regex patterns and keyword analysis (10 default categories: Politics, Economy, Sports, Technology, Health, Education, Environment, Entertainment, International, Local News)
- **Article Scheduling**: Flexible publishing schedules with forbidden hours, daily limits, and custom intervals
- **Image Management**: Reusable image system with automatic matching to articles based on entity names
- **Rich Text Editing**: Full content editing capabilities in admin dashboard
- **Article Status Management**: Draft, published, scheduled statuses with workflow support

### User Features
- **Multiple Themes**: 5 customizable themes (Modern, Classic, Minimal, Newspaper, Magazine) with live preview
- **Category Navigation**: Visual category filtering with badges and article counts
- **Comment System**: IP-based moderation with auto-approval for returning users
- **Voting System**: IP-based voting with duplicate prevention
- **Email Subscriptions**: Newsletter subscription system with confirmation tokens
- **RSS/Atom Feeds**: Multiple feed formats (RSS, Atom, category-specific, search-based)
- **Social Sharing**: Built-in social media sharing buttons
- **Responsive Design**: Mobile-first responsive layouts for all themes

### Admin Features
- **Admin Dashboard**: Comprehensive dashboard with tabs for Articles, Comments, Ads, Contact, Subscriptions, Scheduling, and Settings
- **Site Settings**: Centralized configuration for themes, layouts, comments, webhooks, analytics
- **Ad Management**: Strategic ad placement with scheduling and placement controls
- **Comment Moderation**: Approve/reject comments with webhook integration
- **Email Campaigns**: Create and send email newsletters to subscribers
- **Scheduling Management**: Configure publishing schedules and process scheduled articles
- **Image Reuse Management**: Manage reusable images for prominent people and institutions
- **Analytics Integration**: Google Analytics 4 support

### Technical Features
- **Redis Caching**: High-performance caching for articles, categories, and settings
- **SEO Optimization**: React Helmet for meta tags, Open Graph, and canonical URLs
- **Docker Deployment**: Fully containerized with Docker Compose
- **Health Checks**: Built-in health check endpoints for monitoring
- **Logging**: Comprehensive logging system for debugging and monitoring
- **Session Management**: Redis-backed session storage for persistence

## Tech Stack

### Backend
- **Framework**: Django 5.2.7 + Django REST Framework 3.16.1
- **Database**: SQLite3 (with migrations support)
- **Caching**: Redis 7 (via django-redis 5.4.0)
- **Server**: Gunicorn 23.0.0
- **Image Processing**: Pillow 11.3.0
- **HTTP Client**: Requests 2.32.5

### Frontend
- **Framework**: React 19.1.1
- **Build Tool**: Vite 7.1.7
- **UI Library**: Chakra UI 2.8.2
- **Routing**: React Router DOM 6.20.1
- **HTTP Client**: Axios 1.6.2
- **SEO**: React Helmet Async 2.0.4
- **Icons**: React Icons 5.5.0, Heroicons 2.2.0
- **Styling**: Tailwind CSS 4.1.17, Emotion (for Chakra UI)
- **Testing**: Vitest 2.1.9, React Testing Library 16.3.0

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Web Server**: Apache (reverse proxy + static/media serving)
- **Deployment**: DockerHub for image distribution
- **Time Zone**: Indian/Maldives

## Project Structure

```
dhivehinoosV2/
├── backend/                      # Django backend application
│   ├── articles/                 # Article management app
│   │   ├── models.py             # Article, Category, PublishingSchedule, ReusableImage models
│   │   ├── views.py              # API views for articles
│   │   ├── serializers.py        # DRF serializers
│   │   ├── categorization_service.py  # Automatic categorization engine
│   │   ├── scheduling_service.py      # Article scheduling logic
│   │   ├── image_matching_service.py   # Image reuse matching
│   │   ├── feeds.py              # RSS/Atom feed generators
│   │   └── management/commands/  # Django management commands
│   ├── comments/                 # Comments and voting app
│   │   ├── models.py             # Comment, Vote models
│   │   ├── views.py              # Comment API endpoints
│   │   └── webhook_service.py    # Comment webhook integration
│   ├── ads/                      # Advertisement management
│   │   ├── models.py             # Ad, AdPlacement models
│   │   └── views.py              # Ad API endpoints
│   ├── contact/                  # Contact form handling
│   │   └── models.py             # ContactMessage model
│   ├── subscriptions/           # Email subscription system
│   │   ├── models.py             # NewsletterSubscription, EmailCampaign models
│   │   └── views.py              # Subscription API endpoints
│   ├── settings_app/             # Site-wide settings
│   │   ├── models.py             # SiteSettings model
│   │   └── views.py              # Settings API endpoints
│   ├── auth/                     # Custom authentication
│   ├── scheduling/               # Scheduling app (legacy)
│   ├── dhivehinoos_backend/      # Django project settings
│   │   ├── settings.py           # Main configuration
│   │   └── urls.py               # URL routing
│   ├── database/                 # SQLite database
│   ├── media/                    # Uploaded media files
│   ├── static/                   # Static files
│   ├── logs/                     # Application logs
│   ├── manage.py
│   └── requirements.txt
├── frontend/                     # React frontend application
│   ├── src/
│   │   ├── components/           # Reusable components
│   │   │   ├── ui/               # Chakra UI component wrappers
│   │   │   ├── AdComponent.jsx
│   │   │   ├── CategoryNavigation.jsx
│   │   │   ├── NewsletterSubscription.jsx
│   │   │   ├── SocialShare.jsx
│   │   │   └── StoryCard.jsx
│   │   ├── pages/                # Page components
│   │   │   ├── HomePage.jsx
│   │   │   ├── ArticlePage.jsx
│   │   │   ├── ContactPage.jsx
│   │   │   ├── AboutPage.jsx
│   │   │   └── admin/            # Admin pages
│   │   ├── layouts/              # Theme layouts
│   │   │   ├── ModernLayout.jsx
│   │   │   ├── ClassicLayout.jsx
│   │   │   ├── MinimalLayout.jsx
│   │   │   ├── NewspaperLayout.jsx
│   │   │   └── MagazineLayout.jsx
│   │   ├── themes/               # Theme configurations
│   │   │   ├── base.js
│   │   │   ├── modern.js
│   │   │   ├── classic.js
│   │   │   ├── minimal.js
│   │   │   ├── newspaper.js
│   │   │   └── magazine.js
│   │   ├── contexts/             # React contexts
│   │   │   ├── AuthContext.jsx
│   │   │   └── ToastContext.jsx
│   │   ├── hooks/                # Custom hooks
│   │   │   ├── useTheme.js
│   │   │   ├── useSiteSettings.js
│   │   │   └── useImageSettings.js
│   │   ├── services/             # API services
│   │   │   ├── api.js
│   │   │   └── auth.js
│   │   ├── utils/                # Utility functions
│   │   └── App.jsx               # Main app component
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   └── Dockerfile
├── docker/                       # Docker configuration
│   ├── Dockerfile.backend        # Backend Docker image
│   ├── docker-compose.yml        # Production compose file
│   ├── build-and-push.sh         # Build and push to DockerHub
│   ├── deploy_linode.sh          # Deployment script for Linode
│   └── apache.conf               # Apache configuration
└── README.md                     # This file
```

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.12+ (for local development)
- Redis server (or use Docker Compose)
- Apache web server (for production)

### Local Development Setup

1. **Backend Development**:
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   python manage.py migrate
   python manage.py createsuperuser
   python manage.py create_default_categories
   python manage.py create_default_schedules
   python manage.py runserver
   ```

2. **Frontend Development**:
   ```bash
   cd frontend
   npm install --legacy-peer-deps
   npm run dev
   ```

3. **Access the application**:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - Django Admin: http://localhost:8000/admin/

### Production Deployment

#### Building and Pushing Docker Images

1. **Build and push to DockerHub** (run from project root):
   ```bash
   cd docker
   ./build-and-push.sh [dockerhub-username] [version]
   # Example: ./build-and-push.sh dhimarketer latest
   ```

#### Deploying to Linode

1. **SSH into your Linode server**:
   ```bash
   ssh user@your-linode-server
   ```

2. **Navigate to deployment directory**:
   ```bash
   cd /opt/dhivehinoos
   ```

3. **Run deployment script**:
   ```bash
   chmod +x docker/deploy_linode.sh
   ./docker/deploy_linode.sh
   ```

4. **Configure environment variables** (create `.env` file in docker directory):
   ```bash
   SECRET_KEY=your-secret-key-here
   API_INGEST_KEY=your-n8n-api-key
   DEBUG=False
   ALLOWED_HOSTS=dhivehinoos.net,www.dhivehinoos.net
   REDIS_URL=redis://dhivehinoos_redis:6379/0
   ```

5. **Configure Apache** (see `docker/apache.conf` for reference)

## API Endpoints

### Public Endpoints

#### Articles
- `GET /api/v1/articles/published/` - List published articles (supports pagination, category filtering)
- `GET /api/v1/articles/published/{slug}/` - Get article by slug
- `GET /api/v1/articles/categories/` - List all active categories
- `GET /api/v1/articles/categories/{slug}/` - Get category details
- `GET /api/v1/articles/rss/` - RSS feed for latest articles
- `GET /api/v1/articles/rss/category/{slug}/` - Category-specific RSS feed
- `GET /api/v1/articles/rss/search/?q={query}` - Search results RSS feed
- `GET /api/v1/articles/atom/` - Atom feed for latest articles
- `POST /api/v1/articles/categorize/` - Get category suggestions for text

#### Comments
- `POST /api/v1/comments/create/` - Create comment
- `POST /api/v1/comments/vote/` - Vote on article

#### Ads
- `GET /api/v1/ads/active/` - List active ads

#### Contact
- `POST /api/v1/contact/create/` - Submit contact message

#### Subscriptions
- `POST /api/v1/subscriptions/subscribe/` - Subscribe to newsletter
- `GET /api/v1/subscriptions/confirm/{token}/` - Confirm subscription
- `GET /api/v1/subscriptions/unsubscribe/{token}/` - Unsubscribe

#### Settings
- `GET /api/v1/settings/public/` - Get public site settings

### Admin Endpoints (Authentication Required)

#### Articles
- `GET /api/v1/articles/admin/` - List all articles
- `POST /api/v1/articles/admin/` - Create article
- `PUT /api/v1/articles/admin/{id}/` - Update article
- `DELETE /api/v1/articles/admin/{id}/` - Delete article
- `POST /api/v1/articles/schedule/{id}/` - Schedule article
- `POST /api/v1/articles/publish/{id}/` - Publish article immediately

#### Comments
- `GET /api/v1/comments/admin/` - List all comments
- `PATCH /api/v1/comments/admin/{id}/` - Approve/reject comment

#### Ads
- `GET /api/v1/ads/admin/` - List all ads
- `POST /api/v1/ads/admin/` - Create ad
- `PUT /api/v1/ads/admin/{id}/` - Update ad
- `DELETE /api/v1/ads/admin/{id}/` - Delete ad

#### Contact
- `GET /api/v1/contact/admin/` - List contact messages
- `PATCH /api/v1/contact/admin/{id}/` - Mark as read/archived

#### Subscriptions
- `GET /api/v1/subscriptions/subscriptions/` - List all subscriptions
- `GET /api/v1/subscriptions/campaigns/` - List email campaigns
- `POST /api/v1/subscriptions/campaigns/` - Create campaign
- `POST /api/v1/subscriptions/campaigns/{id}/send/` - Send campaign
- `GET /api/v1/subscriptions/stats/` - Get subscription statistics

#### Scheduling
- `GET /api/v1/articles/schedules/` - List publishing schedules
- `POST /api/v1/articles/schedules/` - Create schedule
- `GET /api/v1/articles/scheduled-articles/` - List scheduled articles
- `POST /api/v1/articles/process-scheduled/` - Process scheduled articles

#### Settings
- `GET /api/v1/settings/admin/` - Get site settings
- `PUT /api/v1/settings/admin/` - Update site settings

### n8n Webhook

- `POST /api/v1/articles/ingest/` - Ingest article from n8n
  - **Headers**: `X-API-Key: your_api_key`
  - **Body**:
    ```json
    {
      "title": "Article Title",
      "content": "<p>HTML content...</p>",
      "image_url": "https://example.com/image.jpg",
      "category_id": 1,
      "publishing_mode": "instant",
      "scheduled_publish_time": "2024-01-15T10:00:00Z"
    }
    ```

## Key Features in Detail

### Article Categorization System

The system automatically categorizes articles using:
- **Regex Pattern Matching**: Sophisticated regex patterns for each category
- **Keyword Analysis**: Weighted keyword matching in titles and content
- **Multi-layered Scoring**: Combines multiple analysis methods
- **Confidence Scoring**: Provides confidence scores for categorization

Default categories include: Politics, Economy, Sports, Technology, Health, Education, Environment, Entertainment, International, and Local News.

### Article Scheduling System

Flexible publishing schedules with:
- **Multiple Frequencies**: Instant, hourly, daily, weekly, custom intervals
- **Forbidden Hours**: Configure time windows when articles shouldn't publish
- **Daily Limits**: Set maximum articles per day per schedule
- **Priority Queuing**: Multiple schedules with priority levels
- **Automatic Processing**: Cron job support for scheduled article processing

### Theme System

Five fully customizable themes:
- **Modern News**: Clean, modern design with featured article and grid layout
- **Classic Blog**: Traditional blog layout with sidebar, warm colors, serif fonts
- **Minimal Clean**: Minimalist design with lots of whitespace, simple typography
- **Newspaper Style**: Traditional newspaper layout with multi-column grid
- **Magazine Layout**: Bold, visual design with large featured images

Each theme supports:
- Custom color schemes
- Font customization
- Spacing adjustments
- Live preview in admin
- JSON-based configuration

### Image Reuse System

Intelligent image matching for articles:
- **Reusable Images**: Upload images for prominent people and institutions
- **Automatic Matching**: Matches article content to reusable images based on entity names
- **Multiple Images**: Supports up to 4 images per article
- **Confidence Scoring**: Calculates match confidence scores
- **Usage Tracking**: Tracks how often images are used

### Email Subscription & RSS System

Comprehensive subscription management:
- **Newsletter Subscriptions**: Email collection with confirmation tokens
- **Email Campaigns**: Create and send newsletters to subscribers
- **RSS/Atom Feeds**: Multiple feed formats (main, category-specific, search-based)
- **Subscription Management**: Admin interface for managing subscribers
- **Statistics**: Track subscription and campaign metrics

### Comment System

Advanced comment moderation:
- **IP-based Moderation**: First-time commenters require approval
- **Auto-approval**: Returning commenters are auto-approved
- **Webhook Integration**: Send approved comments to n8n workflows
- **Voting System**: IP-based voting with duplicate prevention

## Environment Variables

### Backend (.env file in docker directory)

```bash
SECRET_KEY=your-django-secret-key
DEBUG=False
ALLOWED_HOSTS=dhivehinoos.net,www.dhivehinoos.net,localhost
DATABASE_URL=sqlite:////app/database/db.sqlite3
REDIS_URL=redis://dhivehinoos_redis:6379/0
API_INGEST_KEY=your-n8n-api-key
USE_MEMORY_CACHE=false  # Set to true to use memory cache instead of Redis
USE_TLS=true  # For production HTTPS
```

### Frontend

```bash
VITE_API_URL=https://dhivehinoos.net/api/v1
```

## Database Models

### Core Models

- **Article**: Title, slug, content, image, category, status, publishing_mode, scheduled_publish_time
- **Category**: Name, slug, description, color, icon, keywords, regex_patterns
- **Comment**: Article, author_name, content, ip_address, is_approved
- **Vote**: Article, ip_address, vote_type
- **Ad**: Title, image, destination_url, is_active, start_date, end_date
- **ContactMessage**: Name, email, message, is_read, is_archived
- **NewsletterSubscription**: Email, status, subscription_token, unsubscribe_token
- **EmailCampaign**: Title, subject, content, status, scheduled_send_time
- **PublishingSchedule**: Name, frequency, forbidden_hours, max_articles_per_day
- **ScheduledArticle**: Article, schedule, status, scheduled_publish_time
- **ReusableImage**: Entity name, image_file, alternative_names, usage_count
- **SiteSettings**: Centralized site configuration (themes, settings, webhooks)

## Management Commands

```bash
# Create default categories
python manage.py create_default_categories

# Create default publishing schedules
python manage.py create_default_schedules

# Process scheduled articles
python manage.py process_scheduled_articles [--dry-run] [--schedule-id ID]

# Collect static files
python manage.py collectstatic --noinput

# Create superuser
python manage.py createsuperuser
```

## Docker Deployment

### Docker Compose Services

- **dhivehinoos_backend**: Django backend (port 8052)
- **dhivehinoos_frontend**: React frontend (port 8053)
- **dhivehinoos_redis**: Redis cache (port 8054)

### Volumes

- `/opt/dhivehinoos/database` - SQLite database
- `/opt/dhivehinoos/media` - Uploaded media files
- `/opt/dhivehinoos/static` - Static files
- `/opt/dhivehinoos/logs` - Application logs
- `/opt/dhivehinoos/redis` - Redis data persistence

## Security Features

- **API Key Authentication**: Secure webhook endpoints
- **Session-based Admin Auth**: Django session authentication
- **CSRF Protection**: Built-in CSRF protection
- **IP-based Rate Limiting**: Comment and voting duplicate prevention
- **Input Validation**: Comprehensive input sanitization
- **Secure Headers**: XSS protection, content type sniffing prevention
- **Token-based Subscriptions**: UUID tokens for subscription confirmation

## Performance Optimizations

- **Redis Caching**: Articles, categories, and settings cached
- **Database Indexing**: Optimized database queries
- **Image Optimization**: Efficient image handling
- **Static File Serving**: Apache serves static files directly
- **Query Optimization**: select_related and prefetch_related usage
- **Pagination**: All list endpoints support pagination

## Testing

### Backend Tests

```bash
cd backend
source venv/bin/activate
python manage.py test
```

### Frontend Tests

```bash
cd frontend
npm test
npm run test:coverage
```

## Monitoring & Logging

- **Application Logs**: `/opt/dhivehinoos/logs/app.log`
- **Error Logs**: `/opt/dhivehinoos/logs/errors.log`
- **Health Checks**: `/api/v1/articles/health/`
- **Docker Logs**: `docker-compose logs -f`

## Default Admin Credentials

- **Username**: admin
- **Password**: admin123

**⚠️ IMPORTANT: Change these credentials immediately after deployment!**

## n8n Integration

Configure n8n to send articles:

```bash
POST https://dhivehinoos.net/api/v1/articles/ingest/
Headers:
  X-API-Key: your_api_key
  Content-Type: application/json

Body:
{
  "title": "Article Title",
  "content": "<p>HTML content...</p>",
  "image_url": "https://example.com/image.jpg",
  "category_id": 1,
  "publishing_mode": "scheduled",
  "scheduled_publish_time": "2024-01-15T10:00:00Z"
}
```

## Cron Jobs

Set up automatic scheduled article processing:

```bash
# Edit crontab
crontab -e

# Add this line to run every 5 minutes
*/5 * * * * docker-compose -f /opt/dhivehinoos/docker-compose.yml exec -T dhivehinoos_backend python manage.py process_scheduled_articles >> /opt/dhivehinoos/logs/scheduling.log 2>&1
```

## Troubleshooting

### Common Issues

1. **Articles not publishing**: Check if schedule is active and time restrictions
2. **Redis connection errors**: Verify Redis is running and URL is correct
3. **Image matching not working**: Check if image matching is enabled in settings
4. **Theme not applying**: Clear browser cache and verify settings are saved
5. **Comments not appearing**: Check comment approval settings and webhook configuration

### Debug Commands

```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs -f [service_name]

# Access backend shell
docker-compose exec dhivehinoos_backend python manage.py shell

# Check Redis
docker-compose exec dhivehinoos_redis redis-cli ping

# Test API
curl http://localhost:8052/api/v1/articles/published/
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

## Additional Documentation

- `CATEGORIZATION_SYSTEM.md` - Detailed categorization system documentation
- `EMAIL_SUBSCRIPTION_RSS_SYSTEM.md` - Email and RSS feed system documentation
- `SCHEDULING_SYSTEM.md` - Article scheduling system documentation
- `DEPLOYMENT_GUIDE.md` - Detailed deployment instructions
- `TESTING_GUIDE.md` - Testing guidelines and examples
- `SECURITY_AUDIT.md` - Security considerations and best practices
