import { useEffect } from 'react';

const GoogleAnalytics = ({ trackingId }) => {
  useEffect(() => {
    if (!trackingId) {
      // Clean up if trackingId is removed
      if (window.gtag && window.dataLayer) {
        window.dataLayer = [];
        delete window.gtag;
      }
      return;
    }

    // Initialize dataLayer first (must be done before script loads)
    window.dataLayer = window.dataLayer || [];
    function gtag() {
      window.dataLayer.push(arguments);
    }
    window.gtag = gtag;
    gtag('js', new Date());
    
    // Store tracking ID globally for use in analytics utilities
    window.GA_TRACKING_ID = trackingId;
    
    // Load the external script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${trackingId}`;
    
    script.onload = () => {
      // Configure GA4 after script loads
      // Set send_page_view to false - we handle all page views manually via App.jsx
      // This prevents duplicate page views and gives us full control
      gtag('config', trackingId, {
        page_title: document.title,
        page_location: window.location.href,
        send_page_view: false, // Manual page view tracking via App.jsx
        anonymize_ip: true,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
      });
    };
    
    script.onerror = () => {
      console.error('Failed to load Google Analytics script');
    };
    
    // Check if script already exists to avoid duplicates
    const existingScript = document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${trackingId}"]`);
    if (!existingScript) {
      document.head.appendChild(script);
    } else {
      // Script already exists, just update config if needed
      // Don't send page_view here as it would duplicate
      if (window.gtag) {
        gtag('config', trackingId, {
          page_title: document.title,
          page_location: window.location.href,
          send_page_view: false, // Don't send duplicate page view
          anonymize_ip: true,
          allow_google_signals: false,
          allow_ad_personalization_signals: false,
        });
      }
    }

    // Cleanup function
    return () => {
      // Don't remove script on unmount as it's shared
      // Just clear the tracking ID reference
      if (window.GA_TRACKING_ID === trackingId) {
        delete window.GA_TRACKING_ID;
      }
    };
  }, [trackingId]);

  if (!trackingId) return null;

  return null;
};

export default GoogleAnalytics;
