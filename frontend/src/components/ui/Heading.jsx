import clsx from 'clsx';

export const Heading = ({ 
  as: Component = 'h2',
  size = 'md',
  children,
  className,
  ...props 
}) => {
  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base sm:text-lg md:text-xl',
    lg: 'text-lg sm:text-xl md:text-2xl',
    xl: 'text-xl sm:text-2xl md:text-3xl',
    '2xl': 'text-2xl sm:text-3xl md:text-4xl',
    '3xl': 'text-3xl sm:text-4xl md:text-5xl',
    '4xl': 'text-4xl sm:text-5xl md:text-6xl',
  };
  
  return (
    <Component
      className={clsx(
        'font-heading font-bold text-gray-900',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
};


