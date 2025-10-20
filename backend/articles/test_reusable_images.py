from django.test import TestCase
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from unittest.mock import patch, MagicMock
import json
import tempfile
import os

from .models import Article, Category
from .models import ReusableImage, ImageVerification, ImageReuseSettings


class ImageReuseSettingsModelTest(TestCase):
    """Test cases for ImageReuseSettings model"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_create_settings(self):
        """Test creating settings instance"""
        settings = ImageReuseSettings.get_settings()
        self.assertIsNotNone(settings)
        self.assertTrue(settings.auto_verify_high_confidence)
        self.assertEqual(settings.high_confidence_threshold, 0.9)
        self.assertFalse(settings.require_manual_verification)
        self.assertTrue(settings.prefer_verified_images)
        self.assertTrue(settings.allow_unverified_fallback)
        self.assertTrue(settings.notify_on_pending_verification)
    
    def test_default_patterns(self):
        """Test that default patterns are set"""
        settings = ImageReuseSettings.get_settings()
        self.assertIsInstance(settings.politician_name_patterns, list)
        self.assertIsInstance(settings.institution_name_patterns, list)
        self.assertTrue(len(settings.politician_name_patterns) > 0)
        self.assertTrue(len(settings.institution_name_patterns) > 0)
    
    def test_string_representation(self):
        """Test string representation"""
        settings = ImageReuseSettings.get_settings()
        self.assertEqual(str(settings), "Image Reuse Settings")


class ReusableImageModelTest(TestCase):
    """Test cases for ReusableImage model"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        # Create a test image file
        self.test_image = SimpleUploadedFile(
            "test_image.jpg",
            b"fake image content",
            content_type="image/jpeg"
        )
    
    def test_create_reusable_image(self):
        """Test creating a reusable image"""
        image = ReusableImage.objects.create(
            entity_name="Ibrahim Mohamed Solih",
            entity_type="politician",
            image_file=self.test_image,
            alternative_names="Ibu Solih, President Solih",
            description="Official portrait of President Ibrahim Mohamed Solih"
        )
        
        self.assertEqual(image.entity_name, "Ibrahim Mohamed Solih")
        self.assertEqual(image.entity_type, "politician")
        self.assertEqual(image.usage_count, 0)
        self.assertTrue(image.is_active)
        self.assertIsNotNone(image.slug)
        self.assertIsNotNone(image.display_name)
    
    def test_auto_generate_slug(self):
        """Test automatic slug generation"""
        image = ReusableImage.objects.create(
            entity_name="Ibrahim Mohamed Solih",
            entity_type="politician",
            image_file=self.test_image
        )
        
        expected_slug = "ibrahim-mohamed-solih"
        self.assertEqual(image.slug, expected_slug)
    
    def test_auto_generate_display_name(self):
        """Test automatic display name generation"""
        image = ReusableImage.objects.create(
            entity_name="Ibrahim Mohamed Solih",
            entity_type="politician",
            image_file=self.test_image
        )
        
        expected_display_name = "Ibrahim Mohamed Solih"
        self.assertEqual(image.display_name, expected_display_name)
    
    def test_unique_slug_constraint(self):
        """Test unique slug constraint"""
        # Create first image
        ReusableImage.objects.create(
            entity_name="Ibrahim Mohamed Solih",
            entity_type="politician",
            image_file=self.test_image
        )
        
        # Create second image with same entity name should get different slug
        image2 = ReusableImage.objects.create(
            entity_name="Ibrahim Mohamed Solih",
            entity_type="politician",
            image_file=self.test_image
        )
        
        # Should have different slugs
        self.assertNotEqual(ReusableImage.objects.first().slug, image2.slug)
    
    def test_increment_usage(self):
        """Test usage count increment"""
        image = ReusableImage.objects.create(
            entity_name="Ibrahim Mohamed Solih",
            entity_type="politician",
            image_file=self.test_image
        )
        
        initial_count = image.usage_count
        initial_last_used = image.last_used
        
        image.increment_usage()
        
        self.assertEqual(image.usage_count, initial_count + 1)
        self.assertIsNotNone(image.last_used)
        self.assertNotEqual(image.last_used, initial_last_used)
    
    def test_get_all_names(self):
        """Test getting all possible names for an image"""
        image = ReusableImage.objects.create(
            entity_name="Ibrahim Mohamed Solih",
            entity_type="politician",
            image_file=self.test_image,
            alternative_names="Ibu Solih, President Solih"
        )
        
        all_names = image.get_all_names()
        expected_names = [
            "Ibrahim Mohamed Solih",
            "Ibu Solih",
            "President Solih"
        ]
        
        self.assertEqual(set(all_names), set(expected_names))
    
    def test_string_representation(self):
        """Test string representation"""
        image = ReusableImage.objects.create(
            entity_name="Ibrahim Mohamed Solih",
            entity_type="politician",
            image_file=self.test_image
        )
        
        expected = "Ibrahim Mohamed Solih"
        self.assertEqual(str(image), expected)


class ImageVerificationModelTest(TestCase):
    """Test cases for ImageVerification model"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        self.test_image = SimpleUploadedFile(
            "test_image.jpg",
            b"fake image content",
            content_type="image/jpeg"
        )
        
        self.reusable_image = ReusableImage.objects.create(
            entity_name="Ibrahim Mohamed Solih",
            entity_type="politician",
            image_file=self.test_image
        )
        
        self.category = Category.objects.create(
            name="Politics",
            keywords="politics, government, president"
        )
        
        self.article = Article.objects.create(
            title="Test Article",
            content="This is a test article about Ibrahim Mohamed Solih",
            category=self.category
        )
    
    def test_create_verification(self):
        """Test creating an image verification"""
        verification = ImageVerification.objects.create(
            reusable_image=self.reusable_image,
            article=self.article,
            confidence_score=0.85,
            matched_name="Ibrahim Mohamed Solih"
        )
        
        self.assertEqual(verification.reusable_image, self.reusable_image)
        self.assertEqual(verification.article, self.article)
        self.assertEqual(verification.confidence_score, 0.85)
        self.assertEqual(verification.matched_name, "Ibrahim Mohamed Solih")
        self.assertEqual(verification.status, "pending")
        self.assertFalse(verification.auto_approved)
    
    def test_approve_verification(self):
        """Test approving a verification"""
        verification = ImageVerification.objects.create(
            reusable_image=self.reusable_image,
            article=self.article,
            confidence_score=0.85,
            matched_name="Ibrahim Mohamed Solih"
        )
        
        verification.approve(self.user, "Looks good")
        
        self.assertEqual(verification.status, "approved")
        self.assertEqual(verification.reviewed_by, self.user)
        self.assertIsNotNone(verification.reviewed_at)
        self.assertEqual(verification.admin_notes, "Looks good")
    
    def test_reject_verification(self):
        """Test rejecting a verification"""
        verification = ImageVerification.objects.create(
            reusable_image=self.reusable_image,
            article=self.article,
            confidence_score=0.85,
            matched_name="Ibrahim Mohamed Solih"
        )
        
        verification.reject(self.user, "Not a good match")
        
        self.assertEqual(verification.status, "rejected")
        self.assertEqual(verification.reviewed_by, self.user)
        self.assertIsNotNone(verification.reviewed_at)
        self.assertEqual(verification.admin_notes, "Not a good match")
    
    def test_mark_needs_revision(self):
        """Test marking verification as needing revision"""
        verification = ImageVerification.objects.create(
            reusable_image=self.reusable_image,
            article=self.article,
            confidence_score=0.85,
            matched_name="Ibrahim Mohamed Solih"
        )
        
        verification.mark_needs_revision(self.user, "Need better image")
        
        self.assertEqual(verification.status, "needs_revision")
        self.assertEqual(verification.reviewed_by, self.user)
        self.assertIsNotNone(verification.reviewed_at)
        self.assertEqual(verification.admin_notes, "Need better image")
    
    def test_string_representation(self):
        """Test string representation"""
        verification = ImageVerification.objects.create(
            reusable_image=self.reusable_image,
            article=self.article,
            confidence_score=0.85,
            matched_name="Ibrahim Mohamed Solih"
        )
        
        expected = "Ibrahim Mohamed Solih - Test Article (pending)"
        self.assertEqual(str(verification), expected)


class ArticleModelImageReuseTest(TestCase):
    """Test cases for Article model with image reuse fields"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        self.test_image = SimpleUploadedFile(
            "test_image.jpg",
            b"fake image content",
            content_type="image/jpeg"
        )
        
        self.reusable_image = ReusableImage.objects.create(
            entity_name="Ibrahim Mohamed Solih",
            entity_type="politician",
            image_file=self.test_image
        )
        
        self.category = Category.objects.create(
            name="Politics",
            keywords="politics, government, president"
        )
    
    def test_article_with_reused_image(self):
        """Test article with reused image"""
        article = Article.objects.create(
            title="Test Article",
            content="This is a test article about Ibrahim Mohamed Solih",
            category=self.category,
            reused_image=self.reusable_image,
            image_source="reused"
        )
        
        self.assertEqual(article.reused_image, self.reusable_image)
        self.assertEqual(article.image_source, "reused")
    
    def test_article_with_generated_image(self):
        """Test article with generated image"""
        article = Article.objects.create(
            title="Test Article",
            content="This is a test article",
            category=self.category,
            image_source="generated"
        )
        
        self.assertEqual(article.image_source, "generated")
        self.assertIsNone(article.reused_image)
    
    def test_article_with_external_image(self):
        """Test article with external image"""
        article = Article.objects.create(
            title="Test Article",
            content="This is a test article",
            category=self.category,
            image="https://example.com/image.jpg",
            image_source="external"
        )
        
        self.assertEqual(article.image_source, "external")
        self.assertEqual(article.image, "https://example.com/image.jpg")
        self.assertIsNone(article.reused_image)


class ImageReuseIntegrationTest(TestCase):
    """Integration tests for image reuse system"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        self.test_image = SimpleUploadedFile(
            "test_image.jpg",
            b"fake image content",
            content_type="image/jpeg"
        )
        
        self.category = Category.objects.create(
            name="Politics",
            keywords="politics, government, president"
        )
    
    def test_reusable_image_usage_tracking(self):
        """Test that usage tracking works correctly"""
        # Create reusable image
        reusable_image = ReusableImage.objects.create(
            entity_name="Ibrahim Mohamed Solih",
            entity_type="politician",
            image_file=self.test_image
        )
        
        # Create article with reused image
        article = Article.objects.create(
            title="Test Article",
            content="This is a test article about Ibrahim Mohamed Solih",
            category=self.category,
            reused_image=reusable_image,
            image_source="reused"
        )
        
        # Manually increment usage to test the method
        reusable_image.increment_usage()
        
        # Check that usage count is incremented
        reusable_image.refresh_from_db()
        self.assertEqual(reusable_image.usage_count, 1)
        self.assertIsNotNone(reusable_image.last_used)
    
    def test_verification_workflow(self):
        """Test the complete verification workflow"""
        # Create reusable image
        reusable_image = ReusableImage.objects.create(
            entity_name="Ibrahim Mohamed Solih",
            entity_type="politician",
            image_file=self.test_image
        )
        
        # Create article
        article = Article.objects.create(
            title="Test Article",
            content="This is a test article about Ibrahim Mohamed Solih",
            category=self.category
        )
        
        # Create verification
        verification = ImageVerification.objects.create(
            reusable_image=reusable_image,
            article=article,
            confidence_score=0.85,
            matched_name="Ibrahim Mohamed Solih"
        )
        
        # Approve verification
        verification.approve(self.user, "Good match")
        
        # Check that verification is approved
        self.assertEqual(verification.status, "approved")
        self.assertEqual(verification.reviewed_by, self.user)
        self.assertIsNotNone(verification.reviewed_at)
    
    def test_settings_persistence(self):
        """Test that settings are persisted correctly"""
        settings = ImageReuseSettings.get_settings()
        
        # Modify settings
        settings.auto_verify_high_confidence = False
        settings.high_confidence_threshold = 0.8
        settings.require_manual_verification = True
        settings.updated_by = self.user
        settings.save()
        
        # Retrieve settings again
        settings2 = ImageReuseSettings.get_settings()
        
        self.assertFalse(settings2.auto_verify_high_confidence)
        self.assertEqual(settings2.high_confidence_threshold, 0.8)
        self.assertTrue(settings2.require_manual_verification)
        self.assertEqual(settings2.updated_by, self.user)