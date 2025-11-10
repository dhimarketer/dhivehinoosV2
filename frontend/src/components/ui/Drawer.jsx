import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

export const Drawer = ({ isOpen, onClose, children, placement = 'right', ...props }) => {
  if (!isOpen) return null;
  
  const placementClasses = {
    left: 'left-0 top-0 bottom-0',
    right: 'right-0 top-0 bottom-0',
    top: 'top-0 left-0 right-0',
    bottom: 'bottom-0 left-0 right-0',
  };
  
  const sizeClasses = {
    left: 'w-full max-w-sm',
    right: 'w-full max-w-sm',
    top: 'h-full max-h-96',
    bottom: 'h-full max-h-96',
  };
  
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50" {...props}>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" onClick={onClose} />
      
      {/* Drawer container */}
      <div className="fixed inset-0 flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
        <DialogPanel className={clsx(
          'bg-white shadow-xl fixed',
          placementClasses[placement],
          sizeClasses[placement],
          'flex flex-col'
        )}>
          {children}
        </DialogPanel>
      </div>
    </Dialog>
  );
};

export const DrawerOverlay = () => null; // Handled by Drawer component

export const DrawerContent = ({ children, className, ...props }) => (
  <div className={clsx('flex flex-col h-full', className)} {...props}>
    {children}
  </div>
);

export const DrawerHeader = ({ children, className, ...props }) => (
  <DialogTitle className={clsx('p-4 border-b border-gray-200 font-semibold text-lg', className)} {...props}>
    {children}
  </DialogTitle>
);

export const DrawerBody = ({ children, className, ...props }) => (
  <div className={clsx('flex-1 overflow-y-auto p-4', className)} {...props}>
    {children}
  </div>
);

export const DrawerCloseButton = ({ onClose, className, ...props }) => (
  <button
    type="button"
    onClick={onClose}
    className={clsx(
      'absolute top-4 right-4 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500 rounded p-1',
      className
    )}
    {...props}
  >
    <XMarkIcon className="h-6 w-6" />
  </button>
);



