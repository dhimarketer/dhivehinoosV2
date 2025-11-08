from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.authentication import SessionAuthentication
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse, HttpResponse
from django.urls import reverse
from .models import SiteSettings
from .serializers import SiteSettingsSerializer
import json

class NoCSRFSessionAuthentication(SessionAuthentication):
    """
    Custom authentication class that doesn't enforce CSRF tokens
    """
    def enforce_csrf(self, request):
        return  # Skip CSRF enforcement

@api_view(['PUT'])
@permission_classes([IsAdminUser])
@authentication_classes([NoCSRFSessionAuthentication])
@csrf_exempt
def site_settings_view(request):
    """
    PUT: Update site settings (admin only)
    """
    print(f"Settings update view called: {request.method}")
    
    if request.method == 'PUT':
        try:
            import json
            data = json.loads(request.body)
            print(f"Received settings data: {data}")
            
            # Get current settings
            settings = SiteSettings.get_settings()
            print(f"Current settings before update: {SiteSettingsSerializer(settings).data}")
            
            # Update settings
            serializer = SiteSettingsSerializer(settings, data=data, partial=True)
            
            if serializer.is_valid():
                updated_settings = serializer.save()
                print(f"Settings saved successfully: {SiteSettingsSerializer(updated_settings).data}")
                
                # Clear cache when settings are updated
                from django.core.cache import cache
                cache.delete('public_site_settings')
                
                return JsonResponse(serializer.data)
            
            print(f"Validation errors: {serializer.errors}")
            return JsonResponse(serializer.errors, status=400)
            
        except json.JSONDecodeError:
            print("JSON decode error")
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        except Exception as e:
            print(f"Exception: {str(e)}")
            return JsonResponse({'error': str(e)}, status=500)
    
    return JsonResponse({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def test_settings_view(request):
    """
    Test endpoint to verify CSRF exemption is working
    """
    if request.method == 'POST':
        return JsonResponse({'message': 'CSRF exemption working!', 'data': request.body.decode()})
    return JsonResponse({'message': 'Test endpoint - send POST to test CSRF exemption'})

@api_view(['GET'])
def public_settings_view(request):
    """
    GET: Retrieve public site settings (no authentication required)
    Returns only settings that are safe to expose publicly
    """
    from django.core.cache import cache
    
    # Cache public settings for 5 minutes to improve performance
    cache_key = 'public_site_settings'
    cached_data = cache.get(cache_key)
    
    if cached_data is not None:
        return Response(cached_data)
    
    settings = SiteSettings.get_settings()
    
    # Only return public-safe settings
    public_data = {
        'site_name': settings.site_name,
        'site_description': settings.site_description,
        'allow_comments': settings.allow_comments,
        'google_analytics_id': settings.google_analytics_id,
        'story_cards_rows': settings.story_cards_rows,
        'story_cards_columns': settings.story_cards_columns,
        'default_pagination_size': settings.default_pagination_size,
        'active_theme': settings.active_theme,
        'theme_config': settings.theme_config or {},
    }
    
    # Cache for 5 minutes
    cache.set(cache_key, public_data, 300)
    
    return Response(public_data)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_settings_view(request):
    """
    GET: Retrieve all site settings for admin users
    Returns all settings including admin-only fields
    """
    settings = SiteSettings.get_settings()
    serializer = SiteSettingsSerializer(settings)
    return Response(serializer.data)

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