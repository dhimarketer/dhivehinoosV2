import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

const GoogleAnalytics = ({ trackingId }) => {
  useEffect(() => {
    if (!trackingId) return;

    // Defer Google Analytics loading to reduce main-thread blocking
    // Use requestIdleCallback when available, fallback to setTimeout
    const loadGA = () => {
      // Initialize gtag
      window.dataLayer = window.dataLayer || [];
      function gtag() {
        window.dataLayer.push(arguments);
      }
      window.gtag = gtag;
      gtag('js', new Date());
      
      // Configure GA4 with proper settings
      gtag('config', trackingId, {
        page_title: document.title,
        page_location: window.location.href,
        send_page_view: true,
        anonymize_ip: true,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
      });

      // Track page view on route changes
      const handleRouteChange = () => {
        gtag('config', trackingId, {
          page_title: document.title,
          page_location: window.location.href,
        });
      };

      // Listen for route changes (for SPA)
      window.addEventListener('popstate', handleRouteChange);
      
      return () => {
        window.removeEventListener('popstate', handleRouteChange);
      };
    };

    // Load GA after page is interactive to reduce main-thread blocking
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        loadGA();
        // Load the script after a delay to ensure it doesn't block rendering
        const script = document.createElement('script');
        script.async = true;
        script.defer = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${trackingId}`;
        document.head.appendChild(script);
      }, { timeout: 2000 });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        loadGA();
        const script = document.createElement('script');
        script.async = true;
        script.defer = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${trackingId}`;
        document.head.appendChild(script);
      }, 3000);
    }
  }, [trackingId]);

  if (!trackingId) return null;

  // Only include the inline script tag, external script is loaded via requestIdleCallback
  return (
    <Helmet>
      <script>
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${trackingId}', {
            page_title: document.title,
            page_location: window.location.href,
            send_page_view: true,
            anonymize_ip: true,
            allow_google_signals: false,
            allow_ad_personalization_signals: false,
          });
        `}
      </script>
    </Helmet>
  );
};

export default GoogleAnalytics;
