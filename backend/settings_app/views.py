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

@api_view(['GET'])
@permission_classes([IsAdminUser])
def theme_preview_view(request):
    """
    Theme preview endpoint for admin
    Renders a preview page with the theme configuration applied
    """
    # Get theme config from query parameter or use current settings
    config_json = request.GET.get('config', '{}')
    try:
        theme_config = json.loads(config_json) if config_json else {}
    except (json.JSONDecodeError, TypeError):
        theme_config = {}
    
    # Get current active theme
    settings = SiteSettings.get_settings()
    active_theme = settings.active_theme or 'modern'
    
    # Build preview HTML
    colors = theme_config.get('colors', {})
    brand_colors = colors.get('brand', {})
    fonts = theme_config.get('fonts', {})
    
    # Default colors if not provided
    primary_color = brand_colors.get('500', '#0073e6')
    heading_font = fonts.get('heading', 'Inter, sans-serif').split(',')[0].strip()
    body_font = fonts.get('body', 'Inter, sans-serif').split(',')[0].strip()
    
    # Generate CSS variables
    css_vars = f"""
    :root {{
        --brand-primary: {primary_color};
        --heading-font: {heading_font};
        --body-font: {body_font};
    }}
    """
    
    # Generate brand color shades CSS
    brand_css = ""
    for shade in ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900']:
        color = brand_colors.get(shade, '#0073e6')
        brand_css += f"    --brand-{shade}: {color};\n"
    
    preview_html = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Theme Preview - {active_theme.title()}</title>
        <style>
            {css_vars}
            :root {{
                {brand_css}
            }}
            * {{
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }}
            body {{
                font-family: var(--body-font), sans-serif;
                background: #f5f5f5;
                color: #333;
                line-height: 1.6;
            }}
            .preview-container {{
                max-width: 1200px;
                margin: 0 auto;
                padding: 20px;
            }}
            .preview-header {{
                background: white;
                padding: 30px;
                border-radius: 8px;
                margin-bottom: 20px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }}
            .preview-header h1 {{
                font-family: var(--heading-font), sans-serif;
                color: var(--brand-primary);
                margin-bottom: 10px;
            }}
            .preview-header p {{
                color: #666;
            }}
            .preview-content {{
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 20px;
            }}
            .preview-card {{
                background: white;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                border-top: 4px solid var(--brand-primary);
            }}
            .preview-card h2 {{
                font-family: var(--heading-font), sans-serif;
                color: var(--brand-primary);
                margin-bottom: 10px;
                font-size: 1.5rem;
            }}
            .preview-card p {{
                color: #666;
                margin-bottom: 15px;
            }}
            .preview-card .meta {{
                font-size: 0.875rem;
                color: #999;
                margin-bottom: 10px;
            }}
            .preview-button {{
                background: var(--brand-primary);
                color: white;
                padding: 10px 20px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: background 0.2s;
            }}
            .preview-button:hover {{
                background: var(--brand-600, var(--brand-primary));
                opacity: 0.9;
            }}
            .color-palette {{
                display: flex;
                gap: 10px;
                margin-top: 20px;
                flex-wrap: wrap;
            }}
            .color-swatch {{
                width: 60px;
                height: 60px;
                border-radius: 4px;
                border: 1px solid #ddd;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
                color: white;
                text-shadow: 0 1px 2px rgba(0,0,0,0.3);
            }}
            .typography-sample {{
                margin-top: 20px;
                padding: 20px;
                background: #f9f9f9;
                border-radius: 4px;
            }}
            .typography-sample h1 {{
                font-family: var(--heading-font), sans-serif;
                font-size: 2.5rem;
                margin-bottom: 10px;
                color: var(--brand-primary);
            }}
            .typography-sample h2 {{
                font-family: var(--heading-font), sans-serif;
                font-size: 2rem;
                margin-bottom: 10px;
                color: #333;
            }}
            .typography-sample p {{
                font-family: var(--body-font), sans-serif;
                font-size: 1rem;
                color: #666;
                line-height: 1.8;
            }}
        </style>
    </head>
    <body>
        <div class="preview-container">
            <div class="preview-header">
                <h1>Theme Preview: {active_theme.title()}</h1>
                <p>This is a live preview of your theme customization. Changes are reflected in real-time.</p>
            </div>
            
            <div class="preview-content">
                <div class="preview-card">
                    <h2>Sample Article Card</h2>
                    <div class="meta">Category • January 15, 2025</div>
                    <p>This is a sample article card showing how your theme will look. The colors, fonts, and spacing are all customizable.</p>
                    <button class="preview-button">Read More</button>
                </div>
                
                <div class="preview-card">
                    <h2>Another Article</h2>
                    <div class="meta">News • January 14, 2025</div>
                    <p>Notice how the brand color is used consistently across all elements. The heading font and body font are applied as configured.</p>
                    <button class="preview-button">Read More</button>
                </div>
                
                <div class="preview-card">
                    <h2>Featured Story</h2>
                    <div class="meta">Featured • January 13, 2025</div>
                    <p>Your theme customization affects all aspects of the design, creating a cohesive visual experience for your readers.</p>
                    <button class="preview-button">Read More</button>
                </div>
            </div>
            
            <div class="preview-card" style="margin-top: 20px;">
                <h2>Color Palette</h2>
                <p>Your brand color shades:</p>
                <div class="color-palette">
    """
    
    # Add color swatches
    for shade in ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900']:
        color = brand_colors.get(shade, '#0073e6')
        preview_html += f'<div class="color-swatch" style="background: {color};">{shade}</div>\n'
    
    preview_html += """
                </div>
            </div>
            
            <div class="typography-sample">
                <h1>Heading 1 - {heading_font}</h1>
                <h2>Heading 2 - {heading_font}</h2>
                <p>This is body text using {body_font}. The typography settings you configure will be applied throughout your site. You can customize both heading and body fonts to match your brand identity.</p>
            </div>
        </div>
    </body>
    </html>
    """.format(
        heading_font=heading_font,
        body_font=body_font
    )
    
    return HttpResponse(preview_html, content_type='text/html')