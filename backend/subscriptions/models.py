from django.db import models
from django.core.validators import validate_email
from django.utils import timezone
import uuid


class NewsletterSubscription(models.Model):
    """Email subscription for newsletter"""
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('unsubscribed', 'Unsubscribed'),
        ('pending', 'Pending Confirmation'),
        ('bounced', 'Bounced'),
    ]
    
    email = models.EmailField(unique=True, validators=[validate_email])
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    subscription_token = models.UUIDField(default=uuid.uuid4, unique=True)
    unsubscribe_token = models.UUIDField(default=uuid.uuid4, unique=True)
    
    # Optional fields
    first_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    # Timestamps
    subscribed_at = models.DateTimeField(auto_now_add=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)
    unsubscribed_at = models.DateTimeField(null=True, blank=True)
    last_email_sent = models.DateTimeField(null=True, blank=True)
    
    # Metadata
    source = models.CharField(max_length=100, default='website', help_text="Where the subscription came from")
    notes = models.TextField(blank=True, help_text="Admin notes")
    
    class Meta:
        ordering = ['-subscribed_at']
        verbose_name = 'Newsletter Subscription'
        verbose_name_plural = 'Newsletter Subscriptions'
    
    def __str__(self):
        return f"{self.email} ({self.status})"
    
    def confirm_subscription(self):
        """Confirm the subscription"""
        self.status = 'active'
        self.confirmed_at = timezone.now()
        self.save()
    
    def unsubscribe(self):
        """Unsubscribe the user"""
        self.status = 'unsubscribed'
        self.unsubscribed_at = timezone.now()
        self.save()
    
    @property
    def is_active(self):
        """Check if subscription is active"""
        return self.status == 'active'
    
    @property
    def full_name(self):
        """Get full name if available"""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        elif self.first_name:
            return self.first_name
        elif self.last_name:
            return self.last_name
        return ""


class EmailCampaign(models.Model):
    """Email campaign for sending newsletters"""
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('scheduled', 'Scheduled'),
        ('sending', 'Sending'),
        ('sent', 'Sent'),
        ('failed', 'Failed'),
    ]
    
    title = models.CharField(max_length=200)
    subject = models.CharField(max_length=200)
    content = models.TextField(help_text="HTML content for the email")
    plain_text_content = models.TextField(blank=True, help_text="Plain text version")
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    scheduled_send_time = models.DateTimeField(null=True, blank=True)
    
    # Recipients
    target_categories = models.ManyToManyField(
        'articles.Category', 
        blank=True,
        help_text="Categories to target (empty = all subscribers)"
    )
    exclude_unsubscribed = models.BooleanField(default=True)
    
    # Statistics
    total_recipients = models.PositiveIntegerField(default=0)
    emails_sent = models.PositiveIntegerField(default=0)
    emails_delivered = models.PositiveIntegerField(default=0)
    emails_opened = models.PositiveIntegerField(default=0)
    emails_clicked = models.PositiveIntegerField(default=0)
    emails_bounced = models.PositiveIntegerField(default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Email Campaign'
        verbose_name_plural = 'Email Campaigns'
    
    def __str__(self):
        return f"{self.title} ({self.get_status_display()})"
    
    def get_recipients(self):
        """Get list of recipients for this campaign"""
        subscriptions = NewsletterSubscription.objects.filter(status='active')
        
        if self.exclude_unsubscribed:
            subscriptions = subscriptions.exclude(status='unsubscribed')
        
        # If targeting specific categories, we would need to implement
        # a way to track which subscribers are interested in which categories
        # For now, we'll send to all active subscribers
        
        return subscriptions
    
    def send_campaign(self):
        """Send the campaign to all recipients"""
        if self.status != 'draft':
            raise ValueError("Only draft campaigns can be sent")
        
        recipients = self.get_recipients()
        self.total_recipients = recipients.count()
        self.status = 'sending'
        self.save()
        
        # In a real implementation, you would integrate with an email service
        # like SendGrid, Mailchimp, or AWS SES here
        
        self.status = 'sent'
        self.sent_at = timezone.now()
        self.save()
        
        return True