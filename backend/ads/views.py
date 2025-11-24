from rest_framework import permissions, status
from rest_framework.viewsets import ModelViewSet
from rest_framework.generics import ListAPIView
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.authentication import SessionAuthentication
from django.utils import timezone
from django.db import models
from django.http import JsonResponse
from django.core.files.base import ContentFile
from urllib.parse import urlparse
import requests
import logging
import os
from .models import Ad, AdPlacement
from .serializers import AdSerializer, AdPlacementSerializer


class NoCSRFSessionAuthentication(SessionAuthentication):
    """
    Custom authentication class that doesn't enforce CSRF tokens
    """
    def enforce_csrf(self, request):
        return  # Skip CSRF enforcement

logger = logging.getLogger(__name__)


def ads_debug_view(request):
    """Debug endpoint to test ads functionality"""
    try:
        placements_count = AdPlacement.objects.count()
        ads_count = Ad.objects.count()
        active_placements = AdPlacement.objects.filter(is_active=True).count()
        
        return JsonResponse({
            'status': 'success',
            'placements_count': placements_count,
            'ads_count': ads_count,
            'active_placements': active_placements,
            'placements': list(AdPlacement.objects.filter(is_active=True).values('id', 'name', 'is_active'))
        })
    except Exception as e:
        logger.error(f"Error in ads_debug_view: {e}")
        return JsonResponse({
            'status': 'error',
            'error': str(e)
        }, status=500)


class AdPlacementViewSet(ModelViewSet):
    """Admin viewset for managing ad placements"""
    queryset = AdPlacement.objects.all()
    serializer_class = AdPlacementSerializer
    permission_classes = [permissions.AllowAny]  # Temporarily allow any for testing


class AdViewSet(ModelViewSet):
    """Admin viewset for managing ads"""
    queryset = Ad.objects.select_related('placement').all()
    serializer_class = AdSerializer
    permission_classes = [permissions.IsAdminUser]  # ✅ FIXED: Require admin authentication
    authentication_classes = [NoCSRFSessionAuthentication]  # ✅ Use custom auth without CSRF


class ActiveAdsListView(ListAPIView):
    """Public API for listing currently active ads"""
    queryset = Ad.objects.select_related('placement').all()
    serializer_class = AdSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        """Filter ads that are currently active based on dates"""
        try:
            now = timezone.now()
            queryset = Ad.objects.select_related('placement').filter(
                is_active=True,
                start_date__lte=now
            ).filter(
                models.Q(end_date__isnull=True) | models.Q(end_date__gt=now)
            )
            
            # Filter by placement if specified
            placement = self.request.query_params.get('placement', None)
            if placement:
                queryset = queryset.filter(placement__name=placement)
                
            return queryset
        except Exception as e:
            # Log the error and return empty queryset
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error in ActiveAdsListView.get_queryset: {e}")
            return Ad.objects.none()
    
    def get_serializer_context(self):
        """Pass request context to serializer for building absolute URLs"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class AdPlacementsListView(ListAPIView):
    """Public API for listing available ad placements"""
    queryset = AdPlacement.objects.all()
    serializer_class = AdPlacementSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        """Filter active placements"""
        try:
            return AdPlacement.objects.filter(is_active=True)
        except Exception as e:
            # Log the error and return empty queryset
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error in AdPlacementsListView.get_queryset: {e}")
            return AdPlacement.objects.none()


class AgentAdCreateView(APIView):
    """
    Endpoint for AI Sales Agent to create ads with remote image URLs.
    Downloads the image server-side and creates an active Ad.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        """
        Create an ad from a remote image URL.
        
        Expected payload:
        {
            "title": "Ad Title",
            "image_url": "https://source.com/image.jpg",
            "destination_url": "https://client-site.com",
            "start_date": "YYYY-MM-DD",
            "end_date": "YYYY-MM-DD",
            "position": "sidebar" (or "header" or "article_middle")
        }
        """
        try:
            # Extract data from request
            title = request.data.get('title')
            image_url = request.data.get('image_url')
            destination_url = request.data.get('destination_url')
            start_date_str = request.data.get('start_date')
            end_date_str = request.data.get('end_date')
            position = request.data.get('position', 'sidebar')
            
            # Validate required fields
            if not title:
                return Response(
                    {'error': 'title is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if not image_url:
                return Response(
                    {'error': 'image_url is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Download the image
            try:
                response = requests.get(image_url, timeout=30, stream=True)
                if response.status_code != 200:
                    return Response(
                        {'error': f'Failed to download image. HTTP {response.status_code}'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Read content
                content = response.content
                
                # Validate content size (max 10MB)
                if len(content) > 10 * 1024 * 1024:
                    return Response(
                        {'error': 'Image file too large. Maximum size is 10MB.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                if len(content) == 0:
                    return Response(
                        {'error': 'Empty image file'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Extract filename from URL
                parsed_url = urlparse(image_url)
                original_filename = os.path.basename(parsed_url.path)
                if not original_filename or '.' not in original_filename:
                    # Try to get extension from content-type
                    content_type = response.headers.get('content-type', '')
                    if 'jpeg' in content_type or 'jpg' in content_type:
                        ext = '.jpg'
                    elif 'png' in content_type:
                        ext = '.png'
                    elif 'gif' in content_type:
                        ext = '.gif'
                    elif 'webp' in content_type:
                        ext = '.webp'
                    else:
                        ext = '.jpg'  # Default
                    original_filename = f"ad_image{ext}"
                
            except requests.exceptions.Timeout:
                return Response(
                    {'error': 'Timeout downloading image'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            except requests.exceptions.ConnectionError:
                return Response(
                    {'error': 'Connection error downloading image'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            except requests.exceptions.RequestException as e:
                return Response(
                    {'error': f'Error downloading image: {str(e)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Map position string to AdPlacement name
            position_mapping = {
                'sidebar': 'sidebar',
                'header': 'top_banner',
                'article_middle': 'between_articles'
            }
            
            placement_name = position_mapping.get(position.lower(), 'sidebar')
            
            # Get or create the AdPlacement
            try:
                placement = AdPlacement.objects.get(name=placement_name)
            except AdPlacement.DoesNotExist:
                # Create the placement if it doesn't exist
                placement = AdPlacement.objects.create(
                    name=placement_name,
                    description=f"Auto-created placement for {position}",
                    is_active=True
                )
            
            # Parse dates
            start_date = None
            end_date = None
            
            if start_date_str:
                try:
                    from datetime import datetime
                    start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
                    # Make it timezone-aware
                    start_date = timezone.make_aware(start_date)
                except ValueError:
                    return Response(
                        {'error': 'Invalid start_date format. Use YYYY-MM-DD'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            else:
                start_date = timezone.now()
            
            if end_date_str:
                try:
                    from datetime import datetime
                    end_date = datetime.strptime(end_date_str, '%Y-%m-%d')
                    # Make it timezone-aware
                    end_date = timezone.make_aware(end_date)
                except ValueError:
                    return Response(
                        {'error': 'Invalid end_date format. Use YYYY-MM-DD'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Create the Ad object
            ad = Ad.objects.create(
                title=title,
                destination_url=destination_url or '',
                placement=placement,
                is_active=True,
                start_date=start_date,
                end_date=end_date
            )
            
            # Save the downloaded image to image_file field
            filename = f"ad_{ad.id}_{original_filename}"
            ad.image_file.save(filename, ContentFile(content), save=True)
            
            logger.info(f"Agent created ad: ID={ad.id}, Title='{title}', Position='{position}'")
            
            # Return the id of the new Ad
            return Response(
                {'id': ad.id, 'message': 'Ad created successfully'},
                status=status.HTTP_201_CREATED
            )
            
        except Exception as e:
            logger.error(f"Error in AgentAdCreateView: {str(e)}")
            return Response(
                {'error': 'Internal server error', 'details': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )