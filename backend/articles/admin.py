from django.contrib import admin
from django.utils.html import format_html
from django.utils.safestring import mark_safe
from django import forms
from .models import Article, Category, PublishingSchedule, ScheduledArticle, ReusableImage, ImageVerification, ImageReuseSettings, ImageSettings
from .admin_widgets import ImageGalleryWidget

# Import image reuse admin configurations
from . import admin_reusable_images


class ArticleAdminForm(forms.ModelForm):
    """Custom form for Article admin with enhanced image management"""
    upload_new_image = forms.ImageField(
        required=False,
        help_text="📤 Upload a new image to replace existing images. This will add the image to the reusable library and use it for this article.",
        widget=forms.FileInput(attrs={'accept': 'image/*', 'style': 'border: 2px dashed #007bff; padding: 10px; border-radius: 4px; background: #f8f9fa;'})
    )
    
    # Image management fields
    use_original_api_image = forms.BooleanField(
        required=False,
        initial=True,
        help_text="Use the original API image as the primary image"
    )
    disable_reuse_images = forms.BooleanField(
        required=False,
        initial=False,
        help_text="Disable all reuse images (keep original API image only)"
    )
    
    # Image gallery field
    image_gallery_selection = forms.CharField(
        required=False,
        widget=ImageGalleryWidget(),
        help_text="Select images from the gallery below"
    )
    
    class Meta:
        model = Article
        fields = '__all__'
        widgets = {
            'reuse_images': forms.CheckboxSelectMultiple(attrs={'style': 'max-height: 200px; overflow-y: auto; border: 1px solid #ddd; padding: 10px; border-radius: 4px;'}),
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        # Make image_source not required since it's set automatically
        # Use getattr to safely access the field
        try:
            if hasattr(self, 'fields') and 'image_source' in self.fields:
                self.fields['image_source'].required = False
        except (KeyError, AttributeError):
            # Field might not be available yet, skip this configuration
            pass
        
        # Add help text for reuse_images field
        try:
            if hasattr(self, 'fields') and 'reuse_images' in self.fields:
                self.fields['reuse_images'].help_text = "✅ Select up to 4 reusable images that match this article content. Check/uncheck to enable/disable images."
        except (KeyError, AttributeError):
            # Field might not be available yet, skip this configuration
            pass
    
    def clean_reuse_images(self):
        """Validate that no more than 4 reuse images are selected"""
        reuse_images = self.cleaned_data.get('reuse_images')
        if reuse_images and len(reuse_images) > 4:
            raise forms.ValidationError("You can select a maximum of 4 reuse images.")
        return reuse_images
    
    def save(self, commit=True):
        """Override save to handle enhanced image management"""
        instance = super().save(commit=False)
        
        # Handle image management options
        use_original_api = self.cleaned_data.get('use_original_api_image', True)
        disable_reuse = self.cleaned_data.get('disable_reuse_images', False)
        gallery_selection = self.cleaned_data.get('image_gallery_selection', '')
        
        # Handle image gallery selection
        if gallery_selection:
            try:
                image_id, image_type, image_url = gallery_selection.split('|')
                
                if image_type == 'reusable':
                    # Select from reusable images
                    try:
                        reusable_image = ReusableImage.objects.get(id=image_id)
                        instance.reused_image = reusable_image
                        # Add to reuse_images many-to-many field (only if not already added)
                        if not instance.reuse_images.filter(id=reusable_image.id).exists():
                            instance.reuse_images.add(reusable_image)
                        print(f"✅ Added reusable image: {reusable_image.entity_name}")
                    except ReusableImage.DoesNotExist:
                        print(f"⚠️  Warning: ReusableImage with ID {image_id} not found")
                    except Exception as e:
                        print(f"⚠️  Error adding reusable image: {e}")
                        
                elif image_type == 'api':
                    # Use API image from another article
                    try:
                        source_article = Article.objects.get(id=image_id)
                        
                        # Prioritize local file over external URL
                        if source_article.image_file and source_article.image_file.name:
                            # Copy the local file
                            instance.image_file = source_article.image_file
                            instance.image_source = 'external'
                            # Keep the original external URL if available
                            if source_article.image:
                                instance.image = source_article.image
                        elif source_article.image:
                            # Use external URL
                            instance.image = source_article.image
                            instance.image_source = 'external'
                        print(f"✅ Added API image from article: {source_article.title}")
                    except Article.DoesNotExist:
                        print(f"⚠️  Warning: Article with ID {image_id} not found")
                    except Exception as e:
                        print(f"⚠️  Error adding API image: {e}")
                        
            except (ValueError, IndexError) as e:
                # Invalid gallery selection format
                print(f"⚠️  Warning: Invalid gallery selection format: {gallery_selection} - {e}")
            except Exception as e:
                print(f"⚠️  Error processing gallery selection: {e}")
        
        if disable_reuse:
            # Clear all reuse images
            instance.reuse_images.clear()
            instance.reused_image = None
            instance.image_source = 'external'
        
        if use_original_api:
            # Ensure original API image is used as primary
            instance.image_source = 'external'
            # Don't replace the original API image
        
        # Handle reusable image selection (only if not disabled)
        if not disable_reuse and instance.reused_image and instance.reused_image.image_file:
            # Guard against missing file on disk
            try:
                import os
                from django.conf import settings
                file_path = os.path.join(settings.MEDIA_ROOT, instance.reused_image.image_file.name)
                if os.path.exists(file_path):
                    # Only set image_file if there's no original API image
                    if not instance.image:
                        instance.image_file = instance.reused_image.image_file
                    # DO NOT change image_source - keep original API image as primary
                    # instance.image_source = 'reused'  # REMOVED: Keep original API image as primary
                    # DO NOT clear the original API image - keep it as fallback
                    # instance.image = None  # REMOVED: Keep original API image as fallback
                else:
                    # If missing on disk, do not assign; keep existing image fields
                    pass
            except Exception:
                # Fail safe: do not assign image if any error occurs
                pass
        
        # Handle image upload
        uploaded_image = self.cleaned_data.get('upload_new_image')
        if uploaded_image:
            # Save the uploaded image to the article
            instance.image_file = uploaded_image
            # DO NOT change image_source to 'uploaded' - keep original API image as primary
            # instance.image_source = 'uploaded'  # REMOVED: Keep original API image as primary
        
        if commit:
            instance.save()
            # Save many-to-many fields after the instance is saved
            self.save_m2m()
            
            # Handle reusable image creation after instance is saved
            if uploaded_image:
                try:
                    from .models import ReusableImage
                    reusable_image = ReusableImage.objects.create(
                        entity_name=f"Uploaded Image {instance.id}",
                        entity_type='other',
                        image_file=uploaded_image,
                        image_variant='default',
                        slug=f"uploaded-{instance.id}",
                        display_name=f"Uploaded Image for {instance.title[:50]}",
                        is_active=True
                    )
                    print(f"✅ Created reusable image: {reusable_image.slug}")
                except Exception as e:
                    print(f"⚠️  Warning: Could not create reusable image: {e}")
        
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


# Register ImageSettings using admin.site.register instead of decorator
class ImageSettingsAdmin(admin.ModelAdmin):
    """Admin interface for image display settings"""
    
    list_display = ['settings_name', 'image_fit', 'image_position', 'image_orientation', 'is_active', 'created_at']
    list_filter = ['image_fit', 'image_position', 'image_orientation', 'image_quality', 'is_active', 'enable_lazy_loading', 'enable_webp_conversion']
    search_fields = ['settings_name', 'description', 'image_fit', 'image_position']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Settings Information', {
            'fields': ('settings_name', 'description', 'is_active'),
            'description': 'Basic information about this settings configuration'
        }),
        ('Image Display', {
            'fields': ('image_fit', 'image_position', 'image_orientation'),
            'description': 'How images should be displayed and positioned'
        }),
        ('Size Settings', {
            'fields': ('main_image_height', 'reuse_image_height', 'thumbnail_height'),
            'description': 'Height settings for different image types'
        }),
        ('Aspect Ratios', {
            'fields': ('main_image_aspect_ratio', 'reuse_image_aspect_ratio'),
            'description': 'Aspect ratios for different image containers'
        }),
        ('Custom Aspect Ratios', {
            'fields': ('custom_main_width', 'custom_main_height', 'custom_reuse_width', 'custom_reuse_height'),
            'description': 'Custom aspect ratio dimensions (used when aspect ratio is set to "Custom")',
            'classes': ('collapse',)
        }),
        ('Quality & Performance', {
            'fields': ('image_quality', 'enable_lazy_loading', 'enable_webp_conversion'),
            'description': 'Image quality and performance settings'
        }),
        ('Responsive Settings', {
            'fields': ('mobile_image_height', 'tablet_image_height', 'desktop_image_height'),
            'description': 'Height settings for different device types'
        }),
        ('Styling & Effects', {
            'fields': ('image_border_radius', 'image_shadow', 'image_hover_effect'),
            'description': 'Visual styling and effects for images'
        }),
    )
    
    actions = ['activate_settings', 'deactivate_settings', 'duplicate_settings']
    
    def activate_settings(self, request, queryset):
        """Activate selected settings and deactivate others"""
        from django.contrib import messages
        
        if queryset.count() > 1:
            messages.error(request, "Please select only one settings configuration to activate.")
            return
        
        # Deactivate all other settings
        ImageSettings.objects.filter(is_active=True).update(is_active=False)
        
        # Activate selected settings
        queryset.update(is_active=True)
        
        messages.success(request, f"Activated image display settings: {queryset.first().settings_name}")
    
    activate_settings.short_description = "Activate selected settings"
    
    def deactivate_settings(self, request, queryset):
        """Deactivate selected settings"""
        from django.contrib import messages
        
        count = queryset.update(is_active=False)
        messages.success(request, f"Deactivated {count} settings configuration(s).")
    
    deactivate_settings.short_description = "Deactivate selected settings"
    
    def duplicate_settings(self, request, queryset):
        """Duplicate selected settings"""
        from django.contrib import messages
        
        if queryset.count() > 1:
            messages.error(request, "Please select only one settings configuration to duplicate.")
            return
        
        original = queryset.first()
        duplicate = ImageSettings.objects.create(
            settings_name=f"{original.settings_name} (Copy)",
            description=f"Copy of {original.settings_name}",
            image_fit=original.image_fit,
            image_position=original.image_position,
            image_orientation=original.image_orientation,
            main_image_height=original.main_image_height,
            reuse_image_height=original.reuse_image_height,
            thumbnail_height=original.thumbnail_height,
            main_image_aspect_ratio=original.main_image_aspect_ratio,
            reuse_image_aspect_ratio=original.reuse_image_aspect_ratio,
            custom_main_width=original.custom_main_width,
            custom_main_height=original.custom_main_height,
            custom_reuse_width=original.custom_reuse_width,
            custom_reuse_height=original.custom_reuse_height,
            image_quality=original.image_quality,
            enable_lazy_loading=original.enable_lazy_loading,
            enable_webp_conversion=original.enable_webp_conversion,
            mobile_image_height=original.mobile_image_height,
            tablet_image_height=original.tablet_image_height,
            desktop_image_height=original.desktop_image_height,
            image_border_radius=original.image_border_radius,
            image_shadow=original.image_shadow,
            image_hover_effect=original.image_hover_effect,
            is_active=False  # Duplicates are inactive by default
        )
        
        messages.success(request, f"Duplicated settings as: {duplicate.settings_name}")
    
    duplicate_settings.short_description = "Duplicate selected settings"
    
    def get_readonly_fields(self, request, obj=None):
        """Make certain fields readonly for active settings"""
        if obj and obj.is_active:
            return ['is_active']  # Prevent deactivating active settings directly
        return []
    
    def save_model(self, request, obj, form, change):
        """Override save to handle activation logic"""
        if obj.is_active:
            # Deactivate all other settings when activating this one
            ImageSettings.objects.filter(is_active=True).exclude(pk=obj.pk).update(is_active=False)
        super().save_model(request, obj, form, change)

# ImageSettings is now registered with the custom admin site in dhivehinoos_backend/admin.py


@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    form = ArticleAdminForm
    list_display = ['title', 'category', 'status', 'publishing_mode', 'scheduled_publish_time', 'frontend_preview', 'image_matching_status', 'image_source', 'created_at', 'vote_score', 'approved_comments_count']
    list_filter = ['status', 'publishing_mode', 'category', 'image_source', 'created_at']
    search_fields = ['title', 'content']
    prepopulated_fields = {'slug': ('title',)}
    ordering = ['-created_at']
    readonly_fields = ['frontend_preview']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'slug', 'content', 'source_fragments', 'category')
        }),
        ('Image Management', {
            'fields': ('frontend_preview', 'image_gallery_selection', 'reused_image', 'reuse_images', 'upload_new_image'),
            'description': 'Enhanced image management: Preview shows exactly what visitors will see. Use controls to enable/disable images. Upload new images to replace existing ones.'
        }),
        ('Publishing', {
            'fields': ('status', 'publishing_mode', 'scheduled_publish_time')
        }),
    )
    
    actions = ['schedule_for_publishing', 'publish_now', 'unpublish_articles', 'bulk_delete_articles', 'use_original_image', 'clear_reuse_images', 'find_reusable_images']
    
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
                # DO NOT change image_source to 'reused' - keep original API image as primary
                # obj.image_source = 'reused'  # REMOVED: Keep original API image as primary
                # DO NOT clear the original API image - keep it as fallback
                # obj.image = None  # REMOVED: Keep original API image as fallback
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
        """Display a preview of the current primary image - ALWAYS prioritize original API image"""
        try:
            import os
            from django.conf import settings
            from PIL import Image, UnidentifiedImageError
            
            # ALWAYS show original API image first if available - NEVER replace it
            if obj.image and not obj.image.startswith('https://via.placeholder.com'):
                return format_html(
                    '<div style="border: 2px solid #6c757d; padding: 2px; border-radius: 4px;">'
                    '<img src="{}" style="max-width: 100px; max-height: 60px; object-fit: cover;" />'
                    '<div style="font-size: 10px; color: #6c757d; text-align: center; margin-top: 2px;">ORIGINAL API</div>'
                    '</div>', 
                    obj.image
                )
            
            # Show uploaded image file if available (only if no original API image)
            if obj.image_file and obj.image_file.name:
                file_path = os.path.join(settings.MEDIA_ROOT, obj.image_file.name)
                if os.path.exists(file_path):
                    try:
                        with Image.open(file_path) as im:
                            im.verify()
                        return format_html(
                            '<div style="border: 2px solid #007bff; padding: 2px; border-radius: 4px;">'
                            '<img src="{}" style="max-width: 100px; max-height: 60px; object-fit: cover;" />'
                            '<div style="font-size: 10px; color: #007bff; text-align: center; margin-top: 2px;">UPLOADED</div>'
                            '</div>', 
                            obj.image_file.url
                        )
                    except (UnidentifiedImageError, OSError):
                        return format_html('<div style="max-width:100px;max-height:60px;background:#fff3cd;color:#856404;border:1px solid #ffeeba;padding:4px;border-radius:4px;">Corrupt uploaded image</div>')
            
            # Show reuse image if available (only if no original API image or uploaded image)
            if obj.reused_image and obj.reused_image.image_file and obj.reused_image.image_file.name:
                file_path = os.path.join(settings.MEDIA_ROOT, obj.reused_image.image_file.name)
                if os.path.exists(file_path):
                    try:
                        with Image.open(file_path) as im:
                            im.verify()
                        return format_html(
                            '<div style="border: 2px solid #28a745; padding: 2px; border-radius: 4px;">'
                            '<img src="{}" style="max-width: 100px; max-height: 60px; object-fit: cover;" />'
                            '<div style="font-size: 10px; color: #28a745; text-align: center; margin-top: 2px;">REUSE</div>'
                            '</div>', 
                            obj.reused_image.image_file.url
                        )
                    except (UnidentifiedImageError, OSError):
                        return format_html('<div style="max-width:100px;max-height:60px;background:#fff3cd;color:#856404;border:1px solid #ffeeba;padding:4px;border-radius:4px;">Corrupt reuse image</div>')
        except Exception:
            # Silent fail; show placeholder text to avoid admin 500
            pass
        return "No image"
    image_preview.short_description = "Primary Image Preview"
    
    def original_api_image_preview(self, obj):
        """Display a preview of the original API image"""
        try:
            # Check if there's an image URL (external or local)
            if obj.image and not obj.image.startswith('https://via.placeholder.com'):
                # Handle both external URLs and local file paths
                if obj.image.startswith('http'):
                    # External URL
                    image_url = obj.image
                elif obj.image.startswith('/media/'):
                    # Local file path - convert to full URL
                    image_url = f"https://dhivehinoos.net{obj.image}"
                else:
                    # Other local path
                    image_url = f"https://dhivehinoos.net/media/{obj.image}"
                
                return format_html(
                    '<div style="border: 2px solid #6c757d; padding: 2px; border-radius: 4px;">'
                    '<img src="{}" style="max-width: 100px; max-height: 60px; object-fit: cover;" />'
                    '<div style="font-size: 10px; color: #6c757d; text-align: center; margin-top: 2px;">ORIGINAL API</div>'
                    '</div>', 
                    image_url
                )
        except Exception as e:
            print(f"Error in original_api_image_preview: {e}")
            pass
        return "No original API image"
    original_api_image_preview.short_description = "Original API Image"
    
    def frontend_preview(self, obj):
        """Display both images as they will appear on the frontend"""
        try:
            images_html = []
            
            # Original API Image (always first)
            if obj.image and not obj.image.startswith('https://via.placeholder.com'):
                # Handle both external URLs and local file paths
                if obj.image.startswith('http'):
                    api_image_url = obj.image
                elif obj.image.startswith('/media/'):
                    api_image_url = f"https://dhivehinoos.net{obj.image}"
                else:
                    api_image_url = f"https://dhivehinoos.net/media/{obj.image}"
                
                images_html.append(format_html(
                    '<div style="border: 2px solid #28a745; padding: 2px; border-radius: 4px; margin-bottom: 4px;">'
                    '<img src="{}" style="max-width: 120px; max-height: 70px; object-fit: cover;" onerror="this.style.display=\'none\'; this.nextElementSibling.style.display=\'block\';" />'
                    '<div style="display: none; background: #f8f9fa; padding: 10px; text-align: center; font-size: 10px; color: #6c757d;">⚠️ Image Error</div>'
                    '<div style="font-size: 10px; color: #28a745; text-align: center; margin-top: 2px; font-weight: bold;">ORIGINAL API IMAGE</div>'
                    '</div>', 
                    api_image_url
                ))
            
            # Reuse Images (if any)
            if obj.reuse_images.exists():
                for reuse_image in obj.reuse_images.all()[:2]:  # Show max 2 reuse images
                    if reuse_image.image_file and reuse_image.image_file.name:
                        try:
                            # Check if the image file exists and is valid
                            if reuse_image.image_file.storage.exists(reuse_image.image_file.name):
                                reuse_image_url = f"https://dhivehinoos.net{reuse_image.image_file.url}"
                                images_html.append(format_html(
                                    '<div style="border: 2px solid #007bff; padding: 2px; border-radius: 4px; margin-bottom: 4px;">'
                                    '<img src="{}" style="max-width: 120px; max-height: 70px; object-fit: cover;" onerror="this.style.display=\'none\'; this.nextElementSibling.style.display=\'block\';" />'
                                    '<div style="display: none; background: #f8f9fa; padding: 10px; text-align: center; font-size: 10px; color: #6c757d;">⚠️ Corrupted Image</div>'
                                    '<div style="font-size: 10px; color: #007bff; text-align: center; margin-top: 2px; font-weight: bold;">REUSE: {}</div>'
                                    '</div>', 
                                    reuse_image_url,
                                    reuse_image.entity_name
                                ))
                            else:
                                # Image file doesn't exist
                                images_html.append(format_html(
                                    '<div style="border: 2px solid #dc3545; padding: 2px; border-radius: 4px; margin-bottom: 4px;">'
                                    '<div style="background: #f8d7da; padding: 10px; text-align: center; font-size: 10px; color: #721c24;">❌ Missing Image File</div>'
                                    '<div style="font-size: 10px; color: #dc3545; text-align: center; margin-top: 2px; font-weight: bold;">REUSE: {}</div>'
                                    '</div>',
                                    reuse_image.entity_name
                                ))
                        except Exception as e:
                            print(f"Error loading reuse image {reuse_image.id}: {e}")
                            # Show error placeholder
                            images_html.append(format_html(
                                '<div style="border: 2px solid #dc3545; padding: 2px; border-radius: 4px; margin-bottom: 4px;">'
                                '<div style="background: #f8d7da; padding: 10px; text-align: center; font-size: 10px; color: #721c24;">❌ Error Loading Image</div>'
                                '<div style="font-size: 10px; color: #dc3545; text-align: center; margin-top: 2px; font-weight: bold;">REUSE: {}</div>'
                                '</div>',
                                reuse_image.entity_name
                            ))
                            continue
            
            if images_html:
                return format_html('<div style="display: flex; flex-direction: column; gap: 4px;">{}</div>', 
                                 format_html(''.join(images_html)))
            else:
                return "No images"
                
        except Exception as e:
            print(f"Error in frontend_preview: {e}")
            return format_html('<div style="color: #dc3545; font-weight: bold;">⚠️ Error loading preview</div>')
    frontend_preview.short_description = "Frontend Preview (Both Images)"
    
    def image_matching_status(self, obj):
        """Show the current image matching setting status"""
        from settings_app.models import SiteSettings
        settings = SiteSettings.get_settings()
        
        if settings.enable_image_matching:
            return format_html(
                '<span style="color: #28a745; font-weight: bold;">✅ Enabled</span>'
            )
        else:
            return format_html(
                '<span style="color: #dc3545; font-weight: bold;">❌ Disabled</span>'
            )
    image_matching_status.short_description = "Image Matching"
    
    def image_controls(self, obj):
        """Interactive controls for image management"""
        try:
            from settings_app.models import SiteSettings
            settings = SiteSettings.get_settings()
            
            controls_html = []
            
            # Original API Image Controls
            if obj.image and not obj.image.startswith('https://via.placeholder.com'):
                controls_html.append(format_html(
                    '<div style="border: 1px solid #ddd; padding: 10px; margin: 5px 0; border-radius: 4px; background: #f8f9fa;">'
                    '<h4 style="margin: 0 0 8px 0; color: #28a745;">🟢 Original API Image</h4>'
                    '<p style="margin: 0; font-size: 12px; color: #666;">This image comes from the original API and is always preserved.</p>'
                    '<p style="margin: 5px 0 0 0; font-size: 11px;"><strong>URL:</strong> <a href="{}" target="_blank" style="color: #007bff;">{}</a></p>'
                    '</div>',
                    obj.image,
                    obj.image[:50] + "..." if len(obj.image) > 50 else obj.image
                ))
            else:
                controls_html.append(format_html(
                    '<div style="border: 1px solid #ddd; padding: 10px; margin: 5px 0; border-radius: 4px; background: #fff3cd;">'
                    '<h4 style="margin: 0 0 8px 0; color: #856404;">⚠️ No Original API Image</h4>'
                    '<p style="margin: 0; font-size: 12px; color: #666;">This article has no original API image.</p>'
                    '</div>'
                ))
            
            # Reuse Images Controls
            if obj.reuse_images.exists():
                controls_html.append(format_html(
                    '<div style="border: 1px solid #ddd; padding: 10px; margin: 5px 0; border-radius: 4px; background: #e7f3ff;">'
                    '<h4 style="margin: 0 0 8px 0; color: #007bff;">🔵 Reuse Images ({})</h4>',
                    obj.reuse_images.count()
                ))
                
                for reuse_image in obj.reuse_images.all():
                    controls_html.append(format_html(
                        '<div style="margin: 5px 0; padding: 5px; background: white; border-radius: 3px;">'
                        '<strong>{}</strong> ({}) - <a href="{}" target="_blank" style="color: #007bff;">View Image</a>'
                        '</div>',
                        reuse_image.entity_name,
                        reuse_image.entity_type,
                        f"https://dhivehinoos.net{reuse_image.image_file.url}" if reuse_image.image_file else "#"
                    ))
                
                controls_html.append('</div>')
            else:
                controls_html.append(format_html(
                    '<div style="border: 1px solid #ddd; padding: 10px; margin: 5px 0; border-radius: 4px; background: #f8f9fa;">'
                    '<h4 style="margin: 0 0 8px 0; color: #6c757d;">🔵 No Reuse Images</h4>'
                    '<p style="margin: 0; font-size: 12px; color: #666;">No reusable images have been matched for this article.</p>'
                    '</div>'
                ))
            
            # Action buttons
            controls_html.append(format_html(
                '<div style="margin-top: 15px; padding: 10px; background: #e9ecef; border-radius: 4px;">'
                '<h4 style="margin: 0 0 10px 0;">Quick Actions:</h4>'
                '<p style="margin: 5px 0; font-size: 12px;">• Use the Image Gallery below to select/deselect reuse images</p>'
                '<p style="margin: 5px 0; font-size: 12px;">• Upload new images to replace existing ones</p>'
                '<p style="margin: 5px 0; font-size: 12px;">• Changes are saved automatically when you save the article</p>'
                '<p style="margin: 5px 0; font-size: 12px;">• <strong>Image Matching:</strong> {} - <a href="/admin/settings_app/sitesettings/" target="_blank" style="color: #007bff;">Change Setting</a></p>'
                '</div>',
                "✅ Enabled" if settings.enable_image_matching else "❌ Disabled"
            ))
            
            return format_html('<div style="max-width: 400px;">{}</div>', 
                             format_html(''.join(controls_html)))
                
        except Exception as e:
            print(f"Error in image_controls: {e}")
            return "Error loading controls"
    image_controls.short_description = "Image Controls & Info"
    
    def original_image_url(self, obj):
        """Display the original API image URL"""
        if obj.image:
            # Handle both external URLs and local file paths
            if obj.image.startswith('http'):
                # External URL
                image_url = obj.image
            elif obj.image.startswith('/media/'):
                # Local file path - convert to full URL
                image_url = f"https://dhivehinoos.net{obj.image}"
            else:
                # Other local path
                image_url = f"https://dhivehinoos.net/media/{obj.image}"
            
            return format_html('<a href="{}" target="_blank">Original API Image (Fallback)</a>', image_url)
        return "No original image"
    original_image_url.short_description = "Original API Image"
    
    def upload_new_image(self, obj):
        """Custom field for uploading new images"""
        return None  # This is handled in the form
    upload_new_image.short_description = "Upload New Image (Adds to Library)"
    
    def use_original_api_image(self, obj):
        """Custom field for using original API image"""
        return obj.image_source == 'external' and bool(obj.image)
    use_original_api_image.short_description = "Use Original API Image"
    use_original_api_image.boolean = True
    
    def disable_reuse_images(self, obj):
        """Custom field for disabling reuse images"""
        return not bool(obj.reuse_images.exists()) and not bool(obj.reused_image)
    disable_reuse_images.short_description = "Disable Reuse Images"
    disable_reuse_images.boolean = True
    
    def image_gallery_selection(self, obj):
        """Custom field for image gallery selection"""
        return None  # This is handled by the widget
    image_gallery_selection.short_description = "Image Gallery"
    
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
    
    def clear_reuse_images(self, request, queryset):
        """Action to clear all reuse images from selected articles"""
        from django.contrib import messages
        from .cache_utils import invalidate_article_cache
        
        cleared_count = 0
        for article in queryset:
            try:
                # Clear all reuse images but keep original API image
                article.reuse_images.clear()
                article.reused_image = None
                article.image_source = 'external'
                article.save()
                
                # Invalidate cache for this article
                invalidate_article_cache(article_id=article.id)
                cleared_count += 1
            except Exception as e:
                messages.error(request, f"Failed to clear reuse images for '{article.title}': {str(e)}")
        
        if cleared_count > 0:
            messages.success(request, f"Successfully cleared reuse images from {cleared_count} article(s).")
    
    clear_reuse_images.short_description = "Clear all reuse images"
    
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
