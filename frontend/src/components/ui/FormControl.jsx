import clsx from 'clsx';

export const FormControl = ({ children, isRequired, isInvalid, className, ...props }) => (
  <div className={clsx('mb-4', className)} {...props}>
    {children}
  </div>
);

export const FormLabel = ({ children, className, isRequired, ...props }) => (
  <label
    className={clsx(
      'block text-sm font-medium text-gray-700 mb-1',
      isRequired && "after:content-['*'] after:ml-0.5 after:text-red-500",
      className
    )}
    {...props}
  >
    {children}
  </label>
);

export const FormHelperText = ({ children, className, ...props }) => (
  <p className={clsx('mt-1 text-sm text-gray-500', className)} {...props}>
    {children}
  </p>
);

export const FormErrorMessage = ({ children, className, ...props }) => (
  <p className={clsx('mt-1 text-sm text-red-600', className)} {...props}>
    {children}
  </p>
);




