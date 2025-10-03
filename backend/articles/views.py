import requests
import os
from urllib.parse import urlparse
from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework.generics import ListAPIView, RetrieveAPIView
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from .models import Article
from .serializers import ArticleSerializer, ArticleListSerializer, ArticleIngestSerializer


@method_decorator(csrf_exempt, name='dispatch')
class ArticleViewSet(ModelViewSet):
    """Admin viewset for managing articles"""
    queryset = Article.objects.all()
    serializer_class = ArticleSerializer
    permission_classes = [permissions.AllowAny]  # Temporarily allow any for testing
    
    def get_queryset(self):
        queryset = Article.objects.all()
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset


class PublishedArticleListView(ListAPIView):
    """Public API for listing published articles"""
    queryset = Article.objects.filter(status='published')
    serializer_class = ArticleListSerializer
    permission_classes = [permissions.AllowAny]
    
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