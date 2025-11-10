// Theme-aware layout wrapper component
import { useTheme } from '../hooks/useTheme';
import { getLayout } from '../layouts';

/**
 * ThemeLayout - Wraps content with theme-specific layout
 * Automatically selects the correct layout based on active theme
 */
export const ThemeLayout = ({ children, featuredArticle, articles, settings, ...props }) => {
  const { themeName } = useTheme();
  const LayoutComponent = getLayout(themeName);

  return (
    <LayoutComponent
      featuredArticle={featuredArticle}
      articles={articles}
      settings={settings}
      {...props}
    >
      {children}
    </LayoutComponent>
  );
};

export default ThemeLayout;


