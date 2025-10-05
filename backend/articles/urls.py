from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'admin', views.ArticleViewSet, basename='article-admin')

urlpatterns = [
    path('', include(router.urls)),
    path('published/', views.PublishedArticleListView.as_view(), name='published-articles'),
    path('published/<slug:slug>/', views.PublishedArticleDetailView.as_view(), name='published-article-detail'),
    path('ingest/', views.ingest_article, name='ingest-article'),
    path('categories/', views.CategoryListView.as_view(), name='category-list'),
    path('categories/<slug:slug>/', views.CategoryDetailView.as_view(), name='category-detail'),
    path('categorize/', views.categorize_text, name='categorize-text'),
]
