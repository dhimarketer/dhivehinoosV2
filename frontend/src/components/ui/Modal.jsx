import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

export const Modal = ({ isOpen, onClose, children, size = 'md', ...props }) => {
  if (!isOpen) return null;
  
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4',
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50" {...props}>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" onClick={onClose} />
      
      {/* Modal container */}
      <div className="fixed inset-0 flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
        <DialogPanel className={clsx('bg-white rounded-lg shadow-xl w-full relative', sizeClasses[size])}>
          {children}
        </DialogPanel>
      </div>
    </Dialog>
  );
};

export const ModalOverlay = () => null; // Handled by Modal component

export const ModalContent = ({ children, className, ...props }) => (
  <div className={clsx('relative', className)} {...props}>
    {children}
  </div>
);

export const ModalHeader = ({ children, className, ...props }) => (
  <DialogTitle className={clsx('text-xl font-bold mb-4 pr-8', className)} {...props}>
    {children}
  </DialogTitle>
);

export const ModalBody = ({ children, className, ...props }) => (
  <div className={clsx('mb-4', className)} {...props}>
    {children}
  </div>
);

export const ModalCloseButton = ({ onClose, className, ...props }) => (
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

export const ModalFooter = ({ children, className, ...props }) => (
  <div className={clsx('flex justify-end gap-2 mt-4', className)} {...props}>
    {children}
  </div>
);

