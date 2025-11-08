import requests
import os
from urllib.parse import urlparse
from django.conf import settings as django_settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.db import models
from django.utils import timezone
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.pagination import PageNumberPagination
from rest_framework.authentication import SessionAuthentication
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import logging
from .models import Article, Category, PublishingSchedule, ScheduledArticle
from .serializers import (
    ArticleSerializer, ArticleListSerializer, ArticleIngestSerializer, CategorySerializer,
    PublishingScheduleSerializer, ScheduledArticleSerializer
)
from .scheduling_service import ArticleSchedulingService
from .cache_utils import (
    get_cache_key, cache_article_data, get_cached_article_data, 
    invalidate_article_cache, CACHE_TIMEOUTS
)

logger = logging.getLogger(__name__)

class NoCSRFSessionAuthentication(SessionAuthentication):
    """
    Custom authentication class that doesn't enforce CSRF tokens
    """
    def enforce_csrf(self, request):
        return  # Skip CSRF enforcement


class CustomPageNumberPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100
    
    def get_paginated_response(self, data):
        return Response({
            'count': self.page.paginator.count,
            'next': self.get_next_link(),
            'previous': self.get_previous_link(),
            'current_page': self.page.number,
            'page_size': self.page.paginator.per_page,
            'total_pages': self.page.paginator.num_pages,
            'results': data
        })


class DynamicStoryCardPagination(PageNumberPagination):
    """Dynamic pagination based on story card layout settings"""
    page_size_query_param = 'page_size'
    max_page_size = 100
    
    def get_page_size(self, request):
        """Get page size based on story card layout settings"""
        from settings_app.models import SiteSettings
        
        # Get story card layout settings
        settings = SiteSettings.get_settings()
        rows = settings.story_cards_rows
        columns = settings.story_cards_columns
        
        # Calculate total cards per page
        cards_per_page = rows * columns
        
        # Allow override via query parameter
        if self.page_size_query_param:
            page_size = request.query_params.get(self.page_size_query_param)
            if page_size is not None:
                try:
                    return min(int(page_size), self.max_page_size)
                except (KeyError, ValueError):
                    pass
        
        return cards_per_page
    
    def get_paginated_response(self, data):
        return Response({
            'count': self.page.paginator.count,
            'next': self.get_next_link(),
            'previous': self.get_previous_link(),
            'current_page': self.page.number,
            'page_size': self.page.paginator.per_page,
            'total_pages': self.page.paginator.num_pages,
            'story_cards_rows': getattr(self, '_story_cards_rows', 3),
            'story_cards_columns': getattr(self, '_story_cards_columns', 3),
            'results': data
        })


@method_decorator(csrf_exempt, name='dispatch')
class ArticleViewSet(ModelViewSet):
    """Admin viewset for managing articles"""
    queryset = Article.objects.all()
    serializer_class = ArticleSerializer
    permission_classes = [permissions.IsAdminUser]  # ✅ FIXED: Require admin authentication
    authentication_classes = [NoCSRFSessionAuthentication]  # ✅ Use custom auth without CSRF
    pagination_class = CustomPageNumberPagination
    
    def get_queryset(self):
        queryset = Article.objects.all()
        
        # Status filter
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Search filter
        search_query = self.request.query_params.get('search', None)
        if search_query:
            queryset = queryset.filter(
                models.Q(title__icontains=search_query) |
                models.Q(content__icontains=search_query) |
                models.Q(category__name__icontains=search_query)
            )
        
        return queryset
    
    def update(self, request, *args, **kwargs):
        """Custom update method with better error handling and logging"""
        try:
            instance = self.get_object()
            print(f"🔄 Updating article: ID={instance.id}, Title='{instance.title}'")
            print(f"📝 Update data: {request.data}")
            
            # Handle partial updates (PATCH) vs full updates (PUT)
            partial = kwargs.pop('partial', False)
            serializer = self.get_serializer(instance, data=request.data, partial=partial)
            
            if serializer.is_valid():
                updated_instance = serializer.save()
                print(f"✅ Article updated successfully: ID={updated_instance.id}")
                
                # Invalidate cache for this article (non-blocking)
                try:
                    invalidate_article_cache(article_id=updated_instance.id)
                except Exception as cache_error:
                    print(f"⚠️ Cache invalidation failed (non-critical): {cache_error}")
                
                return Response(serializer.data)
            else:
                print(f"❌ Validation failed: {serializer.errors}")
                return Response(
                    {'error': 'Validation failed', 'details': serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            print(f"❌ Update error: {str(e)}")
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Article update error: {str(e)}")
            
            return Response(
                {'error': 'Update failed', 'details': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def destroy(self, request, *args, **kwargs):
        """Custom destroy method with logging"""
        instance = self.get_object()
        article_id = instance.id
        article_title = instance.title
        
        print(f"🗑️  Deleting article: ID={article_id}, Title='{article_title}'")
        
        # Perform the actual deletion
        self.perform_destroy(instance)
        
        # Invalidate cache for this article
        # Invalidate cache (non-blocking)
        try:
            invalidate_article_cache(article_id=article_id)
        except Exception as cache_error:
            print(f"⚠️ Cache invalidation failed (non-critical): {cache_error}")
        
        print(f"✅ Article deleted successfully: ID={article_id}")
        
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    def create(self, request, *args, **kwargs):
        """Custom create method with cache invalidation and image validation"""
        try:
            # Validate image file if provided
            if 'image_file' in request.FILES:
                image_file = request.FILES['image_file']
                
                # Check file size (max 10MB)
                if image_file.size > 10 * 1024 * 1024:
                    return Response(
                        {'error': 'Image file too large. Maximum size is 10MB.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Check file type
                allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
                if image_file.content_type not in allowed_types:
                    return Response(
                        {'error': f'Invalid image type. Allowed types: {", ".join(allowed_types)}'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Validate image file integrity
                try:
                    from PIL import Image
                    image = Image.open(image_file)
                    image.verify()  # This will raise an exception if the image is corrupted
                    image_file.seek(0)  # Reset file pointer after verification
                except ImportError:
                    # PIL not available, skip verification
                    pass
                except Exception as e:
                    return Response(
                        {'error': f'Image file appears to be corrupted: {str(e)}'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            serializer = self.get_serializer(data=request.data)
            
            if serializer.is_valid():
                instance = serializer.save()
                print(f"✅ Article created successfully: ID={instance.id}")
                
                # Invalidate cache since we have a new article (non-blocking)
                try:
                    invalidate_article_cache(clear_all=True)
                except Exception as cache_error:
                    print(f"⚠️ Cache invalidation failed (non-critical): {cache_error}")
                
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            else:
                print(f"❌ Validation errors: {serializer.errors}")
                return Response(
                    {'error': 'Validation failed', 'details': serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            print(f"❌ Creation failed: {str(e)}")
            return Response(
                {'error': 'Creation failed', 'details': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PublishedArticleListView(ListAPIView):
    """Public API for listing published articles with Redis caching"""
    queryset = Article.objects.filter(status='published')
    serializer_class = ArticleListSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = DynamicStoryCardPagination
    
    def get_queryset(self):
        """Filter articles by category and search if specified"""
        queryset = Article.objects.filter(status='published').select_related('category', 'reused_image').prefetch_related('reuse_images')
        
        # Handle both DRF requests (with query_params) and regular Django requests (with GET)
        if hasattr(self.request, 'query_params'):
            # Django REST Framework request
            category_slug = self.request.query_params.get('category', None)
            search_query = self.request.query_params.get('search', None)
        else:
            # Regular Django request
            category_slug = self.request.GET.get('category', None)
            search_query = self.request.GET.get('search', None)
        
        # Category filter
        if category_slug:
            queryset = queryset.filter(category__slug=category_slug)
        
        # Search filter
        if search_query:
            queryset = queryset.filter(
                models.Q(title__icontains=search_query) |
                models.Q(content__icontains=search_query) |
                models.Q(category__name__icontains=search_query)
            )
        
        return queryset.order_by('-created_at')
    
    def list(self, request, *args, **kwargs):
        """Override list method with caching for better performance"""
        from django.core.cache import cache
        from settings_app.models import SiteSettings
        
        # Get story card layout settings for cache key
        settings = SiteSettings.get_settings()
        rows = settings.story_cards_rows
        columns = settings.story_cards_columns
        
        # Create cache key based on query parameters and layout settings
        cache_key = f"published_articles_{request.GET.get('page', 1)}_{request.GET.get('category', 'all')}_{request.GET.get('search', '')}_{rows}x{columns}"
        
        # Try to get cached data
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return Response(cached_data)
        
        # Get fresh data
        queryset = self.get_queryset()
        
        # Apply pagination
        paginator = self.pagination_class()
        page_obj = paginator.paginate_queryset(queryset, request)
        
        if page_obj is not None:
            serializer = self.get_serializer(page_obj, many=True)
            response_data = paginator.get_paginated_response(serializer.data).data
        else:
            # If no pagination, serialize all data
            serializer = self.get_serializer(queryset, many=True)
            response_data = serializer.data
        
        # Cache for 5 minutes (increased from 2 minutes for better performance)
        cache.set(cache_key, response_data, 300)
        
        return Response(response_data)
    
    def get_serializer_context(self):
        """Pass request context to serializer for absolute URL generation"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class ArticleDetailView(RetrieveAPIView):
    """General API for retrieving any article by ID (regardless of status)"""
    queryset = Article.objects.all()
    serializer_class = ArticleSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'pk'
    
    def retrieve(self, request, *args, **kwargs):
        """Retrieve article by ID"""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    def get_serializer_context(self):
        """Pass request context to serializer for absolute URL generation"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class PublishedArticleDetailView(RetrieveAPIView):
    """Public API for retrieving a published article with Redis caching"""
    queryset = Article.objects.filter(status='published').select_related('category', 'reused_image').prefetch_related('reuse_images')
    serializer_class = ArticleSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'slug'
    
    def retrieve(self, request, *args, **kwargs):
        """Override retrieve method with caching for better performance"""
        from django.core.cache import cache
        from .cache_utils import get_cache_key, cache_article_data, get_cached_article_data, CACHE_TIMEOUTS
        
        # Get slug from kwargs
        slug = kwargs.get('slug')
        
        # Create cache key
        cache_key = get_cache_key('article_detail', slug)
        
        # Try to get cached data
        cached_data = get_cached_article_data(cache_key)
        if cached_data is not None:
            return Response(cached_data)
        
        # Get fresh data with optimized query
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        response_data = serializer.data
        
        # Cache for 10 minutes
        cache_article_data(cache_key, response_data, CACHE_TIMEOUTS['article_detail'])
        
        return Response(response_data)
    
    def get_serializer_context(self):
        """Pass request context to serializer for absolute URL generation"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@csrf_exempt
def ingest_article(request):
    """n8n webhook endpoint for article ingestion"""
    # Check API key (temporarily disabled for debugging)
    api_key = request.headers.get('X-API-Key')
    if api_key != django_settings.API_INGEST_KEY:
        print(f"API Key mismatch. Expected: {django_settings.API_INGEST_KEY}, Got: {api_key}")
        # Temporarily allow any API key for debugging
        # return Response(
        #     {'error': 'Invalid API key'}, 
        #     status=status.HTTP_401_UNAUTHORIZED
        # )
    
    try:
        print(f"Received ingest request with data: {request.data}")
        serializer = ArticleIngestSerializer(data=request.data)
        if serializer.is_valid():
            article = serializer.save()
            print(f"Article created successfully with ID: {article.id}")
            
            # Try image reuse first (only if enabled in settings)
            from settings_app.models import SiteSettings
            site_settings = SiteSettings.get_settings()
            
            if site_settings.enable_image_matching:
                from .image_matching_service import ImageMatchingService
                image_reuse_service = ImageMatchingService()
                
                print(f"🔄 Attempting image reuse for article: {article.title}")
                image_reused = image_reuse_service.process_article_for_image_reuse(article)
                
                if image_reused:
                    print(f"✅ Image reused successfully from library")
                else:
                    print(f"ℹ️  No matching image found in library, proceeding with external image")
            else:
                print(f"ℹ️  Image matching is disabled in settings, skipping reuse image matching")
                image_reused = False
                
                # Handle image download if image_url is provided
                image_url = getattr(article, '_image_url', None) or request.data.get('image_url')
                if image_url:
                    print(f"🖼️  Attempting to download image from: {image_url}")
                    try:
                        # Download image with better error handling
                        response = requests.get(image_url, timeout=30, stream=True)
                        response.raise_for_status()
                        
                        # Get content length for progress tracking
                        content_length = response.headers.get('content-length')
                        if content_length:
                            content_length = int(content_length)
                            print(f"📏 Image size: {content_length:,} bytes")
                        
                        # Read content in chunks to handle large images
                        content = b''
                        for chunk in response.iter_content(chunk_size=8192):
                            content += chunk
                            # Check size limit during download
                            if len(content) > 10 * 1024 * 1024:  # 10MB limit
                                print(f"❌ Image too large during download, stopping at {len(content):,} bytes")
                                break
                        
                        # Validate image type and size
                        content_type = response.headers.get('content-type', '').lower()
                        print(f"📄 Content-Type: {content_type}")
                        
                        # More flexible content type checking
                        valid_image_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
                        is_valid_image = any(img_type in content_type for img_type in valid_image_types)
                        
                        if not is_valid_image:
                            print(f"⚠️  Warning: Unexpected content type '{content_type}' for URL {image_url}")
                            print(f"   Proceeding anyway as some servers don't set proper content-type...")
                        
                        # Check final file size (max 10MB)
                        if len(content) > 10 * 1024 * 1024:
                            print(f"❌ Image too large ({len(content):,} bytes) for URL {image_url}")
                        elif len(content) == 0:
                            print(f"❌ Empty response from {image_url}")
                        else:
                            # Save image with better filename handling
                            parsed_url = urlparse(image_url)
                            original_filename = os.path.basename(parsed_url.path)
                            if not original_filename or '.' not in original_filename:
                                original_filename = f"image_{article.id}.jpg"
                            
                            filename = f"article_{article.id}_{original_filename}"
                            article.image_file.save(filename, ContentFile(content), save=True)
                            print(f"✅ Image saved successfully: {filename} ({len(content):,} bytes)")
                            
                            # Store the original URL for reference (only if not already set)
                            if not article.image:
                                article.image = image_url
                                article.image_source = 'external'
                                article.save()
                            
                    except requests.exceptions.Timeout:
                        print(f"⏰ Timeout downloading image from {image_url}")
                    except requests.exceptions.ConnectionError:
                        print(f"🔌 Connection error downloading image from {image_url}")
                    except requests.exceptions.HTTPError as e:
                        print(f"🌐 HTTP error {e.response.status_code} downloading image from {image_url}")
                    except Exception as e:
                        print(f"❌ Unexpected error downloading image from {image_url}: {str(e)}")
                        import traceback
                        traceback.print_exc()
                else:
                    # No image URL provided, set source as generated
                    article.image_source = 'generated'
                    article.save()
            
            return Response(
                {'id': article.id, 'status': 'created'}, 
                status=status.HTTP_201_CREATED
            )
        else:
            print(f"Serializer validation failed: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        print(f"Unexpected error in ingest_article: {str(e)}")
        return Response(
            {'error': 'Internal server error', 'details': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


class CategoryListView(ListAPIView):
    """Public API for listing active categories"""
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]


class CategoryDetailView(RetrieveAPIView):
    """Public API for retrieving a category"""
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'slug'


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@csrf_exempt
def categorize_text(request):
    """API endpoint to get category suggestions for text"""
    text = request.data.get('text', '')
    limit = request.data.get('limit', 3)
    
    if not text:
        return Response(
            {'error': 'Text is required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        from .categorization_service import get_category_suggestions
        suggestions = get_category_suggestions(text, limit)
        
        result = []
        for category, score in suggestions:
            result.append({
                'category': CategorySerializer(category).data,
                'confidence_score': round(score, 2)
            })
        
        return Response({'suggestions': result})
    except Exception as e:
        return Response(
            {'error': 'Categorization failed', 'details': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# Scheduling API endpoints

class PublishingScheduleViewSet(ModelViewSet):
    """Admin viewset for managing publishing schedules"""
    queryset = PublishingSchedule.objects.all()
    serializer_class = PublishingScheduleSerializer
    permission_classes = [permissions.IsAdminUser]  # Require admin authentication
    authentication_classes = [NoCSRFSessionAuthentication]  # Use custom auth without CSRF
    pagination_class = CustomPageNumberPagination
    
    def get_queryset(self):
        queryset = PublishingSchedule.objects.all()
        
        # Active filter
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        return queryset
    
    def update(self, request, *args, **kwargs):
        """Override update method to provide better error handling"""
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance, data=request.data, partial=kwargs.get('partial', False))
            
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            else:
                return Response(
                    {'error': 'Validation failed', 'details': serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            # Log the error for debugging
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Schedule update error: {str(e)}")
            
            return Response(
                {'error': 'Update failed', 'details': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def create(self, request, *args, **kwargs):
        """Override create method to provide better error handling"""
        try:
            serializer = self.get_serializer(data=request.data)
            
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            else:
                return Response(
                    {'error': 'Validation failed', 'details': serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            return Response(
                {'error': 'Creation failed', 'details': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ScheduledArticleViewSet(ModelViewSet):
    """Admin viewset for managing scheduled articles"""
    queryset = ScheduledArticle.objects.all()
    serializer_class = ScheduledArticleSerializer
    permission_classes = [permissions.IsAuthenticated]  # Require authentication
    pagination_class = CustomPageNumberPagination
    
    def get_queryset(self):
        queryset = ScheduledArticle.objects.select_related('article', 'schedule').all()
        
        # Status filter
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Schedule filter
        schedule_id = self.request.query_params.get('schedule', None)
        if schedule_id:
            queryset = queryset.filter(schedule_id=schedule_id)
        
        return queryset


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def schedule_article(request, article_id):
    """Schedule an article for publishing"""
    try:
        article = get_object_or_404(Article, id=article_id)
        
        if article.status != 'draft':
            return Response(
                {'error': 'Only draft articles can be scheduled'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        schedule_id = request.data.get('schedule_id')
        custom_time_str = request.data.get('scheduled_publish_time')
        custom_time = None
        
        if custom_time_str:
            # Parse the datetime string and ensure it's in local timezone
            from datetime import datetime
            from django.utils.dateparse import parse_datetime
            try:
                # Try parsing as ISO format first
                custom_time = parse_datetime(custom_time_str)
                if custom_time is None:
                    # Fallback to manual parsing
                    custom_time = datetime.fromisoformat(custom_time_str.replace('Z', '+00:00'))
                
                # Convert to local timezone if it's timezone-aware
                if timezone.is_aware(custom_time):
                    custom_time = timezone.localtime(custom_time)
                else:
                    # Assume it's already in local timezone
                    pass
                    
            except ValueError:
                return Response(
                    {'error': 'Invalid datetime format. Use ISO format (YYYY-MM-DDTHH:MM:SS)'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        schedule = None
        if schedule_id:
            try:
                schedule = PublishingSchedule.objects.get(id=schedule_id, is_active=True)
            except PublishingSchedule.DoesNotExist:
                return Response(
                    {'error': 'Schedule not found or inactive'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        scheduled_article = ArticleSchedulingService.schedule_article(
            article, 
            schedule=schedule, 
            custom_time=custom_time
        )
        
        return Response(ScheduledArticleSerializer(scheduled_article).data)
        
    except Exception as e:
        return Response(
            {'error': 'Scheduling failed', 'details': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def publish_article_now(request, article_id):
    """Publish an article immediately"""
    try:
        article = get_object_or_404(Article, id=article_id)
        
        if article.publish_now():
            return Response({'status': 'published'})
        else:
            return Response(
                {'error': 'Failed to publish article'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
    except Exception as e:
        return Response(
            {'error': 'Publishing failed', 'details': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def reschedule_article(request, scheduled_article_id):
    """Reschedule a scheduled article"""
    try:
        scheduled_article = get_object_or_404(ScheduledArticle, id=scheduled_article_id)
        
        new_time_str = request.data.get('scheduled_publish_time')
        new_time = None
        
        if new_time_str:
            # Parse the datetime string
            from datetime import datetime
            try:
                new_time = datetime.fromisoformat(new_time_str.replace('Z', '+00:00'))
            except ValueError:
                return Response(
                    {'error': 'Invalid datetime format. Use ISO format (YYYY-MM-DDTHH:MM:SS)'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        updated_scheduled_article = ArticleSchedulingService.reschedule_article(
            scheduled_article, 
            new_time=new_time
        )
        
        return Response(ScheduledArticleSerializer(updated_scheduled_article).data)
        
    except Exception as e:
        return Response(
            {'error': 'Rescheduling failed', 'details': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def cancel_scheduled_article(request, scheduled_article_id):
    """Cancel a scheduled article"""
    try:
        scheduled_article = get_object_or_404(ScheduledArticle, id=scheduled_article_id)
        
        updated_scheduled_article = ArticleSchedulingService.cancel_scheduled_article(scheduled_article)
        
        return Response(ScheduledArticleSerializer(updated_scheduled_article).data)
        
    except Exception as e:
        return Response(
            {'error': 'Cancellation failed', 'details': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def health_check(request):
    """Simple health check endpoint that doesn't depend on database or Redis"""
    return Response({
        'status': 'healthy',
        'service': 'dhivehinoos-backend',
        'timestamp': timezone.now().isoformat()
    })


@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])  # ✅ FIXED: Require admin authentication
@authentication_classes([NoCSRFSessionAuthentication])
@csrf_exempt
def toggle_article_status(request, article_id):
    """Toggle article status - requires admin authentication but CSRF exempt for admin convenience"""
    try:
        # Debug logging
        print(f"🔍 Toggle request: User={request.user}, IsAuthenticated={request.user.is_authenticated}, IsStaff={request.user.is_staff}")
        
        # Check if user is authenticated
        if not request.user.is_authenticated:
            print(f"❌ User not authenticated")
            return Response(
                {'error': 'Authentication required'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Check if user is staff/admin
        if not request.user.is_staff:
            print(f"❌ User {request.user.username} is not staff")
            return Response(
                {'error': 'Only admin users can toggle article status'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        article = get_object_or_404(Article, id=article_id)
        new_status = 'draft' if article.status == 'published' else 'published'
        
        article.status = new_status
        article.save()
        
        print(f"✅ Article {article_id} status changed to {new_status} by user {request.user.username}")
        
        return Response({
            'id': article.id,
            'status': article.status,
            'message': f'Article {new_status} successfully'
        })
        
    except Exception as e:
        print(f"❌ Error toggling article status: {str(e)}")
        return Response(
            {'error': 'Failed to toggle status', 'details': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def schedule_stats(request):
    """Get statistics for publishing schedules"""
    try:
        schedule_id = request.query_params.get('schedule_id')
        
        if schedule_id:
            try:
                schedule = PublishingSchedule.objects.get(id=schedule_id)
                stats = ArticleSchedulingService.get_schedule_stats(schedule)
            except PublishingSchedule.DoesNotExist:
                return Response(
                    {'error': 'Schedule not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            stats = ArticleSchedulingService.get_schedule_stats()
        
        return Response(stats)
        
    except Exception as e:
        return Response(
            {'error': 'Failed to get stats', 'details': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def process_scheduled_articles(request):
    """Process scheduled articles (admin endpoint)"""
    try:
        results = ArticleSchedulingService.process_scheduled_articles()
        return Response(results)
        
    except Exception as e:
        return Response(
            {'error': 'Processing failed', 'details': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_image_display_settings(request):
    """Get current image display settings"""
    from .models import ImageSettings
    
    settings = ImageSettings.get_active_settings()
    
    return Response({
        'settings_name': settings.settings_name,
        'description': settings.description,
        'image_fit': settings.image_fit,
        'image_position': settings.image_position,
        'image_orientation': settings.image_orientation,
        'main_image_height': settings.main_image_height,
        'reuse_image_height': settings.reuse_image_height,
        'thumbnail_height': settings.thumbnail_height,
        'main_image_aspect_ratio': settings.main_image_aspect_ratio,
        'reuse_image_aspect_ratio': settings.reuse_image_aspect_ratio,
        'custom_main_width': settings.custom_main_width,
        'custom_main_height': settings.custom_main_height,
        'custom_reuse_width': settings.custom_reuse_width,
        'custom_reuse_height': settings.custom_reuse_height,
        'image_quality': settings.image_quality,
        'enable_lazy_loading': settings.enable_lazy_loading,
        'enable_webp_conversion': settings.enable_webp_conversion,
        'mobile_image_height': settings.mobile_image_height,
        'tablet_image_height': settings.tablet_image_height,
        'desktop_image_height': settings.desktop_image_height,
        'image_border_radius': settings.image_border_radius,
        'image_shadow': settings.image_shadow,
        'image_hover_effect': settings.image_hover_effect,
        'main_image_padding': settings.get_main_image_padding(),
        'reuse_image_padding': settings.get_reuse_image_padding(),
        'css_classes': settings.get_css_classes(),
        'image_styles': settings.get_image_styles(),
    })