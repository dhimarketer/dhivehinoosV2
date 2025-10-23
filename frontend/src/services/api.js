import axios from 'axios';

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

// Request interceptor for session authentication
api.interceptors.request.use(
  async (config) => {
    // Debug: Log request details
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
    
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
          console.log('CSRF token added to request');
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
        console.log('CSRF token added from DOM');
      }
    }
    
    // Debug: Log headers being sent
    console.log('Request headers:', config.headers);
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors and retries
api.interceptors.response.use(
  (response) => {
    console.log(`Response received: ${response.status} for ${response.config.url}`);
    return response;
  },
  async (error) => {
    const config = error.config;
    
    // Debug: Log error details
    console.error(`API Error: ${error.response?.status || 'Network'} for ${config?.url}`);
    console.error('Error details:', error.response?.data || error.message);
    
    // Handle authentication errors
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.log('Authentication error detected, clearing local auth state');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('user');
      // Don't redirect automatically - let the component handle it
      console.log('Authentication error:', error.response?.status);
      return Promise.reject(error);
    }
    
    // Handle timeout and network errors with retry logic
    if ((error.code === 'ECONNABORTED' || error.code === 'NETWORK_ERROR' || !error.response) && 
        config && !config._retry && config.retry > 0) {
      config._retry = true;
      config.retry--;
      
      console.log(`Retrying request to ${config.url}, attempts left: ${config.retry}`);
      
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
