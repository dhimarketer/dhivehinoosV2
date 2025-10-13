"""
Redis caching utilities for articles app.
Provides helper functions for caching article data and managing cache invalidation.
"""

from django.core.cache import cache
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

# Cache key prefixes
CACHE_PREFIXES = {
    'published_articles': 'articles:published',
    'article_detail': 'article:detail',
    'article_list': 'articles:list',
    'category_articles': 'articles:category',
    'featured_articles': 'articles:featured',
    'latest_articles': 'articles:latest',
}

# Cache timeouts (in seconds)
CACHE_TIMEOUTS = {
    'published_articles': 300,  # 5 minutes
    'article_detail': 600,      # 10 minutes
    'article_list': 300,        # 5 minutes
    'category_articles': 300,    # 5 minutes
    'featured_articles': 1800,  # 30 minutes
    'latest_articles': 300,     # 5 minutes
}


def get_cache_key(prefix, identifier=None, **kwargs):
    """
    Generate a cache key with the given prefix and identifier.
    
    Args:
        prefix (str): Cache key prefix from CACHE_PREFIXES
        identifier: Optional identifier (ID, slug, etc.)
        **kwargs: Additional key-value pairs to include in the key
    
    Returns:
        str: Generated cache key
    """
    if prefix not in CACHE_PREFIXES:
        raise ValueError(f"Invalid cache prefix: {prefix}")
    
    base_key = CACHE_PREFIXES[prefix]
    
    if identifier:
        base_key = f"{base_key}:{identifier}"
    
    if kwargs:
        # Sort kwargs for consistent key generation
        sorted_kwargs = sorted(kwargs.items())
        param_str = ":".join(f"{k}={v}" for k, v in sorted_kwargs)
        base_key = f"{base_key}:{param_str}"
    
    return base_key


def cache_article_data(key, data, timeout=None):
    """
    Cache article data with the given key.
    
    Args:
        key (str): Cache key
        data: Data to cache
        timeout (int): Cache timeout in seconds (uses default if None)
    
    Returns:
        bool: True if cached successfully, False otherwise
    """
    try:
        if timeout is None:
            timeout = CACHE_TIMEOUTS.get('article_detail', 600)
        
        cache.set(key, data, timeout)
        logger.debug(f"Cached data with key: {key}")
        return True
    except Exception as e:
        logger.error(f"Failed to cache data with key {key}: {e}")
        return False


def get_cached_article_data(key):
    """
    Retrieve cached article data.
    
    Args:
        key (str): Cache key
    
    Returns:
        Cached data or None if not found/error
    """
    try:
        data = cache.get(key)
        if data:
            logger.debug(f"Cache hit for key: {key}")
        else:
            logger.debug(f"Cache miss for key: {key}")
        return data
    except Exception as e:
        logger.error(f"Failed to retrieve cached data with key {key}: {e}")
        return None


def invalidate_article_cache(article_id=None, category_id=None, clear_all=False):
    """
    Invalidate article-related cache entries.
    
    Args:
        article_id: Specific article ID to invalidate
        category_id: Specific category ID to invalidate
        clear_all (bool): If True, clear all article caches
    """
    try:
        if clear_all:
            # Clear all article-related caches - use specific keys instead of wildcards
            keys_to_clear = []
            for prefix in CACHE_PREFIXES.values():
                # Add common cache keys without wildcards
                keys_to_clear.extend([
                    f"{prefix}",
                    f"{prefix}:1",  # Common pagination key
                    f"{prefix}:published",
                    f"{prefix}:latest",
                ])
            cache.delete_many(keys_to_clear)
            logger.info(f"Cleared {len(keys_to_clear)} article caches")
        else:
            keys_to_delete = []
            
            if article_id:
                # Clear article-specific caches
                keys_to_delete.extend([
                    get_cache_key('article_detail', article_id),
                    get_cache_key('published_articles'),
                    get_cache_key('latest_articles'),
                    get_cache_key('featured_articles'),
                ])
            
            if category_id:
                # Clear category-specific caches
                keys_to_delete.extend([
                    get_cache_key('category_articles', category_id),
                    get_cache_key('article_list'),
                ])
            
            # Always clear general article list caches when any article changes
            if article_id or category_id:
                keys_to_delete.extend([
                    get_cache_key('published_articles'),
                    get_cache_key('latest_articles'),
                ])
            
            if keys_to_delete:
                cache.delete_many(keys_to_delete)
                logger.info(f"Invalidated cache keys: {keys_to_delete}")
        
    except Exception as e:
        logger.error(f"Failed to invalidate cache: {e}")


def get_cache_stats():
    """
    Get Redis cache statistics.
    
    Returns:
        dict: Cache statistics or None if Redis is not available
    """
    try:
        # This is a simple implementation - in production you might want more detailed stats
        cache_info = {
            'backend': cache.__class__.__name__,
            'location': getattr(cache, '_cache', {}).get('LOCATION', 'unknown'),
        }
        
        # Try to get Redis info if using Redis
        if hasattr(cache, '_cache') and hasattr(cache._cache, 'get_client'):
            try:
                client = cache._cache.get_client()
                if hasattr(client, 'info'):
                    redis_info = client.info()
                    cache_info.update({
                        'redis_version': redis_info.get('redis_version'),
                        'used_memory': redis_info.get('used_memory_human'),
                        'connected_clients': redis_info.get('connected_clients'),
                        'total_commands_processed': redis_info.get('total_commands_processed'),
                    })
            except Exception:
                pass
        
        return cache_info
    except Exception as e:
        logger.error(f"Failed to get cache stats: {e}")
        return None


def test_cache_connection():
    """
    Test Redis cache connection.
    
    Returns:
        bool: True if connection is working, False otherwise
    """
    try:
        test_key = 'cache_test'
        test_value = 'test_value'
        
        # Test set
        cache.set(test_key, test_value, 10)
        
        # Test get
        retrieved_value = cache.get(test_key)
        
        # Test delete
        cache.delete(test_key)
        
        return retrieved_value == test_value
    except Exception as e:
        logger.error(f"Cache connection test failed: {e}")
        return False
