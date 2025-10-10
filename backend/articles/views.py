import requests
import os
from urllib.parse import urlparse
from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.db import models
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from .models import Article, Category, PublishingSchedule, ScheduledArticle
from .serializers import (
    ArticleSerializer, ArticleListSerializer, ArticleIngestSerializer, CategorySerializer,
    PublishingScheduleSerializer, ScheduledArticleSerializer
)
from .scheduling_service import ArticleSchedulingService


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


@method_decorator(csrf_exempt, name='dispatch')
class ArticleViewSet(ModelViewSet):
    """Admin viewset for managing articles"""
    queryset = Article.objects.all()
    serializer_class = ArticleSerializer
    permission_classes = [permissions.AllowAny]  # Temporarily allow any for testing
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
    
    def destroy(self, request, *args, **kwargs):
        """Custom destroy method with logging"""
        instance = self.get_object()
        article_id = instance.id
        article_title = instance.title
        
        print(f"🗑️  Deleting article: ID={article_id}, Title='{article_title}'")
        
        # Perform the actual deletion
        self.perform_destroy(instance)
        
        print(f"✅ Article deleted successfully: ID={article_id}")
        
        return Response(status=status.HTTP_204_NO_CONTENT)


class PublishedArticleListView(ListAPIView):
    """Public API for listing published articles"""
    queryset = Article.objects.filter(status='published')
    serializer_class = ArticleListSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = CustomPageNumberPagination
    
    def get_queryset(self):
        """Filter articles by category and search if specified"""
        queryset = Article.objects.filter(status='published').select_related('category')
        
        # Category filter
        category_slug = self.request.query_params.get('category', None)
        if category_slug:
            queryset = queryset.filter(category__slug=category_slug)
        
        # Search filter
        search_query = self.request.query_params.get('search', None)
        if search_query:
            queryset = queryset.filter(
                models.Q(title__icontains=search_query) |
                models.Q(content__icontains=search_query) |
                models.Q(category__name__icontains=search_query)
            )
        
        return queryset
    
    def get_serializer_context(self):
        """Pass request context to serializer for absolute URL generation"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class PublishedArticleDetailView(RetrieveAPIView):
    """Public API for retrieving a published article"""
    queryset = Article.objects.filter(status='published')
    serializer_class = ArticleSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'slug'
    
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
    if api_key != settings.API_INGEST_KEY:
        print(f"API Key mismatch. Expected: {settings.API_INGEST_KEY}, Got: {api_key}")
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
                        
                        # Also store the original URL for reference
                        article.image = image_url
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
    permission_classes = [permissions.AllowAny]  # Temporarily allow any for testing
    pagination_class = CustomPageNumberPagination
    
    def get_queryset(self):
        queryset = PublishingSchedule.objects.all()
        
        # Active filter
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        return queryset


class ScheduledArticleViewSet(ModelViewSet):
    """Admin viewset for managing scheduled articles"""
    queryset = ScheduledArticle.objects.all()
    serializer_class = ScheduledArticleSerializer
    permission_classes = [permissions.AllowAny]  # Temporarily allow any for testing
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
@permission_classes([permissions.AllowAny])
@csrf_exempt
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
        custom_time = request.data.get('scheduled_publish_time')
        
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
@permission_classes([permissions.AllowAny])
@csrf_exempt
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
@permission_classes([permissions.AllowAny])
@csrf_exempt
def reschedule_article(request, scheduled_article_id):
    """Reschedule a scheduled article"""
    try:
        scheduled_article = get_object_or_404(ScheduledArticle, id=scheduled_article_id)
        
        new_time = request.data.get('scheduled_publish_time')
        
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
@permission_classes([permissions.AllowAny])
@csrf_exempt
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
@permission_classes([permissions.AllowAny])
@csrf_exempt
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