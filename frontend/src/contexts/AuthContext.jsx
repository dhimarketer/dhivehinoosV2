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
    try {
      // Initialize authentication state from localStorage
      const storedAuth = localStorage.getItem('isAuthenticated');
      const storedUser = localStorage.getItem('user');
      
      if (storedAuth === 'true' && storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setIsAuthenticated(true);
          setUser(userData);
          
          // Verify with backend in background (don't block UI)
          checkAuthStatus().catch(error => {
            console.log('Background auth check failed:', error);
            // Don't clear auth state immediately - let user try to use the app
          });
        } catch (error) {
          console.error('Error parsing stored user data:', error);
          localStorage.removeItem('isAuthenticated');
          localStorage.removeItem('user');
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('AuthContext initialization error:', error);
      setLoading(false);
    }
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
      // Let the component handle navigation
      window.location.href = '/admin/login';
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

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = '/admin/login';
    }
  }, [isAuthenticated, loading]);

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
    return null;
  }

  return children;
};
