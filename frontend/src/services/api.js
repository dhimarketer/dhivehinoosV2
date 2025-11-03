import axios from 'axios';
import { getCachedResponse, setCachedResponse } from '../utils/requestCache';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable cookies for session authentication
  timeout: 15000, // Reduced to 15 seconds for better user experience
  retry: 2, // Increased retries for better reliability
  retryDelay: 1000, // Increased delay between retries
});

// Cacheable GET requests
const CACHEABLE_METHODS = ['GET'];
const CACHEABLE_ENDPOINTS = [
  '/settings/public/',
  '/articles/categories/',
  '/articles/published/',
  '/ads/active/'
];

// Request deduplication - track pending requests
const pendingRequests = new Map();

// Helper to get request key - includes full URL with params for accurate deduplication
const getRequestKey = (method, url, params) => {
  // If params exist and URL doesn't have query string, include params in key
  // Otherwise, use the full URL as-is (params might be in URL already)
  // Check if URL has query params - just check string, don't parse URL constructor
  if (url && url.includes('?')) {
    // URL already has params - use full URL as key
    return `${method}:${url}`;
  }
  // Params are separate - include them in key
  const paramString = params ? JSON.stringify(params) : '';
  return `${method}:${url}:${paramString}`;
};

// Intercept axios calls at a lower level for caching
const originalGet = api.get.bind(api);
api.get = function(url, config = {}) {
  // Build full URL - handle both absolute and relative URLs
  let fullUrl = url || '';
  if (!fullUrl.includes('http://') && !fullUrl.includes('https://')) {
    // Relative URL - prepend baseURL
    const baseURL = this.defaults.baseURL || '';
    // Ensure no double slashes
    const base = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
    const path = fullUrl.startsWith('/') ? fullUrl : '/' + fullUrl;
    fullUrl = base + path;
  }
  const method = 'GET';
  
  // Check if this is a cacheable endpoint
  const isCacheable = CACHEABLE_ENDPOINTS.some(endpoint => fullUrl.includes(endpoint));
  
  if (isCacheable) {
    // Check for cached response
    const cachedResponse = getCachedResponse(method, fullUrl, config.params);
    if (cachedResponse) {
      // Return cached response immediately - no console log in production
      return Promise.resolve({
        data: cachedResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { ...config, url: fullUrl }
      });
    }
    
    // Check for pending duplicate request
    const requestKey = getRequestKey(method, fullUrl, config.params);
    if (pendingRequests.has(requestKey)) {
      // Return pending request - no console log in production
      return pendingRequests.get(requestKey);
    }
    
    // Make new request and track it
    const requestPromise = originalGet(url, config)
      .then(response => {
        // Cache successful responses
        if (response.status === 200) {
          let ttl = 30000;
          if (fullUrl.includes('/settings/public/')) {
            ttl = 60000;
          } else if (fullUrl.includes('/articles/categories/')) {
            ttl = 300000;
          } else if (fullUrl.includes('/ads/active/')) {
            ttl = 60000;
          }
          setCachedResponse(method, fullUrl, config.params, response.data, ttl);
        }
        return response;
      })
      .catch(error => {
        // Remove from pending on error
        pendingRequests.delete(requestKey);
        throw error;
      })
      .finally(() => {
        // Clean up after a short delay
        setTimeout(() => {
          pendingRequests.delete(requestKey);
        }, 100);
      });
    
    pendingRequests.set(requestKey, requestPromise);
    return requestPromise;
  }
  
  // Non-cacheable request, use original
  return originalGet(url, config);
};

// Request interceptor for session authentication
api.interceptors.request.use(
  async (config) => {
    // Session authentication is handled automatically with cookies
    // For state-changing operations (POST, PUT, PATCH, DELETE), get CSRF token only for non-exempt endpoints
    const stateChangingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    const needsFreshToken = stateChangingMethods.includes(config.method?.toUpperCase());
    
    // Check if this is a CSRF-exempt endpoint (like comments/create, articles toggle-status)
    const csrfExemptEndpoints = [
        '/comments/create/', 
        '/comments/vote/', 
        '/articles/toggle-status/', 
        '/auth/login/',
        '/auth/logout/',
        '/auth/create-admin/',
        '/settings/admin/',
        '/contact/create/',
        '/subscriptions/'
    ];
    const isCsrfExempt = csrfExemptEndpoints.some(endpoint => config.url?.includes(endpoint));
    
    if (needsFreshToken && !isCsrfExempt && !config.headers['X-CSRFToken']) {
      try {
        // Use shorter timeout for CSRF token fetch to prevent delays
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
        
        const response = await fetch('/api/v1/auth/csrf-token/', {
          method: 'GET',
          credentials: 'include',
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          config.headers['X-CSRFToken'] = data.csrf_token;
        }
      } catch (error) {
        console.warn('Could not fetch CSRF token:', error);
        // Continue without CSRF token - let the backend handle it
      }
    }
    
    // Fallback: try to get CSRF token from DOM (only for non-exempt endpoints)
    if (!isCsrfExempt && !config.headers['X-CSRFToken']) {
      const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value;
      if (csrfToken) {
        config.headers['X-CSRFToken'] = csrfToken;
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors and retries
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const config = error?.config;
    
    // Handle authentication errors
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('user');
      // Don't redirect automatically - let the component handle it
      return Promise.reject(error);
    }
    
    // Handle timeout and network errors with retry logic
    if ((error.code === 'ECONNABORTED' || error.code === 'NETWORK_ERROR' || !error.response) && 
        config && !config._retry && config.retry > 0) {
      config._retry = true;
      config.retry--;
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, config.retryDelay || 1000));
      
      return api(config);
    }
    
    return Promise.reject(error);
  }
);

export const articlesAPI = {
  getPublished: (category = null, page = 1, pageSize = null) => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    params.append('page', page);
    if (pageSize) params.append('page_size', pageSize);
    return api.get(`/articles/published/?${params.toString()}`);
  },
  search: (query, category = null, page = 1, pageSize = null) => {
    const params = new URLSearchParams();
    params.append('search', query);
    if (category) params.append('category', category);
    params.append('page', page);
    if (pageSize) params.append('page_size', pageSize);
    return api.get(`/articles/published/?${params.toString()}`);
  },
  getBySlug: (slug) => api.get(`/articles/published/${slug}/`),
};

export const categoriesAPI = {
  getAll: () => api.get('/articles/categories/'),
  getBySlug: (slug) => api.get(`/articles/categories/${slug}/`),
  categorizeText: (text, limit = 3) => api.post('/articles/categorize/', { text, limit }),
};

export const commentsAPI = {
  getByArticle: (slug) => api.get(`/comments/article/${slug}/`),
  create: (data) => api.post('/comments/create/', data, {
    timeout: 15000, // 15 second timeout specifically for comment creation
  }),
};

export const votesAPI = {
  create: (data) => api.post('/comments/vote/', data),
  getStatus: (articleId) => api.get(`/comments/vote-status/${articleId}/`),
};

// Ads API - Public only
export const adsAPI = {
  getActive: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/ads/active/${queryString ? '?' + queryString : ''}`);
  },
};

export const contactAPI = {
  create: (data) => api.post('/contact/create/', data),
};

export const authAPI = {
  login: (credentials) => api.post('/auth/login/', credentials),
  logout: () => api.post('/auth/logout/'),
  getCurrentUser: () => api.get('/auth/user/'),
};

export const settingsAPI = {
  get: () => api.get('/settings/public/'),
  update: (data) => api.put('/settings/admin/', data),
  getPublic: () => api.get('/settings/public/'),
};

export const imageSettingsAPI = {
  get: () => api.get('/articles/image-display-settings/'),
};

export default api;
