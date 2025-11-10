import { Switch as HeadlessSwitch } from '@headlessui/react';
import clsx from 'clsx';

export const Switch = ({
  isChecked,
  onChange,
  label,
  className,
  ...props
}) => {
  return (
    <HeadlessSwitch
      checked={isChecked}
      onChange={onChange}
      className={clsx(
        isChecked ? 'bg-brand-500' : 'bg-gray-200',
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2',
        className
      )}
      {...props}
    >
      <span className="sr-only">{label}</span>
      <span
        className={clsx(
          isChecked ? 'translate-x-6' : 'translate-x-1',
          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform'
        )}
      />
    </HeadlessSwitch>
  );
};



