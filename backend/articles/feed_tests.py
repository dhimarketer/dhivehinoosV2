from django.test import TestCase, RequestFactory
from django.urls import reverse
from django.utils import timezone
from django.contrib.syndication.views import Feed
from datetime import datetime, timedelta
import xml.etree.ElementTree as ET

from articles.models import Article, Category
from articles.feeds import LatestArticlesFeed, AtomLatestArticlesFeed, CategoryFeed, SearchFeed


class RSSFeedTest(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        
        # Create test category
        self.category = Category.objects.create(
            name='Test Category',
            slug='test-category',
            description='Test category description'
        )
        
        # Create test articles
        self.article1 = Article.objects.create(
            title='Test Article 1',
            slug='test-article-1',
            content='This is test article 1 content',
            category=self.category,
            status='published',
            published_at=timezone.now() - timedelta(hours=2)
        )
        
        self.article2 = Article.objects.create(
            title='Test Article 2',
            slug='test-article-2',
            content='This is test article 2 content',
            category=self.category,
            status='published',
            published_at=timezone.now() - timedelta(hours=1)
        )
        
        self.draft_article = Article.objects.create(
            title='Draft Article',
            slug='draft-article',
            content='This is a draft article',
            category=self.category,
            status='draft'
        )

    def test_latest_articles_feed_title(self):
        """Test LatestArticlesFeed title"""
        request = self.factory.get('/rss/')
        feed = LatestArticlesFeed()
        
        self.assertEqual(feed.title(request), 'Latest Articles - Dhivehinoos.net')

    def test_latest_articles_feed_link(self):
        """Test LatestArticlesFeed link"""
        request = self.factory.get('/rss/')
        feed = LatestArticlesFeed()
        
        self.assertEqual(feed.link(request), '/')

    def test_latest_articles_feed_description(self):
        """Test LatestArticlesFeed description"""
        request = self.factory.get('/rss/')
        feed = LatestArticlesFeed()
        
        self.assertEqual(feed.description(request), 'Latest articles from Dhivehinoos.net')

    def test_latest_articles_feed_items(self):
        """Test LatestArticlesFeed items"""
        request = self.factory.get('/rss/')
        feed = LatestArticlesFeed()
        
        items = feed.items(request)
        
        # Should only return published articles
        self.assertEqual(len(items), 2)
        self.assertIn(self.article1, items)
        self.assertIn(self.article2, items)
        self.assertNotIn(self.draft_article, items)

    def test_latest_articles_feed_item_title(self):
        """Test LatestArticlesFeed item title"""
        request = self.factory.get('/rss/')
        feed = LatestArticlesFeed()
        
        title = feed.item_title(self.article1)
        self.assertEqual(title, 'Test Article 1')

    def test_latest_articles_feed_item_description(self):
        """Test LatestArticlesFeed item description"""
        request = self.factory.get('/rss/')
        feed = LatestArticlesFeed()
        
        description = feed.item_description(self.article1)
        self.assertEqual(description, 'This is test article 1 content')

    def test_latest_articles_feed_item_pubdate(self):
        """Test LatestArticlesFeed item pubdate"""
        request = self.factory.get('/rss/')
        feed = LatestArticlesFeed()
        
        pubdate = feed.item_pubdate(self.article1)
        self.assertEqual(pubdate, self.article1.published_at)

    def test_latest_articles_feed_item_updateddate(self):
        """Test LatestArticlesFeed item updateddate"""
        request = self.factory.get('/rss/')
        feed = LatestArticlesFeed()
        
        updateddate = feed.item_updateddate(self.article1)
        self.assertEqual(updateddate, self.article1.updated_at)

    def test_latest_articles_feed_item_enclosure(self):
        """Test LatestArticlesFeed item enclosure"""
        request = self.factory.get('/rss/')
        feed = LatestArticlesFeed()
        
        # Test with article that has image
        self.article1.image = 'https://example.com/image.jpg'
        self.article1.save()
        
        enclosure = feed.item_enclosure(self.article1)
        self.assertIsNotNone(enclosure)
        self.assertEqual(enclosure.url, 'https://example.com/image.jpg')
        self.assertEqual(enclosure.length, 0)  # Length not available for external URLs
        self.assertEqual(enclosure.mime_type, 'image/jpeg')

    def test_latest_articles_feed_item_enclosure_no_image(self):
        """Test LatestArticlesFeed item enclosure with no image"""
        request = self.factory.get('/rss/')
        feed = LatestArticlesFeed()
        
        enclosure = feed.item_enclosure(self.article1)
        self.assertIsNone(enclosure)


class AtomFeedTest(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        
        # Create test category
        self.category = Category.objects.create(
            name='Test Category',
            slug='test-category',
            description='Test category description'
        )
        
        # Create test article
        self.article = Article.objects.create(
            title='Test Article',
            slug='test-article',
            content='This is test article content',
            category=self.category,
            status='published',
            published_at=timezone.now() - timedelta(hours=1)
        )

    def test_atom_latest_articles_feed_title(self):
        """Test AtomLatestArticlesFeed title"""
        request = self.factory.get('/atom/')
        feed = AtomLatestArticlesFeed()
        
        self.assertEqual(feed.title(request), 'Latest Articles - Dhivehinoos.net')

    def test_atom_latest_articles_feed_link(self):
        """Test AtomLatestArticlesFeed link"""
        request = self.factory.get('/atom/')
        feed = AtomLatestArticlesFeed()
        
        self.assertEqual(feed.link(request), '/')

    def test_atom_latest_articles_feed_description(self):
        """Test AtomLatestArticlesFeed description"""
        request = self.factory.get('/atom/')
        feed = AtomLatestArticlesFeed()
        
        self.assertEqual(feed.description(request), 'Latest articles from Dhivehinoos.net')

    def test_atom_latest_articles_feed_items(self):
        """Test AtomLatestArticlesFeed items"""
        request = self.factory.get('/atom/')
        feed = AtomLatestArticlesFeed()
        
        items = feed.items(request)
        
        # Should only return published articles
        self.assertEqual(len(items), 1)
        self.assertIn(self.article, items)


class CategoryFeedTest(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        
        # Create test categories
        self.category1 = Category.objects.create(
            name='Category 1',
            slug='category-1',
            description='Category 1 description'
        )
        
        self.category2 = Category.objects.create(
            name='Category 2',
            slug='category-2',
            description='Category 2 description'
        )
        
        # Create test articles
        self.article1 = Article.objects.create(
            title='Article in Category 1',
            slug='article-category-1',
            content='This is article in category 1',
            category=self.category1,
            status='published',
            published_at=timezone.now() - timedelta(hours=1)
        )
        
        self.article2 = Article.objects.create(
            title='Article in Category 2',
            slug='article-category-2',
            content='This is article in category 2',
            category=self.category2,
            status='published',
            published_at=timezone.now() - timedelta(hours=1)
        )

    def test_category_feed_title(self):
        """Test CategoryFeed title"""
        request = self.factory.get('/rss/category/category-1/')
        feed = CategoryFeed()
        
        title = feed.title(request)
        self.assertEqual(title, f'Articles in {self.category1.name} - Dhivehinoos.net')

    def test_category_feed_link(self):
        """Test CategoryFeed link"""
        request = self.factory.get('/rss/category/category-1/')
        feed = CategoryFeed()
        
        link = feed.link(request)
        self.assertEqual(link, f'/category/{self.category1.slug}/')

    def test_category_feed_description(self):
        """Test CategoryFeed description"""
        request = self.factory.get('/rss/category/category-1/')
        feed = CategoryFeed()
        
        description = feed.description(request)
        self.assertEqual(description, f'Latest articles in {self.category1.name}')

    def test_category_feed_items(self):
        """Test CategoryFeed items"""
        request = self.factory.get('/rss/category/category-1/')
        feed = CategoryFeed()
        
        items = feed.items(request)
        
        # Should only return articles from category 1
        self.assertEqual(len(items), 1)
        self.assertIn(self.article1, items)
        self.assertNotIn(self.article2, items)

    def test_category_feed_items_different_category(self):
        """Test CategoryFeed items for different category"""
        request = self.factory.get('/rss/category/category-2/')
        feed = CategoryFeed()
        
        items = feed.items(request)
        
        # Should only return articles from category 2
        self.assertEqual(len(items), 1)
        self.assertIn(self.article2, items)
        self.assertNotIn(self.article1, items)


class SearchFeedTest(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        
        # Create test category
        self.category = Category.objects.create(
            name='Test Category',
            slug='test-category',
            description='Test category description'
        )
        
        # Create test articles
        self.article1 = Article.objects.create(
            title='Python Programming Article',
            slug='python-article',
            content='This is about Python programming',
            category=self.category,
            status='published',
            published_at=timezone.now() - timedelta(hours=1)
        )
        
        self.article2 = Article.objects.create(
            title='JavaScript Tutorial',
            slug='javascript-article',
            content='This is about JavaScript development',
            category=self.category,
            status='published',
            published_at=timezone.now() - timedelta(hours=1)
        )
        
        self.article3 = Article.objects.create(
            title='Django Web Framework',
            slug='django-article',
            content='This is about Django web framework',
            category=self.category,
            status='published',
            published_at=timezone.now() - timedelta(hours=1)
        )

    def test_search_feed_title(self):
        """Test SearchFeed title"""
        request = self.factory.get('/rss/search/?q=python')
        feed = SearchFeed()
        
        title = feed.title(request)
        self.assertEqual(title, 'Search Results for "python" - Dhivehinoos.net')

    def test_search_feed_link(self):
        """Test SearchFeed link"""
        request = self.factory.get('/rss/search/?q=python')
        feed = SearchFeed()
        
        link = feed.link(request)
        self.assertEqual(link, '/search/?q=python')

    def test_search_feed_description(self):
        """Test SearchFeed description"""
        request = self.factory.get('/rss/search/?q=python')
        feed = SearchFeed()
        
        description = feed.description(request)
        self.assertEqual(description, 'Search results for "python"')

    def test_search_feed_items(self):
        """Test SearchFeed items"""
        request = self.factory.get('/rss/search/?q=python')
        feed = SearchFeed()
        
        items = feed.items(request)
        
        # Should return articles matching "python"
        self.assertEqual(len(items), 1)
        self.assertIn(self.article1, items)
        self.assertNotIn(self.article2, items)
        self.assertNotIn(self.article3, items)

    def test_search_feed_items_multiple_matches(self):
        """Test SearchFeed items with multiple matches"""
        request = self.factory.get('/rss/search/?q=programming')
        feed = SearchFeed()
        
        items = feed.items(request)
        
        # Should return articles matching "programming"
        self.assertEqual(len(items), 1)
        self.assertIn(self.article1, items)

    def test_search_feed_items_no_matches(self):
        """Test SearchFeed items with no matches"""
        request = self.factory.get('/rss/search/?q=nonexistent')
        feed = SearchFeed()
        
        items = feed.items(request)
        
        # Should return no articles
        self.assertEqual(len(items), 0)

    def test_search_feed_items_case_insensitive(self):
        """Test SearchFeed items case insensitive search"""
        request = self.factory.get('/rss/search/?q=PYTHON')
        feed = SearchFeed()
        
        items = feed.items(request)
        
        # Should return articles matching "PYTHON" (case insensitive)
        self.assertEqual(len(items), 1)
        self.assertIn(self.article1, items)


class FeedIntegrationTest(TestCase):
    """Integration tests for RSS/Atom feeds"""
    
    def setUp(self):
        self.factory = RequestFactory()
        
        # Create test category
        self.category = Category.objects.create(
            name='Test Category',
            slug='test-category',
            description='Test category description'
        )
        
        # Create test articles
        self.article1 = Article.objects.create(
            title='Test Article 1',
            slug='test-article-1',
            content='This is test article 1 content',
            category=self.category,
            status='published',
            published_at=timezone.now() - timedelta(hours=2)
        )
        
        self.article2 = Article.objects.create(
            title='Test Article 2',
            slug='test-article-2',
            content='This is test article 2 content',
            category=self.category,
            status='published',
            published_at=timezone.now() - timedelta(hours=1)
        )

    def test_feed_urls(self):
        """Test that feed URLs are accessible"""
        from django.test import Client
        client = Client()
        
        # Test RSS feed
        response = client.get('/api/v1/articles/rss/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'], 'application/rss+xml; charset=utf-8')
        
        # Test Atom feed
        response = client.get('/api/v1/articles/atom/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'], 'application/atom+xml; charset=utf-8')
        
        # Test category feed
        response = client.get('/api/v1/articles/rss/category/test-category/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'], 'application/rss+xml; charset=utf-8')
        
        # Test search feed
        response = client.get('/api/v1/articles/rss/search/?q=test')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'], 'application/rss+xml; charset=utf-8')

    def test_feed_xml_structure(self):
        """Test that feed XML has correct structure"""
        from django.test import Client
        client = Client()
        
        response = client.get('/api/v1/articles/rss/')
        self.assertEqual(response.status_code, 200)
        
        # Parse XML
        root = ET.fromstring(response.content)
        
        # Check RSS structure
        self.assertEqual(root.tag, 'rss')
        self.assertEqual(root.get('version'), '2.0')
        
        # Check channel
        channel = root.find('channel')
        self.assertIsNotNone(channel)
        
        # Check required elements
        title = channel.find('title')
        self.assertIsNotNone(title)
        self.assertEqual(title.text, 'Latest Articles - Dhivehinoos.net')
        
        link = channel.find('link')
        self.assertIsNotNone(link)
        self.assertEqual(link.text, '/')
        
        description = channel.find('description')
        self.assertIsNotNone(description)
        self.assertEqual(description.text, 'Latest articles from Dhivehinoos.net')
        
        # Check items
        items = channel.findall('item')
        self.assertEqual(len(items), 2)

    def test_feed_items_content(self):
        """Test that feed items have correct content"""
        from django.test import Client
        client = Client()
        
        response = client.get('/api/v1/articles/rss/')
        self.assertEqual(response.status_code, 200)
        
        # Parse XML
        root = ET.fromstring(response.content)
        channel = root.find('channel')
        items = channel.findall('item')
        
        # Check first item
        item1 = items[0]
        
        title = item1.find('title')
        self.assertIsNotNone(title)
        self.assertEqual(title.text, 'Test Article 2')  # Most recent first
        
        link = item1.find('link')
        self.assertIsNotNone(link)
        self.assertIn('test-article-2', link.text)
        
        description = item1.find('description')
        self.assertIsNotNone(description)
        self.assertEqual(description.text, 'This is test article 2 content')
        
        pubDate = item1.find('pubDate')
        self.assertIsNotNone(pubDate)

    def test_category_feed_filtering(self):
        """Test that category feed filters correctly"""
        from django.test import Client
        client = Client()
        
        response = client.get('/api/v1/articles/rss/category/test-category/')
        self.assertEqual(response.status_code, 200)
        
        # Parse XML
        root = ET.fromstring(response.content)
        channel = root.find('channel')
        items = channel.findall('item')
        
        # Should have 2 items
        self.assertEqual(len(items), 2)
        
        # Check that all items are from the correct category
        for item in items:
            link = item.find('link')
            self.assertIn('test-article', link.text)

    def test_search_feed_filtering(self):
        """Test that search feed filters correctly"""
        from django.test import Client
        client = Client()
        
        response = client.get('/api/v1/articles/rss/search/?q=article')
        self.assertEqual(response.status_code, 200)
        
        # Parse XML
        root = ET.fromstring(response.content)
        channel = root.find('channel')
        items = channel.findall('item')
        
        # Should have 2 items (both contain "article")
        self.assertEqual(len(items), 2)
        
        # Check that all items match the search term
        for item in items:
            title = item.find('title')
            self.assertIn('Article', title.text)
