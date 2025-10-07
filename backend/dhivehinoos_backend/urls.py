"""
URL configuration for dhivehinoos_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse, HttpResponse, FileResponse
from django.views.generic import RedirectView
from django.views.static import serve
from settings_app import views as settings_views
import os

def api_info(request):
    """Simple API info endpoint for the root URL"""
    return JsonResponse({
        'message': 'Dhivehinoos.net API',
        'version': '1.0',
        'endpoints': {
            'admin': '/admin/',
            'articles': '/api/v1/articles/',
            'comments': '/api/v1/comments/',
            'ads': '/api/v1/ads/',  # Re-enabled ad system
            'contact': '/api/v1/contact/',
            'settings': '/api/v1/settings/',
        },
        'frontend': 'http://localhost:5173',
        'documentation': 'See PROJECT_PLAN.md for API documentation'
    })

def favicon_view(request):
    """Simple favicon response"""
    return HttpResponse('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect width="32" height="32" fill="#2563eb"/><text x="16" y="20" text-anchor="middle" fill="white" font-family="Arial" font-size="16" font-weight="bold">D</text></svg>', content_type='image/svg+xml')

urlpatterns = [
    path('', api_info, name='api-info'),
    path('favicon.ico', favicon_view, name='favicon'),
    path('sitemap.xml', settings_views.sitemap_view, name='sitemap'),
    path('robots.txt', settings_views.robots_txt_view, name='robots-txt'),
    # path('admin/', admin.site.urls),  # Disabled to prevent conflict with React admin dashboard
    path('api/v1/articles/', include('articles.urls')),
    path('api/v1/comments/', include('comments.urls')),
    path('api/v1/ads/', include('ads.urls')),  # Re-enabled ad system
    path('api/v1/contact/', include('contact.urls')),
    path('api/v1/settings/', include('settings_app.urls')),
]

# Serve media files in development and production
# Always serve media files to ensure images are accessible
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
else:
    # Production: Use Django's serve view for media files
    urlpatterns += [
        path('media/<path:path>', serve, {'document_root': settings.MEDIA_ROOT}),
        path('static/<path:path>', serve, {'document_root': settings.STATIC_ROOT}),
    ]
