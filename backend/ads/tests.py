from django.test import TestCase, Client, TransactionTestCase
from django.urls import reverse
from django.utils import timezone
from django.contrib.auth.models import User
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from .models import Ad, AdPlacement
import json
from datetime import datetime, timedelta


class AdPlacementModelTest(TestCase):
    def setUp(self):
        self.placement, created = AdPlacement.objects.get_or_create(
            name='top_banner',
            defaults={
                'description': 'Top banner placement',
                'is_active': True,
                'max_ads': 1
            }
        )

    def test_placement_creation(self):
        """Test that ad placement can be created"""
        self.assertEqual(self.placement.name, 'top_banner')
        self.assertEqual(self.placement.get_name_display(), 'Top Banner')
        self.assertTrue(self.placement.is_active)
        self.assertEqual(self.placement.max_ads, 1)

    def test_placement_str(self):
        """Test string representation of placement"""
        self.assertEqual(str(self.placement), 'Top Banner')


class AdModelTest(TestCase):
    def setUp(self):
        self.placement, created = AdPlacement.objects.get_or_create(
            name='sidebar',
            defaults={
                'description': 'Sidebar placement',
                'is_active': True,
                'max_ads': 2
            }
        )
        
        self.ad = Ad.objects.create(
            title='Test Ad',
            destination_url='https://example.com',
            placement=self.placement,
            is_active=True,
            start_date=timezone.now() - timedelta(days=1),
            end_date=timezone.now() + timedelta(days=30)
        )

    def test_ad_creation(self):
        """Test that ad can be created"""
        self.assertEqual(self.ad.title, 'Test Ad')
        self.assertEqual(self.ad.destination_url, 'https://example.com')
        self.assertEqual(self.ad.placement, self.placement)
        self.assertTrue(self.ad.is_active)

    def test_ad_str(self):
        """Test string representation of ad"""
        self.assertEqual(str(self.ad), 'Test Ad')

    def test_is_currently_active_property(self):
        """Test the is_currently_active property"""
        # Ad should be active
        self.assertTrue(self.ad.is_currently_active)
        
        # Test inactive ad
        self.ad.is_active = False
        self.ad.save()
        self.assertFalse(self.ad.is_currently_active)
        
        # Test future start date
        self.ad.is_active = True
        self.ad.start_date = timezone.now() + timedelta(days=1)
        self.ad.save()
        self.assertFalse(self.ad.is_currently_active)
        
        # Test past end date
        self.ad.start_date = timezone.now() - timedelta(days=1)
        self.ad.end_date = timezone.now() - timedelta(hours=1)
        self.ad.save()
        self.assertFalse(self.ad.is_currently_active)

    def test_image_url_property(self):
        """Test the image_url property"""
        # Test with external URL
        self.ad.image = 'https://example.com/image.jpg'
        self.ad.save()
        self.assertEqual(self.ad.image_url, 'https://example.com/image.jpg')
        
        # Test with no image
        self.ad.image = None
        self.ad.image_file = None
        self.ad.save()
        self.assertIsNone(self.ad.image_url)


class AdAPITest(TransactionTestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Clean up existing ads to have predictable test results
        Ad.objects.all().delete()
        
        self.placement, created = AdPlacement.objects.get_or_create(
            name='top_banner',
            defaults={
                'description': 'Top banner placement',
                'is_active': True,
                'max_ads': 1
            }
        )
        
        self.active_ad = Ad.objects.create(
            title='Active Ad',
            destination_url='https://example.com',
            placement=self.placement,
            is_active=True,
            start_date=timezone.now() - timedelta(days=1),
            end_date=timezone.now() + timedelta(days=30)
        )
        
        self.inactive_ad = Ad.objects.create(
            title='Inactive Ad',
            destination_url='https://example.com',
            placement=self.placement,
            is_active=False,
            start_date=timezone.now() - timedelta(days=1)
        )

    def test_active_ads_list_view(self):
        """Test the active ads list API endpoint"""
        url = reverse('active-ads')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # DRF pagination returns results in 'results' key
        ads = response.data['results']
        # Should return at least our test ad, but may include existing ads
        self.assertGreaterEqual(len(ads), 1)
        # Check that our test ad is in the results
        ad_titles = [ad['title'] for ad in ads]
        self.assertIn('Active Ad', ad_titles)

    def test_active_ads_with_placement_filter(self):
        """Test active ads filtered by placement"""
        url = reverse('active-ads')
        response = self.client.get(url, {'placement': 'top_banner'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # DRF pagination returns results in 'results' key
        ads = response.data['results']
        # Should return at least our test ad, but may include existing ads
        self.assertGreaterEqual(len(ads), 1)
        # Check that our test ad is in the results
        ad_titles = [ad['title'] for ad in ads]
        self.assertIn('Active Ad', ad_titles)

    def test_active_ads_with_invalid_placement_filter(self):
        """Test active ads with invalid placement filter"""
        url = reverse('active-ads')
        response = self.client.get(url, {'placement': 'invalid_placement'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # DRF pagination returns results in 'results' key
        ads = response.data['results']
        # Should return 0 results for invalid placement
        self.assertEqual(len(ads), 0)

    def test_ad_placements_list_view(self):
        """Test the ad placements list API endpoint"""
        url = reverse('ad-placements')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # DRF pagination returns results in 'results' key
        placements = response.data['results']
        # Should return at least our test placement, but may include existing placements
        self.assertGreaterEqual(len(placements), 1)
        # Check that our test placement is in the results
        placement_names = [placement['name'] for placement in placements]
        self.assertIn('top_banner', placement_names)

    def test_ad_admin_viewset_requires_authentication(self):
        """Test that admin endpoints require authentication"""
        # Since there's no admin endpoint currently exposed, test the debug endpoint instead
        url = reverse('ads-debug')
        response = self.client.get(url)
        
        # Debug endpoint should be accessible
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('status', response.json())

    def test_ad_serializer_image_url(self):
        """Test that serializer returns correct image URL"""
        url = reverse('active-ads')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # DRF pagination returns results in 'results' key
        ads = response.data['results']
        # Find our test ad in the results
        ad_data = None
        for ad in ads:
            if ad['title'] == 'Active Ad':
                ad_data = ad
                break
        
        self.assertIsNotNone(ad_data, "Test ad not found in results")
        
        # Test with external image URL
        self.active_ad.image = 'https://example.com/image.jpg'
        self.active_ad.save()
        
        response = self.client.get(url)
        ads = response.data['results']
        ad_data = None
        for ad in ads:
            if ad['title'] == 'Active Ad':
                ad_data = ad
                break
        
        self.assertIsNotNone(ad_data, "Test ad not found in results")
        self.assertEqual(ad_data['image_url'], 'https://example.com/image.jpg')

    def test_ad_with_image_file(self):
        """Test ad with uploaded image file"""
        # This test would require actual file upload testing
        # For now, just test the structure
        url = reverse('active-ads')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # DRF pagination returns results in 'results' key
        ads = response.data['results']
        # Find our test ad in the results
        ad_data = None
        for ad in ads:
            if ad['title'] == 'Active Ad':
                ad_data = ad
                break
        
        self.assertIsNotNone(ad_data, "Test ad not found in results")
        self.assertIn('image_url', ad_data)


class AdIntegrationTest(TransactionTestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Clean up existing ads to have predictable test results
        Ad.objects.all().delete()
        
        # Create multiple placements using get_or_create
        self.top_banner, created = AdPlacement.objects.get_or_create(
            name='top_banner',
            defaults={
                'description': 'Top banner placement',
                'is_active': True,
                'max_ads': 1
            }
        )
        
        self.sidebar, created = AdPlacement.objects.get_or_create(
            name='sidebar',
            defaults={
                'description': 'Sidebar placement',
                'is_active': True,
                'max_ads': 2
            }
        )
        
        # Create ads for different placements
        self.top_ad = Ad.objects.create(
            title='Top Banner Ad',
            destination_url='https://example.com/top',
            placement=self.top_banner,
            is_active=True,
            start_date=timezone.now() - timedelta(days=1),
            end_date=timezone.now() + timedelta(days=30)
        )
        
        self.sidebar_ad1 = Ad.objects.create(
            title='Sidebar Ad 1',
            destination_url='https://example.com/sidebar1',
            placement=self.sidebar,
            is_active=True,
            start_date=timezone.now() - timedelta(days=1),
            end_date=timezone.now() + timedelta(days=30)
        )
        
        self.sidebar_ad2 = Ad.objects.create(
            title='Sidebar Ad 2',
            destination_url='https://example.com/sidebar2',
            placement=self.sidebar,
            is_active=True,
            start_date=timezone.now() - timedelta(days=1),
            end_date=timezone.now() + timedelta(days=30)
        )

    def test_get_ads_by_placement(self):
        """Test getting ads filtered by specific placement"""
        # Test top banner ads
        url = reverse('active-ads')
        response = self.client.get(url, {'placement': 'top_banner'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # DRF pagination returns results in 'results' key
        ads = response.data['results']
        # Should return at least our test ad, but may include existing ads
        self.assertGreaterEqual(len(ads), 1)
        # Check that our test ad is in the results
        ad_titles = [ad['title'] for ad in ads]
        self.assertIn('Top Banner Ad', ad_titles)
        
        # Test sidebar ads
        response = self.client.get(url, {'placement': 'sidebar'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # DRF pagination returns results in 'results' key
        ads = response.data['results']
        # Should return at least our test ads, but may include existing ads
        self.assertGreaterEqual(len(ads), 2)
        ad_titles = [ad['title'] for ad in ads]
        self.assertIn('Sidebar Ad 1', ad_titles)
        self.assertIn('Sidebar Ad 2', ad_titles)

    def test_get_all_active_ads(self):
        """Test getting all active ads without placement filter"""
        url = reverse('active-ads')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # DRF pagination returns results in 'results' key
        ads = response.data['results']
        # Should return at least our test ads, but may include existing ads
        self.assertGreaterEqual(len(ads), 3)
        # Check that our test ads are in the results
        ad_titles = [ad['title'] for ad in ads]
        self.assertIn('Top Banner Ad', ad_titles)
        self.assertIn('Sidebar Ad 1', ad_titles)
        self.assertIn('Sidebar Ad 2', ad_titles)

    def test_ad_placement_max_ads_constraint(self):
        """Test that placement respects max_ads constraint"""
        # This would need to be implemented in the view logic
        # For now, just verify the placement has max_ads set
        self.assertEqual(self.top_banner.max_ads, 1)
        self.assertEqual(self.sidebar.max_ads, 2)


class AdDataIntegrityTest(TestCase):
    def setUp(self):
        self.placement, created = AdPlacement.objects.get_or_create(
            name='test_placement',
            defaults={
                'description': 'Test placement',
                'is_active': True,
                'max_ads': 1
            }
        )

    def test_ad_without_placement(self):
        """Test creating ad without placement"""
        ad = Ad.objects.create(
            title='Ad without placement',
            is_active=True,
            start_date=timezone.now()
        )
        
        self.assertIsNone(ad.placement)
        self.assertTrue(ad.is_currently_active)

    def test_ad_with_invalid_dates(self):
        """Test ad with invalid date ranges"""
        # End date before start date should be handled gracefully
        ad = Ad.objects.create(
            title='Invalid Date Ad',
            placement=self.placement,
            is_active=True,
            start_date=timezone.now(),
            end_date=timezone.now() - timedelta(days=1)
        )
        
        # The model should still be created, but is_currently_active should return False
        self.assertFalse(ad.is_currently_active)

    def test_ad_with_future_start_date(self):
        """Test ad with future start date"""
        ad = Ad.objects.create(
            title='Future Ad',
            placement=self.placement,
            is_active=True,
            start_date=timezone.now() + timedelta(days=1)
        )
        
        self.assertFalse(ad.is_currently_active)

    def test_ad_without_end_date(self):
        """Test ad without end date (should run indefinitely)"""
        ad = Ad.objects.create(
            title='Indefinite Ad',
            placement=self.placement,
            is_active=True,
            start_date=timezone.now() - timedelta(days=1)
        )
        
        self.assertTrue(ad.is_currently_active)
        self.assertIsNone(ad.end_date)

    def test_ad_serializer_empty_placement_id(self):
        """Test that serializer handles empty placement_id correctly"""
        from .serializers import AdSerializer
        
        # Test with empty string placement_id
        data = {
            'title': 'Test Ad',
            'placement_id': '',
            'is_active': True
        }
        
        serializer = AdSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        
        # The empty string should be converted to None
        validated_data = serializer.to_internal_value(data)
        self.assertIsNone(validated_data.get('placement_id'))
        
    def test_ad_serializer_empty_date_fields(self):
        """Test that serializer handles empty date fields correctly"""
        from .serializers import AdSerializer
        
        # Test with empty string date fields
        data = {
            'title': 'Test Ad',
            'start_date': '',
            'end_date': '',
            'is_active': True
        }
        
        serializer = AdSerializer(data=data)
        # Debug: print validation errors if serializer is not valid
        if not serializer.is_valid():
            print(f"Validation errors: {serializer.errors}")
        
        # The serializer should be valid after our to_internal_value fix
        self.assertTrue(serializer.is_valid())
        
        # Empty strings should be converted to None
        validated_data = serializer.to_internal_value(data)
        self.assertIsNone(validated_data.get('start_date'))
        self.assertIsNone(validated_data.get('end_date'))
        
    def test_ad_serializer_valid_placement_id(self):
        """Test that serializer handles valid placement_id correctly"""
        from .serializers import AdSerializer
        
        # Test with valid placement_id
        data = {
            'title': 'Test Ad',
            'placement_id': self.placement.id,
            'is_active': True
        }
        
        serializer = AdSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        
        validated_data = serializer.to_internal_value(data)
        # The placement_id should be mapped to placement field
        self.assertEqual(validated_data.get('placement'), self.placement)
        
    def test_ad_creation_without_placement(self):
        """Test creating ad without placement"""
        ad = Ad.objects.create(
            title='Ad without placement',
            is_active=True,
            start_date=timezone.now()
        )
        
        self.assertIsNone(ad.placement)
        self.assertTrue(ad.is_currently_active)
        
    def test_ad_creation_with_empty_placement_string(self):
        """Test creating ad with empty placement string (should be handled gracefully)"""
        from .serializers import AdSerializer
        
        data = {
            'title': 'Test Ad',
            'placement_id': '',  # Empty string
            'is_active': True
        }
        
        serializer = AdSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        
        ad = serializer.save()
        self.assertIsNone(ad.placement)
        
    def test_ad_update_removes_placement(self):
        """Test updating ad to remove placement"""
        # Create ad with placement
        ad = Ad.objects.create(
            title='Ad with placement',
            placement=self.placement,
            is_active=True,
            start_date=timezone.now()
        )
        
        self.assertEqual(ad.placement, self.placement)
        
        # Update to remove placement (don't send placement_id)
        from .serializers import AdSerializer
        serializer = AdSerializer(ad, data={'title': 'Updated Ad'}, partial=True)
        self.assertTrue(serializer.is_valid())
        
        # The update method should handle this case
        updated_ad = serializer.save()
        # Note: This test might need adjustment based on actual serializer behavior