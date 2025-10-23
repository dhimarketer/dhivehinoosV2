from django import forms
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from django.db import models
from .models import ReusableImage, Article


class ImageGalleryWidget(forms.Widget):
    """Custom widget to display image gallery for admin selection"""
    
    def __init__(self, attrs=None):
        super().__init__(attrs)
    
    def render(self, name, value, attrs=None, renderer=None):
        """Render the image gallery widget"""
        
        # Get all reusable images
        reusable_images = ReusableImage.objects.filter(is_active=True)
        
        # Get all articles with API images (both external URLs and local files)
        # First get count for display
        articles_with_api_images_count = Article.objects.filter(
            models.Q(image_file__isnull=False) | models.Q(image__isnull=False)
        ).exclude(
            models.Q(image__startswith='https://via.placeholder.com')
        ).distinct().count()
        
        # Get actual articles for display (limit to 50 for performance, but show all count)
        articles_with_api_images = Article.objects.filter(
            models.Q(image_file__isnull=False) | models.Q(image__isnull=False)
        ).exclude(
            models.Q(image__startswith='https://via.placeholder.com')
        ).distinct().order_by('-created_at')[:50]  # Show most recent 50
        
        html = f"""
        <div id="image-gallery-{name}" class="image-gallery-widget">
            <div class="gallery-header">
                <h4>Image Gallery</h4>
                <p>Select images from the gallery below. Click on an image to select it.</p>
            </div>
            
            <div class="gallery-tabs">
                <button type="button" class="tab-button active" onclick="showTab_{name}('reusable-{name}')">Reusable Images ({reusable_images.count()})</button>
                <button type="button" class="tab-button" onclick="showTab_{name}('api-{name}')">API Images ({articles_with_api_images_count})</button>
            </div>
            
            <div id="reusable-{name}" class="gallery-tab active">
                <div class="image-grid">
        """
        
        # Render reusable images
        for image in reusable_images:
            if image.image_file and image.image_file.name:
                html += f"""
                    <div class="image-item" data-image-id="{image.id}" data-image-type="reusable" data-image-url="{image.image_file.url}">
                        <img src="{image.image_file.url}" alt="{image.entity_name}" />
                        <div class="image-info">
                            <div class="image-name">{image.entity_name}</div>
                        </div>
                    </div>
                """
        
        html += f"""
                </div>
            </div>
            
            <div id="api-{name}" class="gallery-tab">
                <div class="image-grid">
        """
        
        # Render API images
        for article in articles_with_api_images:
            # Determine which image to show and its URL
            image_url = None
            image_source = "Unknown"
            
            if article.image_file and article.image_file.name:
                # Local file takes priority - construct full URL
                image_url = f"https://dhivehinoos.net{article.image_file.url}"
                image_source = "Local File"
            elif article.image:
                # External URL as fallback
                image_url = article.image
                image_source = "External URL"
            
            if image_url:
                # Add error handling for image loading
                html += f"""
                    <div class="image-item" data-image-id="{article.id}" data-image-type="api" data-image-url="{image_url}">
                        <img src="{image_url}" alt="{article.title}" 
                             onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
                        <div class="image-error" style="display:none; width:100%; height:100px; background:#f8f9fa; border:1px solid #dee2e6; display:flex; align-items:center; justify-content:center; color:#6c757d; font-size:12px;">
                            Image failed to load<br/>
                            <small>URL: {image_url}</small>
                        </div>
                        <div class="image-info">
                            <div class="image-name">{article.title[:30]}...</div>
                        </div>
                    </div>
                """
        
        html += f"""
                </div>
            </div>
            
            <div class="gallery-footer">
                <input type="hidden" name="{name}" id="selected-image-{name}" value="{value or ''}" />
                <div class="selected-info">
                    <span id="selected-text-{name}">No image selected</span>
                </div>
            </div>
        </div>
        
        <style>
        .image-gallery-widget {{
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 15px;
            margin: 10px 0;
            background: #f9f9f9;
        }}
        
        .gallery-header h4 {{
            margin: 0 0 10px 0;
            color: #333;
        }}
        
        .gallery-tabs {{
            margin-bottom: 15px;
        }}
        
        .tab-button {{
            background: #007cba;
            color: white;
            border: none;
            padding: 8px 16px;
            margin-right: 5px;
            border-radius: 4px;
            cursor: pointer;
        }}
        
        .tab-button.active {{
            background: #005a87;
        }}
        
        .gallery-tab {{
            display: none;
        }}
        
        .gallery-tab.active {{
            display: block;
        }}
        
        .image-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 15px;
            max-height: 400px;
            overflow-y: auto;
            border: 1px solid #ddd;
            padding: 10px;
            background: white;
        }}
        
        .image-item {{
            border: 2px solid #ddd;
            border-radius: 4px;
            overflow: hidden;
            cursor: pointer;
            transition: border-color 0.2s;
        }}
        
        .image-item:hover {{
            border-color: #007cba;
        }}
        
        .image-item.selected {{
            border-color: #28a745;
            background: #d4edda;
        }}
        
        .image-item img {{
            width: 100%;
            height: 100px;
            object-fit: cover;
            object-position: top;
        }}
        
        .image-info {{
            padding: 8px;
            font-size: 12px;
        }}
        
        .image-name {{
            font-weight: bold;
            margin-bottom: 4px;
        }}
        
        .image-type {{
            color: #666;
            margin-bottom: 2px;
        }}
        
        .image-usage {{
            color: #999;
            font-size: 10px;
        }}
        
        .gallery-footer {{
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid #ddd;
        }}
        
        .selected-info {{
            font-weight: bold;
            color: #28a745;
        }}
        </style>
        
        <script>
        // Scoped functions for this widget instance
        function showTab_{name}(tabId) {{
            const gallery = document.getElementById('image-gallery-{name}');
            if (!gallery) {{
                console.error('Gallery not found for {name}');
                return;
            }}
            
            // Hide all tabs within this gallery
            gallery.querySelectorAll('.gallery-tab').forEach(tab => {{
                tab.classList.remove('active');
            }});
            
            // Remove active class from all buttons within this gallery
            gallery.querySelectorAll('.tab-button').forEach(btn => {{
                btn.classList.remove('active');
            }});
            
            // Show selected tab
            const targetTab = document.getElementById(tabId);
            if (targetTab) {{
                targetTab.classList.add('active');
            }}
            
            // Add active class to clicked button
            const clickedButton = event.target;
            if (clickedButton) {{
                clickedButton.classList.add('active');
            }}
        }}
        
        // Add click handlers to image items for this widget instance
        document.addEventListener('DOMContentLoaded', function() {{
            const gallery = document.getElementById('image-gallery-{name}');
            if (!gallery) return;
            
            const imageItems = gallery.querySelectorAll('.image-item');
            const selectedInput = document.getElementById('selected-image-{name}');
            const selectedText = document.getElementById('selected-text-{name}');
            
            if (!selectedInput || !selectedText) return;
            
            imageItems.forEach(item => {{
                item.addEventListener('click', function() {{
                    // Remove selected class from all items in this gallery
                    imageItems.forEach(i => i.classList.remove('selected'));
                    
                    // Add selected class to clicked item
                    this.classList.add('selected');
                    
                    // Update hidden input
                    const imageId = this.dataset.imageId;
                    const imageType = this.dataset.imageType;
                    const imageUrl = this.dataset.imageUrl;
                    
                    if (imageId && imageType && imageUrl) {{
                        selectedInput.value = imageId + '|' + imageType + '|' + imageUrl;
                        
                        // Update selected text
                        const imageNameEl = this.querySelector('.image-name');
                        if (imageNameEl) {{
                            const imageName = imageNameEl.textContent;
                            selectedText.textContent = `Selected: ${{imageName}} (${{imageType}} image)`;
                        }}
                    }}
                }});
            }});
        }});
        </script>
        """
        
        return mark_safe(html)
