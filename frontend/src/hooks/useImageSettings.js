import { useState, useEffect } from 'react';
import { imageSettingsAPI } from '../services/api';

export const useImageSettings = () => {
  const [settings, setSettings] = useState({
    image_fit: 'cover',
    image_position: 'top',
    image_orientation: 'auto',
    main_image_height: 400,
    reuse_image_height: 300,
    thumbnail_height: 150,
    main_image_aspect_ratio: '16:9',
    reuse_image_aspect_ratio: '1:1',
    image_border_radius: 8,
    image_shadow: true,
    image_hover_effect: true,
    enable_lazy_loading: true,
    enable_webp_conversion: true,
    mobile_image_height: 250,
    tablet_image_height: 350,
    desktop_image_height: 400,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await imageSettingsAPI.get();
        setSettings(response.data);
      } catch (err) {
        console.error('Error fetching image settings:', err);
        
        // Provide more specific error messages
        let errorMessage = 'Failed to load image settings';
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
