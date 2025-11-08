import clsx from 'clsx';

export const IconButton = ({
  icon: Icon,
  'aria-label': ariaLabel,
  size = 'md',
  variant = 'ghost',
  colorScheme = 'gray',
  className,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const sizeClasses = {
    xs: 'h-6 w-6 text-xs',
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-base',
    lg: 'h-12 w-12 text-lg',
  };
  
  // Color scheme classes - using explicit classes for Tailwind
  const colorClasses = {
    gray: {
      solid: 'bg-gray-500 text-white hover:bg-gray-600 focus:ring-gray-500',
      outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500',
      ghost: 'text-gray-600 hover:bg-gray-50 focus:ring-gray-500',
    },
    blue: {
      solid: 'bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500',
      outline: 'border border-blue-300 text-blue-700 hover:bg-blue-50 focus:ring-blue-500',
      ghost: 'text-blue-600 hover:bg-blue-50 focus:ring-blue-500',
    },
    brand: {
      solid: 'bg-brand-500 text-white hover:bg-brand-600 focus:ring-brand-500',
      outline: 'border border-brand-300 text-brand-700 hover:bg-brand-50 focus:ring-brand-500',
      ghost: 'text-brand-600 hover:bg-brand-50 focus:ring-brand-500',
    },
  };
  
  const variantClasses = colorClasses[colorScheme]?.[variant] || colorClasses.gray[variant];
  
  return (
    <button
      type="button"
      className={clsx(
        baseClasses,
        sizeClasses[size],
        variantClasses,
        className
      )}
      aria-label={ariaLabel}
      {...props}
    >
      {Icon && <Icon />}
    </button>
  );
};

