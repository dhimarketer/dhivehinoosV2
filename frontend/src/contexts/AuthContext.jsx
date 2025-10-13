import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/auth';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if we have cached auth data first
        const cachedAuth = localStorage.getItem('isAuthenticated');
        const cachedUser = localStorage.getItem('user');
        
        if (cachedAuth === 'true' && cachedUser) {
          // Set cached state immediately for better UX
          setIsAuthenticated(true);
          setUser(JSON.parse(cachedUser));
        }
        
        // Always verify with backend to ensure session is still valid
        const isAuth = await authService.checkAuthStatus();
        
        if (isAuth) {
          setIsAuthenticated(true);
          setUser(authService.getCurrentUser());
        } else {
          setIsAuthenticated(false);
          setUser(null);
          // Clear any stale authentication data
          localStorage.removeItem('isAuthenticated');
          localStorage.removeItem('user');
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setIsAuthenticated(false);
        setUser(null);
        // Clear any stale authentication data
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      const isAuth = await authService.checkAuthStatus();
      setIsAuthenticated(isAuth);
      if (isAuth) {
        setUser(authService.getCurrentUser());
      } else {
        setUser(null);
        // Clear any stale authentication data
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('user');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
      setUser(null);
      // Clear any stale authentication data
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      const result = await authService.login(username, password);
      if (result.success) {
        setIsAuthenticated(true);
        setUser(result.user);
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed' };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setIsAuthenticated(false);
      setUser(null);
      // Redirect to landing page instead of admin login
      window.location.href = '/';
    }
  };

  const value = {
    isAuthenticated,
    user,
    loading,
    login,
    logout,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Protected Route Component
export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Redirecting to login...</div>
      </div>
    );
  }

  return children;
};
