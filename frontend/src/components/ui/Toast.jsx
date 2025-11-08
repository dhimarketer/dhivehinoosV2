import { XMarkIcon, CheckCircleIcon, ExclamationCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
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

export const Toast = ({ toast, onClose }) => {
  const Icon = iconMap[toast.status] || InformationCircleIcon;
  
  return (
    <div
      className={clsx(
        'border rounded-lg p-4 shadow-lg max-w-sm w-full flex items-start',
        colorMap[toast.status] || colorMap.info
      )}
    >
      <Icon className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        {toast.title && (
          <div className="font-semibold mb-1">{toast.title}</div>
        )}
        {toast.description && (
          <div className="text-sm">{toast.description}</div>
        )}
      </div>
      {toast.isClosable && (
        <button
          onClick={() => onClose(toast.id)}
          className="ml-3 text-gray-400 hover:text-gray-600"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      )}
    </div>
  );
};

export const ToastContainer = ({ toasts, onClose }) => {
  if (toasts.length === 0) return null;
  
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
};


