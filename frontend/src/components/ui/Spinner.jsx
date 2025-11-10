import { ClipLoader } from 'react-spinners';
import clsx from 'clsx';

export const Spinner = ({ 
  size = 'md',
  color = '#0073e6',
  className,
  ...props 
}) => {
  const sizeMap = {
    sm: 16,
    md: 24,
    lg: 32,
    xl: 40,
  };
  
  return (
    <ClipLoader
      size={sizeMap[size]}
      color={color}
      className={clsx(className)}
      {...props}
    />
  );
};



