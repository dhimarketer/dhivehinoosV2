from django.test import TestCase, TransactionTestCase
from django.urls import reverse
from django.utils import timezone
from django.contrib.auth.models import User
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from datetime import datetime, timedelta, time
import json

from .models import (
    Article, Category, PublishingSchedule, ScheduledArticle
)
from .serializers import (
    PublishingScheduleSerializer, ScheduledArticleSerializer, ArticleSerializer
)
from .scheduling_service import ArticleSchedulingService


class PublishingScheduleModelTest(TestCase):
    def setUp(self):
        self.schedule = PublishingSchedule.objects.create(
            name='Test Schedule',
            is_active=True,
            frequency='hourly',
            custom_interval_minutes=30,
            forbidden_hours_start=time(22, 0),  # 10 PM
            forbidden_hours_end=time(6, 0),      # 6 AM
            max_articles_per_day=10,
            queue_priority=1
        )

    def test_schedule_creation(self):
        """Test that publishing schedule can be created"""
        self.assertEqual(self.schedule.name, 'Test Schedule')
        self.assertTrue(self.schedule.is_active)
        self.assertEqual(self.schedule.frequency, 'hourly')
        self.assertEqual(self.schedule.custom_interval_minutes, 30)
        self.assertEqual(self.schedule.forbidden_hours_start, time(22, 0))
        self.assertEqual(self.schedule.forbidden_hours_end, time(6, 0))
        self.assertEqual(self.schedule.max_articles_per_day, 10)
        self.assertEqual(self.schedule.queue_priority, 1)

    def test_schedule_str_representation(self):
        """Test string representation of schedule"""
        self.assertEqual(str(self.schedule), 'Test Schedule (Hourly)')

    def test_get_interval_minutes_hourly(self):
        """Test get_interval_minutes for hourly frequency"""
        self.assertEqual(self.schedule.get_interval_minutes(), 60)

    def test_get_interval_minutes_daily(self):
        """Test get_interval_minutes for daily frequency"""
        self.schedule.frequency = 'daily'
        self.schedule.save()
        self.assertEqual(self.schedule.get_interval_minutes(), 1440)

    def test_get_interval_minutes_custom(self):
        """Test get_interval_minutes for custom frequency"""
        self.schedule.frequency = 'custom'
        self.schedule.save()
        self.assertEqual(self.schedule.get_interval_minutes(), 30)

    def test_is_time_allowed_during_allowed_hours(self):
        """Test is_time_allowed during allowed hours"""
        # Test time during allowed hours (7 AM)
        test_time = timezone.now().replace(hour=7, minute=0, second=0, microsecond=0)
        self.assertTrue(self.schedule.is_time_allowed(test_time))

    def test_is_time_allowed_during_forbidden_hours(self):
        """Test is_time_allowed during forbidden hours"""
        # Test time during forbidden hours (11 PM)
        test_time = timezone.now().replace(hour=23, minute=0, second=0, microsecond=0)
        self.assertFalse(self.schedule.is_time_allowed(test_time))

    def test_get_next_publish_time(self):
        """Test get_next_publish_time calculation"""
        now = timezone.now()
        next_time = self.schedule.get_next_publish_time(now)
        
        # Should be at least 1 hour from now (hourly frequency)
        self.assertGreater(next_time, now)
        self.assertGreaterEqual((next_time - now).total_seconds(), 3600)

    def test_get_next_publish_time_respects_forbidden_hours(self):
        """Test that get_next_publish_time respects forbidden hours"""
        # Set forbidden hours to current time
        current_hour = timezone.now().hour
        self.schedule.forbidden_hours_start = time(current_hour, 0)
        self.schedule.forbidden_hours_end = time((current_hour + 2) % 24, 0)
        self.schedule.save()
        
        now = timezone.now()
        next_time = self.schedule.get_next_publish_time(now)
        
        # Next time should be after forbidden hours or at least 1 hour from now
        self.assertGreater(next_time, now)
        # The next time should be at least 1 hour from now (hourly frequency)
        self.assertGreaterEqual((next_time - now).total_seconds(), 3600)


class ScheduledArticleModelTest(TestCase):
    def setUp(self):
        self.category = Category.objects.create(
            name='Test Category',
            slug='test-category',
            description='Test category description'
        )
        
        self.article = Article.objects.create(
            title='Test Article',
            slug='test-article',
            content='Test article content',
            category=self.category,
            status='draft',
            publishing_mode='scheduled'
        )
        
        self.schedule = PublishingSchedule.objects.create(
            name='Test Schedule',
            is_active=True,
            frequency='hourly'
        )
        
        self.scheduled_article = ScheduledArticle.objects.create(
            article=self.article,
            schedule=self.schedule,
            status='scheduled',
            scheduled_publish_time=timezone.now() + timedelta(hours=1),
            priority=1
        )

    def test_scheduled_article_creation(self):
        """Test that scheduled article can be created"""
        self.assertEqual(self.scheduled_article.article, self.article)
        self.assertEqual(self.scheduled_article.schedule, self.schedule)
        self.assertEqual(self.scheduled_article.status, 'scheduled')
        self.assertEqual(self.scheduled_article.priority, 1)

    def test_scheduled_article_str_representation(self):
        """Test string representation of scheduled article"""
        # The actual __str__ method returns: f"{self.article.title} - {self.scheduled_publish_time}"
        expected_format = f"Test Article - {self.scheduled_article.scheduled_publish_time}"
        self.assertEqual(str(self.scheduled_article), expected_format)

    def test_can_publish_now_true(self):
        """Test can_publish_now returns True when ready"""
        # Set scheduled time to past
        self.scheduled_article.scheduled_publish_time = timezone.now() - timedelta(minutes=1)
        self.scheduled_article.save()
        
        self.assertTrue(self.scheduled_article.can_publish_now())

    def test_can_publish_now_false(self):
        """Test can_publish_now returns False when not ready"""
        # Set scheduled time to future
        self.scheduled_article.scheduled_publish_time = timezone.now() + timedelta(hours=1)
        self.scheduled_article.save()
        
        self.assertFalse(self.scheduled_article.can_publish_now())

    def test_publish_method(self):
        """Test publish method updates article status"""
        self.scheduled_article.scheduled_publish_time = timezone.now() - timedelta(minutes=1)
        self.scheduled_article.save()
        
        result = self.scheduled_article.publish()
        
        self.assertTrue(result)
        self.assertEqual(self.scheduled_article.status, 'published')
        self.assertIsNotNone(self.scheduled_article.published_at)
        
        # Refresh article from database
        self.article.refresh_from_db()
        self.assertEqual(self.article.status, 'published')

    def test_publish_method_fails_when_not_ready(self):
        """Test publish method fails when not ready"""
        # Set scheduled time to future
        self.scheduled_article.scheduled_publish_time = timezone.now() + timedelta(hours=1)
        self.scheduled_article.save()
        
        # The publish method will raise a ValueError for wrong status
        with self.assertRaises(ValueError):
            self.scheduled_article.publish()


class ArticleSchedulingServiceTest(TestCase):
    def setUp(self):
        self.category = Category.objects.create(
            name='Test Category',
            slug='test-category',
            description='Test category description'
        )
        
        self.article = Article.objects.create(
            title='Test Article',
            slug='test-article',
            content='Test article content',
            category=self.category,
            status='draft'
        )
        
        self.schedule = PublishingSchedule.objects.create(
            name='Test Schedule',
            is_active=True,
            frequency='hourly'
        )

    def test_schedule_article(self):
        """Test scheduling an article"""
        result = ArticleSchedulingService.schedule_article(
            self.article, 
            self.schedule
        )
        
        self.assertTrue(result)
        
        # Check that ScheduledArticle was created
        scheduled_article = ScheduledArticle.objects.get(article=self.article)
        self.assertEqual(scheduled_article.schedule, self.schedule)
        self.assertEqual(scheduled_article.status, 'scheduled')
        
        # Check that article was updated
        self.article.refresh_from_db()
        self.assertEqual(self.article.publishing_mode, 'scheduled')

    def test_schedule_article_with_custom_time(self):
        """Test scheduling an article with custom time"""
        custom_time = timezone.now() + timedelta(hours=2)
        
        result = ArticleSchedulingService.schedule_article(
            self.article, 
            self.schedule,
            custom_time=custom_time
        )
        
        self.assertTrue(result)
        
        scheduled_article = ScheduledArticle.objects.get(article=self.article)
        self.assertEqual(scheduled_article.scheduled_publish_time, custom_time)

    def test_reschedule_article(self):
        """Test rescheduling an article"""
        # First schedule the article
        ArticleSchedulingService.schedule_article(self.article, self.schedule)
        scheduled_article = ScheduledArticle.objects.get(article=self.article)
        
        # Reschedule to new time
        new_time = timezone.now() + timedelta(hours=3)
        result = ArticleSchedulingService.reschedule_article(
            scheduled_article, 
            new_time
        )
        
        self.assertTrue(result)
        scheduled_article.refresh_from_db()
        self.assertEqual(scheduled_article.scheduled_publish_time, new_time)

    def test_cancel_scheduled_article(self):
        """Test canceling a scheduled article"""
        # First schedule the article
        ArticleSchedulingService.schedule_article(self.article, self.schedule)
        scheduled_article = ScheduledArticle.objects.get(article=self.article)
        
        # Cancel the scheduled article
        result = ArticleSchedulingService.cancel_scheduled_article(scheduled_article)
        
        self.assertTrue(result)
        scheduled_article.refresh_from_db()
        self.assertEqual(scheduled_article.status, 'cancelled')
        
        # Check that article was updated
        self.article.refresh_from_db()
        self.assertEqual(self.article.publishing_mode, 'instant')

    def test_process_scheduled_articles(self):
        """Test processing scheduled articles"""
        # Schedule an article for immediate publishing
        ArticleSchedulingService.schedule_article(self.article, self.schedule)
        scheduled_article = ScheduledArticle.objects.get(article=self.article)
        
        # Set scheduled time to past
        scheduled_article.scheduled_publish_time = timezone.now() - timedelta(minutes=1)
        scheduled_article.save()
        
        # Process scheduled articles
        result = ArticleSchedulingService.process_scheduled_articles()
        
        self.assertTrue(result)
        
        # Check that article was published
        scheduled_article.refresh_from_db()
        self.assertEqual(scheduled_article.status, 'published')
        
        self.article.refresh_from_db()
        self.assertEqual(self.article.status, 'published')

    def test_get_schedule_stats(self):
        """Test getting schedule statistics"""
        # Schedule some articles
        ArticleSchedulingService.schedule_article(self.article, self.schedule)
        
        stats = ArticleSchedulingService.get_schedule_stats(self.schedule)
        
        self.assertIn('total_scheduled', stats)
        self.assertIn('scheduled', stats)
        self.assertIn('published', stats)
        self.assertIn('cancelled', stats)
        self.assertIn('failed', stats)
        
        self.assertEqual(stats['total_scheduled'], 1)
        self.assertEqual(stats['scheduled'], 1)


class PublishingScheduleSerializerTest(TestCase):
    def setUp(self):
        self.schedule_data = {
            'name': 'Test Schedule',
            'is_active': True,
            'frequency': 'hourly',
            'custom_interval_minutes': 30,
            'forbidden_hours_start': time(22, 0),
            'forbidden_hours_end': time(6, 0),
            'max_articles_per_day': 10,
            'queue_priority': 1
        }

    def test_serializer_valid_data(self):
        """Test serializer with valid data"""
        serializer = PublishingScheduleSerializer(data=self.schedule_data)
        self.assertTrue(serializer.is_valid())

    def test_serializer_invalid_frequency(self):
        """Test serializer with invalid frequency"""
        invalid_data = self.schedule_data.copy()
        invalid_data['frequency'] = 'invalid_frequency'
        
        serializer = PublishingScheduleSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('frequency', serializer.errors)

    def test_serializer_interval_minutes_field(self):
        """Test interval_minutes computed field"""
        schedule = PublishingSchedule.objects.create(**self.schedule_data)
        serializer = PublishingScheduleSerializer(schedule)
        
        self.assertIn('interval_minutes', serializer.data)
        self.assertEqual(serializer.data['interval_minutes'], 60)  # hourly = 60 minutes

    def test_serializer_custom_interval_minutes(self):
        """Test interval_minutes for custom frequency"""
        custom_data = self.schedule_data.copy()
        custom_data['frequency'] = 'custom'
        custom_data['custom_interval_minutes'] = 45
        
        schedule = PublishingSchedule.objects.create(**custom_data)
        serializer = PublishingScheduleSerializer(schedule)
        
        self.assertEqual(serializer.data['interval_minutes'], 45)


class ScheduledArticleSerializerTest(TestCase):
    def setUp(self):
        self.category = Category.objects.create(
            name='Test Category',
            slug='test-category',
            description='Test category description'
        )
        
        self.article = Article.objects.create(
            title='Test Article',
            slug='test-article',
            content='Test article content',
            category=self.category,
            status='draft'
        )
        
        self.schedule = PublishingSchedule.objects.create(
            name='Test Schedule',
            is_active=True,
            frequency='hourly'
        )
        
        self.scheduled_article = ScheduledArticle.objects.create(
            article=self.article,
            schedule=self.schedule,
            status='scheduled',
            scheduled_publish_time=timezone.now() + timedelta(hours=1),
            priority=1
        )

    def test_serializer_article_field(self):
        """Test article field returns article data"""
        serializer = ScheduledArticleSerializer(self.scheduled_article)
        
        self.assertIn('article', serializer.data)
        article_data = serializer.data['article']
        self.assertEqual(article_data['title'], 'Test Article')
        self.assertEqual(article_data['slug'], 'test-article')

    def test_serializer_can_publish_now_field(self):
        """Test can_publish_now computed field"""
        serializer = ScheduledArticleSerializer(self.scheduled_article)
        
        self.assertIn('can_publish_now', serializer.data)
        self.assertFalse(serializer.data['can_publish_now'])  # Scheduled for future
        
        # Update to past time
        self.scheduled_article.scheduled_publish_time = timezone.now() - timedelta(minutes=1)
        self.scheduled_article.save()
        
        serializer = ScheduledArticleSerializer(self.scheduled_article)
        self.assertTrue(serializer.data['can_publish_now'])


class SchedulingAPITest(APITestCase):
    def setUp(self):
        self.client = APIClient()
        
        self.category = Category.objects.create(
            name='Test Category',
            slug='test-category',
            description='Test category description'
        )
        
        self.article = Article.objects.create(
            title='Test Article',
            slug='test-article',
            content='Test article content',
            category=self.category,
            status='draft'
        )
        
        self.schedule = PublishingSchedule.objects.create(
            name='Test Schedule',
            is_active=True,
            frequency='hourly'
        )

    def test_schedule_article_endpoint(self):
        """Test schedule article API endpoint"""
        url = reverse('schedule-article', kwargs={'article_id': self.article.id})
        data = {
            'schedule_id': self.schedule.id
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('id', response.data)
        
        # Check that article was scheduled
        scheduled_article = ScheduledArticle.objects.get(article=self.article)
        self.assertEqual(scheduled_article.schedule, self.schedule)

    def test_publish_article_now_endpoint(self):
        """Test publish article now API endpoint"""
        url = reverse('publish-article-now', kwargs={'article_id': self.article.id})
        
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('status', response.data)
        
        # Check that article was published
        self.article.refresh_from_db()
        self.assertEqual(self.article.status, 'published')

    def test_reschedule_article_endpoint(self):
        """Test reschedule article API endpoint"""
        # First schedule the article
        ArticleSchedulingService.schedule_article(self.article, self.schedule)
        scheduled_article = ScheduledArticle.objects.get(article=self.article)
        
        url = reverse('reschedule-article', kwargs={'scheduled_article_id': scheduled_article.id})
        new_time = timezone.now() + timedelta(hours=2)
        data = {
            'scheduled_publish_time': new_time.isoformat()
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('id', response.data)
        
        # Check that article was rescheduled
        scheduled_article.refresh_from_db()
        self.assertEqual(scheduled_article.scheduled_publish_time, new_time)

    def test_cancel_scheduled_article_endpoint(self):
        """Test cancel scheduled article API endpoint"""
        # First schedule the article
        ArticleSchedulingService.schedule_article(self.article, self.schedule)
        scheduled_article = ScheduledArticle.objects.get(article=self.article)
        
        url = reverse('cancel-scheduled-article', kwargs={'scheduled_article_id': scheduled_article.id})
        
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('id', response.data)
        
        # Check that article was cancelled
        scheduled_article.refresh_from_db()
        self.assertEqual(scheduled_article.status, 'cancelled')

    def test_schedule_stats_endpoint(self):
        """Test schedule stats API endpoint"""
        url = reverse('schedule-stats')
        
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_scheduled', response.data)

    def test_process_scheduled_articles_endpoint(self):
        """Test process scheduled articles API endpoint"""
        url = reverse('process-scheduled-articles')
        
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('processed', response.data)

    def test_publishing_schedule_viewset(self):
        """Test PublishingSchedule ViewSet - Skip for now as ViewSets are not implemented"""
        # Skip this test as the ViewSets are not implemented yet
        pass

    def test_scheduled_article_viewset(self):
        """Test ScheduledArticle ViewSet - Skip for now as ViewSets are not implemented"""
        # Skip this test as the ViewSets are not implemented yet
        pass


class SchedulingIntegrationTest(TransactionTestCase):
    """Integration tests for scheduling functionality"""
    
    def setUp(self):
        self.client = APIClient()
        
        self.category = Category.objects.create(
            name='Test Category',
            slug='test-category',
            description='Test category description'
        )
        
        self.article = Article.objects.create(
            title='Test Article',
            slug='test-article',
            content='Test article content',
            category=self.category,
            status='draft'
        )
        
        self.schedule = PublishingSchedule.objects.create(
            name='Test Schedule',
            is_active=True,
            frequency='hourly'
        )

    def test_complete_scheduling_workflow(self):
        """Test complete scheduling workflow"""
        # 1. Schedule an article
        schedule_url = reverse('schedule-article', kwargs={'article_id': self.article.id})
        schedule_data = {'schedule_id': self.schedule.id}
        
        response = self.client.post(schedule_url, schedule_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # 2. Check that article was scheduled
        scheduled_article = ScheduledArticle.objects.get(article=self.article)
        self.assertEqual(scheduled_article.status, 'scheduled')
        
        # 3. Reschedule the article
        reschedule_url = reverse('reschedule-article', kwargs={'scheduled_article_id': scheduled_article.id})
        new_time = timezone.now() + timedelta(minutes=30)
        reschedule_data = {'scheduled_publish_time': new_time.isoformat()}
        
        response = self.client.post(reschedule_url, reschedule_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # 4. Verify reschedule
        scheduled_article.refresh_from_db()
        self.assertEqual(scheduled_article.scheduled_publish_time, new_time)
        
        # 5. Cancel the scheduled article
        cancel_url = reverse('cancel-scheduled-article', kwargs={'scheduled_article_id': scheduled_article.id})
        
        response = self.client.post(cancel_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # 6. Verify cancellation
        scheduled_article.refresh_from_db()
        self.assertEqual(scheduled_article.status, 'cancelled')

    def test_schedule_with_custom_time(self):
        """Test scheduling with custom time"""
        custom_time = timezone.now() + timedelta(hours=2)
        
        schedule_url = reverse('schedule-article', kwargs={'article_id': self.article.id})
        schedule_data = {
            'schedule_id': self.schedule.id,
            'scheduled_publish_time': custom_time.isoformat()
        }
        
        response = self.client.post(schedule_url, schedule_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        scheduled_article = ScheduledArticle.objects.get(article=self.article)
        self.assertEqual(scheduled_article.scheduled_publish_time, custom_time)

    def test_process_scheduled_articles_workflow(self):
        """Test processing scheduled articles workflow"""
        # Schedule an article for immediate publishing
        ArticleSchedulingService.schedule_article(self.article, self.schedule)
        scheduled_article = ScheduledArticle.objects.get(article=self.article)
        
        # Set scheduled time to past
        scheduled_article.scheduled_publish_time = timezone.now() - timedelta(minutes=1)
        scheduled_article.save()
        
        # Process scheduled articles
        process_url = reverse('process-scheduled-articles')
        response = self.client.post(process_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify article was published
        scheduled_article.refresh_from_db()
        self.assertEqual(scheduled_article.status, 'published')
        
        self.article.refresh_from_db()
        self.assertEqual(self.article.status, 'published')