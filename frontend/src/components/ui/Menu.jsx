import { Menu as HeadlessMenu, MenuButton as HeadlessMenuButton, MenuItems, MenuItem as HeadlessMenuItem } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

export const Menu = ({ children, ...props }) => (
  <HeadlessMenu className="relative" {...props}>
    {children}
  </HeadlessMenu>
);

export const MenuButton = ({ children, rightIcon, className, ...props }) => (
  <HeadlessMenuButton
    className={clsx(
      'inline-flex items-center px-3 py-2 text-sm font-medium rounded-md',
      'hover:bg-brand-50 hover:text-brand-600',
      'focus:outline-none focus:ring-2 focus:ring-brand-500',
      className
    )}
    {...props}
  >
    {children}
    {rightIcon && <ChevronDownIcon className="ml-2 h-4 w-4" />}
  </HeadlessMenuButton>
);

export const MenuList = ({ children, className, ...props }) => (
  <MenuItems
    className={clsx(
      'absolute z-50 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none',
      className
    )}
    {...props}
  >
    <div className="py-1">
      {children}
    </div>
  </MenuItems>
);

export const MenuItem = ({ children, as, to, onClick, className, ...props }) => {
  const Component = as || 'div';
  
  return (
    <HeadlessMenuItem>
      {({ active }) => (
        <Component
          to={to}
          onClick={onClick}
          className={clsx(
            active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
            'block px-4 py-2 text-sm',
            className
          )}
          {...props}
        >
          {children}
        </Component>
      )}
    </HeadlessMenuItem>
  );
};

export const MenuDivider = ({ className, ...props }) => (
  <div className={clsx('border-t border-gray-200 my-1', className)} {...props} />
);


