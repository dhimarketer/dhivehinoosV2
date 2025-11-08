import clsx from 'clsx';

export const Select = ({
  children,
  error,
  size = 'md',
  className,
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-5 py-3 text-lg',
  };
  
  return (
    <select
      className={clsx(
        'w-full rounded-lg border transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-offset-0',
        sizeClasses[size],
        error
          ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
          : 'border-gray-300 focus:border-brand-500 focus:ring-brand-500',
        'bg-white',
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
};


