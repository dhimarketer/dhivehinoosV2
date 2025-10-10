from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'subscriptions', views.NewsletterSubscriptionViewSet, basename='newsletter-subscription')
router.register(r'campaigns', views.EmailCampaignViewSet, basename='email-campaign')

urlpatterns = [
    path('', include(router.urls)),
    
    # Public subscription endpoints
    path('subscribe/', views.subscribe_newsletter, name='subscribe-newsletter'),
    path('confirm/<uuid:token>/', views.confirm_subscription, name='confirm-subscription'),
    path('unsubscribe/<uuid:token>/', views.unsubscribe_newsletter, name='unsubscribe-newsletter'),
    path('unsubscribe-page/<uuid:token>/', views.unsubscribe_page, name='unsubscribe-page'),
    
    # Admin endpoints
    path('stats/', views.subscription_stats, name='subscription-stats'),
    path('campaigns/<int:campaign_id>/send/', views.send_campaign, name='send-campaign'),
]
