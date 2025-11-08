import clsx from 'clsx';

export const Text = ({ 
  as: Component = 'p',
  size = 'md',
  children,
  className,
  ...props 
}) => {
  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };
  
  return (
    <Component
      className={clsx(
        'font-body text-gray-800',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
};


