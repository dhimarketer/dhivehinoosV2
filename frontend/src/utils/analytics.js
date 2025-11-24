// Google Analytics 4 utility functions

/**
 * Track a custom event in Google Analytics 4
 * @param {string} eventName - The name of the event
 * @param {object} parameters - Event parameters
 */
export const trackEvent = (eventName, parameters = {}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, parameters);
  }
};

/**
 * Track page view for SPA route changes
 * @param {string} pagePath - The path of the page
 * @param {string} pageTitle - The title of the page
 */
export const trackPageView = (pagePath, pageTitle) => {
  if (typeof window !== 'undefined' && window.gtag) {
    // Use page_view event for GA4 SPA tracking
    window.gtag('event', 'page_view', {
      page_path: pagePath,
      page_title: pageTitle,
      page_location: window.location.href,
    });
  }
};

/**
 * Track article view
 * @param {string} articleSlug - The slug of the article
 * @param {string} articleTitle - The title of the article
 * @param {string} category - The category of the article
 */
export const trackArticleView = (articleSlug, articleTitle, category = null) => {
  trackEvent('view_item', {
    item_id: articleSlug,
    item_name: articleTitle,
    item_category: category,
    content_type: 'article',
  });
};

/**
 * Track comment submission
 * @param {string} articleSlug - The slug of the article
 */
export const trackCommentSubmit = (articleSlug) => {
  trackEvent('comment_submit', {
    item_id: articleSlug,
    content_type: 'article',
  });
};

/**
 * Track contact form submission
 */
export const trackContactSubmit = () => {
  trackEvent('contact_form_submit', {
    content_type: 'contact',
  });
};

/**
 * Track ad click
 * @param {string} adId - The ID of the ad
 * @param {string} adPlacement - The placement of the ad
 */
export const trackAdClick = (adId, adPlacement) => {
  trackEvent('ad_click', {
    item_id: adId,
    ad_placement: adPlacement,
    content_type: 'advertisement',
  });
};
