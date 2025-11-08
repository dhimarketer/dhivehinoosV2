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

