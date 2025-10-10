from django.contrib.syndication.views import Feed
from django.urls import reverse
from django.utils.feedgenerator import Atom1Feed
from django.http import Http404
from django.db.models import Q
from .models import Article, Category
from settings_app.models import SiteSettings


class LatestArticlesFeed(Feed):
    """RSS feed for latest articles"""
    title = "Dhivehinoos.net - Latest Articles"
    link = "/rss/"
    description = "Latest articles from Dhivehinoos.net"
    
    def get_object(self, request, *args, **kwargs):
        """Get site settings for dynamic title/description"""
        return SiteSettings.get_settings()
    
    def title(self, obj):
        """Dynamic title from site settings"""
        return f"{obj.site_name} - Latest Articles"
    
    def description(self, obj):
        """Dynamic description from site settings"""
        return obj.site_description
    
    def link(self, obj):
        """Link to homepage"""
        return "https://dhivehinoos.net/"
    
    def items(self, obj):
        """Get latest published articles"""
        return Article.objects.filter(status='published').order_by('-created_at')[:20]
    
    def item_title(self, item):
        """Article title"""
        return item.title
    
    def item_description(self, item):
        """Article content"""
        return item.content
    
    def item_link(self, item):
        """Link to article"""
        return f"https://dhivehinoos.net/article/{item.slug}"
    
    def item_pubdate(self, item):
        """Publication date"""
        return item.created_at
    
    def item_updateddate(self, item):
        """Last updated date"""
        return item.updated_at
    
    def item_categories(self, item):
        """Article categories"""
        if item.category:
            return [item.category.name]
        return []
    
    def item_enclosure_url(self, item):
        """Article image as enclosure"""
        if item.image_url:
            return item.image_url
        return None
    
    def item_enclosure_length(self, item):
        """Enclosure length (not available for URLs)"""
        return None
    
    def item_enclosure_mime_type(self, item):
        """Enclosure MIME type"""
        if item.image_url:
            return "image/jpeg"  # Default assumption
        return None


class CategoryFeed(Feed):
    """RSS feed for specific category"""
    title = "Dhivehinoos.net - Category Articles"
    link = "/rss/"
    description = "Articles from specific category"
    
    def get_object(self, request, category_slug):
        """Get category object"""
        try:
            return Category.objects.get(slug=category_slug, is_active=True)
        except Category.DoesNotExist:
            raise Http404("Category not found")
    
    def title(self, obj):
        """Category-specific title"""
        return f"Dhivehinoos.net - {obj.name} Articles"
    
    def description(self, obj):
        """Category description"""
        return f"Latest articles in {obj.name} category"
    
    def link(self, obj):
        """Link to category page"""
        return f"https://dhivehinoos.net/category/{obj.slug}"
    
    def items(self, obj):
        """Get articles from this category"""
        return Article.objects.filter(
            status='published', 
            category=obj
        ).order_by('-created_at')[:20]
    
    def item_title(self, item):
        """Article title"""
        return item.title
    
    def item_description(self, item):
        """Article content"""
        return item.content
    
    def item_link(self, item):
        """Link to article"""
        return f"https://dhivehinoos.net/article/{item.slug}"
    
    def item_pubdate(self, item):
        """Publication date"""
        return item.created_at
    
    def item_updateddate(self, item):
        """Last updated date"""
        return item.updated_at
    
    def item_categories(self, item):
        """Article categories"""
        return [item.category.name]


class SearchFeed(Feed):
    """RSS feed for search results"""
    title = "Dhivehinoos.net - Search Results"
    link = "/rss/"
    description = "Search results from Dhivehinoos.net"
    
    def get_object(self, request, *args, **kwargs):
        """Get search query from request"""
        query = request.GET.get('q', '')
        if not query:
            raise Http404("Search query required")
        return query
    
    def title(self, obj):
        """Search-specific title"""
        return f"Dhivehinoos.net - Search: {obj}"
    
    def description(self, obj):
        """Search description"""
        return f"Search results for: {obj}"
    
    def link(self, obj):
        """Link to search page"""
        return f"https://dhivehinoos.net/search?q={obj}"
    
    def items(self, obj):
        """Get search results"""
        return Article.objects.filter(
            status='published'
        ).filter(
            Q(title__icontains=obj) | 
            Q(content__icontains=obj) |
            Q(category__name__icontains=obj)
        ).order_by('-created_at')[:20]
    
    def item_title(self, item):
        """Article title"""
        return item.title
    
    def item_description(self, item):
        """Article content"""
        return item.content
    
    def item_link(self, item):
        """Link to article"""
        return f"https://dhivehinoos.net/article/{item.slug}"
    
    def item_pubdate(self, item):
        """Publication date"""
        return item.created_at
    
    def item_updateddate(self, item):
        """Last updated date"""
        return item.updated_at
    
    def item_categories(self, item):
        """Article categories"""
        if item.category:
            return [item.category.name]
        return []


class AtomLatestArticlesFeed(LatestArticlesFeed):
    """Atom feed for latest articles"""
    feed_type = Atom1Feed
    subtitle = LatestArticlesFeed.description
