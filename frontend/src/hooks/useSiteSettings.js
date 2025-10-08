import { useState, useEffect } from 'react';
import { settingsAPI } from '../services/api';

export const useSiteSettings = () => {
  const [settings, setSettings] = useState({
    site_name: 'Dhivehinoos.net',
    site_description: 'Authentic Maldivian Dhivehi Twitter thoughts and cultural insights for the Maldivian diaspora worldwide. Connect with your roots through curated Dhivehi content.',
    allow_comments: true,
    google_analytics_id: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = await settingsAPI.getPublic();
        setSettings(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching site settings:', err);
        setError('Failed to load site settings');
        // Keep default settings on error
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return { settings, loading, error };
};
