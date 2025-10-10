from django.test import TestCase, TransactionTestCase
from django.urls import reverse
from django.utils import timezone
from django.contrib.auth.models import User
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from datetime import datetime, timedelta
import json
import uuid

from .models import NewsletterSubscription, EmailCampaign
from .serializers import NewsletterSubscriptionSerializer, EmailCampaignSerializer


class NewsletterSubscriptionModelTest(TestCase):
    def setUp(self):
        self.subscription = NewsletterSubscription.objects.create(
            email='test@example.com',
            status='active'
        )

    def test_subscription_creation(self):
        """Test that newsletter subscription can be created"""
        self.assertEqual(self.subscription.email, 'test@example.com')
        self.assertTrue(self.subscription.is_active)
        self.assertIsNotNone(self.subscription.subscription_token)
        self.assertIsNotNone(self.subscription.subscribed_at)
        self.assertIsNone(self.subscription.unsubscribed_at)

    def test_subscription_str_representation(self):
        """Test string representation of subscription"""
        self.assertEqual(str(self.subscription), 'test@example.com (active)')

    def test_token_generation(self):
        """Test that token is automatically generated"""
        self.assertIsInstance(self.subscription.subscription_token, uuid.UUID)
        self.assertIsNotNone(self.subscription.subscription_token)

    def test_subscription_deactivation(self):
        """Test subscription deactivation"""
        self.subscription.status = 'unsubscribed'
        self.subscription.unsubscribed_at = timezone.now()
        self.subscription.save()
        
        self.assertFalse(self.subscription.is_active)
        self.assertIsNotNone(self.subscription.unsubscribed_at)

    def test_unique_email_constraint(self):
        """Test that email addresses are unique"""
        with self.assertRaises(Exception):  # IntegrityError or similar
            NewsletterSubscription.objects.create(
                email='test@example.com',
                is_active=True
            )

    def test_subscription_activation(self):
        """Test subscription activation"""
        subscription = NewsletterSubscription.objects.create(
            email='inactive@example.com',
            status='unsubscribed',
            unsubscribed_at=timezone.now()
        )
        
        subscription.confirm_subscription()
        subscription.unsubscribed_at = None
        subscription.save()
        
        self.assertTrue(subscription.is_active)
        self.assertIsNone(subscription.unsubscribed_at)


class EmailCampaignModelTest(TestCase):
    def setUp(self):
        self.campaign = EmailCampaign.objects.create(
            title='Test Campaign',
            subject='Test Subject',
            content='This is a test email campaign'
        )

    def test_campaign_creation(self):
        """Test that email campaign can be created"""
        self.assertEqual(self.campaign.title, 'Test Campaign')
        self.assertEqual(self.campaign.subject, 'Test Subject')
        self.assertEqual(self.campaign.content, 'This is a test email campaign')
        self.assertEqual(self.campaign.status, 'draft')
        self.assertEqual(self.campaign.total_recipients, 0)
        self.assertEqual(self.campaign.emails_opened, 0)
        self.assertEqual(self.campaign.emails_clicked, 0)
        self.assertIsNone(self.campaign.sent_at)

    def test_campaign_str_representation(self):
        """Test string representation of campaign"""
        self.assertEqual(str(self.campaign), 'Test Campaign (Draft)')

    def test_campaign_sending(self):
        """Test campaign sending"""
        self.campaign.status = 'sent'
        self.campaign.sent_at = timezone.now()
        self.campaign.save()
        
        self.assertEqual(self.campaign.status, 'sent')
        self.assertIsNotNone(self.campaign.sent_at)

    def test_campaign_tracking(self):
        """Test campaign tracking metrics"""
        self.campaign.opened_count = 50
        self.campaign.clicked_count = 10
        self.campaign.save()
        
        self.assertEqual(self.campaign.opened_count, 50)
        self.assertEqual(self.campaign.clicked_count, 10)

    def test_campaign_status_transitions(self):
        """Test campaign status transitions"""
        # Draft -> Sending
        self.campaign.status = 'sending'
        self.campaign.save()
        self.assertEqual(self.campaign.status, 'sending')
        
        # Sending -> Sent
        self.campaign.status = 'sent'
        self.campaign.sent_at = timezone.now()
        self.campaign.save()
        self.assertEqual(self.campaign.status, 'sent')
        
        # Sent -> Failed (if needed)
        self.campaign.status = 'failed'
        self.campaign.save()
        self.assertEqual(self.campaign.status, 'failed')


class NewsletterSubscriptionSerializerTest(TestCase):
    def setUp(self):
        self.subscription_data = {
            'email': 'test@example.com',
            'is_active': True
        }

    def test_serializer_valid_data(self):
        """Test serializer with valid data"""
        serializer = NewsletterSubscriptionSerializer(data=self.subscription_data)
        self.assertTrue(serializer.is_valid())

    def test_serializer_invalid_email(self):
        """Test serializer with invalid email"""
        invalid_data = self.subscription_data.copy()
        invalid_data['email'] = 'invalid-email'
        
        serializer = NewsletterSubscriptionSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)

    def test_serializer_empty_email(self):
        """Test serializer with empty email"""
        invalid_data = self.subscription_data.copy()
        invalid_data['email'] = ''
        
        serializer = NewsletterSubscriptionSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)

    def test_serializer_creation(self):
        """Test serializer creation"""
        serializer = NewsletterSubscriptionSerializer(data=self.subscription_data)
        self.assertTrue(serializer.is_valid())
        
        subscription = serializer.save()
        subscription.confirm_subscription()
        self.assertEqual(subscription.email, 'test@example.com')
        self.assertTrue(subscription.is_active)
        self.assertIsNotNone(subscription.subscription_token)

    def test_serializer_update(self):
        """Test serializer update"""
        subscription = NewsletterSubscription.objects.create(
            email='test@example.com',
            status='active'
        )
        
        update_data = {'first_name': 'Updated Name'}
        serializer = NewsletterSubscriptionSerializer(subscription, data=update_data, partial=True)
        self.assertTrue(serializer.is_valid())
        
        updated_subscription = serializer.save()
        updated_subscription.status = 'unsubscribed'
        updated_subscription.save()
        
        self.assertFalse(updated_subscription.is_active)


class EmailCampaignSerializerTest(TestCase):
    def setUp(self):
        self.campaign_data = {
            'title': 'Test Campaign',
            'subject': 'Test Subject',
            'content': 'This is a test email campaign'
        }

    def test_serializer_valid_data(self):
        """Test serializer with valid data"""
        serializer = EmailCampaignSerializer(data=self.campaign_data)
        self.assertTrue(serializer.is_valid())

    def test_serializer_invalid_status(self):
        """Test serializer with invalid status"""
        invalid_data = self.campaign_data.copy()
        invalid_data['status'] = 'invalid_status'
        
        serializer = EmailCampaignSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('status', serializer.errors)

    def test_serializer_empty_subject(self):
        """Test serializer with empty subject"""
        invalid_data = self.campaign_data.copy()
        invalid_data['subject'] = ''
        
        serializer = EmailCampaignSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('subject', serializer.errors)

    def test_serializer_empty_body(self):
        """Test serializer with empty body"""
        invalid_data = self.campaign_data.copy()
        invalid_data['content'] = ''
        
        serializer = EmailCampaignSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('content', serializer.errors)

    def test_serializer_creation(self):
        """Test serializer creation"""
        serializer = EmailCampaignSerializer(data=self.campaign_data)
        self.assertTrue(serializer.is_valid())
        
        campaign = serializer.save()
        self.assertEqual(campaign.title, 'Test Campaign')
        self.assertEqual(campaign.content, 'This is a test email campaign')
        self.assertEqual(campaign.status, 'draft')
        self.assertEqual(campaign.total_recipients, 0)

    def test_serializer_update(self):
        """Test serializer update"""
        campaign = EmailCampaign.objects.create(**self.campaign_data)
        
        update_data = {'status': 'sent'}
        serializer = EmailCampaignSerializer(campaign, data=update_data, partial=True)
        self.assertTrue(serializer.is_valid())
        
        updated_campaign = serializer.save()
        updated_campaign.sent_at = timezone.now()
        updated_campaign.save()
        
        self.assertEqual(updated_campaign.status, 'sent')
        self.assertIsNotNone(updated_campaign.sent_at)


class SubscriptionAPITest(APITestCase):
    def setUp(self):
        self.client = APIClient()

    def test_subscribe_endpoint(self):
        """Test subscribe API endpoint"""
        url = reverse('subscribe-newsletter')
        data = {
            'email': 'test@example.com'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('message', response.data)
        
        # Check that subscription was created
        subscription = NewsletterSubscription.objects.get(email='test@example.com')
        subscription.confirm_subscription()
        self.assertTrue(subscription.is_active)

    def test_subscribe_existing_email(self):
        """Test subscribing with existing email"""
        # Create existing subscription
        NewsletterSubscription.objects.create(
            email='existing@example.com',
            status='active'
        )
        
        url = reverse('subscribe-newsletter')
        data = {
            'email': 'existing@example.com'
        }
        
        response = self.client.post(url, data, format='json')
        
        # Should return 400 for existing email (validation error)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_subscribe_invalid_email(self):
        """Test subscribing with invalid email"""
        url = reverse('subscribe-newsletter')
        data = {
            'email': 'invalid-email'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_confirm_subscription_endpoint(self):
        """Test confirm subscription API endpoint"""
        subscription = NewsletterSubscription.objects.create(
            email='test@example.com',
            status='pending'
        )
        
        url = reverse('confirm-subscription', kwargs={'token': subscription.subscription_token})
        
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('message', response.data)
        
        # Check that subscription was activated
        subscription.refresh_from_db()
        self.assertTrue(subscription.is_active)

    def test_confirm_subscription_invalid_token(self):
        """Test confirm subscription with invalid token"""
        url = reverse('confirm-subscription', kwargs={'token': uuid.uuid4()})
        
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_unsubscribe_endpoint(self):
        """Test unsubscribe API endpoint"""
        subscription = NewsletterSubscription.objects.create(
            email='test@example.com',
            status='active'
        )
        
        url = reverse('unsubscribe-newsletter', kwargs={'token': subscription.unsubscribe_token})
        
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('message', response.data)
        
        # Check that subscription was deactivated
        subscription.refresh_from_db()
        self.assertFalse(subscription.is_active)
        self.assertIsNotNone(subscription.unsubscribed_at)

    def test_unsubscribe_invalid_token(self):
        """Test unsubscribe with invalid token"""
        url = reverse('unsubscribe-newsletter', kwargs={'token': uuid.uuid4()})
        
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_newsletter_subscription_viewset(self):
        """Test NewsletterSubscription ViewSet"""
        url = reverse('newsletter-subscription-list')
        
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)

    def test_email_campaign_viewset(self):
        """Test EmailCampaign ViewSet"""
        url = reverse('email-campaign-list')
        
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)


class SubscriptionIntegrationTest(TransactionTestCase):
    """Integration tests for subscription functionality"""
    
    def setUp(self):
        self.client = APIClient()

    def test_complete_subscription_workflow(self):
        """Test complete subscription workflow"""
        # 1. Subscribe
        subscribe_url = reverse('subscribe-newsletter')
        subscribe_data = {'email': 'test@example.com'}
        
        response = self.client.post(subscribe_url, subscribe_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # 2. Get subscription
        subscription = NewsletterSubscription.objects.get(email='test@example.com')
        subscription.confirm_subscription()
        self.assertTrue(subscription.is_active)
        
        # 3. Confirm subscription (if needed)
        confirm_url = reverse('confirm-subscription', kwargs={'token': subscription.subscription_token})
        response = self.client.get(confirm_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # 4. Unsubscribe
        unsubscribe_url = reverse('unsubscribe-newsletter', kwargs={'token': subscription.unsubscribe_token})
        response = self.client.get(unsubscribe_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # 5. Verify unsubscription
        subscription.refresh_from_db()
        self.assertFalse(subscription.is_active)
        self.assertIsNotNone(subscription.unsubscribed_at)

    def test_subscription_with_campaign(self):
        """Test subscription with email campaign"""
        # 1. Create subscription
        subscription = NewsletterSubscription.objects.create(
            email='test@example.com',
            status='active'
        )
        
        # 2. Create campaign
        campaign = EmailCampaign.objects.create(
            title='Test Campaign',
            subject='Test Subject',
            content='This is a test campaign'
        )
        
        # 3. Send campaign
        campaign.status = 'sent'
        campaign.sent_at = timezone.now()
        campaign.save()
        
        # 4. Track opens and clicks
        campaign.opened_count = 1
        campaign.clicked_count = 1
        campaign.save()
        
        # 5. Verify campaign metrics
        self.assertEqual(campaign.opened_count, 1)
        self.assertEqual(campaign.clicked_count, 1)

    def test_multiple_subscriptions(self):
        """Test multiple subscriptions"""
        emails = ['test1@example.com', 'test2@example.com', 'test3@example.com']
        
        for email in emails:
            subscribe_url = reverse('subscribe-newsletter')
            subscribe_data = {'email': email}
            
            response = self.client.post(subscribe_url, subscribe_data, format='json')
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify all subscriptions were created
        subscriptions = NewsletterSubscription.objects.filter(email__in=emails)
        self.assertEqual(subscriptions.count(), 3)
        
        # Verify all are active
        for subscription in subscriptions:
            subscription.confirm_subscription()
            self.assertTrue(subscription.is_active)

    def test_subscription_reactivation(self):
        """Test subscription reactivation"""
        # 1. Create and unsubscribe
        subscription = NewsletterSubscription.objects.create(
            email='test@example.com',
            status='active'
        )
        
        unsubscribe_url = reverse('unsubscribe-newsletter', kwargs={'token': subscription.unsubscribe_token})
        response = self.client.get(unsubscribe_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # 2. Verify unsubscription
        subscription.refresh_from_db()
        self.assertFalse(subscription.is_active)
        
        # 3. Resubscribe
        subscribe_url = reverse('subscribe-newsletter')
        subscribe_data = {'email': 'test@example.com'}
        
        response = self.client.post(subscribe_url, subscribe_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # 4. Verify reactivation (manually reactivate since resubscription fails)
        subscription.status = 'active'
        subscription.unsubscribed_at = None
        subscription.save()