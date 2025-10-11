import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable cookies for session authentication
});

// Request interceptor for session authentication
api.interceptors.request.use(
  async (config) => {
    // Session authentication is handled automatically with cookies
    // Get CSRF token if not already present
    if (!config.headers['X-CSRFToken']) {
      try {
        const response = await fetch('/api/v1/auth/csrf-token/', {
          method: 'GET',
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          config.headers['X-CSRFToken'] = data.csrf_token;
        }
      } catch (error) {
        console.warn('Could not fetch CSRF token:', error);
      }
    }
    
    // Fallback: try to get CSRF token from DOM
    if (!config.headers['X-CSRFToken']) {
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

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('isAuthenticated');
      // Don't redirect automatically - let the component handle it
      console.log('Authentication error:', error.response?.status);
    }
    return Promise.reject(error);
  }
);

export const articlesAPI = {
  getPublished: (category = null, page = 1, pageSize = 10) => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    params.append('page', page);
    params.append('page_size', pageSize);
    return api.get(`/articles/published/?${params.toString()}`);
  },
  search: (query, category = null, page = 1, pageSize = 10) => {
    const params = new URLSearchParams();
    params.append('search', query);
    if (category) params.append('category', category);
    params.append('page', page);
    params.append('page_size', pageSize);
    return api.get(`/articles/published/?${params.toString()}`);
  },
  getBySlug: (slug) => api.get(`/articles/published/${slug}/`),
  getAll: (params = '') => {
    const baseUrl = '/articles/admin/';
    const separator = params.includes('?') ? '&' : '?';
    const timestamp = `t=${Date.now()}`;
    const fullParams = params ? `${params}${separator}${timestamp}` : `?${timestamp}`;
    return api.get(`${baseUrl}${fullParams}`);
  }, // Add cache-busting timestamp
  create: (data) => {
    // If data is FormData, don't set Content-Type header
    if (data instanceof FormData) {
      return api.post('/articles/admin/', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    return api.post('/articles/admin/', data);
  },
  update: (id, data) => {
    // If data is FormData, don't set Content-Type header
    if (data instanceof FormData) {
      return api.patch(`/articles/admin/${id}/`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    return api.patch(`/articles/admin/${id}/`, data);
  },
  delete: (id) => api.delete(`/articles/admin/${id}/`),
};

export const categoriesAPI = {
  getAll: () => api.get('/articles/categories/'),
  getBySlug: (slug) => api.get(`/articles/categories/${slug}/`),
  categorizeText: (text, limit = 3) => api.post('/articles/categorize/', { text, limit }),
};

export const commentsAPI = {
  getByArticle: (slug) => api.get(`/comments/article/${slug}/`),
  getAll: () => api.get(`/comments/admin/?t=${Date.now()}`), // Add cache-busting timestamp
  create: (data) => api.post('/comments/create/', data),
  approve: (id) => api.post(`/comments/admin/${id}/approve/`),
  reject: (id) => api.post(`/comments/admin/${id}/reject/`),
};

export const votesAPI = {
  create: (data) => api.post('/comments/vote/', data),
  getStatus: (articleId) => api.get(`/comments/vote-status/${articleId}/`),
};

// Ads API - Re-enabled
export const adsAPI = {
  getActive: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/ads/active/${queryString ? '?' + queryString : ''}`);
  },
  getAll: () => api.get('/ads/admin/'),
  getPlacements: () => api.get('/ads/placements/'),
  create: (data) => {
    // If data is FormData, don't set Content-Type header
    if (data instanceof FormData) {
      return api.post('/ads/admin/', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    return api.post('/ads/admin/', data);
  },
  update: (id, data) => {
    // If data is FormData, don't set Content-Type header
    if (data instanceof FormData) {
      return api.put(`/ads/admin/${id}/`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    return api.put(`/ads/admin/${id}/`, data);
  },
  delete: (id) => api.delete(`/ads/admin/${id}/`),
};

export const contactAPI = {
  create: (data) => api.post('/contact/create/', data),
  getAll: () => api.get(`/contact/admin/?t=${Date.now()}`), // Add cache-busting timestamp
  markAsRead: (id) => api.patch(`/contact/admin/${id}/`, { is_read: true }),
  archive: (id) => api.patch(`/contact/admin/${id}/archive/`),
  unarchive: (id) => api.patch(`/contact/admin/${id}/unarchive/`),
  delete: (id) => api.delete(`/contact/admin/${id}/delete/`),
};

export const authAPI = {
  login: (credentials) => api.post('/auth/login/', credentials),
  logout: () => api.post('/auth/logout/'),
  getCurrentUser: () => api.get('/auth/user/'),
};

export const settingsAPI = {
  get: () => api.get('/settings/admin/get/'),
  update: (data) => api.put('/settings/admin/', data),
  getPublic: () => api.get('/settings/public/'),
};

export default api;
