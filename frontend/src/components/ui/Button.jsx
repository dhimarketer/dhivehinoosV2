import clsx from 'clsx';

export const Button = ({
  children,
  variant = 'solid',
  size = 'md',
  colorScheme = 'brand',
  isLoading = false,
  isDisabled = false,
  disabled,
  className,
  ...props
}) => {
  const baseClasses = 'font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const colorSchemes = {
    brand: {
      solid: 'bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 focus:ring-brand-500',
      outline: 'border-2 border-brand-500 text-brand-500 hover:bg-brand-50 active:bg-brand-100 focus:ring-brand-500',
      ghost: 'text-brand-500 hover:bg-brand-50 active:bg-brand-100 focus:ring-brand-500',
      link: 'text-brand-500 hover:underline focus:ring-brand-500',
    },
    blue: {
      solid: 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700 focus:ring-blue-500',
      outline: 'border-2 border-blue-500 text-blue-500 hover:bg-blue-50 active:bg-blue-100 focus:ring-blue-500',
      ghost: 'text-blue-500 hover:bg-blue-50 active:bg-blue-100 focus:ring-blue-500',
      link: 'text-blue-500 hover:underline focus:ring-blue-500',
    },
    green: {
      solid: 'bg-green-500 text-white hover:bg-green-600 active:bg-green-700 focus:ring-green-500',
      outline: 'border-2 border-green-500 text-green-500 hover:bg-green-50 active:bg-green-100 focus:ring-green-500',
      ghost: 'text-green-500 hover:bg-green-50 active:bg-green-100 focus:ring-green-500',
      link: 'text-green-500 hover:underline focus:ring-green-500',
    },
    red: {
      solid: 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700 focus:ring-red-500',
      outline: 'border-2 border-red-500 text-red-500 hover:bg-red-50 active:bg-red-100 focus:ring-red-500',
      ghost: 'text-red-500 hover:bg-red-50 active:bg-red-100 focus:ring-red-500',
      link: 'text-red-500 hover:underline focus:ring-red-500',
    },
    gray: {
      solid: 'bg-gray-500 text-white hover:bg-gray-600 active:bg-gray-700 focus:ring-gray-500',
      outline: 'border-2 border-gray-500 text-gray-500 hover:bg-gray-50 active:bg-gray-100 focus:ring-gray-500',
      ghost: 'text-gray-500 hover:bg-gray-50 active:bg-gray-100 focus:ring-gray-500',
      link: 'text-gray-500 hover:underline focus:ring-gray-500',
    },
  };
  
  const variantClasses = colorSchemes[colorScheme] || colorSchemes.brand;
  
  const sizeClasses = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  
  return (
    <button
      className={clsx(
        baseClasses,
        variantClasses[variant] || variantClasses.solid,
        sizeClasses[size],
        className
      )}
      disabled={isDisabled || isLoading || disabled}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647A7.962 7.962 0 0112 20c0-3.042-1.135-5.824-3-7.938l-3 2.647z"></path>
          </svg>
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
};

