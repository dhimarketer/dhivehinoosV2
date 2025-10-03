import requests
import os
from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework.generics import ListAPIView, RetrieveAPIView
from django.shortcuts import get_object_or_404
from .models import Article
from .serializers import ArticleSerializer, ArticleListSerializer, ArticleIngestSerializer


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
def ingest_article(request):
    """n8n webhook endpoint for article ingestion"""
    # Check API key
    api_key = request.headers.get('X-API-Key')
    if api_key != settings.API_INGEST_KEY:
        return Response(
            {'error': 'Invalid API key'}, 
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    serializer = ArticleIngestSerializer(data=request.data)
    if serializer.is_valid():
        article = serializer.save()
        
        # Handle image download if image_url is provided
        image_url = request.data.get('image_url')
        if image_url:
            try:
                # Download image
                response = requests.get(image_url, timeout=30)
                response.raise_for_status()
                
                # Validate image type and size
                content_type = response.headers.get('content-type', '')
                if not content_type.startswith('image/'):
                    return Response(
                        {'error': 'Invalid image type'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Check file size (max 5MB)
                if len(response.content) > 5 * 1024 * 1024:
                    return Response(
                        {'error': 'Image too large (max 5MB)'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Save image
                filename = f"article_{article.id}_{os.path.basename(image_url)}"
                article.image.save(filename, ContentFile(response.content), save=True)
                
            except requests.RequestException as e:
                return Response(
                    {'error': f'Failed to download image: {str(e)}'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return Response(
            {'id': article.id, 'status': 'created'}, 
            status=status.HTTP_201_CREATED
        )
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)