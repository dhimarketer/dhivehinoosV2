from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth.models import User
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from .models import SiteSettings
from .serializers import SiteSettingsSerializer
import json


class SiteSettingsModelTest(TestCase):
    def setUp(self):
        # Clean up any existing settings
        SiteSettings.objects.all().delete()
        
    def test_get_settings_creates_default(self):
        """Test that get_settings creates default settings if none exist"""
        settings = SiteSettings.get_settings()
        
        self.assertEqual(settings.default_article_status, 'draft')
        self.assertEqual(settings.site_name, 'Dhivehinoos.net')
        self.assertTrue(settings.allow_comments)
        self.assertTrue(settings.require_comment_approval)
        
    def test_get_settings_returns_existing(self):
        """Test that get_settings returns existing settings"""
        # First, get the default settings to ensure they exist
        default_settings = SiteSettings.get_settings()
        
        # Update the existing settings instead of creating new ones
        default_settings.default_article_status = 'published'
        default_settings.site_name = 'Custom Site'
        default_settings.site_description = 'Custom description'
        default_settings.allow_comments = False
        default_settings.require_comment_approval = False
        default_settings.google_analytics_id = 'G-TEST123456'
        default_settings.save()
        
        # Now get settings again - should return the updated settings
        settings = SiteSettings.get_settings()
        self.assertEqual(settings.id, default_settings.id)
        self.assertEqual(settings.default_article_status, 'published')
        self.assertEqual(settings.site_name, 'Custom Site')
        self.assertFalse(settings.allow_comments)
        
    def test_settings_str_representation(self):
        """Test string representation of settings"""
        settings = SiteSettings.get_settings()
        str_repr = str(settings)
        self.assertIn('Site Settings', str_repr)
        self.assertIn('Updated:', str_repr)


class SiteSettingsSerializerTest(TestCase):
    def setUp(self):
        self.settings = SiteSettings.get_settings()
        
    def test_serializer_valid_data(self):
        """Test serializer with valid data"""
        data = {
            'default_article_status': 'published',
            'site_name': 'Test Site',
            'site_description': 'Test description',
            'allow_comments': False,
            'require_comment_approval': False,
            'google_analytics_id': 'G-TEST123456'
        }
        
        serializer = SiteSettingsSerializer(self.settings, data=data, partial=True)
        self.assertTrue(serializer.is_valid())
        
    def test_serializer_invalid_article_status(self):
        """Test serializer with invalid article status"""
        data = {
            'default_article_status': 'invalid_status'
        }
        
        serializer = SiteSettingsSerializer(self.settings, data=data, partial=True)
        self.assertFalse(serializer.is_valid())
        self.assertIn('default_article_status', serializer.errors)
        
    def test_serializer_invalid_google_analytics_id(self):
        """Test serializer with invalid Google Analytics ID"""
        data = {
            'google_analytics_id': 'invalid-ga-id'
        }
        
        serializer = SiteSettingsSerializer(self.settings, data=data, partial=True)
        self.assertFalse(serializer.is_valid())
        self.assertIn('google_analytics_id', serializer.errors)
        
    def test_serializer_empty_google_analytics_id(self):
        """Test serializer with empty Google Analytics ID (should be valid)"""
        data = {
            'google_analytics_id': ''
        }
        
        serializer = SiteSettingsSerializer(self.settings, data=data, partial=True)
        self.assertTrue(serializer.is_valid())
        
    def test_serializer_null_google_analytics_id(self):
        """Test serializer with null Google Analytics ID (should be valid)"""
        data = {
            'google_analytics_id': None
        }
        
        serializer = SiteSettingsSerializer(self.settings, data=data, partial=True)
        self.assertTrue(serializer.is_valid())


class SiteSettingsAPITest(APITestCase):
    def setUp(self):
        self.client = APIClient()
        # Create admin user for authentication
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='adminpass123',
            is_staff=True,
            is_superuser=True
        )
        # Clean up any existing settings
        SiteSettings.objects.all().delete()
        
    def test_public_settings_endpoint(self):
        """Test public settings endpoint returns only public fields"""
        settings = SiteSettings.get_settings()
        
        url = reverse('site-settings-public')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Should only return public fields
        expected_fields = {'site_name', 'site_description', 'allow_comments', 'google_analytics_id', 'story_cards_columns', 'story_cards_rows'}
        self.assertEqual(set(response.data.keys()), expected_fields)
        
        # Should not include admin-only fields
        self.assertNotIn('default_article_status', response.data)
        self.assertNotIn('require_comment_approval', response.data)
        
    def test_admin_settings_endpoint(self):
        """Test admin settings endpoint returns all fields"""
        settings = SiteSettings.get_settings()
        
        # Authenticate as admin user
        self.client.force_authenticate(user=self.admin_user)
        
        url = reverse('site-settings-admin-get')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Should return all fields including admin-only fields
        expected_fields = {
            'id', 'default_article_status', 'site_name', 'site_description',
            'allow_comments', 'require_comment_approval', 'google_analytics_id',
            'story_cards_columns', 'story_cards_rows', 'contact_email',
            'comment_webhook_url', 'comment_webhook_enabled', 'comment_webhook_secret',
            'created_at', 'updated_at'
        }
        self.assertEqual(set(response.data.keys()), expected_fields)
        
        # Should include admin-only fields
        self.assertIn('default_article_status', response.data)
        self.assertIn('require_comment_approval', response.data)
        
    def test_update_settings_endpoint(self):
        """Test settings update endpoint"""
        settings = SiteSettings.get_settings()
        
        # Authenticate as admin user
        self.client.force_authenticate(user=self.admin_user)
        
        update_data = {
            'default_article_status': 'published',
            'site_name': 'Updated Site Name',
            'site_description': 'Updated description',
            'allow_comments': False,
            'require_comment_approval': False,
            'google_analytics_id': 'G-UPDATED123'
        }
        
        url = reverse('site-settings-admin')
        response = self.client.put(
            url,
            data=json.dumps(update_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify the settings were updated
        updated_settings = SiteSettings.get_settings()
        self.assertEqual(updated_settings.default_article_status, 'published')
        self.assertEqual(updated_settings.site_name, 'Updated Site Name')
        self.assertEqual(updated_settings.site_description, 'Updated description')
        self.assertFalse(updated_settings.allow_comments)
        self.assertFalse(updated_settings.require_comment_approval)
        self.assertEqual(updated_settings.google_analytics_id, 'G-UPDATED123')
        
    def test_update_settings_partial(self):
        """Test partial settings update"""
        settings = SiteSettings.get_settings()
        original_name = settings.site_name
        
        # Authenticate as admin user
        self.client.force_authenticate(user=self.admin_user)
        
        # Only update default_article_status
        update_data = {
            'default_article_status': 'published'
        }
        
        url = reverse('site-settings-admin')
        response = self.client.put(
            url,
            data=json.dumps(update_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify only the specified field was updated
        updated_settings = SiteSettings.get_settings()
        self.assertEqual(updated_settings.default_article_status, 'published')
        self.assertEqual(updated_settings.site_name, original_name)  # Should remain unchanged
        
    def test_update_settings_invalid_data(self):
        """Test settings update with invalid data"""
        # Authenticate as admin user
        self.client.force_authenticate(user=self.admin_user)
        
        update_data = {
            'default_article_status': 'invalid_status',
            'google_analytics_id': 'invalid-ga-id'
        }
        
        url = reverse('site-settings-admin')
        response = self.client.put(
            url,
            data=json.dumps(update_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        # JsonResponse stores data in response.content, not response.data
        response_data = json.loads(response.content)
        self.assertIn('default_article_status', response_data)
        self.assertIn('google_analytics_id', response_data)
        
    def test_update_settings_invalid_json(self):
        """Test settings update with invalid JSON"""
        # Authenticate as admin user
        self.client.force_authenticate(user=self.admin_user)
        
        url = reverse('site-settings-admin')
        response = self.client.put(
            url,
            data='invalid json',
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        # JsonResponse stores data in response.content, not response.data
        response_data = json.loads(response.content)
        self.assertIn('error', response_data)
        
    def test_settings_persistence(self):
        """Test that settings persist across multiple requests"""
        # This test specifically addresses the bug we just fixed
        
        # Authenticate as admin user
        self.client.force_authenticate(user=self.admin_user)
        
        # First, update settings
        update_data = {
            'default_article_status': 'published',
            'site_name': 'Persistent Test Site'
        }
        
        url = reverse('site-settings-admin')
        response = self.client.put(
            url,
            data=json.dumps(update_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Then, read settings back
        get_url = reverse('site-settings-admin-get')
        response = self.client.get(get_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify settings were persisted
        self.assertEqual(response.data['default_article_status'], 'published')
        self.assertEqual(response.data['site_name'], 'Persistent Test Site')
        
        # Make another update
        update_data2 = {
            'default_article_status': 'draft',
            'site_name': 'Another Update'
        }
        
        response = self.client.put(
            url,
            data=json.dumps(update_data2),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Read again to verify persistence
        response = self.client.get(get_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['default_article_status'], 'draft')
        self.assertEqual(response.data['site_name'], 'Another Update')


class SiteSettingsIntegrationTest(APITestCase):
    """Integration tests for settings functionality"""
    
    def setUp(self):
        # Create admin user for authentication
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='adminpass123',
            is_staff=True,
            is_superuser=True
        )
        # Clean up any existing settings
        SiteSettings.objects.all().delete()
        
    def test_settings_workflow(self):
        """Test complete settings workflow"""
        # 1. Get initial settings
        settings = SiteSettings.get_settings()
        self.assertEqual(settings.default_article_status, 'draft')
        
        # 2. Authenticate as admin user
        self.client.force_authenticate(user=self.admin_user)
        
        # 3. Update settings via API
        update_data = {
            'default_article_status': 'published',
            'site_name': 'Integration Test Site',
            'allow_comments': False
        }
        
        response = self.client.put(
            '/api/v1/settings/admin/',
            data=json.dumps(update_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 200)
        
        # 4. Verify settings were updated
        updated_settings = SiteSettings.get_settings()
        self.assertEqual(updated_settings.default_article_status, 'published')
        self.assertEqual(updated_settings.site_name, 'Integration Test Site')
        self.assertFalse(updated_settings.allow_comments)
        
        # 5. Test that settings persist across model calls
        settings_again = SiteSettings.get_settings()
        self.assertEqual(settings_again.id, updated_settings.id)
        self.assertEqual(settings_again.default_article_status, 'published')
        
    def test_settings_singleton_behavior(self):
        """Test that settings behave as a singleton"""
        # Get settings multiple times
        settings1 = SiteSettings.get_settings()
        settings2 = SiteSettings.get_settings()
        settings3 = SiteSettings.get_settings()
        
        # All should be the same instance
        self.assertEqual(settings1.id, settings2.id)
        self.assertEqual(settings2.id, settings3.id)
        self.assertEqual(settings1.id, settings3.id)
        
        # Update one
        settings1.default_article_status = 'published'
        settings1.save()
        
        # Get again - should reflect the update
        settings4 = SiteSettings.get_settings()
        self.assertEqual(settings4.default_article_status, 'published')
        self.assertEqual(settings4.id, settings1.id)
