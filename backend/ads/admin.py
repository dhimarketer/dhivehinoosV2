from django.contrib import admin
from .models import Ad, AdPlacement


@admin.register(AdPlacement)
class AdPlacementAdmin(admin.ModelAdmin):
    list_display = ['name', 'description', 'is_active', 'max_ads', 'created_at']
    list_filter = ['is_active', 'name']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at']
    
    fieldsets = (
        ('Placement Details', {
            'fields': ('name', 'description')
        }),
        ('Configuration', {
            'fields': ('is_active', 'max_ads')
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )


@admin.register(Ad)
class AdAdmin(admin.ModelAdmin):
    list_display = ['title', 'placement', 'is_active', 'is_currently_active', 'start_date', 'end_date', 'created_at']
    list_filter = ['is_active', 'placement', 'start_date', 'end_date']
    search_fields = ['title', 'destination_url']
    readonly_fields = ['created_at', 'is_currently_active']
    
    fieldsets = (
        ('Ad Details', {
            'fields': ('title', 'placement', 'destination_url')
        }),
        ('Images', {
            'fields': ('image', 'image_file'),
            'description': 'You can provide either an external image URL or upload an image file.'
        }),
        ('Status & Timing', {
            'fields': ('is_active', 'start_date', 'end_date', 'is_currently_active')
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('placement')
