from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Count, Q
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework.generics import ListAPIView
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.http import HttpResponseRedirect
from .models import NewsletterSubscription, EmailCampaign
from .serializers import (
    NewsletterSubscriptionSerializer, 
    NewsletterSubscriptionCreateSerializer,
    EmailCampaignSerializer,
    SubscriptionStatsSerializer
)


@method_decorator(csrf_exempt, name='dispatch')
class NewsletterSubscriptionViewSet(ModelViewSet):
    """Admin viewset for managing newsletter subscriptions"""
    queryset = NewsletterSubscription.objects.all()
    serializer_class = NewsletterSubscriptionSerializer
    permission_classes = [permissions.AllowAny]  # Temporarily allow any for testing
    
    def get_queryset(self):
        queryset = NewsletterSubscription.objects.all()
        
        # Status filter
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Search filter
        search_query = self.request.query_params.get('search', None)
        if search_query:
            queryset = queryset.filter(
                Q(email__icontains=search_query) |
                Q(first_name__icontains=search_query) |
                Q(last_name__icontains=search_query)
            )
        
        return queryset


@method_decorator(csrf_exempt, name='dispatch')
class EmailCampaignViewSet(ModelViewSet):
    """Admin viewset for managing email campaigns"""
    queryset = EmailCampaign.objects.all()
    serializer_class = EmailCampaignSerializer
    permission_classes = [permissions.AllowAny]  # Temporarily allow any for testing
    
    def get_queryset(self):
        queryset = EmailCampaign.objects.all()
        
        # Status filter
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@csrf_exempt
def subscribe_newsletter(request):
    """Subscribe to newsletter endpoint"""
    try:
        serializer = NewsletterSubscriptionCreateSerializer(data=request.data)
        if serializer.is_valid():
            # Get client IP and user agent
            ip_address = request.META.get('REMOTE_ADDR')
            user_agent = request.META.get('HTTP_USER_AGENT', '')
            
            subscription = serializer.save(
                ip_address=ip_address,
                user_agent=user_agent,
                source=request.data.get('source', 'website')
            )
            
            # Send confirmation email (in a real implementation)
            # send_confirmation_email(subscription)
            
            return Response({
                'message': 'Successfully subscribed to newsletter!',
                'subscription_id': subscription.id,
                'status': subscription.status
            }, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response(
            {'error': 'Subscription failed', 'details': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def confirm_subscription(request, token):
    """Confirm subscription via token"""
    try:
        subscription = get_object_or_404(NewsletterSubscription, subscription_token=token)
        
        if subscription.status == 'pending':
            subscription.confirm_subscription()
            return Response({
                'message': 'Subscription confirmed successfully!',
                'email': subscription.email
            })
        elif subscription.status == 'active':
            return Response({
                'message': 'Subscription already confirmed.',
                'email': subscription.email
            })
        else:
            return Response({
                'error': 'Invalid subscription status'
            }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response(
            {'error': 'Confirmation failed', 'details': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def unsubscribe_newsletter(request, token):
    """Unsubscribe from newsletter via token"""
    try:
        subscription = get_object_or_404(NewsletterSubscription, unsubscribe_token=token)
        
        if subscription.status == 'active':
            subscription.unsubscribe()
            return Response({
                'message': 'Successfully unsubscribed from newsletter.',
                'email': subscription.email
            })
        elif subscription.status == 'unsubscribed':
            return Response({
                'message': 'Already unsubscribed.',
                'email': subscription.email
            })
        else:
            return Response({
                'error': 'Invalid subscription status'
            }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response(
            {'error': 'Unsubscription failed', 'details': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def subscription_stats(request):
    """Get subscription statistics"""
    try:
        now = timezone.now()
        today = now.date()
        week_ago = now - timezone.timedelta(days=7)
        month_ago = now - timezone.timedelta(days=30)
        
        stats = {
            'total_subscribers': NewsletterSubscription.objects.count(),
            'active_subscribers': NewsletterSubscription.objects.filter(status='active').count(),
            'pending_subscribers': NewsletterSubscription.objects.filter(status='pending').count(),
            'unsubscribed_count': NewsletterSubscription.objects.filter(status='unsubscribed').count(),
            'bounced_count': NewsletterSubscription.objects.filter(status='bounced').count(),
            'subscriptions_today': NewsletterSubscription.objects.filter(subscribed_at__date=today).count(),
            'subscriptions_this_week': NewsletterSubscription.objects.filter(subscribed_at__gte=week_ago).count(),
            'subscriptions_this_month': NewsletterSubscription.objects.filter(subscribed_at__gte=month_ago).count(),
        }
        
        serializer = SubscriptionStatsSerializer(stats)
        return Response(serializer.data)
    except Exception as e:
        return Response(
            {'error': 'Failed to get stats', 'details': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@csrf_exempt
def send_campaign(request, campaign_id):
    """Send an email campaign"""
    try:
        campaign = get_object_or_404(EmailCampaign, id=campaign_id)
        
        if campaign.status != 'draft':
            return Response(
                {'error': 'Only draft campaigns can be sent'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        success = campaign.send_campaign()
        
        if success:
            return Response({
                'message': 'Campaign sent successfully',
                'recipients': campaign.total_recipients
            })
        else:
            return Response(
                {'error': 'Failed to send campaign'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    except Exception as e:
        return Response(
            {'error': 'Campaign sending failed', 'details': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# Unsubscribe page view for direct access
def unsubscribe_page(request, token):
    """Unsubscribe page for direct access"""
    try:
        subscription = get_object_or_404(NewsletterSubscription, unsubscribe_token=token)
        
        if subscription.status == 'active':
            subscription.unsubscribe()
            message = f"Successfully unsubscribed {subscription.email} from newsletter."
        elif subscription.status == 'unsubscribed':
            message = f"{subscription.email} is already unsubscribed."
        else:
            message = f"Invalid subscription status for {subscription.email}."
        
        # Return a simple HTML page
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Unsubscribe - Dhivehinoos.net</title>
            <style>
                body {{ font-family: Arial, sans-serif; text-align: center; padding: 50px; }}
                .container {{ max-width: 600px; margin: 0 auto; }}
                .success {{ color: #28a745; }}
                .error {{ color: #dc3545; }}
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Newsletter Unsubscribe</h1>
                <p class="success">{message}</p>
                <p><a href="https://dhivehinoos.net">Return to Dhivehinoos.net</a></p>
            </div>
        </body>
        </html>
        """
        
        return HttpResponse(html_content)
    except Exception as e:
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Unsubscribe Error - Dhivehinoos.net</title>
            <style>
                body {{ font-family: Arial, sans-serif; text-align: center; padding: 50px; }}
                .container {{ max-width: 600px; margin: 0 auto; }}
                .error {{ color: #dc3545; }}
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Newsletter Unsubscribe</h1>
                <p class="error">Error: {str(e)}</p>
                <p><a href="https://dhivehinoos.net">Return to Dhivehinoos.net</a></p>
            </div>
        </body>
        </html>
        """
        return HttpResponse(html_content)