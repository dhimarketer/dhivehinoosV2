"""
Article Categorization Service

This service provides automatic categorization of articles using:
1. Regex pattern matching
2. Keyword-based analysis
3. Text content analysis
4. Title analysis

The service is designed to be extensible and configurable through the Category model.
"""

import re
from typing import Optional, List, Dict, Tuple
from django.db import models
from .models import Category, Article


class ArticleCategorizationService:
    """Service for automatically categorizing articles"""
    
    def __init__(self):
        self.categories = Category.objects.filter(is_active=True).order_by('sort_order')
        self._build_categorization_cache()
    
    def _build_categorization_cache(self):
        """Build cache of categorization rules for performance"""
        self.category_cache = {}
        for category in self.categories:
            self.category_cache[category.id] = {
                'keywords': category.get_keywords_list(),
                'regex_patterns': category.get_regex_patterns_list(),
                'category': category
            }
    
    def categorize_article(self, article: Article) -> Optional[Category]:
        """
        Categorize an article using multiple methods
        
        Returns the best matching category or None if no match found
        """
        if not article.title and not article.content:
            return None
        
        # Combine title and content for analysis
        text_to_analyze = f"{article.title or ''} {article.content or ''}".lower()
        
        # Get categorization scores
        scores = self._calculate_categorization_scores(text_to_analyze)
        
        if not scores:
            return None
        
        # Return the category with the highest score
        best_category_id = max(scores.keys(), key=lambda k: scores[k])
        return self.category_cache[best_category_id]['category']
    
    def _calculate_categorization_scores(self, text: str) -> Dict[int, float]:
        """Calculate categorization scores for all categories"""
        scores = {}
        
        for category_id, rules in self.category_cache.items():
            score = 0.0
            
            # Regex pattern matching (highest weight)
            regex_score = self._calculate_regex_score(text, rules['regex_patterns'])
            score += regex_score * 3.0  # Weight: 3x
            
            # Keyword matching
            keyword_score = self._calculate_keyword_score(text, rules['keywords'])
            score += keyword_score * 2.0  # Weight: 2x
            
            # Title-specific analysis (if text contains title)
            title_score = self._calculate_title_score(text, rules['keywords'])
            score += title_score * 1.5  # Weight: 1.5x
            
            # Content analysis
            content_score = self._calculate_content_score(text, rules['keywords'])
            score += content_score * 1.0  # Weight: 1x
            
            if score > 0:
                scores[category_id] = score
        
        return scores
    
    def _calculate_regex_score(self, text: str, patterns: List[str]) -> float:
        """Calculate score based on regex pattern matches"""
        if not patterns:
            return 0.0
        
        score = 0.0
        for pattern in patterns:
            try:
                matches = re.findall(pattern, text, re.IGNORECASE)
                if matches:
                    # Score based on number of matches and pattern complexity
                    pattern_score = len(matches) * (1 + len(pattern) / 100)  # Longer patterns get slight bonus
                    score += pattern_score
            except re.error:
                # Skip invalid regex patterns
                continue
        
        return score
    
    def _calculate_keyword_score(self, text: str, keywords: List[str]) -> float:
        """Calculate score based on keyword matches"""
        if not keywords:
            return 0.0
        
        score = 0.0
        text_words = set(re.findall(r'\b\w+\b', text.lower()))
        
        for keyword in keywords:
            keyword_lower = keyword.lower()
            
            # Exact keyword match
            if keyword_lower in text_words:
                score += 2.0
            
            # Partial keyword match (for compound keywords)
            elif any(keyword_lower in word or word in keyword_lower for word in text_words):
                score += 1.0
            
            # Substring match in text
            elif keyword_lower in text:
                score += 0.5
        
        return score
    
    def _calculate_title_score(self, text: str, keywords: List[str]) -> float:
        """Calculate score based on title analysis (first part of text)"""
        if not keywords:
            return 0.0
        
        # Assume first 200 characters are title-like
        title_part = text[:200].lower()
        score = 0.0
        
        for keyword in keywords:
            keyword_lower = keyword.lower()
            if keyword_lower in title_part:
                # Title matches get higher weight
                score += 3.0
        
        return score
    
    def _calculate_content_score(self, text: str, keywords: List[str]) -> float:
        """Calculate score based on content analysis"""
        if not keywords:
            return 0.0
        
        # Remove HTML tags for better analysis
        clean_text = re.sub(r'<[^>]+>', ' ', text)
        clean_text = clean_text.lower()
        
        score = 0.0
        for keyword in keywords:
            keyword_lower = keyword.lower()
            # Count occurrences in content
            occurrences = clean_text.count(keyword_lower)
            if occurrences > 0:
                score += min(occurrences * 0.5, 2.0)  # Cap at 2.0 per keyword
        
        return score
    
    def get_category_suggestions(self, text: str, limit: int = 3) -> List[Tuple[Category, float]]:
        """
        Get category suggestions with confidence scores
        
        Returns list of (category, score) tuples sorted by score
        """
        scores = self._calculate_categorization_scores(text.lower())
        
        suggestions = []
        for category_id, score in scores.items():
            category = self.category_cache[category_id]['category']
            suggestions.append((category, score))
        
        # Sort by score descending
        suggestions.sort(key=lambda x: x[1], reverse=True)
        return suggestions[:limit]
    
    def refresh_cache(self):
        """Refresh the categorization cache (call when categories are updated)"""
        self.categories = Category.objects.filter(is_active=True).order_by('sort_order')
        self._build_categorization_cache()


# Global instance
categorization_service = ArticleCategorizationService()


def auto_categorize_article(article: Article) -> Optional[Category]:
    """
    Convenience function to automatically categorize an article
    
    This function should be called when articles are created or updated
    """
    return categorization_service.categorize_article(article)


def get_category_suggestions(text: str, limit: int = 3) -> List[Tuple[Category, float]]:
    """
    Convenience function to get category suggestions for text
    
    Useful for admin interfaces or API endpoints
    """
    return categorization_service.get_category_suggestions(text, limit)



