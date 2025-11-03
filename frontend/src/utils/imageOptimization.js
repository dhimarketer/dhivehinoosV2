/**
 * Image optimization utilities for better performance
 */

/**
 * Generate optimized image URL with size parameters
 * Attempts to use URL parameters or path manipulation for common CDNs
 * @param {string} imageUrl - Base image URL
 * @param {number} width - Desired width
 * @param {number} height - Desired height (optional)
 * @returns {string} - Optimized image URL
 */
export const getOptimizedImageUrlBySize = (imageUrl, width, height = null) => {
  if (!imageUrl) return imageUrl;
  
  // If it's a fal.media URL, try to use their image transformation API if available
  // Common patterns: ?w=width, ?width=width, or path-based like /widthxheight/
  if (imageUrl.includes('fal.media')) {
    try {
      // Try adding width parameter - common pattern for image CDNs
      const url = new URL(imageUrl);
      url.searchParams.set('w', width.toString());
      if (height) {
        url.searchParams.set('h', height.toString());
        url.searchParams.set('fit', 'cover'); // Common fit parameter
      }
      url.searchParams.set('q', '75'); // Quality setting - reduced for better performance
      return url.toString();
    } catch (e) {
      // If URL parsing fails (e.g., relative URL), return original
      console.warn('Failed to optimize image URL:', imageUrl, e);
      return imageUrl;
    }
  }
  
  // For other URLs, return as-is (backend should handle optimization)
  return imageUrl;
};

/**
 * Generate responsive image srcset for different screen sizes
 * @param {string} imageUrl - Base image URL
 * @param {Object} sizes - Object with size options
 * @returns {string} - srcset string
 */
export const generateSrcSet = (imageUrl, sizes = {}) => {
  if (!imageUrl) return '';
  
  // Define standard breakpoints for responsive images
  const breakpoints = sizes.breakpoints || [400, 600, 800, 1200, 1600];
  const aspectRatio = sizes.aspectRatio || 16/9;
  
  const srcsetParts = breakpoints.map(width => {
    const height = Math.round(width / aspectRatio);
    const optimizedUrl = getOptimizedImageUrlBySize(imageUrl, width, height);
    return `${optimizedUrl} ${width}w`;
  });
  
  return srcsetParts.join(', ');
};

/**
 * Generate sizes attribute for responsive images
 * @param {Object} sizes - Size configuration
 * @returns {string} - sizes attribute string
 */
export const generateSizes = (sizes = {}) => {
  // Default responsive sizes
  if (sizes.featured) {
    return '(max-width: 768px) 100vw, (max-width: 1024px) 800px, 1200px';
  }
  if (sizes.compact) {
    return '120px';
  }
  // Default card sizes
  return '(max-width: 768px) 100vw, (max-width: 1024px) 350px, 400px';
};

/**
 * Check if browser supports WebP format
 * @returns {Promise<boolean>}
 */
export const supportsWebP = () => {
  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
};

/**
 * Check if browser supports AVIF format
 * @returns {Promise<boolean>}
 */
export const supportsAVIF = () => {
  return new Promise((resolve) => {
    const avif = new Image();
    avif.onload = avif.onerror = () => {
      resolve(avif.height === 2);
    };
    avif.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=';
  });
};

/**
 * Get optimized image URL based on browser support
 * This would ideally check with the backend for WebP/AVIF versions
 * @param {string} imageUrl - Original image URL
 * @param {string} format - Preferred format (webp, avif, original)
 * @returns {string} - Optimized image URL
 */
export const getOptimizedImageUrl = async (imageUrl) => {
  if (!imageUrl) return imageUrl;

  // If the image URL already contains format info, return as is
  if (imageUrl.includes('.webp') || imageUrl.includes('.avif')) {
    return imageUrl;
  }

  // For now, return original URL
  // In the future, this could:
  // 1. Check browser support for WebP/AVIF
  // 2. Request backend to serve optimized format
  // 3. Use service worker for format conversion
  return imageUrl;
};

/**
 * Generate lazy loading props for images
 * @param {boolean} aboveFold - Whether the image is above the fold
 * @returns {Object} - Props for lazy loading
 */
export const getLazyLoadingProps = (aboveFold = false) => {
  if (aboveFold) {
    // Critical images above the fold should load immediately
    return {
      loading: 'eager',
      fetchpriority: 'high',
    };
  }

  // Images below the fold should lazy load
  return {
    loading: 'lazy',
    decoding: 'async',
  };
};

/**
 * Add image dimensions to prevent layout shift
 * @param {string} imageUrl - Image URL
 * @returns {Promise<Object>} - Object with width and height
 */
export const getImageDimensions = (imageUrl) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };
    img.onerror = () => {
      resolve({
        width: 800,
        height: 450, // Default 16:9 aspect ratio
      });
    };
    img.src = imageUrl;
  });
};

