import clsx from 'clsx';

export const Container = ({ 
  children, 
  maxW = 'xl',
  className,
  ...props 
}) => {
  const maxWidthClasses = {
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    '2xl': 'max-w-screen-2xl',
    '7xl': 'max-w-7xl',
    'content': 'max-w-content', // Standard.mv max width without sidebar (840px)
    'content-sidebar': 'max-w-content-sidebar', // Standard.mv max width with sidebar (760px)
    'newspaper': 'max-w-newspaper', // Newspaper layout max width (1240px)
    full: 'max-w-full',
  };
  
  return (
    <div
      className={clsx(
        'mx-auto px-4 sm:px-6',
        maxWidthClasses[maxW],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

