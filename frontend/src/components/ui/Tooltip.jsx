import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import clsx from 'clsx';

export const Tooltip = ({ 
  label, 
  children, 
  placement = 'top',
  className,
  ...props 
}) => {
  return (
    <Popover className="relative">
      <PopoverButton as="div" className="inline-block">
        {children}
      </PopoverButton>
      <PopoverPanel
        className={clsx(
          'absolute z-50 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded shadow-lg',
          placement === 'top' && 'bottom-full left-1/2 -translate-x-1/2 mb-2',
          placement === 'bottom' && 'top-full left-1/2 -translate-x-1/2 mt-2',
          placement === 'left' && 'right-full top-1/2 -translate-y-1/2 mr-2',
          placement === 'right' && 'left-full top-1/2 -translate-y-1/2 ml-2',
          className
        )}
        {...props}
      >
        {label}
        {/* Arrow */}
        <div
          className={clsx(
            'absolute w-2 h-2 bg-gray-900 transform rotate-45',
            placement === 'top' && 'top-full left-1/2 -translate-x-1/2 -mt-1',
            placement === 'bottom' && 'bottom-full left-1/2 -translate-x-1/2 -mb-1',
            placement === 'left' && 'left-full top-1/2 -translate-y-1/2 -ml-1',
            placement === 'right' && 'right-full top-1/2 -translate-y-1/2 -mr-1'
          )}
        />
      </PopoverPanel>
    </Popover>
  );
};



