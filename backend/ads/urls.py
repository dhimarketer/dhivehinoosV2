from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()

urlpatterns = [
    path('', include(router.urls)),
    path('active/', views.ActiveAdsListView.as_view(), name='active-ads'),
    path('placements/', views.AdPlacementsListView.as_view(), name='ad-placements'),
    path('debug/', views.ads_debug_view, name='ads-debug'),
    path('agent/create/', views.AgentAdCreateView.as_view(), name='agent-ad-create'),
]
