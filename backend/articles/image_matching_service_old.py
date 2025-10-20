import re
import difflib
from typing import List, Dict, Optional, Tuple
from django.db.models import Q
from django.conf import settings
from .models import Article, ReusableImage, ImageVerification, ImageReuseSettings


class ImageMatchingService:
    """Service for matching article content with reusable images"""
    
    def __init__(self):
        self.settings = ImageReuseSettings.get_settings()
    
    def find_matching_images(self, article_content: str, article_title: str = '') -> List[Dict]:
        """
        Find matching images for article content
        
        Args:
            article_content: The article content to search
            article_title: The article title (optional)
            
        Returns:
            List of matching images with confidence scores
        """
        # Extract names from content
        extracted_names = self.extract_names(article_content, article_title)
        
        if not extracted_names:
            return []
        
        matches = []
        for name in extracted_names:
            # Find images for this name
            images = self.get_images_for_name(name)
            
            for image in images:
                confidence = self.calculate_confidence(name, image)
                if confidence >= 0.5:  # Minimum threshold
                    matches.append({
                        'image': image,
                        'confidence': confidence,
                        'matched_name': name
                    })
        
        # Sort by confidence and verification status
        matches.sort(key=lambda x: (
            x['image'].is_verified,
            x['confidence']
        ), reverse=True)
        
        return matches
    
    def select_best_image(self, matches: List[Dict]) -> Optional[Dict]:
        """
        Select the best image based on settings and verification status
        
        Args:
            matches: List of matching images
            
        Returns:
            Best matching image or None
        """
        if not matches:
            return None
        
        best_match = matches[0]
        
        # If auto-verification is enabled and we have high confidence
        if (self.settings.auto_verify_high_confidence and 
            best_match['confidence'] >= self.settings.high_confidence_threshold):
            best_match['auto_approved'] = True
            best_match['auto_approval_reason'] = 'High confidence auto-approval'
            return best_match
        
        # If manual verification is required for this entity type
        entity_type = best_match['image'].entity_type
        if (self.settings.require_manual_verification and 
            entity_type in self.settings.verification_required_for):
            # Create verification record for admin review
            self.create_verification_record(best_match)
            return None
        
        # Return best match if fallback is allowed
        if self.settings.allow_unverified_fallback:
            return best_match
        
        return None
    
    def extract_names(self, content: str, title: str = '') -> List[str]:
        """
        Extract names from article content using regex patterns
        
        Args:
            content: Article content
            title: Article title
            
        Returns:
            List of extracted names
        """
        names = set()
        text_to_search = f"{title} {content}".lower()
        
        # Extract politician names
        for pattern in self.settings.politician_name_patterns:
            matches = re.findall(pattern, text_to_search, re.IGNORECASE)
            for match in matches:
                if isinstance(match, tuple):
                    match = match[0]  # Get first group
                names.add(match.strip())
        
        # Extract institution names
        for pattern in self.settings.institution_name_patterns:
            matches = re.findall(pattern, text_to_search, re.IGNORECASE)
            for match in matches:
                if isinstance(match, tuple):
                    match = match[0]  # Get first group
                names.add(match.strip())
        
        # Also check for common name patterns
        common_patterns = [
            r'\b([A-Z][a-z]+ [A-Z][a-z]+)\b',  # First Last
            r'\b([A-Z][a-z]+ [A-Z]\. [A-Z][a-z]+)\b',  # First M. Last
        ]
        
        for pattern in common_patterns:
            matches = re.findall(pattern, content)
            for match in matches:
                names.add(match.strip())
        
        return list(names)
    
    def get_images_for_name(self, name: str) -> List[ReusableImage]:
        """
        Get all images that match the given name
        
        Args:
            name: Name to search for
            
        Returns:
            List of matching ReusableImage objects
        """
        # Create search query
        query = Q(entity_name__icontains=name)
        query |= Q(alternative_names__icontains=name)
        query |= Q(name_variations__icontains=name)
        query |= Q(tags__icontains=name)
        
        # Only get active images
        query &= Q(is_active=True)
        
        return ReusableImage.objects.filter(query)
    
    def calculate_confidence(self, name: str, image: ReusableImage) -> float:
        """
        Calculate confidence score for name-image match
        
        Args:
            name: The name being matched
            image: The ReusableImage object
            
        Returns:
            Confidence score between 0.0 and 1.0
        """
        name_lower = name.lower().strip()
        confidence = 0.0
        
        # Check exact match with entity name
        if name_lower == image.entity_name.lower():
            confidence = 1.0
        elif name_lower in image.entity_name.lower():
            confidence = 0.9
        
        # Check alternative names
        for alt_name in image.alternative_names:
            if name_lower == alt_name.lower():
                confidence = max(confidence, 0.95)
            elif name_lower in alt_name.lower():
                confidence = max(confidence, 0.85)
        
        # Check name variations
        for variation in image.name_variations:
            if name_lower == variation.lower():
                confidence = max(confidence, 0.9)
            elif name_lower in variation.lower():
                confidence = max(confidence, 0.8)
        
        # Check tags
        if image.tags:
            tags = [tag.strip().lower() for tag in image.tags.split(',')]
            for tag in tags:
                if name_lower == tag:
                    confidence = max(confidence, 0.7)
                elif name_lower in tag:
                    confidence = max(confidence, 0.6)
        
        # Use fuzzy matching as fallback
        if confidence < 0.5:
            fuzzy_score = self.fuzzy_match(name, image)
            confidence = max(confidence, fuzzy_score)
        
        return min(confidence, 1.0)
    
    def fuzzy_match(self, name: str, image: ReusableImage) -> float:
        """
        Perform fuzzy matching between name and image
        
        Args:
            name: The name being matched
            image: The ReusableImage object
            
        Returns:
            Fuzzy match score between 0.0 and 1.0
        """
        name_lower = name.lower().strip()
        best_score = 0.0
        
        # Check against entity name
        score = difflib.SequenceMatcher(None, name_lower, image.entity_name.lower()).ratio()
        best_score = max(best_score, score)
        
        # Check against alternative names
        for alt_name in image.alternative_names:
            score = difflib.SequenceMatcher(None, name_lower, alt_name.lower()).ratio()
            best_score = max(best_score, score)
        
        # Check against name variations
        for variation in image.name_variations:
            score = difflib.SequenceMatcher(None, name_lower, variation.lower()).ratio()
            best_score = max(best_score, score)
        
        # Only return scores above 0.6 for fuzzy matching
        return best_score if best_score > 0.6 else 0.0
    
    def create_verification_record(self, match: Dict) -> ImageVerification:
        """
        Create a verification record for admin review
        
        Args:
            match: The matching image data
            
        Returns:
            Created ImageVerification object
        """
        verification = ImageVerification.objects.create(
            reusable_image=match['image'],
            article=match.get('article'),
            confidence_score=match['confidence'],
            matched_name=match['matched_name'],
            status='pending'
        )
        
        # Send notification if enabled
        if self.settings.notify_on_pending_verification:
            self.send_verification_notification(verification)
        
        return verification
    
    def send_verification_notification(self, verification: ImageVerification):
        """Send email notification for pending verification"""
        try:
            from django.core.mail import send_mail
            from django.conf import settings
            
            recipients = self.settings.verification_email_recipients
            if not recipients:
                return
            
            subject = f"Image Verification Required: {verification.reusable_image.entity_name}"
            message = f"""
            A new image verification is pending:
            
            Entity: {verification.reusable_image.entity_name}
            Article: {verification.article.title}
            Confidence: {verification.confidence_score}
            Matched Name: {verification.matched_name}
            
            Please review at: {settings.SITE_URL}/admin/articles/imageverification/{verification.id}/
            """
            
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                recipients,
                fail_silently=True
            )
        except Exception as e:
            # Log error but don't fail the process
            print(f"Failed to send verification notification: {e}")
    
    def process_article_for_image_reuse(self, article: Article) -> bool:
        """
        Process an article to find and apply image reuse
        
        Args:
            article: The Article object to process
            
        Returns:
            True if image was reused, False otherwise
        """
        # Find matching images
        matches = self.find_matching_images(article.content, article.title)
        
        if not matches:
            return False
        
        # Select best image
        best_match = self.select_best_image(matches)
        
        if not best_match:
            return False
        
        # Apply the image to the article
        self.apply_image_to_article(article, best_match)
        
        return True
    
    def apply_image_to_article(self, article: Article, match: Dict):
        """
        Apply a matched image to an article
        
        Args:
            article: The Article object
            match: The matching image data
        """
        image = match['image']
        
        # Set the reused image
        article.reused_image = image
        article.image_source = 'reused'
        
        # If the image has a local file, use it
        if image.image_file:
            article.image_file = image.image_file
            article.image = image.image_url  # Keep original URL as reference
        else:
            # Use the image URL
            article.image = image.image_url
        
        article.save()
        
        # Increment usage count
        image.increment_usage()
        
        # Create verification record if needed
        if not match.get('auto_approved', False):
            self.create_verification_record(match)
    
    def get_verification_stats(self) -> Dict:
        """Get statistics about image verifications"""
        from django.utils import timezone
        from datetime import timedelta
        
        now = timezone.now()
        last_week = now - timedelta(days=7)
        
        return {
            'pending': ImageVerification.objects.filter(status='pending').count(),
            'approved': ImageVerification.objects.filter(status='approved').count(),
            'rejected': ImageVerification.objects.filter(status='rejected').count(),
            'needs_revision': ImageVerification.objects.filter(status='needs_revision').count(),
            'pending_last_week': ImageVerification.objects.filter(
                status='pending',
                created_at__gte=last_week
            ).count(),
            'total_verifications': ImageVerification.objects.count(),
        }
