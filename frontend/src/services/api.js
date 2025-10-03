import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable cookies for session authentication
});

// Request interceptor for session authentication
api.interceptors.request.use(
  (config) => {
    // Session authentication is handled automatically with cookies
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
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

export const articlesAPI = {
  getPublished: () => api.get('/articles/published/'),
  getBySlug: (slug) => api.get(`/articles/published/${slug}/`),
  getAll: () => api.get('/articles/admin/'),
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
      return api.put(`/articles/admin/${id}/`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    return api.put(`/articles/admin/${id}/`, data);
  },
  delete: (id) => api.delete(`/articles/admin/${id}/`),
};

export const commentsAPI = {
  getByArticle: (slug) => api.get(`/comments/article/${slug}/`),
  getAll: () => api.get('/comments/admin/'),
  create: (data) => api.post('/comments/create/', data),
  approve: (id) => api.patch(`/comments/admin/${id}/`, { is_approved: true }),
  reject: (id) => api.delete(`/comments/admin/${id}/`),
};

export const votesAPI = {
  create: (data) => api.post('/comments/vote/', data),
  getStatus: (articleId) => api.get(`/comments/vote-status/${articleId}/`),
};

export const adsAPI = {
  getActive: () => api.get('/ads/active/'),
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
  getAll: () => api.get('/contact/admin/'),
  markAsRead: (id) => api.patch(`/contact/admin/${id}/`, { is_read: true }),
};

export const authAPI = {
  login: (credentials) => api.post('/auth/login/', credentials),
  logout: () => api.post('/auth/logout/'),
  getCurrentUser: () => api.get('/auth/user/'),
};

export default api;
