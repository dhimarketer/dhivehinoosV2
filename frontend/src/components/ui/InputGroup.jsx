import clsx from 'clsx';

export const InputGroup = ({ children, size = 'md', className, ...props }) => {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };
  
  return (
    <div className={clsx('relative', sizeClasses[size], className)} {...props}>
      {children}
    </div>
  );
};

export const InputRightElement = ({ children, className, ...props }) => (
  <div className={clsx('absolute inset-y-0 right-0 flex items-center pr-3', className)} {...props}>
    {children}
  </div>
);

export const InputLeftElement = ({ children, className, ...props }) => (
  <div className={clsx('absolute inset-y-0 left-0 flex items-center pl-3', className)} {...props}>
    {children}
  </div>
);


