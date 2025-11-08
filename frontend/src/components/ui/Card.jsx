import clsx from 'clsx';

export const Card = ({ children, className, as, to, href, ...props }) => {
  const Component = as || 'div';
  const baseClasses = 'bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden';
  
  // If it's a link component (Link from react-router or native <a>)
  if (as || to || href) {
    return (
      <Component
        to={to}
        href={href || to}
        className={clsx(baseClasses, 'block no-underline text-inherit', className)}
        {...props}
      >
        {children}
      </Component>
    );
  }
  
  return (
    <Component
      className={clsx(baseClasses, className)}
      {...props}
    >
      {children}
    </Component>
  );
};

export const CardHeader = ({ children, className, ...props }) => (
  <div
    className={clsx('px-4 py-3 border-b border-gray-100', className)}
    {...props}
  >
    {children}
  </div>
);

export const CardBody = ({ children, className, ...props }) => (
  <div className={clsx('px-4 py-3', className)} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ children, className, ...props }) => (
  <div
    className={clsx('px-6 py-4 border-t border-gray-200 bg-gray-50', className)}
    {...props}
  >
    {children}
  </div>
);

