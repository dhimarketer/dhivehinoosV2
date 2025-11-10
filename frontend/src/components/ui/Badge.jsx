import clsx from 'clsx';

export const Badge = ({
  children,
  colorScheme = 'gray',
  variant = 'solid',
  size = 'md',
  className,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center font-medium rounded-full';
  
  const colorClasses = {
    gray: {
      solid: 'bg-gray-100 text-gray-800',
      outline: 'border border-gray-300 text-gray-800',
      subtle: 'bg-gray-50 text-gray-700',
    },
    red: {
      solid: 'bg-red-100 text-red-800',
      outline: 'border border-red-300 text-red-800',
      subtle: 'bg-red-50 text-red-700',
    },
    green: {
      solid: 'bg-green-100 text-green-800',
      outline: 'border border-green-300 text-green-800',
      subtle: 'bg-green-50 text-green-700',
    },
    blue: {
      solid: 'bg-blue-100 text-blue-800',
      outline: 'border border-blue-300 text-blue-800',
      subtle: 'bg-blue-50 text-blue-700',
    },
    brand: {
      solid: 'bg-brand-100 text-brand-800',
      outline: 'border border-brand-300 text-brand-800',
      subtle: 'bg-brand-50 text-brand-700',
    },
  };
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-sm',
    lg: 'px-3 py-1 text-base',
  };
  
  return (
    <span
      className={clsx(
        baseClasses,
        colorClasses[colorScheme]?.[variant] || colorClasses.gray[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};



