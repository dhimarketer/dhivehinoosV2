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
        
        # Use the image file
        article.image_file = image.image_file
        article.image = image.image_file.url  # Use the file URL
        
        article.save()
        
        # Increment usage count
        image.increment_usage()
    
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
