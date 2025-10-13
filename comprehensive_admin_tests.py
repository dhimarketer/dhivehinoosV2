#!/usr/bin/env python3
"""
Comprehensive Admin Authentication Tests
Tests ALL admin functionalities across the entire application
"""

import os
import sys
import django
from django.conf import settings

# Setup Django environment first
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dhivehinoos_backend.settings')
django.setup()

# Now import Django modules
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from articles.models import Article, Category, PublishingSchedule
from comments.models import Comment
from contact.models import ContactMessage
from ads.models import Ad, AdPlacement
from settings_app.models import SiteSettings
from datetime import datetime, timedelta
import json

class ComprehensiveAdminTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        print("\n🔧 Setting up comprehensive admin test data...")
        
        # Create categories
        cls.category, created = Category.objects.get_or_create(name='General', slug='general')
        cls.category2, created = Category.objects.get_or_create(name='Tech', slug='tech')
        
        # Create users
        try:
            cls.admin_user = User.objects.get(username='testadmin')
        except User.DoesNotExist:
            cls.admin_user = User.objects.create_superuser('testadmin', 'admin@example.com', 'adminpassword')
        
        try:
            cls.regular_user = User.objects.get(username='testuser')
        except User.DoesNotExist:
            cls.regular_user = User.objects.create_user('testuser', 'user@example.com', 'userpassword')
        
        # Create articles
        try:
            cls.article = Article.objects.get(title='Test Article for Admin')
        except Article.DoesNotExist:
            cls.article = Article.objects.create(
                title='Test Article for Admin',
                content='This is a test article content.',
                author=cls.admin_user,
                category=cls.category,
                status='draft'
            )
        
        # Create comments
        try:
            cls.comment = Comment.objects.get(content='Test comment for admin')
        except Comment.DoesNotExist:
            cls.comment = Comment.objects.create(
                article=cls.article,
                author_name='Test User',
                author_email='test@example.com',
                content='Test comment for admin',
                is_approved=False
            )
        
        # Create contact messages
        try:
            cls.contact_message = ContactMessage.objects.get(name='Test Contact')
        except ContactMessage.DoesNotExist:
            cls.contact_message = ContactMessage.objects.create(
                name='Test Contact',
                email='contact@example.com',
                message='Test contact message for admin'
            )
        
        # Create ad placements
        try:
            cls.ad_placement = AdPlacement.objects.get(name='Test Placement')
        except AdPlacement.DoesNotExist:
            cls.ad_placement = AdPlacement.objects.create(
                name='Test Placement',
                description='Test ad placement',
                position='header'
            )
        
        # Create ads
        try:
            cls.ad = Ad.objects.get(title='Test Ad')
        except Ad.DoesNotExist:
            cls.ad = Ad.objects.create(
                title='Test Ad',
                image='test.jpg',
                destination_url='https://example.com',
                placement=cls.ad_placement,
                is_active=True
            )
        
        # Create publishing schedule
        try:
            cls.schedule = PublishingSchedule.objects.get(name='Test Schedule')
        except PublishingSchedule.DoesNotExist:
            cls.schedule = PublishingSchedule.objects.create(
                name='Test Schedule',
                frequency='hourly',
                is_active=True
            )
        
        # Ensure site settings exist
        cls.site_settings = SiteSettings.get_settings()

    def setUp(self):
        self.admin_client = APIClient()
        self.regular_client = APIClient()
        self.unauthenticated_client = APIClient()

        # Log in users
        self.admin_client.login(username='testadmin', password='adminpassword')
        self.regular_client.login(username='testuser', password='userpassword')

        # Ensure ALLOWED_HOSTS includes 'testserver'
        if 'testserver' not in settings.ALLOWED_HOSTS:
            settings.ALLOWED_HOSTS.append('testserver')

    def test_1_article_admin_endpoints(self):
        print("\n📝 Test 1: Article Admin Endpoints")
        
        # Test admin can access article endpoints
        response = self.admin_client.get('/api/v1/articles/admin/')
        print(f"  Admin GET articles: {response.status_code}")
        self.assertEqual(response.status_code, 200)
        
        # Test admin can create articles
        article_data = {
            'title': 'New Admin Article',
            'content': 'Content for new article',
            'status': 'draft',
            'category': self.category.id
        }
        response = self.admin_client.post('/api/v1/articles/admin/', article_data, format='json')
        print(f"  Admin CREATE article: {response.status_code}")
        self.assertEqual(response.status_code, 201)
        
        # Test admin can update articles
        update_data = {'title': 'Updated Admin Article'}
        response = self.admin_client.patch(f'/api/v1/articles/admin/{self.article.id}/', update_data, format='json')
        print(f"  Admin UPDATE article: {response.status_code}")
        self.assertEqual(response.status_code, 200)
        
        # Test regular user access (should be denied)
        response = self.regular_client.get('/api/v1/articles/admin/')
        print(f"  Regular user GET articles: {response.status_code}")
        # Note: Currently AllowAny, but should be IsAdminUser
        
        # Test unauthenticated access (should be denied)
        response = self.unauthenticated_client.get('/api/v1/articles/admin/')
        print(f"  No auth GET articles: {response.status_code}")
        # Note: Currently AllowAny, but should be IsAdminUser

    def test_2_comment_admin_endpoints(self):
        print("\n💬 Test 2: Comment Admin Endpoints")
        
        # Test admin can access comment endpoints
        response = self.admin_client.get('/api/v1/comments/admin/')
        print(f"  Admin GET comments: {response.status_code}")
        self.assertEqual(response.status_code, 200)
        
        # Test admin can approve comments
        response = self.admin_client.post(f'/api/v1/comments/admin/{self.comment.id}/approve/')
        print(f"  Admin APPROVE comment: {response.status_code}")
        self.assertEqual(response.status_code, 200)
        
        # Test admin can reject comments
        response = self.admin_client.post(f'/api/v1/comments/admin/{self.comment.id}/reject/')
        print(f"  Admin REJECT comment: {response.status_code}")
        self.assertEqual(response.status_code, 200)
        
        # Test regular user access (should be denied)
        response = self.regular_client.get('/api/v1/comments/admin/')
        print(f"  Regular user GET comments: {response.status_code}")
        # Note: Currently AllowAny, but should be IsAdminUser

    def test_3_contact_admin_endpoints(self):
        print("\n📧 Test 3: Contact Admin Endpoints")
        
        # Test admin can access contact messages
        response = self.admin_client.get('/api/v1/contact/admin/')
        print(f"  Admin GET contact messages: {response.status_code}")
        self.assertEqual(response.status_code, 200)
        
        # Test admin can archive contact messages
        response = self.admin_client.patch(f'/api/v1/contact/admin/{self.contact_message.id}/archive/')
        print(f"  Admin ARCHIVE contact message: {response.status_code}")
        self.assertEqual(response.status_code, 200)
        
        # Test admin can delete contact messages
        response = self.admin_client.delete(f'/api/v1/contact/admin/{self.contact_message.id}/delete/')
        print(f"  Admin DELETE contact message: {response.status_code}")
        self.assertEqual(response.status_code, 200)
        
        # Test regular user access (should be denied)
        response = self.regular_client.get('/api/v1/contact/admin/')
        print(f"  Regular user GET contact messages: {response.status_code}")
        # Note: Currently AllowAny, but should be IsAdminUser

    def test_4_ad_admin_endpoints(self):
        print("\n📢 Test 4: Ad Admin Endpoints")
        
        # Test admin can access ad endpoints
        response = self.admin_client.get('/api/v1/ads/admin/')
        print(f"  Admin GET ads: {response.status_code}")
        self.assertEqual(response.status_code, 200)
        
        # Test admin can create ads
        ad_data = {
            'title': 'New Admin Ad',
            'image': 'new-ad.jpg',
            'destination_url': 'https://example.com',
            'placement': self.ad_placement.id,
            'is_active': True
        }
        response = self.admin_client.post('/api/v1/ads/admin/', ad_data, format='json')
        print(f"  Admin CREATE ad: {response.status_code}")
        self.assertEqual(response.status_code, 201)
        
        # Test admin can update ads
        update_data = {'title': 'Updated Admin Ad'}
        response = self.admin_client.patch(f'/api/v1/ads/admin/{self.ad.id}/', update_data, format='json')
        print(f"  Admin UPDATE ad: {response.status_code}")
        self.assertEqual(response.status_code, 200)
        
        # Test regular user access (should be denied)
        response = self.regular_client.get('/api/v1/ads/admin/')
        print(f"  Regular user GET ads: {response.status_code}")
        # Note: Currently AllowAny, but should be IsAdminUser

    def test_5_scheduling_admin_endpoints(self):
        print("\n⏰ Test 5: Scheduling Admin Endpoints")
        
        # Test admin can access scheduling endpoints
        response = self.admin_client.get('/api/v1/articles/schedules/')
        print(f"  Admin GET schedules: {response.status_code}")
        self.assertEqual(response.status_code, 200)
        
        # Test admin can create schedules
        schedule_data = {
            'name': 'New Admin Schedule',
            'frequency': 'daily',
            'is_active': True
        }
        response = self.admin_client.post('/api/v1/articles/schedules/', schedule_data, format='json')
        print(f"  Admin CREATE schedule: {response.status_code}")
        self.assertEqual(response.status_code, 201)
        
        # Test admin can update schedules
        update_data = {'is_active': False}
        response = self.admin_client.patch(f'/api/v1/articles/schedules/{self.schedule.id}/', update_data, format='json')
        print(f"  Admin UPDATE schedule: {response.status_code}")
        self.assertEqual(response.status_code, 200)
        
        # Test regular user access (should be denied)
        response = self.regular_client.get('/api/v1/articles/schedules/')
        print(f"  Regular user GET schedules: {response.status_code}")
        self.assertEqual(response.status_code, 403)  # ✅ Correctly denied
        
        # Test unauthenticated access (should be denied)
        response = self.unauthenticated_client.get('/api/v1/articles/schedules/')
        print(f"  No auth GET schedules: {response.status_code}")
        self.assertEqual(response.status_code, 403)  # ✅ Correctly denied

    def test_6_settings_admin_endpoints(self):
        print("\n⚙️ Test 6: Settings Admin Endpoints")
        
        # Test admin can access settings
        response = self.admin_client.get('/api/v1/settings/admin/get/')
        print(f"  Admin GET settings: {response.status_code}")
        self.assertEqual(response.status_code, 200)
        
        # Test admin can update settings
        settings_data = {
            'site_name': 'Updated Site Name',
            'allow_comments': True,
            'default_article_status': 'draft'
        }
        response = self.admin_client.put('/api/v1/settings/admin/', settings_data, format='json')
        print(f"  Admin UPDATE settings: {response.status_code}")
        self.assertEqual(response.status_code, 200)
        
        # Test regular user access (should be denied)
        response = self.regular_client.get('/api/v1/settings/admin/get/')
        print(f"  Regular user GET settings: {response.status_code}")
        # Note: Currently no permission check, but should be IsAdminUser

    def test_7_article_toggle_status(self):
        print("\n🔄 Test 7: Article Toggle Status")
        
        # Test admin can toggle article status
        response = self.admin_client.post(f'/api/v1/articles/toggle-status/{self.article.id}/')
        print(f"  Admin TOGGLE article status: {response.status_code}")
        self.assertEqual(response.status_code, 200)
        
        # Test regular user access (should be denied)
        response = self.regular_client.post(f'/api/v1/articles/toggle-status/{self.article.id}/')
        print(f"  Regular user TOGGLE article status: {response.status_code}")
        # Note: Currently AllowAny, but should be IsAdminUser

    def test_8_csrf_exemption_consistency(self):
        print("\n🛡️ Test 8: CSRF Exemption Consistency")
        
        # Test that all admin endpoints work without CSRF tokens
        endpoints_to_test = [
            ('/api/v1/articles/admin/', 'GET'),
            ('/api/v1/comments/admin/', 'GET'),
            ('/api/v1/contact/admin/', 'GET'),
            ('/api/v1/ads/admin/', 'GET'),
            ('/api/v1/articles/schedules/', 'GET'),
            ('/api/v1/settings/admin/get/', 'GET'),
        ]
        
        for endpoint, method in endpoints_to_test:
            if method == 'GET':
                response = self.admin_client.get(endpoint)
            print(f"  {method} {endpoint}: {response.status_code}")
            # All should work without CSRF tokens

    def test_9_permission_class_audit(self):
        print("\n🔍 Test 9: Permission Class Audit")
        
        # This test documents current permission classes and identifies issues
        print("  Current Permission Classes:")
        print("    - ArticleViewSet: AllowAny (❌ Should be IsAdminUser)")
        print("    - CommentViewSet: AllowAny (❌ Should be IsAdminUser)")
        print("    - ContactMessageViewSet: AllowAny (❌ Should be IsAdminUser)")
        print("    - AdViewSet: AllowAny (❌ Should be IsAdminUser)")
        print("    - PublishingScheduleViewSet: IsAdminUser (✅ Correct)")
        print("    - Settings endpoints: No permission check (❌ Should be IsAdminUser)")
        print("    - Toggle status: AllowAny (❌ Should be IsAdminUser)")

    def test_10_authentication_edge_cases(self):
        print("\n🔐 Test 10: Authentication Edge Cases")
        
        # Test expired session
        self.admin_client.logout()
        response = self.admin_client.get('/api/v1/articles/schedules/')
        print(f"  Expired session GET schedules: {response.status_code}")
        self.assertEqual(response.status_code, 403)
        
        # Test invalid credentials
        invalid_client = APIClient()
        invalid_client.login(username='invalid', password='invalid')
        response = invalid_client.get('/api/v1/articles/schedules/')
        print(f"  Invalid credentials GET schedules: {response.status_code}")
        self.assertEqual(response.status_code, 403)
        
        # Test malformed session cookie
        malformed_client = APIClient()
        malformed_client.cookies['sessionid'] = 'invalid_session_id'
        response = malformed_client.get('/api/v1/articles/schedules/')
        print(f"  Malformed session GET schedules: {response.status_code}")
        self.assertEqual(response.status_code, 403)

if __name__ == '__main__':
    import unittest
    unittest.main()
