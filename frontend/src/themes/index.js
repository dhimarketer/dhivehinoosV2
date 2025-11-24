// Export all themes
import { modernTheme } from './modern';
import { classicTheme } from './classic';
import { minimalTheme } from './minimal';
import { newspaperTheme } from './newspaper';
import { magazineTheme } from './magazine';

export const themes = {
  modern: modernTheme,
  classic: classicTheme,
  minimal: minimalTheme,
  newspaper: newspaperTheme,
  magazine: magazineTheme,
};

// Default theme
export const defaultTheme = modernTheme;

// Get theme by name
export const getTheme = (themeName) => {
  return themes[themeName] || defaultTheme;
};

// Apply custom theme config overrides
export const applyThemeConfig = (theme, config = {}) => {
  if (!config || Object.keys(config).length === 0) {
    return theme;
  }

  // Deep merge custom config with theme
  const mergedTheme = { ...theme };
  
  // Override colors if provided
  if (config.colors) {
    mergedTheme.colors = {
      ...theme.colors,
      ...config.colors,
    };
  }
  
  // Override fonts if provided
  if (config.fonts) {
    mergedTheme.fonts = {
      ...theme.fonts,
      ...config.fonts,
    };
  }
  
  // Override spacing if provided
  if (config.space) {
    mergedTheme.space = {
      ...theme.space,
      ...config.space,
    };
  }
  
  return mergedTheme;
};



