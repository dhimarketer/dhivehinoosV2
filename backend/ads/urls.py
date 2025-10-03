from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'admin', views.AdViewSet, basename='ad-admin')
router.register(r'placements/admin', views.AdPlacementViewSet, basename='ad-placement-admin')

urlpatterns = [
    path('', include(router.urls)),
    path('active/', views.ActiveAdsListView.as_view(), name='active-ads'),
    path('placements/', views.AdPlacementsListView.as_view(), name='ad-placements'),
]
