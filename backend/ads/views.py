from rest_framework import permissions
from rest_framework.viewsets import ModelViewSet
from rest_framework.generics import ListAPIView
from django.utils import timezone
from django.db import models
from .models import Ad, AdPlacement
from .serializers import AdSerializer, AdPlacementSerializer


class AdPlacementViewSet(ModelViewSet):
    """Admin viewset for managing ad placements"""
    queryset = AdPlacement.objects.all()
    serializer_class = AdPlacementSerializer
    permission_classes = [permissions.AllowAny]  # Temporarily allow any for testing


class AdViewSet(ModelViewSet):
    """Admin viewset for managing ads"""
    queryset = Ad.objects.select_related('placement').all()
    serializer_class = AdSerializer
    permission_classes = [permissions.AllowAny]  # Temporarily allow any for testing


class ActiveAdsListView(ListAPIView):
    """Public API for listing currently active ads"""
    serializer_class = AdSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        """Filter ads that are currently active based on dates"""
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
    
    def get_serializer_context(self):
        """Pass request context to serializer for building absolute URLs"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class AdPlacementsListView(ListAPIView):
    """Public API for listing available ad placements"""
    serializer_class = AdPlacementSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        """Filter active placements"""
        return AdPlacement.objects.filter(is_active=True)