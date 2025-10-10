from rest_framework import serializers
from .models import NewsletterSubscription, EmailCampaign


class NewsletterSubscriptionSerializer(serializers.ModelSerializer):
    """Serializer for NewsletterSubscription model"""
    
    class Meta:
        model = NewsletterSubscription
        fields = [
            'id', 'email', 'first_name', 'last_name', 'status', 
            'subscribed_at', 'confirmed_at', 'source'
        ]
        read_only_fields = ['id', 'status', 'subscribed_at', 'confirmed_at']
    
    def validate_email(self, value):
        """Validate email uniqueness"""
        if NewsletterSubscription.objects.filter(email=value).exists():
            raise serializers.ValidationError("This email is already subscribed.")
        return value


class NewsletterSubscriptionCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating newsletter subscriptions"""
    
    class Meta:
        model = NewsletterSubscription
        fields = ['email', 'first_name', 'last_name', 'source']
    
    def validate_email(self, value):
        """Validate email uniqueness"""
        if NewsletterSubscription.objects.filter(email=value).exists():
            raise serializers.ValidationError("This email is already subscribed.")
        return value


class EmailCampaignSerializer(serializers.ModelSerializer):
    """Serializer for EmailCampaign model"""
    target_categories = serializers.StringRelatedField(many=True, read_only=True)
    
    class Meta:
        model = EmailCampaign
        fields = [
            'id', 'title', 'subject', 'content', 'plain_text_content',
            'status', 'scheduled_send_time', 'target_categories',
            'total_recipients', 'emails_sent', 'emails_delivered',
            'emails_opened', 'emails_clicked', 'emails_bounced',
            'created_at', 'updated_at', 'sent_at'
        ]
        read_only_fields = [
            'id', 'total_recipients', 'emails_sent', 'emails_delivered',
            'emails_opened', 'emails_clicked', 'emails_bounced',
            'created_at', 'updated_at', 'sent_at'
        ]


class SubscriptionStatsSerializer(serializers.Serializer):
    """Serializer for subscription statistics"""
    total_subscribers = serializers.IntegerField()
    active_subscribers = serializers.IntegerField()
    pending_subscribers = serializers.IntegerField()
    unsubscribed_count = serializers.IntegerField()
    bounced_count = serializers.IntegerField()
    subscriptions_today = serializers.IntegerField()
    subscriptions_this_week = serializers.IntegerField()
    subscriptions_this_month = serializers.IntegerField()
