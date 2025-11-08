import { 
  ExclamationCircleIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon 
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

const iconMap = {
  success: CheckCircleIcon,
  error: ExclamationCircleIcon,
  warning: ExclamationTriangleIcon,
  info: InformationCircleIcon,
};

const colorMap = {
  success: 'bg-green-50 text-green-800 border-green-200',
  error: 'bg-red-50 text-red-800 border-red-200',
  warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  info: 'bg-blue-50 text-blue-800 border-blue-200',
};

export const Alert = ({ 
  status = 'info',
  title,
  children,
  className,
  ...props 
}) => {
  const Icon = iconMap[status];
  
  return (
    <div
      role="alert"
      className={clsx(
        'border rounded-lg p-4 flex items-start',
        colorMap[status],
        className
      )}
      {...props}
    >
      <Icon className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        {title && <div className="font-semibold mb-1">{title}</div>}
        <div>{children}</div>
      </div>
    </div>
  );
};

