from django.db import models
from django.utils.text import slugify
from django.utils import timezone
from django.contrib.auth.models import User
import json


class ImageReuseSettings(models.Model):
    """Settings for image reuse system"""
    
    # Auto-verification settings
    auto_verify_high_confidence = models.BooleanField(
        default=True,
        help_text="Automatically verify images with high confidence scores"
    )
    high_confidence_threshold = models.FloatField(
        default=0.9,
        help_text="Confidence threshold for auto-verification (0.0 to 1.0)"
    )
    
    # Manual verification settings
    require_manual_verification = models.BooleanField(
        default=False,
        help_text="Require manual verification for all image matches"
    )
    verification_required_for = models.JSONField(
        default=list,
        help_text="Entity types that require manual verification"
    )
    
    # Image selection settings
    prefer_verified_images = models.BooleanField(
        default=True,
        help_text="Prefer verified images over unverified ones"
    )
    allow_unverified_fallback = models.BooleanField(
        default=True,
        help_text="Allow fallback to unverified images if no verified ones available"
    )
    
    # Notification settings
    notify_on_pending_verification = models.BooleanField(
        default=True,
        help_text="Send email notifications for pending verifications"
    )
    verification_email_recipients = models.JSONField(
        default=list,
        help_text="Email addresses to notify about pending verifications"
    )
    
    # Name matching settings
    politician_name_patterns = models.JSONField(
        default=list,
        help_text="Regex patterns for extracting politician names"
    )
    institution_name_patterns = models.JSONField(
        default=list,
        help_text="Regex patterns for extracting institution names"
    )
    
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        help_text="User who last updated these settings"
    )
    
    class Meta:
        verbose_name = 'Image Reuse Settings'
        verbose_name_plural = 'Image Reuse Settings'
    
    def __str__(self):
        return "Image Reuse Settings"
    
    @classmethod
    def get_settings(cls):
        """Get or create settings instance"""
        obj, created = cls.objects.get_or_create(pk=1)
        if created:
            # Set default patterns
            obj.politician_name_patterns = [
                r'ރައްޔިތުން\s+([A-Za-z\s]+)',
                r'([A-Za-z\s]+)\s+ރައްޔިތުން',
                r'President\s+([A-Za-z\s]+)',
                r'([A-Za-z\s]+)\s+President',
            ]
            obj.institution_name_patterns = [
                r'މަޖިލިސް\s+([A-Za-z\s]+)',
                r'([A-Za-z\s]+)\s+މަޖިލިސް',
                r'Parliament\s+([A-Za-z\s]+)',
                r'([A-Za-z\s]+)\s+Parliament',
            ]
            obj.save()
        return obj


class ReusableImage(models.Model):
    """Model for storing reusable images with metadata"""
    
    ENTITY_TYPE_CHOICES = [
        ('politician', 'Politician'),
        ('institution', 'Institution'),
        ('organization', 'Organization'),
        ('public_figure', 'Public Figure'),
        ('other', 'Other'),
    ]
    
    IMAGE_VARIANT_CHOICES = [
        ('portrait', 'Portrait'),
        ('official', 'Official'),
        ('casual', 'Casual'),
        ('group', 'Group'),
        ('exterior', 'Exterior'),
        ('interior', 'Interior'),
        ('logo', 'Logo'),
        ('banner', 'Banner'),
        ('default', 'Default'),
    ]
    
    # Core identification
    entity_name = models.CharField(
        max_length=255,
        help_text="Primary name of the person or entity"
    )
    entity_type = models.CharField(
        max_length=50,
        choices=ENTITY_TYPE_CHOICES,
        help_text="Type of entity this image represents"
    )
    
    # Image management
    image_file = models.ImageField(
        upload_to='reusable_images/',
        help_text="The actual image file"
    )
    image_url = models.URLField(
        blank=True, 
        null=True,
        help_text="Original URL if image was downloaded from external source"
    )
    image_variant = models.CharField(
        max_length=50,
        choices=IMAGE_VARIANT_CHOICES,
        default='default',
        help_text="Type/variant of the image"
    )
    image_sequence = models.PositiveIntegerField(
        default=1,
        help_text="Sequence number for multiple images of same entity/variant"
    )
    
    # Naming scheme
    slug = models.SlugField(
        unique=True,
        help_text="Auto-generated unique identifier"
    )
    display_name = models.CharField(
        max_length=255,
        help_text="Human-readable display name"
    )
    
    # Alternative names and variations
    alternative_names = models.JSONField(
        default=list,
        help_text="Alternative names, nicknames, titles"
    )
    name_variations = models.JSONField(
        default=list,
        help_text="Name variations in different languages"
    )
    
    # Metadata
    tags = models.TextField(
        blank=True,
        help_text="Comma-separated tags for searching"
    )
    description = models.TextField(
        blank=True,
        help_text="Description of the image"
    )
    source = models.CharField(
        max_length=100,
        blank=True,
        help_text="Source of the image (AI Generated, Official Photo, etc.)"
    )
    
    # Admin verification
    is_verified = models.BooleanField(
        default=False,
        help_text="Whether this image has been verified by admin"
    )
    verified_by = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='verified_images',
        help_text="Admin user who verified this image"
    )
    verified_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When this image was verified"
    )
    verification_notes = models.TextField(
        blank=True,
        help_text="Admin notes about verification"
    )
    
    # Usage tracking
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this image is available for use"
    )
    usage_count = models.PositiveIntegerField(
        default=0,
        help_text="Number of times this image has been used"
    )
    last_used = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When this image was last used"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['entity_name', 'image_sequence']
        unique_together = ['entity_name', 'image_variant', 'image_sequence']
        verbose_name = 'Reusable Image'
        verbose_name_plural = 'Reusable Images'
    
    def __str__(self):
        return self.display_name
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = self.generate_slug()
        if not self.display_name:
            self.display_name = self.generate_display_name()
        super().save(*args, **kwargs)
    
    def generate_slug(self):
        """Generate slug: entity-name-variant-sequence"""
        base_slug = slugify(self.entity_name)
        variant_slug = slugify(self.image_variant)
        return f"{base_slug}-{variant_slug}-{self.image_sequence}"
    
    def generate_display_name(self):
        """Generate display name: Entity Name - Variant"""
        return f"{self.entity_name} - {self.image_variant.title()}"
    
    def increment_usage(self):
        """Increment usage count and update last used timestamp"""
        self.usage_count += 1
        self.last_used = timezone.now()
        self.save(update_fields=['usage_count', 'last_used'])
    
    def get_all_names(self):
        """Get all possible names for this image"""
        names = [self.entity_name]
        names.extend(self.alternative_names)
        names.extend(self.name_variations)
        return [name.strip() for name in names if name.strip()]


class ImageVerification(models.Model):
    """Model for tracking image verification requests"""
    
    STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('needs_revision', 'Needs Revision'),
    ]
    
    reusable_image = models.ForeignKey(
        ReusableImage,
        on_delete=models.CASCADE,
        related_name='verifications',
        help_text="The image being verified"
    )
    article = models.ForeignKey(
        'Article',
        on_delete=models.CASCADE,
        related_name='image_verifications',
        help_text="The article that triggered this verification"
    )
    
    # Verification details
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        help_text="Current verification status"
    )
    confidence_score = models.FloatField(
        null=True,
        blank=True,
        help_text="Confidence score from matching algorithm (0.0 to 1.0)"
    )
    matched_name = models.CharField(
        max_length=255,
        help_text="The name that was matched in the article"
    )
    
    # Admin review
    reviewed_by = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='reviewed_verifications',
        help_text="Admin user who reviewed this verification"
    )
    reviewed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When this verification was reviewed"
    )
    admin_notes = models.TextField(
        blank=True,
        help_text="Admin notes about the verification"
    )
    
    # Auto-verification settings
    auto_approved = models.BooleanField(
        default=False,
        help_text="Whether this was auto-approved by the system"
    )
    auto_approval_reason = models.CharField(
        max_length=100,
        blank=True,
        help_text="Reason for auto-approval"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Image Verification'
        verbose_name_plural = 'Image Verifications'
    
    def __str__(self):
        return f"{self.reusable_image.entity_name} - {self.article.title} ({self.status})"
    
    def approve(self, user, notes=''):
        """Approve this verification"""
        self.status = 'approved'
        self.reviewed_by = user
        self.reviewed_at = timezone.now()
        self.admin_notes = notes
        self.save()
    
    def reject(self, user, notes=''):
        """Reject this verification"""
        self.status = 'rejected'
        self.reviewed_by = user
        self.reviewed_at = timezone.now()
        self.admin_notes = notes
        self.save()
    
    def mark_needs_revision(self, user, notes=''):
        """Mark this verification as needing revision"""
        self.status = 'needs_revision'
        self.reviewed_by = user
        self.reviewed_at = timezone.now()
        self.admin_notes = notes
        self.save()

