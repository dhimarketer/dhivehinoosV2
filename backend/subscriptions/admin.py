from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import NewsletterSubscription, EmailCampaign


@admin.register(NewsletterSubscription)
class NewsletterSubscriptionAdmin(admin.ModelAdmin):
    list_display = [
        'email', 'full_name', 'status', 'source', 'subscribed_at', 
        'confirmed_at', 'unsubscribed_at', 'action_buttons'
    ]
    list_filter = ['status', 'source', 'subscribed_at', 'confirmed_at']
    search_fields = ['email', 'first_name', 'last_name']
    readonly_fields = [
        'subscription_token', 'unsubscribe_token', 'subscribed_at', 
        'confirmed_at', 'unsubscribed_at', 'ip_address', 'user_agent'
    ]
    ordering = ['-subscribed_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('email', 'first_name', 'last_name', 'status')
        }),
        ('Subscription Details', {
            'fields': ('source', 'notes')
        }),
        ('Technical Details', {
            'fields': ('subscription_token', 'unsubscribe_token', 'ip_address', 'user_agent'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('subscribed_at', 'confirmed_at', 'unsubscribed_at', 'last_email_sent'),
            'classes': ('collapse',)
        }),
    )
    
    def full_name(self, obj):
        """Display full name"""
        return obj.full_name or '-'
    full_name.short_description = 'Full Name'
    
    def action_buttons(self, obj):
        """Display action buttons"""
        if obj.status == 'pending':
            confirm_url = reverse('admin:subscriptions_newslettersubscription_confirm', args=[obj.pk])
            return format_html(
                '<a class="button" href="{}">Confirm</a>',
                confirm_url
            )
        elif obj.status == 'active':
            unsubscribe_url = reverse('admin:subscriptions_newslettersubscription_unsubscribe', args=[obj.pk])
            return format_html(
                '<a class="button" href="{}">Unsubscribe</a>',
                unsubscribe_url
            )
        return '-'
    action_buttons.short_description = 'Actions'
    
    def confirm_subscription(self, request, queryset):
        """Admin action to confirm subscriptions"""
        updated = queryset.filter(status='pending').update(status='active')
        self.message_user(request, f'{updated} subscriptions confirmed.')
    confirm_subscription.short_description = "Confirm selected subscriptions"
    
    def unsubscribe_subscriptions(self, request, queryset):
        """Admin action to unsubscribe"""
        updated = queryset.filter(status='active').update(status='unsubscribed')
        self.message_user(request, f'{updated} subscriptions unsubscribed.')
    unsubscribe_subscriptions.short_description = "Unsubscribe selected subscriptions"
    
    actions = ['confirm_subscription', 'unsubscribe_subscriptions']


@admin.register(EmailCampaign)
class EmailCampaignAdmin(admin.ModelAdmin):
    list_display = [
        'title', 'subject', 'status', 'total_recipients', 
        'emails_sent', 'created_at', 'sent_at', 'action_buttons'
    ]
    list_filter = ['status', 'created_at', 'sent_at']
    search_fields = ['title', 'subject']
    readonly_fields = [
        'total_recipients', 'emails_sent', 'emails_delivered',
        'emails_opened', 'emails_clicked', 'emails_bounced',
        'created_at', 'updated_at', 'sent_at'
    ]
    ordering = ['-created_at']
    
    fieldsets = (
        ('Campaign Information', {
            'fields': ('title', 'subject', 'status')
        }),
        ('Content', {
            'fields': ('content', 'plain_text_content')
        }),
        ('Scheduling', {
            'fields': ('scheduled_send_time',)
        }),
        ('Targeting', {
            'fields': ('target_categories', 'exclude_unsubscribed')
        }),
        ('Statistics', {
            'fields': (
                'total_recipients', 'emails_sent', 'emails_delivered',
                'emails_opened', 'emails_clicked', 'emails_bounced'
            ),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'sent_at'),
            'classes': ('collapse',)
        }),
    )
    
    def action_buttons(self, obj):
        """Display action buttons"""
        if obj.status == 'draft':
            send_url = reverse('admin:subscriptions_emailcampaign_send', args=[obj.pk])
            return format_html(
                '<a class="button" href="{}">Send Campaign</a>',
                send_url
            )
        return '-'
    action_buttons.short_description = 'Actions'
    
    def send_campaign(self, request, queryset):
        """Admin action to send campaigns"""
        sent_count = 0
        for campaign in queryset.filter(status='draft'):
            try:
                campaign.send_campaign()
                sent_count += 1
            except Exception as e:
                self.message_user(request, f'Failed to send campaign "{campaign.title}": {str(e)}', level='ERROR')
        
        if sent_count > 0:
            self.message_user(request, f'{sent_count} campaigns sent successfully.')
    send_campaign.short_description = "Send selected campaigns"
    
    actions = ['send_campaign']