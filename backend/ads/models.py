from django.db import models
from django.utils import timezone


class AdPlacement(models.Model):
    """Define where ads can be placed on the website"""
    PLACEMENT_CHOICES = [
        ('top_banner', 'Top Banner'),
        ('sidebar', 'Sidebar'),
        ('between_articles', 'Between Articles'),
        ('bottom_banner', 'Bottom Banner'),
        ('article_header', 'Article Header'),
        ('article_footer', 'Article Footer'),
    ]
    
    name = models.CharField(max_length=50, choices=PLACEMENT_CHOICES, unique=True)
    description = models.TextField(blank=True, help_text="Description of where this placement appears")
    is_active = models.BooleanField(default=True)
    max_ads = models.PositiveIntegerField(default=1, help_text="Maximum number of ads that can be shown in this placement")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['name']
        verbose_name = 'Ad Placement'
        verbose_name_plural = 'Ad Placements'
    
    def __str__(self):
        return self.get_name_display()


class Ad(models.Model):
    title = models.CharField(max_length=100)
    image = models.URLField(blank=True, null=True, help_text="External image URL (optional)")
    image_file = models.ImageField(blank=True, null=True, upload_to='ads/', help_text="Uploaded image file (optional)")
    destination_url = models.URLField(blank=True, null=True, help_text="Optional target link")
    placement = models.ForeignKey(AdPlacement, on_delete=models.CASCADE, null=True, blank=True, help_text="Where this ad should be displayed")
    is_active = models.BooleanField(default=True)
    start_date = models.DateTimeField(default=timezone.now, help_text="When the ad should start showing")
    end_date = models.DateTimeField(blank=True, null=True, help_text="When the ad should stop showing (optional)")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Ad'
        verbose_name_plural = 'Ads'
    
    def __str__(self):
        return self.title
    
    @property
    def is_currently_active(self):
        """Check if the ad is currently active based on dates"""
        now = timezone.now()
        if not self.is_active:
            return False
        if self.start_date > now:
            return False
        if self.end_date and self.end_date < now:
            return False
        return True
    
    @property
    def image_url(self):
        """Return the image URL, either from image field or image_file field"""
        if self.image:
            return self.image
        elif self.image_file:
            return self.image_file.url
        return None