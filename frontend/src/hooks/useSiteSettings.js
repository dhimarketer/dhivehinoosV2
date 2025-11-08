import { useState, useEffect } from 'react';
import { settingsAPI } from '../services/api';

export const useSiteSettings = () => {
  const [settings, setSettings] = useState({
    site_name: 'Dhivehinoos.net',
    site_description: 'Authentic Maldivian Dhivehi Twitter thoughts and cultural insights for the Maldivian diaspora worldwide. Connect with your roots through curated Dhivehi content.',
    allow_comments: true,
    google_analytics_id: null,
    story_cards_rows: 3,
    story_cards_columns: 3,
    default_pagination_size: 12, // Default fallback
    active_theme: 'modern', // Default theme
    theme_config: {}, // Default empty config
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await settingsAPI.getPublic();
        setSettings(response.data);
      } catch (err) {
        console.error('Error fetching site settings:', err);
        
        // Provide more specific error messages
        let errorMessage = 'Failed to load site settings';
        if (err.code === 'ECONNABORTED') {
          errorMessage = 'Request timed out. Please check your connection.';
        } else if (err.code === 'NETWORK_ERROR' || !err.response) {
          errorMessage = 'Network error. Please check your connection.';
        } else if (err.response?.status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        }
        
        setError(errorMessage);
        // Keep default settings on error
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return { settings, loading, error };
};
