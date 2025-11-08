// Export all layout components
import ModernLayout from './ModernLayout';
import ClassicLayout from './ClassicLayout';
import MinimalLayout from './MinimalLayout';
import NewspaperLayout from './NewspaperLayout';
import MagazineLayout from './MagazineLayout';

export const layouts = {
  modern: ModernLayout,
  classic: ClassicLayout,
  minimal: MinimalLayout,
  newspaper: NewspaperLayout,
  magazine: MagazineLayout,
};

// Get layout component by theme name
export const getLayout = (themeName) => {
  return layouts[themeName] || layouts.modern;
};

// Default layout
export const defaultLayout = ModernLayout;

