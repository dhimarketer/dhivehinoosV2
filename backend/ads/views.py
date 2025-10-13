from rest_framework import permissions
from rest_framework.viewsets import ModelViewSet
from rest_framework.generics import ListAPIView
from rest_framework.authentication import SessionAuthentication
from django.utils import timezone
from django.db import models
from django.http import JsonResponse
import logging
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