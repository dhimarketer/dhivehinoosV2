import clsx from 'clsx';

export const Box = ({ 
  children, 
  className,
  ...props 
}) => {
  return (
    <div
      className={clsx(className)}
      {...props}
    >
      {children}
    </div>
  );
};



