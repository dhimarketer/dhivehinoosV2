// Authentication service for admin login
import api from './api';

class AuthService {
  constructor() {
    this.isAuthenticated = false;
  }

  async login(username, password) {
    try {
      const response = await api.post('/auth/login/', {
        username,
        password
      });
      
      if (response.status === 200) {
        // Store authentication state
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('user', JSON.stringify(response.data.user));
        this.isAuthenticated = true;
        return { success: true, user: response.data.user };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed' 
      };
    }
  }

  async logout() {
    try {
      await api.post('/auth/logout/');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage regardless of API call success
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('user');
      this.isAuthenticated = false;
    }
  }

  async checkAuthStatus() {
    try {
      const response = await api.get('/auth/user/');
      if (response.status === 200 && response.data.user) {
        this.isAuthenticated = true;
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('user', JSON.stringify(response.data.user));
        return true;
      }
    } catch (error) {
      // User is not authenticated (403, 401, or network error)
      console.log('Auth check failed:', error.response?.status || 'Network error');
      this.isAuthenticated = false;
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('user');
      return false;
    }
    return false;
  }

  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  isLoggedIn() {
    return this.isAuthenticated && localStorage.getItem('isAuthenticated') === 'true';
  }
}

export default new AuthService();
