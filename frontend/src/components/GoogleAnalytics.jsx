import { useEffect } from 'react';

const GoogleAnalytics = ({ trackingId }) => {
  useEffect(() => {
    if (!trackingId) return;

    // Load GA completely asynchronously after page is fully loaded and interactive
    // This prevents any blocking of initial page render
    const loadGAScript = () => {
      // Initialize dataLayer first (minimal code)
      window.dataLayer = window.dataLayer || [];
      function gtag() {
        window.dataLayer.push(arguments);
      }
      window.gtag = gtag;
      gtag('js', new Date());
      
      // Load the external script
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${trackingId}`;
      script.onload = () => {
        // Configure after script loads
        gtag('config', trackingId, {
          page_title: document.title,
          page_location: window.location.href,
          send_page_view: true,
          anonymize_ip: true,
          allow_google_signals: false,
          allow_ad_personalization_signals: false,
        });
      };
      document.head.appendChild(script);
    };

    // Wait for page to be fully interactive before loading GA
    if (document.readyState === 'complete') {
      // Page already loaded, wait a bit then load
      setTimeout(loadGAScript, 2000);
    } else {
      // Wait for page to finish loading
      window.addEventListener('load', () => {
        if ('requestIdleCallback' in window) {
          requestIdleCallback(loadGAScript, { timeout: 3000 });
        } else {
          setTimeout(loadGAScript, 3000);
        }
      });
    }
  }, [trackingId]);

  if (!trackingId) return null;

  // Don't include inline script - load everything asynchronously to prevent blocking
  // The inline script will be added via useEffect after page load
  return null;
};

export default GoogleAnalytics;
