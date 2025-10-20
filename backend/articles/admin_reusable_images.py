from django.contrib import admin
from django.utils import timezone
from django.utils.html import format_html
from django.urls import reverse, path
from django.shortcuts import redirect, render
from django.contrib import messages
from django.db.models import Count, Q
from django.utils.safestring import mark_safe
from django.http import HttpResponseRedirect
from django import forms
import zipfile
import os
from django.core.files.base import ContentFile

from .models import ReusableImage, ImageVerification, ImageReuseSettings
from .models import Article


class BulkImportForm(forms.Form):
    """Form for bulk importing images"""
    zip_file = forms.FileField(
        help_text="Upload a ZIP file containing images. Images will be named based on filename (without extension)."
    )
    entity_type = forms.ChoiceField(
        choices=ReusableImage.ENTITY_TYPE_CHOICES,
        initial='other',
        help_text="Default entity type for all imported images"
    )
    prefix = forms.CharField(
        max_length=100,
        required=False,
        help_text="Optional prefix to add to all entity names (e.g., 'President')"
    )


@admin.register(ImageReuseSettings)
class ImageReuseSettingsAdmin(admin.ModelAdmin):
    """Admin interface for ImageReuseSettings"""
    
    fieldsets = (
        ('Auto-Verification Settings', {
            'fields': (
                'auto_verify_high_confidence',
                'high_confidence_threshold',
            )
        }),
        ('Manual Verification Settings', {
            'fields': (
                'require_manual_verification',
                'verification_required_for',
            )
        }),
        ('Image Selection Settings', {
            'fields': (
                'prefer_verified_images',
                'allow_unverified_fallback',
            )
        }),
        ('Notification Settings', {
            'fields': (
                'notify_on_pending_verification',
                'verification_email_recipients',
            )
        }),
        ('Name Matching Patterns', {
            'fields': (
                'politician_name_patterns',
                'institution_name_patterns',
            ),
            'classes': ('collapse',)
        }),
    )
    
    def has_add_permission(self, request):
        """Only allow one settings instance"""
        return not ImageReuseSettings.objects.exists()
    
    def has_delete_permission(self, request, obj=None):
        """Prevent deletion of settings"""
        return False


@admin.register(ReusableImage)
class ReusableImageAdmin(admin.ModelAdmin):
    """Simplified admin interface for ReusableImage"""
    
    list_display = [
        'image_thumbnail',
        'entity_name',
        'entity_type',
        'is_active',
        'usage_count',
        'last_used',
        'created_at'
    ]
    
    list_filter = [
        'entity_type',
        'is_active',
        'created_at'
    ]
    
    search_fields = [
        'entity_name',
        'alternative_names',
        'description'
    ]
    
    readonly_fields = [
        'slug',
        'display_name',
        'usage_count',
        'last_used',
        'created_at',
        'updated_at',
        'image_thumbnail'
    ]
    
    fieldsets = (
        ('Basic Information', {
            'fields': (
                'entity_name',
                'entity_type',
                'display_name',
                'slug'
            ),
            'description': 'Optional: Enter the identifiable name (e.g., "President Ibrahim Mohamed Solih"). If empty, will be generated from filename.'
        }),
        ('Image Upload', {
            'fields': (
                'image_file',
                'image_thumbnail',
            ),
            'description': 'Upload the image file. The system will automatically generate a unique identifier.'
        }),
        ('Name Matching', {
            'fields': (
                'alternative_names',
            ),
            'description': 'Optional: Add alternative names separated by commas (e.g., "Ibu Solih, President Solih, Ibrahim Solih")'
        }),
        ('Optional Details', {
            'fields': (
                'description',
            ),
            'classes': ('collapse',)
        }),
        ('Status & Usage', {
            'fields': (
                'is_active',
                'usage_count',
                'last_used',
            ),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': (
                'created_at',
                'updated_at'
            ),
            'classes': ('collapse',)
        }),
    )
    
    actions = [
        'activate_images',
        'deactivate_images',
        'reset_usage_count'
    ]
    
    def get_urls(self):
        """Add custom URLs for bulk import"""
        urls = super().get_urls()
        custom_urls = [
            path('bulk-import/', self.admin_site.admin_view(self.bulk_import_view), name='articles_reusableimage_bulk_import'),
        ]
        return custom_urls + urls
    
    def image_thumbnail(self, obj):
        """Display image thumbnail with error handling"""
        if obj.image_file:
            try:
                # Check if file actually exists
                import os
                from django.conf import settings
                file_path = os.path.join(settings.MEDIA_ROOT, obj.image_file.name)
                if os.path.exists(file_path):
                    return format_html(
                        '<img src="{}" width="50" height="50" style="object-fit: cover; border-radius: 4px;" />',
                        obj.image_file.url
                    )
                else:
                    return format_html(
                        '<div style="width:50px;height:50px;background:#f0f0f0;border-radius:4px;display:flex;align-items:center;justify-content:center;color:#666;font-size:10px;">File Missing</div>'
                    )
            except Exception as e:
                return format_html(
                    '<div style="width:50px;height:50px;background:#f0f0f0;border-radius:4px;display:flex;align-items:center;justify-content:center;color:#666;font-size:10px;">Error</div>'
                )
        return "No Image"
    image_thumbnail.short_description = "Image"
    
    def activate_images(self, request, queryset):
        """Bulk activate images"""
        count = queryset.update(is_active=True)
        self.message_user(request, f"{count} images activated.")
    activate_images.short_description = "Activate selected images"
    
    def deactivate_images(self, request, queryset):
        """Bulk deactivate images"""
        count = queryset.update(is_active=False)
        self.message_user(request, f"{count} images deactivated.")
    deactivate_images.short_description = "Deactivate selected images"
    
    def reset_usage_count(self, request, queryset):
        """Reset usage count for selected images"""
        count = queryset.update(usage_count=0, last_used=None)
        self.message_user(request, f"Usage count reset for {count} images.")
    reset_usage_count.short_description = "Reset usage count"
    
    def bulk_import_view(self, request):
        """Bulk import images from ZIP file"""
        if request.method == 'POST':
            form = BulkImportForm(request.POST, request.FILES)
            if form.is_valid():
                zip_file = form.cleaned_data['zip_file']
                entity_type = form.cleaned_data['entity_type']
                prefix = form.cleaned_data['prefix']
                
                try:
                    imported_count = self._process_zip_file(zip_file, entity_type, prefix)
                    messages.success(request, f"Successfully imported {imported_count} images.")
                    return HttpResponseRedirect(reverse('admin:articles_reusableimage_changelist'))
                except Exception as e:
                    messages.error(request, f"Error importing images: {str(e)}")
        else:
            form = BulkImportForm()
        
        context = {
            'form': form,
            'title': 'Bulk Import Images',
            'has_permission': True,
        }
        return render(request, 'admin/articles/reusableimage/bulk_import.html', context)
    
    def _process_zip_file(self, zip_file, entity_type, prefix):
        """Process ZIP file and create ReusableImage objects"""
        imported_count = 0
        
        with zipfile.ZipFile(zip_file, 'r') as zip_ref:
            for file_info in zip_ref.filelist:
                if not file_info.is_dir():
                    # Get file extension
                    filename = file_info.filename
                    name, ext = os.path.splitext(filename)
                    
                    # Skip non-image files
                    if ext.lower() not in ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']:
                        continue
                    
                    # Create entity name
                    entity_name = name.replace('_', ' ').replace('-', ' ').title()
                    if prefix:
                        entity_name = f"{prefix} {entity_name}"
                    
                    # Check if image already exists
                    if ReusableImage.objects.filter(entity_name=entity_name).exists():
                        continue
                    
                    # Read image data
                    image_data = zip_ref.read(filename)
                    
                    # Create ReusableImage
                    reusable_image = ReusableImage(
                        entity_name=entity_name,
                        entity_type=entity_type,
                        is_active=True
                    )
                    
                    # Save image file
                    image_file = ContentFile(image_data, name=filename)
                    reusable_image.image_file = image_file
                    reusable_image.save()
                    
                    imported_count += 1
        
        return imported_count
    
    def changelist_view(self, request, extra_context=None):
        """Add bulk import link to changelist"""
        extra_context = extra_context or {}
        extra_context['bulk_import_url'] = reverse('admin:articles_reusableimage_bulk_import')
        extra_context['show_bulk_import'] = True
        return super().changelist_view(request, extra_context)


@admin.register(ImageVerification)
class ImageVerificationAdmin(admin.ModelAdmin):
    """Admin interface for ImageVerification"""
    
    list_display = [
        'reusable_image_link',
        'article_link',
        'status',
        'confidence_score',
        'matched_name',
        'auto_approved',
        'reviewed_by',
        'created_at'
    ]
    
    list_filter = [
        'status',
        'auto_approved',
        'created_at',
        'reusable_image__entity_type'
    ]
    
    search_fields = [
        'reusable_image__entity_name',
        'article__title',
        'matched_name',
        'admin_notes'
    ]
    
    readonly_fields = [
        'created_at',
        'confidence_score',
        'matched_name',
        'reusable_image_link',
        'article_link'
    ]
    
    fieldsets = (
        ('Verification Details', {
            'fields': (
                'reusable_image_link',
                'article_link',
                'status',
                'confidence_score',
                'matched_name'
            )
        }),
        ('Admin Review', {
            'fields': (
                'reviewed_by',
                'reviewed_at',
                'admin_notes'
            )
        }),
        ('Auto-verification', {
            'fields': (
                'auto_approved',
                'auto_approval_reason'
            )
        }),
    )
    
    actions = [
        'approve_verifications',
        'reject_verifications',
        'mark_needs_revision'
    ]
    
    def reusable_image_link(self, obj):
        """Display link to reusable image"""
        url = reverse('admin:articles_reusableimage_change', args=[obj.reusable_image.id])
        return format_html('<a href="{}">{}</a>', url, obj.reusable_image.display_name)
    reusable_image_link.short_description = "Reusable Image"
    
    def article_link(self, obj):
        """Display link to article"""
        url = reverse('admin:articles_article_change', args=[obj.article.id])
        return format_html('<a href="{}">{}</a>', url, obj.article.title)
    article_link.short_description = "Article"
    
    def approve_verifications(self, request, queryset):
        """Bulk approve verifications"""
        count = 0
        for verification in queryset:
            verification.approve(request.user, "Bulk approved")
            count += 1
        self.message_user(request, f"{count} verifications approved.")
    approve_verifications.short_description = "Approve selected verifications"
    
    def reject_verifications(self, request, queryset):
        """Bulk reject verifications"""
        count = 0
        for verification in queryset:
            verification.reject(request.user, "Bulk rejected")
            count += 1
        self.message_user(request, f"{count} verifications rejected.")
    reject_verifications.short_description = "Reject selected verifications"
    
    def mark_needs_revision(self, request, queryset):
        """Bulk mark verifications as needing revision"""
        count = 0
        for verification in queryset:
            verification.mark_needs_revision(request.user, "Bulk marked for revision")
            count += 1
        self.message_user(request, f"{count} verifications marked for revision.")
    mark_needs_revision.short_description = "Mark selected as needing revision"
    
    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return super().get_queryset(request).select_related(
            'reusable_image',
            'article',
            'reviewed_by'
        )


class ImageVerificationWidget(admin.ModelAdmin):
    """Widget for displaying verification statistics in admin dashboard"""
    
    def changelist_view(self, request, extra_context=None):
        """Add verification statistics to changelist view"""
        extra_context = extra_context or {}
        
        # Get verification statistics
        extra_context['verification_stats'] = {
            'pending': ImageVerification.objects.filter(status='pending').count(),
            'approved': ImageVerification.objects.filter(status='approved').count(),
            'rejected': ImageVerification.objects.filter(status='rejected').count(),
            'needs_revision': ImageVerification.objects.filter(status='needs_revision').count(),
            'total': ImageVerification.objects.count(),
        }
        
        # Get recent verifications
        extra_context['recent_verifications'] = ImageVerification.objects.filter(
            created_at__gte=timezone.now() - timezone.timedelta(days=7)
        ).count()
        
        return super().changelist_view(request, extra_context)


# Add verification widget to Article admin
# Note: ArticleAdmin extension is handled in the main admin.py file
