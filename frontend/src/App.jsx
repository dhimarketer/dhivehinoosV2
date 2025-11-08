import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import { Spinner, Box } from './components/ui';
import { HelmetProvider } from 'react-helmet-async';
import GoogleAnalytics from './components/GoogleAnalytics';
import { useSiteSettings } from './hooks/useSiteSettings';
import { useTheme } from './hooks/useTheme';
import { trackPageView } from './utils/analytics';
import { AuthProvider, ProtectedRoute } from './contexts/AuthContext';
import { ToastProvider, useToast } from './contexts/ToastContext';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastContainer } from './components/ui';

// Enable lazy loading for route-based code splitting
// This will significantly reduce initial bundle size
const HomePage = lazy(() => import('./pages/HomePage'));
// Temporarily disable lazy loading for ArticlePage to fix module loading error
import ArticlePage from './pages/ArticlePage';
const ContactPage = lazy(() => import('./pages/ContactPage'));
const SettingsPage = lazy(() => import('./pages/admin/SettingsPage'));

// Loading fallback component
const LoadingFallback = () => (
  <Box className="flex justify-center items-center min-h-screen">
    <Spinner size="xl" color="#0073e6" />
  </Box>
);

function AppContent() {
  const { settings } = useSiteSettings();
  const { theme, loading: themeLoading } = useTheme();
  const location = useLocation();

  // Track page views on route changes
  useEffect(() => {
    if (settings.google_analytics_id) {
      trackPageView(location.pathname, document.title);
    }
  }, [location, settings.google_analytics_id]);

  // Show loading while theme is being loaded
  if (themeLoading || !theme) {
    return <LoadingFallback />;
  }

  return (
    <ChakraProvider theme={theme}>
      <GoogleAnalytics trackingId={settings.google_analytics_id} />
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/category/:slug" element={<HomePage />} />
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
    </ChakraProvider>
  );
}

function ToastWrapper() {
  const { toasts, closeToast } = useToast();
  return <ToastContainer toasts={toasts} onClose={closeToast} />;
}

function App() {
  return (
    <HelmetProvider>
      <ToastProvider>
        <ErrorBoundary>
          <Router>
            <AuthProvider>
              <AppContent />
              <ToastWrapper />
            </AuthProvider>
          </Router>
        </ErrorBoundary>
      </ToastProvider>
    </HelmetProvider>
  );
}

export default App;