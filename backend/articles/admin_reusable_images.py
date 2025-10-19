from django.contrib import admin
from django.utils import timezone
from django.utils.html import format_html
from django.urls import reverse
from django.shortcuts import redirect
from django.contrib import messages
from django.db.models import Count, Q
from django.utils.safestring import mark_safe

from .models import ReusableImage, ImageVerification, ImageReuseSettings
from .models import Article


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
    """Admin interface for ReusableImage"""
    
    list_display = [
        'image_thumbnail',
        'display_name',
        'entity_name',
        'entity_type',
        'image_variant',
        'is_verified',
        'usage_count',
        'last_used',
        'created_at'
    ]
    
    list_filter = [
        'entity_type',
        'image_variant',
        'is_verified',
        'is_active',
        'created_at'
    ]
    
    search_fields = [
        'entity_name',
        'alternative_names',
        'name_variations',
        'tags',
        'description'
    ]
    
    readonly_fields = [
        'slug',
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
            )
        }),
        ('Image Details', {
            'fields': (
                'image_file',
                'image_url',
                'image_thumbnail',
                'image_variant',
                'image_sequence'
            )
        }),
        ('Names & Variations', {
            'fields': (
                'alternative_names',
                'name_variations',
                'tags',
                'description'
            )
        }),
        ('Verification', {
            'fields': (
                'is_verified',
                'verified_by',
                'verified_at',
                'verification_notes'
            )
        }),
        ('Usage & Status', {
            'fields': (
                'is_active',
                'usage_count',
                'last_used',
                'source'
            )
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
        'verify_images',
        'unverify_images',
        'activate_images',
        'deactivate_images',
        'export_usage_stats'
    ]
    
    def image_thumbnail(self, obj):
        """Display image thumbnail"""
        if obj.image_file:
            return format_html(
                '<img src="{}" width="50" height="50" style="object-fit: cover; border-radius: 4px;" />',
                obj.image_file.url
            )
        return "No Image"
    image_thumbnail.short_description = "Image"
    
    def verify_images(self, request, queryset):
        """Bulk verify images"""
        count = queryset.update(
            is_verified=True,
            verified_by=request.user,
            verified_at=timezone.now()
        )
        self.message_user(request, f"{count} images verified.")
    verify_images.short_description = "Verify selected images"
    
    def unverify_images(self, request, queryset):
        """Bulk unverify images"""
        count = queryset.update(
            is_verified=False,
            verified_by=None,
            verified_at=None
        )
        self.message_user(request, f"{count} images unverified.")
    unverify_images.short_description = "Unverify selected images"
    
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
    
    def export_usage_stats(self, request, queryset):
        """Export usage statistics"""
        # This would typically generate a CSV or Excel file
        # For now, just show a message
        total_usage = queryset.aggregate(total=Count('usage_count'))['total']
        self.message_user(request, f"Total usage count: {total_usage}")
    export_usage_stats.short_description = "Export usage statistics"
    
    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return super().get_queryset(request).select_related('verified_by')


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
