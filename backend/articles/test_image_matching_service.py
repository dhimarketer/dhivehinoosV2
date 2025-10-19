from django.test import TestCase
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from unittest.mock import patch, MagicMock
import json

from .models import Article, Category
from .models import ReusableImage, ImageVerification, ImageReuseSettings
from .image_matching_service import ImageMatchingService


class ImageMatchingServiceTest(TestCase):
    """Test cases for ImageMatchingService"""
    
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
        
        # Create test reusable images
        self.president_image = ReusableImage.objects.create(
            entity_name="Ibrahim Mohamed Solih",
            entity_type="politician",
            image_file=self.test_image,
            image_variant="portrait",
            alternative_names=["Ibu Solih", "President Solih"],
            name_variations=["އިބްރާހިމް މުހައްމަދު ސޮލިހު"],
            tags="president, maldives, politics",
            is_verified=True
        )
        
        self.parliament_image = ReusableImage.objects.create(
            entity_name="Maldives Parliament",
            entity_type="institution",
            image_file=self.test_image,
            image_variant="exterior",
            alternative_names=["Majlis", "People's Majlis"],
            name_variations=["މަޖިލިސް"],
            tags="parliament, government, building"
        )
        
        self.service = ImageMatchingService()
    
    def test_extract_names_politician(self):
        """Test extracting politician names from content"""
        content = "President Ibrahim Mohamed Solih announced new policies today."
        names = self.service.extract_names(content)
        
        self.assertIn("Ibrahim Mohamed Solih", names)
    
    def test_extract_names_institution(self):
        """Test extracting institution names from content"""
        content = "The Maldives Parliament passed a new bill today."
        names = self.service.extract_names(content)
        
        self.assertIn("Maldives Parliament", names)
    
    def test_extract_names_with_title(self):
        """Test extracting names with title included"""
        content = "ރައްޔިތުން ހުރިހާ އެސީ އިބްރާހިމް މުހައްމަދު ސޮލިހު"
        names = self.service.extract_names(content)
        
        # Should extract the name from the Dhivehi text
        self.assertTrue(len(names) > 0)
    
    def test_get_images_for_name_exact_match(self):
        """Test getting images for exact name match"""
        images = self.service.get_images_for_name("Ibrahim Mohamed Solih")
        
        self.assertEqual(len(images), 1)
        self.assertEqual(images[0], self.president_image)
    
    def test_get_images_for_name_alternative_name(self):
        """Test getting images for alternative name"""
        images = self.service.get_images_for_name("Ibu Solih")
        
        self.assertEqual(len(images), 1)
        self.assertEqual(images[0], self.president_image)
    
    def test_get_images_for_name_variation(self):
        """Test getting images for name variation"""
        images = self.service.get_images_for_name("އިބްރާހިމް މުހައްމަދު ސޮލިހު")
        
        self.assertEqual(len(images), 1)
        self.assertEqual(images[0], self.president_image)
    
    def test_get_images_for_name_tag_match(self):
        """Test getting images for tag match"""
        images = self.service.get_images_for_name("president")
        
        self.assertEqual(len(images), 1)
        self.assertEqual(images[0], self.president_image)
    
    def test_calculate_confidence_exact_match(self):
        """Test confidence calculation for exact match"""
        confidence = self.service.calculate_confidence(
            "Ibrahim Mohamed Solih", 
            self.president_image
        )
        
        self.assertEqual(confidence, 1.0)
    
    def test_calculate_confidence_partial_match(self):
        """Test confidence calculation for partial match"""
        confidence = self.service.calculate_confidence(
            "Ibrahim", 
            self.president_image
        )
        
        self.assertEqual(confidence, 0.9)
    
    def test_calculate_confidence_alternative_name(self):
        """Test confidence calculation for alternative name"""
        confidence = self.service.calculate_confidence(
            "Ibu Solih", 
            self.president_image
        )
        
        self.assertEqual(confidence, 0.95)
    
    def test_calculate_confidence_name_variation(self):
        """Test confidence calculation for name variation"""
        confidence = self.service.calculate_confidence(
            "އިބްރާހިމް މުހައްމަދު ސޮލިހު", 
            self.president_image
        )
        
        self.assertEqual(confidence, 0.9)
    
    def test_calculate_confidence_tag_match(self):
        """Test confidence calculation for tag match"""
        confidence = self.service.calculate_confidence(
            "president", 
            self.president_image
        )
        
        self.assertEqual(confidence, 0.7)
    
    def test_calculate_confidence_no_match(self):
        """Test confidence calculation for no match"""
        confidence = self.service.calculate_confidence(
            "Random Name", 
            self.president_image
        )
        
        self.assertLess(confidence, 0.5)
    
    def test_find_matching_images(self):
        """Test finding matching images for content"""
        content = "President Ibrahim Mohamed Solih announced new policies."
        matches = self.service.find_matching_images(content)
        
        self.assertEqual(len(matches), 1)
        self.assertEqual(matches[0]['image'], self.president_image)
        self.assertEqual(matches[0]['matched_name'], "Ibrahim Mohamed Solih")
        self.assertGreater(matches[0]['confidence'], 0.5)
    
    def test_find_matching_images_multiple_matches(self):
        """Test finding multiple matching images"""
        # Create another image for the same person
        another_image = ReusableImage.objects.create(
            entity_name="Ibrahim Mohamed Solih",
            entity_type="politician",
            image_file=self.test_image,
            image_variant="official",
            image_sequence=2
        )
        
        content = "President Ibrahim Mohamed Solih announced new policies."
        matches = self.service.find_matching_images(content)
        
        self.assertEqual(len(matches), 2)
        # Should be sorted by verification status and confidence
        self.assertTrue(matches[0]['image'].is_verified)
    
    def test_select_best_image_high_confidence_auto_approve(self):
        """Test selecting best image with high confidence auto-approval"""
        # Set settings for auto-approval
        settings = ImageReuseSettings.get_settings()
        settings.auto_verify_high_confidence = True
        settings.high_confidence_threshold = 0.8
        settings.save()
        
        matches = [{
            'image': self.president_image,
            'confidence': 0.9,
            'matched_name': 'Ibrahim Mohamed Solih'
        }]
        
        best_match = self.service.select_best_image(matches)
        
        self.assertIsNotNone(best_match)
        self.assertTrue(best_match.get('auto_approved', False))
        self.assertEqual(best_match['auto_approval_reason'], 'High confidence auto-approval')
    
    def test_select_best_image_manual_verification_required(self):
        """Test selecting best image when manual verification is required"""
        # Set settings for manual verification
        settings = ImageReuseSettings.get_settings()
        settings.require_manual_verification = True
        settings.verification_required_for = ['politician']
        settings.save()
        
        matches = [{
            'image': self.president_image,
            'confidence': 0.9,
            'matched_name': 'Ibrahim Mohamed Solih'
        }]
        
        with patch.object(self.service, 'create_verification_record') as mock_create:
            best_match = self.service.select_best_image(matches)
            
            self.assertIsNone(best_match)
            mock_create.assert_called_once()
    
    def test_select_best_image_no_fallback(self):
        """Test selecting best image when fallback is not allowed"""
        # Set settings to not allow fallback
        settings = ImageReuseSettings.get_settings()
        settings.allow_unverified_fallback = False
        settings.save()
        
        # Create unverified image
        unverified_image = ReusableImage.objects.create(
            entity_name="Test Person",
            entity_type="politician",
            image_file=self.test_image,
            is_verified=False
        )
        
        matches = [{
            'image': unverified_image,
            'confidence': 0.7,
            'matched_name': 'Test Person'
        }]
        
        best_match = self.service.select_best_image(matches)
        
        self.assertIsNone(best_match)
    
    def test_create_verification_record(self):
        """Test creating verification record"""
        article = Article.objects.create(
            title="Test Article",
            content="This is a test article about Ibrahim Mohamed Solih",
            category=self.category
        )
        
        match = {
            'image': self.president_image,
            'confidence': 0.85,
            'matched_name': 'Ibrahim Mohamed Solih',
            'article': article
        }
        
        verification = self.service.create_verification_record(match)
        
        self.assertEqual(verification.reusable_image, self.president_image)
        self.assertEqual(verification.article, article)
        self.assertEqual(verification.confidence_score, 0.85)
        self.assertEqual(verification.matched_name, 'Ibrahim Mohamed Solih')
        self.assertEqual(verification.status, 'pending')
    
    @patch('django.core.mail.send_mail')
    def test_send_verification_notification(self, mock_send_mail):
        """Test sending verification notification"""
        # Set up settings for notifications
        settings = ImageReuseSettings.get_settings()
        settings.notify_on_pending_verification = True
        settings.verification_email_recipients = ['admin@example.com']
        settings.save()
        
        article = Article.objects.create(
            title="Test Article",
            content="This is a test article about Ibrahim Mohamed Solih",
            category=self.category
        )
        
        verification = ImageVerification.objects.create(
            reusable_image=self.president_image,
            article=article,
            confidence_score=0.85,
            matched_name='Ibrahim Mohamed Solih'
        )
        
        self.service.send_verification_notification(verification)
        
        mock_send_mail.assert_called_once()
        call_args = mock_send_mail.call_args
        self.assertIn('Image Verification Required', call_args[0][0])
        self.assertIn('Ibrahim Mohamed Solih', call_args[0][1])
    
    def test_apply_image_to_article(self):
        """Test applying image to article"""
        article = Article.objects.create(
            title="Test Article",
            content="This is a test article about Ibrahim Mohamed Solih",
            category=self.category
        )
        
        match = {
            'image': self.president_image,
            'confidence': 0.9,
            'matched_name': 'Ibrahim Mohamed Solih'
        }
        
        self.service.apply_image_to_article(article, match)
        
        article.refresh_from_db()
        self.assertEqual(article.reused_image, self.president_image)
        self.assertEqual(article.image_source, 'reused')
        
        # Check usage count was incremented
        self.president_image.refresh_from_db()
        self.assertEqual(self.president_image.usage_count, 1)
    
    def test_process_article_for_image_reuse(self):
        """Test processing article for image reuse"""
        article = Article.objects.create(
            title="Test Article",
            content="President Ibrahim Mohamed Solih announced new policies today.",
            category=self.category
        )
        
        result = self.service.process_article_for_image_reuse(article)
        
        self.assertTrue(result)
        article.refresh_from_db()
        self.assertEqual(article.reused_image, self.president_image)
        self.assertEqual(article.image_source, 'reused')
    
    def test_process_article_no_match(self):
        """Test processing article with no matching images"""
        article = Article.objects.create(
            title="Test Article",
            content="This is about something completely different.",
            category=self.category
        )
        
        result = self.service.process_article_for_image_reuse(article)
        
        self.assertFalse(result)
        article.refresh_from_db()
        self.assertIsNone(article.reused_image)
        self.assertEqual(article.image_source, 'external')
    
    def test_get_verification_stats(self):
        """Test getting verification statistics"""
        # Create some test verifications
        article1 = Article.objects.create(
            title="Article 1",
            content="Test content",
            category=self.category
        )
        
        article2 = Article.objects.create(
            title="Article 2",
            content="Test content",
            category=self.category
        )
        
        ImageVerification.objects.create(
            reusable_image=self.president_image,
            article=article1,
            confidence_score=0.85,
            matched_name='Ibrahim Mohamed Solih',
            status='pending'
        )
        
        ImageVerification.objects.create(
            reusable_image=self.parliament_image,
            article=article2,
            confidence_score=0.75,
            matched_name='Maldives Parliament',
            status='approved'
        )
        
        stats = self.service.get_verification_stats()
        
        self.assertEqual(stats['pending'], 1)
        self.assertEqual(stats['approved'], 1)
        self.assertEqual(stats['rejected'], 0)
        self.assertEqual(stats['needs_revision'], 0)
        self.assertEqual(stats['total_verifications'], 2)


class ImageMatchingServiceIntegrationTest(TestCase):
    """Integration tests for ImageMatchingService"""
    
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
        
        self.service = ImageMatchingService()
    
    def test_end_to_end_image_reuse_workflow(self):
        """Test complete end-to-end image reuse workflow"""
        # Create reusable image
        reusable_image = ReusableImage.objects.create(
            entity_name="Ibrahim Mohamed Solih",
            entity_type="politician",
            image_file=self.test_image,
            alternative_names=["Ibu Solih", "President Solih"],
            name_variations=["އިބްރާހިމް މުހައްމަދު ސޮލިހު"],
            tags="president, maldives, politics",
            is_verified=True
        )
        
        # Create article
        article = Article.objects.create(
            title="President Announces New Policy",
            content="President Ibrahim Mohamed Solih announced new economic policies today.",
            category=self.category
        )
        
        # Process article for image reuse
        result = self.service.process_article_for_image_reuse(article)
        
        # Verify result
        self.assertTrue(result)
        article.refresh_from_db()
        self.assertEqual(article.reused_image, reusable_image)
        self.assertEqual(article.image_source, 'reused')
        
        # Verify usage tracking
        reusable_image.refresh_from_db()
        self.assertEqual(reusable_image.usage_count, 1)
        self.assertIsNotNone(reusable_image.last_used)
    
    def test_verification_workflow_integration(self):
        """Test complete verification workflow integration"""
        # Set up settings for manual verification
        settings = ImageReuseSettings.get_settings()
        settings.require_manual_verification = True
        settings.verification_required_for = ['politician']
        settings.save()
        
        # Create reusable image
        reusable_image = ReusableImage.objects.create(
            entity_name="Ibrahim Mohamed Solih",
            entity_type="politician",
            image_file=self.test_image,
            is_verified=False
        )
        
        # Create article
        article = Article.objects.create(
            title="President Announces New Policy",
            content="President Ibrahim Mohamed Solih announced new economic policies today.",
            category=self.category
        )
        
        # Process article for image reuse
        result = self.service.process_article_for_image_reuse(article)
        
        # Should create verification record but not apply image
        self.assertFalse(result)
        
        # Check verification was created
        verifications = ImageVerification.objects.filter(
            reusable_image=reusable_image,
            article=article
        )
        self.assertEqual(verifications.count(), 1)
        
        verification = verifications.first()
        self.assertEqual(verification.status, 'pending')
        self.assertEqual(verification.matched_name, 'Ibrahim Mohamed Solih')
        
        # Approve verification
        verification.approve(self.user, "Good match")
        
        # Verify approval
        self.assertEqual(verification.status, 'approved')
        self.assertEqual(verification.reviewed_by, self.user)
        self.assertIsNotNone(verification.reviewed_at)
