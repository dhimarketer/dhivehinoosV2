/**
 * Image optimization utilities for better performance
 */

/**
 * Generate responsive image srcset for different screen sizes
 * @param {string} imageUrl - Base image URL
 * @param {Object} sizes - Object with size options (optional)
 * @returns {string} - srcset string
 */
export const generateSrcSet = (imageUrl, sizes = {}) => {
  // For now, return the original URL
  // In the future, this could generate different sizes if backend supports it
  return imageUrl;
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

