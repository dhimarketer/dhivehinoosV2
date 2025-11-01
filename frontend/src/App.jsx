import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ChakraProvider, Spinner, Box } from '@chakra-ui/react';
import { HelmetProvider } from 'react-helmet-async';
import theme from './theme';
import GoogleAnalytics from './components/GoogleAnalytics';
import { useSiteSettings } from './hooks/useSiteSettings';
import { trackPageView } from './utils/analytics';
import { AuthProvider, ProtectedRoute } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';

// Enable lazy loading for route-based code splitting
// This will significantly reduce initial bundle size
const HomePage = lazy(() => import('./pages/HomePage'));
const ArticlePage = lazy(() => import('./pages/ArticlePage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const SettingsPage = lazy(() => import('./pages/admin/SettingsPage'));

// Loading fallback component
const LoadingFallback = () => (
  <Box display="flex" justifyContent="center" alignItems="center" minH="100vh">
    <Spinner size="xl" thickness="4px" speed="0.65s" color="brand.500" />
  </Box>
);

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
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/article/:slug" element={<ArticlePage />} />
          <Route path="/contact" element={<ContactPage />} />
          
          {/* Admin Routes - Only Settings Page Remains */}
          <Route path="/admin/settings" element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          } />
        </Routes>
      </Suspense>
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