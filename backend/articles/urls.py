from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .feeds import LatestArticlesFeed, CategoryFeed, SearchFeed, AtomLatestArticlesFeed

router = DefaultRouter()
router.register(r'schedules', views.PublishingScheduleViewSet, basename='publishing-schedule')
router.register(r'scheduled-articles', views.ScheduledArticleViewSet, basename='scheduled-article')

urlpatterns = [
    path('', include(router.urls)),
    path('published/', views.PublishedArticleListView.as_view(), name='published-articles'),
    path('published/<slug:slug>/', views.PublishedArticleDetailView.as_view(), name='published-article-detail'),
    path('<int:pk>/', views.ArticleDetailView.as_view(), name='article-detail'),
    path('ingest/', views.ingest_article, name='ingest-article'),
    path('categories/', views.CategoryListView.as_view(), name='category-list'),
    path('categories/<slug:slug>/', views.CategoryDetailView.as_view(), name='category-detail'),
    path('categorize/', views.categorize_text, name='categorize-text'),
    
    # Health check endpoint
    path('health/', views.health_check, name='health-check'),
    
    # RSS/Atom Feeds
    path('rss/', LatestArticlesFeed(), name='rss-feed'),
    path('atom/', AtomLatestArticlesFeed(), name='atom-feed'),
    path('rss/category/<slug:category_slug>/', CategoryFeed(), name='category-rss-feed'),
    path('rss/search/', SearchFeed(), name='search-rss-feed'),
    
    # Simple toggle endpoint - no authentication required
    path('toggle-status/<int:article_id>/', views.toggle_article_status, name='toggle-article-status'),
    
    # Scheduling endpoints
    path('schedule/<int:article_id>/', views.schedule_article, name='schedule-article'),
    path('publish/<int:article_id>/', views.publish_article_now, name='publish-article-now'),
    path('reschedule/<int:scheduled_article_id>/', views.reschedule_article, name='reschedule-article'),
    path('cancel/<int:scheduled_article_id>/', views.cancel_scheduled_article, name='cancel-scheduled-article'),
    path('schedule-stats/', views.schedule_stats, name='schedule-stats'),
    path('process-scheduled/', views.process_scheduled_articles, name='process-scheduled-articles'),
    path('image-display-settings/', views.get_image_display_settings, name='image-display-settings'),
    path('agent/analytics/', views.AgentAnalyticsView.as_view(), name='agent-analytics'),
]
