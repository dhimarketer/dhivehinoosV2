import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

const GoogleAnalytics = ({ trackingId }) => {
  useEffect(() => {
    if (!trackingId) return;

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
  }, [trackingId]);

  if (!trackingId) return null;

  return (
    <Helmet>
      <script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${trackingId}`}
      />
      <script>
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
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
