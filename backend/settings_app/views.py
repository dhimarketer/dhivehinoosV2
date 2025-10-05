from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse, HttpResponse
from django.urls import reverse
from .models import SiteSettings
from .serializers import SiteSettingsSerializer
import json

@api_view(['GET', 'PUT'])
def site_settings_view(request):
    """
    GET: Retrieve current site settings
    PUT: Update site settings
    """
    if request.method == 'GET':
        settings = SiteSettings.get_settings()
        serializer = SiteSettingsSerializer(settings)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        settings = SiteSettings.get_settings()
        serializer = SiteSettingsSerializer(settings, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def public_settings_view(request):
    """
    GET: Retrieve public site settings (no authentication required)
    Returns only settings that are safe to expose publicly
    """
    settings = SiteSettings.get_settings()
    
    # Only return public-safe settings
    public_data = {
        'site_name': settings.site_name,
        'site_description': settings.site_description,
        'allow_comments': settings.allow_comments,
        'google_analytics_id': settings.google_analytics_id,
    }
    
    return Response(public_data)

@api_view(['GET'])
def sitemap_view(request):
    """
    Generate XML sitemap for search engines
    """
    from articles.models import Article
    
    # Get all published articles
    articles = Article.objects.filter(status='published').order_by('-created_at')
    
    # Build sitemap XML
    xml_content = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml_content += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    
    # Add homepage
    xml_content += '  <url>\n'
    xml_content += '    <loc>https://dhivehinoos.net/</loc>\n'
    xml_content += '    <lastmod>2025-10-04</lastmod>\n'
    xml_content += '    <changefreq>daily</changefreq>\n'
    xml_content += '    <priority>1.0</priority>\n'
    xml_content += '  </url>\n'
    
    # Add contact page
    xml_content += '  <url>\n'
    xml_content += '    <loc>https://dhivehinoos.net/contact</loc>\n'
    xml_content += '    <lastmod>2025-10-04</lastmod>\n'
    xml_content += '    <changefreq>monthly</changefreq>\n'
    xml_content += '    <priority>0.8</priority>\n'
    xml_content += '  </url>\n'
    
    # Add articles
    for article in articles:
        xml_content += '  <url>\n'
        xml_content += f'    <loc>https://dhivehinoos.net/article/{article.slug}</loc>\n'
        xml_content += f'    <lastmod>{article.updated_at.strftime("%Y-%m-%d")}</lastmod>\n'
        xml_content += '    <changefreq>weekly</changefreq>\n'
        xml_content += '    <priority>0.6</priority>\n'
        xml_content += '  </url>\n'
    
    xml_content += '</urlset>'
    
    return HttpResponse(xml_content, content_type='application/xml')

@api_view(['GET'])
def robots_txt_view(request):
    """
    Generate robots.txt file
    """
    robots_content = """User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: https://dhivehinoos.net/sitemap.xml
"""
    
    return HttpResponse(robots_content, content_type='text/plain')