/**
 * Request cache utility to prevent duplicate API calls
 * Implements simple in-memory cache with TTL
 */

const requestCache = new Map();

// Default TTL: 30 seconds for most requests
const DEFAULT_TTL = 30000;

/**
 * Generate a cache key from request config
 */
const getCacheKey = (method, url, params) => {
  const paramString = params ? JSON.stringify(params) : '';
  return `${method}:${url}:${paramString}`;
};

/**
 * Check if cached request is still valid
 */
const isCacheValid = (cacheEntry) => {
  if (!cacheEntry) return false;
  return Date.now() - cacheEntry.timestamp < cacheEntry.ttl;
};

/**
 * Get cached response if available and valid
 */
export const getCachedResponse = (method, url, params = {}) => {
  const key = getCacheKey(method, url, params);
  const cached = requestCache.get(key);
  
  if (isCacheValid(cached)) {
    return cached.response;
  }
  
  // Remove expired cache entry
  if (cached) {
    requestCache.delete(key);
  }
  
  return null;
};

/**
 * Cache a response
 */
export const setCachedResponse = (method, url, params, response, ttl = DEFAULT_TTL) => {
  const key = getCacheKey(method, url, params);
  requestCache.set(key, {
    response,
    timestamp: Date.now(),
    ttl
  });
};

/**
 * Clear specific cache entry
 */
export const clearCache = (method, url, params) => {
  const key = getCacheKey(method, url, params);
  requestCache.delete(key);
};

/**
 * Clear all cache
 */
export const clearAllCache = () => {
  requestCache.clear();
};

/**
 * Clean up expired cache entries (call periodically)
 */
export const cleanupExpiredCache = () => {
  const now = Date.now();
  for (const [key, entry] of requestCache.entries()) {
    if (now - entry.timestamp >= entry.ttl) {
      requestCache.delete(key);
    }
  }
};

// Clean up expired cache entries every minute
if (typeof window !== 'undefined') {
  setInterval(cleanupExpiredCache, 60000);
}

