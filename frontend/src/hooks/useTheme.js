import { useState, useEffect, useMemo } from 'react';
import { useSiteSettings } from './useSiteSettings';
import { getTheme, applyThemeConfig } from '../themes';

/**
 * Hook to get the active theme based on site settings
 * @returns {Object} { theme, themeName, loading, error }
 */
export const useTheme = () => {
  const { settings, loading: settingsLoading } = useSiteSettings();
  const [theme, setTheme] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (settingsLoading) {
      return;
    }

    try {
      // Get theme name from settings (default to 'modern')
      const themeName = settings.active_theme || 'modern';
      
      // Get base theme
      const baseTheme = getTheme(themeName);
      
      // Apply custom theme config if provided
      const customConfig = settings.theme_config || {};
      const finalTheme = applyThemeConfig(baseTheme, customConfig);
      
      setTheme(finalTheme);
    } catch (error) {
      console.error('Error loading theme:', error);
      // Fallback to default theme
      const defaultTheme = getTheme('modern');
      setTheme(defaultTheme);
    } finally {
      setLoading(false);
    }
  }, [settings.active_theme, settings.theme_config, settingsLoading]);

  const themeName = useMemo(() => {
    return settings.active_theme || 'modern';
  }, [settings.active_theme]);

  return {
    theme: theme || getTheme('modern'), // Fallback to modern theme
    themeName,
    loading: loading || settingsLoading,
    error: null,
  };
};


