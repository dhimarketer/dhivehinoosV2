import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import { HelmetProvider } from 'react-helmet-async';
import theme from './theme';
import HomePage from './pages/HomePage';
import ArticlePage from './pages/ArticlePage';
import ContactPage from './pages/ContactPage';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import SettingsPage from './pages/admin/SettingsPage';
import GoogleAnalytics from './components/GoogleAnalytics';
import { useSiteSettings } from './hooks/useSiteSettings';
import { trackPageView } from './utils/analytics';
import { AuthProvider, ProtectedRoute } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';

function AppContent() {
  const { settings } = useSiteSettings();
  const location = useLocation();

  // Track page views on route changes
  useEffect(() => {
    if (settings.google_analytics_id) {
      trackPageView(location.pathname, document.title);
    }
  }, [location, settings.google_analytics_id]);

  return (
    <>
      <GoogleAnalytics trackingId={settings.google_analytics_id} />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/article/:slug" element={<ArticlePage />} />
        <Route path="/contact" element={<ContactPage />} />
        
        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/settings" element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/*" element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        } />
      </Routes>
    </>
  );
}

function App() {
  return (
    <ChakraProvider theme={theme}>
      <HelmetProvider>
        <ErrorBoundary>
          <Router>
            <AuthProvider>
              <AppContent />
            </AuthProvider>
          </Router>
        </ErrorBoundary>
      </HelmetProvider>
    </ChakraProvider>
  );
}

export default App;