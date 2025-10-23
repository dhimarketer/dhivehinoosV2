import re
from typing import List, Dict, Optional
from django.db.models import Q
from .models import Article, ReusableImage


class ImageMatchingService:
    """Simplified service for matching article content with reusable images"""
    
    def find_matching_images(self, content: str, title: str = "") -> List[Dict]:
        """
        Find reusable images that match the given content and title
        
        Args:
            content: Article content to search for matches
            title: Article title (optional)
            
        Returns:
            List of matching image dictionaries
        """
        # Combine content and title for searching
        search_text = f"{title} {content}".lower()
        
        # Get all active reusable images
        reusable_images = ReusableImage.objects.filter(is_active=True)
        
        matches = []
        
        for image in reusable_images:
            # Get all possible names for this image
            all_names = image.get_all_names()
            
            # Check if any name appears in the search text
            for name in all_names:
                if name.lower() in search_text:
                    # Calculate a simple confidence score
                    confidence = self._calculate_confidence(name, search_text, title)
                    
                    matches.append({
                        'image': image,
                        'matched_name': name,
                        'confidence': confidence,
                        'auto_approved': confidence >= 0.8  # Auto-approve high confidence matches
                    })
                    break  # Only add each image once
        
        # Sort by confidence score (highest first)
        matches.sort(key=lambda x: x['confidence'], reverse=True)
        
        return matches
    
    def _calculate_confidence(self, name: str, search_text: str, title: str) -> float:
        """
        Calculate confidence score for a name match
        
        Args:
            name: The matched name
            search_text: The text being searched
            title: Article title
            
        Returns:
            Confidence score between 0.0 and 1.0
        """
        name_lower = name.lower()
        search_lower = search_text.lower()
        
        # Base confidence
        confidence = 0.5
        
        # Boost if name appears in title
        if title and name_lower in title.lower():
            confidence += 0.3
        
        # Boost for longer names (more specific)
        if len(name) > 10:
            confidence += 0.1
        
        # Boost for exact matches
        if name_lower == search_lower.strip():
            confidence += 0.2
        
        # Boost if name appears multiple times
        count = search_lower.count(name_lower)
        if count > 1:
            confidence += 0.1 * min(count - 1, 3)  # Cap at 0.3
        
        return min(confidence, 1.0)  # Cap at 1.0
    
    def select_best_image(self, matches: List[Dict]) -> Optional[Dict]:
        """
        Select the best image from matches
        
        Args:
            matches: List of matching images
            
        Returns:
            Best matching image or None
        """
        if not matches:
            return None
        
        # Return the highest confidence match
        return matches[0]
    
    def apply_images_to_article(self, article: Article, matches: List[Dict]) -> bool:
        """
        Apply multiple matched images to an article (max 4)
        
        Args:
            article: The Article object
            matches: List of matching image data (max 4)
            
        Returns:
            True if images were applied, False otherwise
        """
        if not matches:
            return False
        
        # Limit to maximum 4 images
        matches = matches[:4]
        
        # Clear existing reuse images
        article.reuse_images.clear()
        
        # Add all matching images to the many-to-many field
        valid_images = []
        for match in matches:
            image = match['image']
            
            # Check if the reusable image has an actual image file
            if not image.image_file or not image.image_file.name:
                print(f"⚠️  Warning: ReusableImage '{image.entity_name}' has no image file, skipping")
                continue
            
            valid_images.append(image)
        
        if not valid_images:
            return False
        
        # Add images to the many-to-many field
        article.reuse_images.set(valid_images)
        
        # Set the primary reused image (first one) for backward compatibility
        article.reused_image = valid_images[0]
        # DO NOT change image_source - keep it as 'external' to preserve original API image
        # article.image_source = 'reused'  # REMOVED: Keep original API image as primary
        
        # NEVER replace the original API image - it should always remain as the primary image
        # Only set image_file if there's no original image AND no image_file already
        if not article.image and not article.image_file:
            article.image_file = valid_images[0].image_file
            # DO NOT replace article.image with reuse image URL - keep original API image
            # article.image = valid_images[0].image_file.url  # REMOVED: This was replacing original API image
        
        article.save()
        
        # Increment usage count for all images
        for image in valid_images:
            image.increment_usage()
        
        # Invalidate cache for this article
        try:
            from .cache_utils import invalidate_article_cache
            invalidate_article_cache(article_id=article.id)
        except Exception as e:
            print(f"⚠️  Warning: Failed to invalidate cache for article {article.id}: {e}")
        
        print(f"✅ Applied {len(valid_images)} reuse images to article '{article.title}'")
        return True
    
    def apply_image_to_article(self, article: Article, match: Dict):
        """
        Apply a single matched image to an article (legacy method for backward compatibility)
        
        Args:
            article: The Article object
            match: The matching image data
        """
        return self.apply_images_to_article(article, [match])
    
    def process_article_for_image_reuse(self, article: Article) -> bool:
        """
        Process an article to find and apply image reuse
        
        Args:
            article: The Article object to process
            
        Returns:
            True if images were reused, False otherwise
        """
        # Find matching images
        matches = self.find_matching_images(article.content, article.title)
        
        if not matches:
            return False
        
        # Apply all matching images (up to 4)
        return self.apply_images_to_article(article, matches)
