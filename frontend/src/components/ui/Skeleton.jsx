import clsx from 'clsx';

export const Skeleton = ({
  className,
  ...props
}) => {
  return (
    <div
      className={clsx(
        'animate-pulse bg-gray-200 rounded',
        className
      )}
      {...props}
    />
  );
};



