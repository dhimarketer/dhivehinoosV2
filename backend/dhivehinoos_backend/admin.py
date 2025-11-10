from django.contrib import admin
from django.contrib.admin import AdminSite
from django.utils.html import format_html
from django.urls import path, reverse
from django.shortcuts import redirect
from django.contrib import messages
from django.db.models import Count, Q
from django.utils import timezone


class DhivehinoosAdminSite(AdminSite):
    """Custom admin site for Dhivehinoos.net"""
    
    site_header = "Dhivehinoos.net Administration"
    site_title = "Dhivehinoos Admin"
    index_title = "Welcome to Dhivehinoos Administration"
    
    def get_urls(self):
        """Add custom admin URLs"""
        urls = super().get_urls()
        from settings_app import views as settings_views
        from settings_app.admin_theme import ThemeCustomizationAdmin
        theme_admin = ThemeCustomizationAdmin(self)
        custom_urls = [
            path('dashboard/', self.admin_view(self.dashboard_view), name='dashboard'),
            path('theme-preview/', settings_views.theme_preview_view, name='theme-preview'),
        ]
        # Add theme customization URLs
        custom_urls.extend(theme_admin.get_urls())
        return custom_urls + urls
    
    def get_app_list(self, request):
        """Customize app list to include Theme Customization"""
        app_list = super().get_app_list(request)
        
        # Add Theme Customization as a separate app
        theme_app = {
            'name': 'Theme Customization',
            'app_label': 'theme',
            'app_url': '/admin/theme-customization/',
            'has_module_perms': request.user.is_staff,
            'models': [
                {
                    'name': 'Customize Theme',
                    'object_name': 'customization',
                    'admin_url': '/admin/theme-customization/',
                    'view_only': False,
                    'add_url': None,
                    'perms': {
                        'add': False,
                        'change': True,
                        'delete': False,
                        'view': True,
                    },
                }
            ],
        }
        
        # Insert Theme Customization at the top of the app list
        app_list.insert(0, theme_app)
        
        return app_list
    
    def dashboard_view(self, request):
        """Custom dashboard view with statistics"""
        from articles.models import Article, Category
        from comments.models import Comment
        from contact.models import ContactMessage
        from ads.models import Ad
        from subscriptions.models import NewsletterSubscription
        
        # Get statistics
        stats = {
            'total_articles': Article.objects.count(),
            'published_articles': Article.objects.filter(status='published').count(),
            'draft_articles': Article.objects.filter(status='draft').count(),
            'scheduled_articles': Article.objects.filter(status='scheduled').count(),
            'total_comments': Comment.objects.count(),
            'pending_comments': Comment.objects.filter(is_approved=False).count(),
            'approved_comments': Comment.objects.filter(is_approved=True).count(),
            'total_contact_messages': ContactMessage.objects.count(),
            'unread_messages': ContactMessage.objects.filter(is_read=False).count(),
            'total_ads': Ad.objects.count(),
            'active_ads': Ad.objects.filter(is_active=True).count(),
            'total_subscriptions': NewsletterSubscription.objects.count(),
            'active_subscriptions': NewsletterSubscription.objects.filter(status='active').count(),
        }
        
        # Recent activity
        recent_articles = Article.objects.order_by('-created_at')[:5]
        recent_comments = Comment.objects.order_by('-created_at')[:5]
        recent_messages = ContactMessage.objects.order_by('-created_at')[:5]
        
        context = {
            'title': 'Dashboard',
            'stats': stats,
            'recent_articles': recent_articles,
            'recent_comments': recent_comments,
            'recent_messages': recent_messages,
        }
        
        from django.shortcuts import render
        return render(request, 'admin/dashboard.html', context)


# Create custom admin site instance
admin_site = DhivehinoosAdminSite(name='dhivehinoos_admin')

# Register all models with the custom admin site
from django.contrib.auth.models import User, Group
from django.contrib.auth.admin import UserAdmin, GroupAdmin

admin_site.register(User, UserAdmin)
admin_site.register(Group, GroupAdmin)

# Register all app models
from articles.models import Article, Category, PublishingSchedule, ScheduledArticle
from articles.admin import ArticleAdmin, CategoryAdmin, PublishingScheduleAdmin, ScheduledArticleAdmin
from comments.models import Comment, Vote
from comments.admin import CommentAdmin, VoteAdmin
from contact.models import ContactMessage
from contact.admin import ContactMessageAdmin
from ads.models import Ad, AdPlacement
from ads.admin import AdAdmin, AdPlacementAdmin
from subscriptions.models import NewsletterSubscription, EmailCampaign
from subscriptions.admin import NewsletterSubscriptionAdmin, EmailCampaignAdmin
from settings_app.models import SiteSettings
from settings_app.admin import SiteSettingsAdmin

# Register with custom admin site
admin_site.register(Article, ArticleAdmin)
admin_site.register(Category, CategoryAdmin)
admin_site.register(PublishingSchedule, PublishingScheduleAdmin)
admin_site.register(ScheduledArticle, ScheduledArticleAdmin)
admin_site.register(Comment, CommentAdmin)
admin_site.register(Vote, VoteAdmin)
admin_site.register(ContactMessage, ContactMessageAdmin)
admin_site.register(Ad, AdAdmin)
admin_site.register(AdPlacement, AdPlacementAdmin)
admin_site.register(NewsletterSubscription, NewsletterSubscriptionAdmin)
admin_site.register(EmailCampaign, EmailCampaignAdmin)
admin_site.register(SiteSettings, SiteSettingsAdmin)

# Import and register image management models
try:
    from articles.models import ReusableImage, ImageVerification, ImageReuseSettings, ImageSettings
    from articles import admin_reusable_images
    from articles.admin_reusable_images import ReusableImageAdmin, ImageVerificationAdmin, ImageReuseSettingsAdmin
    from articles.admin import ImageSettingsAdmin
    
    admin_site.register(ReusableImage, ReusableImageAdmin)
    admin_site.register(ImageVerification, ImageVerificationAdmin)
    admin_site.register(ImageReuseSettings, ImageReuseSettingsAdmin)
    admin_site.register(ImageSettings, ImageSettingsAdmin)
except ImportError:
    # Image management models might not be available yet
    pass
