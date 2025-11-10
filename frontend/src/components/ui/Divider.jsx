import clsx from 'clsx';

export const Divider = ({
  orientation = 'horizontal',
  className,
  ...props
}) => {
  return (
    <hr
      className={clsx(
        orientation === 'horizontal' ? 'w-full border-t border-gray-200' : 'h-full border-l border-gray-200',
        className
      )}
      {...props}
    />
  );
};



