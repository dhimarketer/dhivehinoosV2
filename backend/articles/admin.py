from django.contrib import admin
from django.utils.html import format_html
from django.utils.safestring import mark_safe
from django import forms
from .models import Article, Category, PublishingSchedule, ScheduledArticle, ReusableImage, ImageVerification, ImageReuseSettings

# Import image reuse admin configurations
from . import admin_reusable_images


class ArticleAdminForm(forms.ModelForm):
    """Custom form for Article admin with simplified image handling"""
    upload_new_image = forms.ImageField(
        required=False,
        help_text="Upload a new image to add to the reusable library and use for this article"
    )
    
    class Meta:
        model = Article
        fields = '__all__'
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Make image_source not required since it's set automatically
        if 'image_source' in self.fields:
            self.fields['image_source'].required = False
    
    def save(self, commit=True):
        """Override save to handle reusable image assignment"""
        instance = super().save(commit=False)
        
        # Handle reusable image selection
        if instance.reused_image and instance.reused_image.image_file:
            # Guard against missing file on disk
            try:
                import os
                from django.conf import settings
                file_path = os.path.join(settings.MEDIA_ROOT, instance.reused_image.image_file.name)
                if os.path.exists(file_path):
                    instance.image_file = instance.reused_image.image_file
                    instance.image_source = 'reused'
                else:
                    # If missing on disk, do not assign; keep existing image fields
                    pass
            except Exception:
                # Fail safe: do not assign image if any error occurs
                pass
        
        if commit:
            instance.save()
        
        return instance


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'color', 'icon', 'is_active', 'sort_order', 'articles_count']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'description', 'keywords']
    prepopulated_fields = {'slug': ('name',)}
    ordering = ['sort_order', 'name']
    
    def articles_count(self, obj):
        return obj.articles.count()
    articles_count.short_description = 'Articles'


@admin.register(PublishingSchedule)
class PublishingScheduleAdmin(admin.ModelAdmin):
    list_display = ['name', 'frequency', 'is_active', 'queue_priority', 'max_articles_per_day', 'created_at']
    list_filter = ['is_active', 'frequency', 'created_at']
    search_fields = ['name']
    ordering = ['-queue_priority', 'name']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'is_active', 'queue_priority')
        }),
        ('Publishing Frequency', {
            'fields': ('frequency', 'custom_interval_minutes')
        }),
        ('Time Restrictions', {
            'fields': ('forbidden_hours_start', 'forbidden_hours_end'),
            'description': 'Set hours when articles should NOT be published (e.g., 22:00 to 08:00 for overnight)'
        }),
        ('Daily Limits', {
            'fields': ('max_articles_per_day',)
        }),
    )


@admin.register(ScheduledArticle)
class ScheduledArticleAdmin(admin.ModelAdmin):
    list_display = ['article', 'schedule', 'status', 'scheduled_publish_time', 'priority', 'created_at']
    list_filter = ['status', 'schedule', 'created_at', 'scheduled_publish_time']
    search_fields = ['article__title', 'schedule__name']
    ordering = ['scheduled_publish_time', '-priority']
    readonly_fields = ['created_at', 'updated_at', 'published_at']
    
    fieldsets = (
        ('Article Information', {
            'fields': ('article', 'schedule')
        }),
        ('Scheduling', {
            'fields': ('status', 'scheduled_publish_time', 'priority')
        }),
        ('Results', {
            'fields': ('published_at', 'failure_reason'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    form = ArticleAdminForm
    list_display = ['title', 'category', 'status', 'publishing_mode', 'scheduled_publish_time', 'image_preview', 'image_source', 'created_at', 'vote_score', 'approved_comments_count']
    list_filter = ['status', 'publishing_mode', 'category', 'image_source', 'created_at']
    search_fields = ['title', 'content']
    prepopulated_fields = {'slug': ('title',)}
    ordering = ['-created_at']
    readonly_fields = ['image_preview', 'original_image_url']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'slug', 'content', 'category')
        }),
        ('Image Management', {
            'fields': ('image_preview', 'original_image_url', 'reused_image', 'upload_new_image'),
            'description': 'Simple image management: Select from reusable library OR upload new image (adds to library). Original API image is always kept as fallback.'
        }),
        ('Publishing', {
            'fields': ('status', 'publishing_mode', 'scheduled_publish_time')
        }),
    )
    
    actions = ['schedule_for_publishing', 'publish_now', 'unpublish_articles', 'bulk_delete_articles', 'use_original_image', 'find_reusable_images']
    
    def save_model(self, request, obj, form, change):
        """Simplified save logic for image management"""
        # Handle image upload (adds to reusable library)
        if hasattr(form, 'cleaned_data') and 'upload_new_image' in form.cleaned_data:
            uploaded_file = form.cleaned_data['upload_new_image']
            if uploaded_file:
                # Create new reusable image
                reusable_image = ReusableImage.objects.create(
                    entity_name=f"Uploaded for {obj.title[:50]}",
                    entity_type='other',
                    image_file=uploaded_file,
                    description=f"Image uploaded for article: {obj.title}"
                )
                # Use this image for the article
                obj.reused_image = reusable_image
                obj.image_file = reusable_image.image_file
                obj.image_source = 'reused'
                print(f"✅ Created reusable image: {reusable_image.image_file.url}")
        
        # The form's clean method handles reusable image selection
        # Save the article
        super().save_model(request, obj, form, change)
        
        # Invalidate cache after saving
        if change:  # Only invalidate cache for updates, not new articles
            from .cache_utils import invalidate_article_cache
            invalidate_article_cache(article_id=obj.id)
    
    def schedule_for_publishing(self, request, queryset):
        """Action to schedule selected articles for publishing"""
        from django.contrib import messages
        
        scheduled_count = 0
        for article in queryset.filter(status='draft'):
            try:
                article.schedule_for_publishing()
                scheduled_count += 1
            except Exception as e:
                messages.error(request, f"Failed to schedule '{article.title}': {str(e)}")
        
        if scheduled_count > 0:
            messages.success(request, f"Successfully scheduled {scheduled_count} article(s) for publishing.")
    
    schedule_for_publishing.short_description = "Schedule selected articles for publishing"
    
    def publish_now(self, request, queryset):
        """Action to publish selected articles immediately"""
        from django.contrib import messages
        from .cache_utils import invalidate_article_cache
        
        published_count = 0
        for article in queryset:
            try:
                if article.publish_now():
                    # Invalidate cache for this article
                    invalidate_article_cache(article_id=article.id)
                    published_count += 1
            except Exception as e:
                messages.error(request, f"Failed to publish '{article.title}': {str(e)}")
        
        if published_count > 0:
            messages.success(request, f"Successfully published {published_count} article(s).")
            # Clear published articles cache since we published some
            from django.core.cache import cache
            cache.delete('published_articles')
    
    publish_now.short_description = "Publish selected articles immediately"
    
    def unpublish_articles(self, request, queryset):
        """Action to unpublish selected articles"""
        from django.contrib import messages
        from .cache_utils import invalidate_article_cache
        
        unpublished_count = 0
        for article in queryset.filter(status='published'):
            try:
                article.status = 'draft'
                article.save()
                # Invalidate cache for this article
                invalidate_article_cache(article_id=article.id)
                unpublished_count += 1
            except Exception as e:
                messages.error(request, f"Failed to unpublish '{article.title}': {str(e)}")
        
        if unpublished_count > 0:
            messages.success(request, f"Successfully unpublished {unpublished_count} article(s).")
            # Clear published articles cache since we unpublished some
            from django.core.cache import cache
            cache.delete('published_articles')
    
    unpublish_articles.short_description = "Unpublish selected articles"
    
    def bulk_delete_articles(self, request, queryset):
        """Action to delete selected articles"""
        from django.contrib import messages
        
        count = queryset.count()
        queryset.delete()
        messages.success(request, f'{count} articles deleted.')
    
    bulk_delete_articles.short_description = "Delete selected articles"
    
    def image_preview(self, obj):
        """Display a preview of the current image"""
        try:
            import os
            from django.conf import settings
            from PIL import Image, UnidentifiedImageError
            if obj.image_file and obj.image_file.name:
                file_path = os.path.join(settings.MEDIA_ROOT, obj.image_file.name)
                if os.path.exists(file_path):
                    # Verify image is not corrupted
                    try:
                        with Image.open(file_path) as im:
                            im.verify()
                        return format_html('<img src="{}" style="max-width: 100px; max-height: 60px; object-fit: cover;" />', obj.image_file.url)
                    except (UnidentifiedImageError, OSError):
                        return format_html('<div style="max-width:100px;max-height:60px;background:#fff3cd;color:#856404;border:1px solid #ffeeba;padding:4px;border-radius:4px;">Corrupt image</div>')
            if obj.image:
                return format_html('<img src="{}" style="max-width: 100px; max-height: 60px; object-fit: cover;" />', obj.image)
        except Exception:
            # Silent fail; show placeholder text to avoid admin 500
            pass
        return "No image"
    image_preview.short_description = "Image Preview"
    
    def original_image_url(self, obj):
        """Display the original API image URL"""
        if obj.image:
            return format_html('<a href="{}" target="_blank">Original API Image (Fallback)</a>', obj.image)
        return "No original image"
    original_image_url.short_description = "Original API Image"
    
    def upload_new_image(self, obj):
        """Custom field for uploading new images"""
        return None  # This is handled in the form
    upload_new_image.short_description = "Upload New Image (Adds to Library)"
    
    def use_original_image(self, request, queryset):
        """Action to switch selected articles back to their original API image"""
        from django.contrib import messages
        from .cache_utils import invalidate_article_cache
        
        switched_count = 0
        for article in queryset:
            if article.image:  # If there's an original image
                # Switch back to original image
                article.image_source = 'external'
                article.reused_image = None
                article.image_file = None
                article.save()
                
                # Invalidate cache for this article
                invalidate_article_cache(article_id=article.id)
                switched_count += 1
        
        if switched_count > 0:
            messages.success(request, f"Successfully switched {switched_count} article(s) back to original API image.")
        else:
            messages.info(request, "No articles were switched. Only articles with original images can be switched back.")
    
    use_original_image.short_description = "Use original API image"
    
    def find_reusable_images(self, request, queryset):
        """Action to show which reusable images match the selected articles"""
        from django.contrib import messages
        from .image_matching_service import ImageMatchingService
        
        service = ImageMatchingService()
        matches_found = 0
        
        for article in queryset:
            matches = service.find_matching_images(article.content, article.title)
            if matches:
                matches_found += 1
                match_info = []
                for match in matches[:3]:  # Show top 3 matches
                    match_info.append(f"{match['image'].entity_name} (confidence: {match['confidence']:.2f})")
                
                messages.info(request, f"'{article.title}': {', '.join(match_info)}")
        
        if matches_found == 0:
            messages.info(request, "No matching reusable images found for any of the selected articles.")
        else:
            messages.success(request, f"Found matches for {matches_found} article(s). See details above.")
    
    find_reusable_images.short_description = "Find matching reusable images"

    # Capture unexpected admin rendering errors to logs so we can diagnose 500s
    def change_view(self, request, object_id, form_url='', extra_context=None):
        import logging, traceback
        logger = logging.getLogger(__name__)
        try:
            return super().change_view(request, object_id, form_url, extra_context)
        except Exception as e:
            logger.exception("Admin change_view failed for Article id=%s: %s", object_id, str(e))
            # Re-raise so HTTP status remains accurate, but with stacktrace captured
            raise

    def add_view(self, request, form_url='', extra_context=None):
        import logging, traceback
        logger = logging.getLogger(__name__)
        try:
            return super().add_view(request, form_url, extra_context)
        except Exception as e:
            logger.exception("Admin add_view failed for Article: %s", str(e))
            raise
