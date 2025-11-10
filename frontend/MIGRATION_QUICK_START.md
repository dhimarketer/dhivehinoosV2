# Quick Start Guide: Chakra UI to Tailwind Migration

## Installation

```bash
# Install Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Install Headless UI and Heroicons
npm install @headlessui/react @heroicons/react

# Install additional utilities
npm install react-spinners  # For loading spinners
npm install clsx  # For conditional class names

# Optional: Tailwind plugins
npm install -D @tailwindcss/forms @tailwindcss/typography
```

## Tailwind Config Setup

```javascript
// tailwind.config.js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#e6f3ff',
          100: '#b3d9ff',
          200: '#80bfff',
          300: '#4da6ff',
          400: '#1a8cff',
          500: '#0073e6',
          600: '#005bb3',
          700: '#004280',
          800: '#002a4d',
          900: '#00111a',
        },
      },
      fontFamily: {
        heading: ['Inter', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      screens: {
        'sm': '480px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
```

## Base Component Examples

### Button Component

```jsx
// src/components/ui/Button.jsx
import clsx from 'clsx';

export const Button = ({
  children,
  variant = 'solid',
  size = 'md',
  colorScheme = 'brand',
  isLoading = false,
  isDisabled = false,
  className,
  ...props
}) => {
  const baseClasses = 'font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    solid: `bg-${colorScheme}-500 text-white hover:bg-${colorScheme}-600 active:bg-${colorScheme}-700`,
    outline: `border-2 border-${colorScheme}-500 text-${colorScheme}-500 hover:bg-${colorScheme}-50 active:bg-${colorScheme}-100`,
    ghost: `text-${colorScheme}-500 hover:bg-${colorScheme}-50 active:bg-${colorScheme}-100`,
    link: `text-${colorScheme}-500 hover:underline`,
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  
  const disabledClasses = isDisabled || isLoading 
    ? 'opacity-50 cursor-not-allowed' 
    : 'cursor-pointer';
  
  return (
    <button
      className={clsx(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        disabledClasses,
        className
      )}
      disabled={isDisabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center">
          <Spinner size="sm" className="mr-2" />
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
};
```

### Card Component

```jsx
// src/components/ui/Card.jsx
import clsx from 'clsx';

export const Card = ({ children, className, ...props }) => (
  <div
    className={clsx(
      'bg-white rounded-lg shadow-md overflow-hidden',
      className
    )}
    {...props}
  >
    {children}
  </div>
);

export const CardHeader = ({ children, className, ...props }) => (
  <div
    className={clsx('px-6 py-4 border-b border-gray-200', className)}
    {...props}
  >
    {children}
  </div>
);

export const CardBody = ({ children, className, ...props }) => (
  <div className={clsx('px-6 py-4', className)} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ children, className, ...props }) => (
  <div
    className={clsx('px-6 py-4 border-t border-gray-200 bg-gray-50', className)}
    {...props}
  >
    {children}
  </div>
);
```

### Container Component

```jsx
// src/components/ui/Container.jsx
import clsx from 'clsx';

export const Container = ({ 
  children, 
  maxW = 'xl',
  className,
  ...props 
}) => {
  const maxWidthClasses = {
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    '2xl': 'max-w-screen-2xl',
    full: 'max-w-full',
  };
  
  return (
    <div
      className={clsx(
        'mx-auto px-4 sm:px-6',
        maxWidthClasses[maxW],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
```

### Heading Component

```jsx
// src/components/ui/Heading.jsx
import clsx from 'clsx';

export const Heading = ({ 
  as: Component = 'h2',
  size = 'md',
  children,
  className,
  ...props 
}) => {
  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base sm:text-lg md:text-xl',
    lg: 'text-lg sm:text-xl md:text-2xl',
    xl: 'text-xl sm:text-2xl md:text-3xl',
    '2xl': 'text-2xl sm:text-3xl md:text-4xl',
    '3xl': 'text-3xl sm:text-4xl md:text-5xl',
    '4xl': 'text-4xl sm:text-5xl md:text-6xl',
  };
  
  return (
    <Component
      className={clsx(
        'font-heading font-bold text-gray-900',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
};
```

### Text Component

```jsx
// src/components/ui/Text.jsx
import clsx from 'clsx';

export const Text = ({ 
  as: Component = 'p',
  size = 'md',
  children,
  className,
  ...props 
}) => {
  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };
  
  return (
    <Component
      className={clsx(
        'font-body text-gray-800',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
};
```

### Spinner Component

```jsx
// src/components/ui/Spinner.jsx
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
```

### Alert Component

```jsx
// src/components/ui/Alert.jsx
import { AlertCircleIcon, CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

const iconMap = {
  success: CheckCircleIcon,
  error: AlertCircleIcon,
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
```

### Input Component

```jsx
// src/components/ui/Input.jsx
import clsx from 'clsx';

export const Input = ({
  error,
  size = 'md',
  className,
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-5 py-3 text-lg',
  };
  
  return (
    <input
      className={clsx(
        'w-full rounded-lg border transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-offset-0',
        sizeClasses[size],
        error
          ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
          : 'border-gray-300 focus:border-brand-500 focus:ring-brand-500',
        className
      )}
      {...props}
    />
  );
};
```

## Migration Example: HomePage

### Before (Chakra UI)
```jsx
import { Box, Container, Heading, Text, Button } from '@chakra-ui/react';

const HomePage = () => (
  <Container maxW="xl">
    <Box p={4}>
      <Heading size="lg">Welcome</Heading>
      <Text mt={4}>Some text here</Text>
      <Button colorScheme="brand" mt={4}>Click me</Button>
    </Box>
  </Container>
);
```

### After (Tailwind CSS)
```jsx
import { Container } from '../components/ui/Container';
import { Heading } from '../components/ui/Heading';
import { Text } from '../components/ui/Text';
import { Button } from '../components/ui/Button';

const HomePage = () => (
  <Container maxW="xl">
    <div className="p-4">
      <Heading size="lg">Welcome</Heading>
      <Text className="mt-4">Some text here</Text>
      <Button colorScheme="brand" className="mt-4">Click me</Button>
    </div>
  </Container>
);
```

## Common Patterns

### Flex Layout
```jsx
// Chakra: <Flex direction="row" align="center" justify="space-between">
<div className="flex flex-row items-center justify-between">

// Chakra: <HStack spacing={4}>
<div className="flex flex-row items-center gap-4">

// Chakra: <VStack spacing={4}>
<div className="flex flex-col gap-4">
```

### Grid Layout
```jsx
// Chakra: <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

### Responsive Text
```jsx
// Chakra: fontSize={{ base: 'sm', md: 'md', lg: 'lg' }}
<div className="text-sm md:text-base lg:text-lg">
```

### Conditional Classes
```jsx
import clsx from 'clsx';

<div className={clsx(
  'base-classes',
  condition && 'conditional-classes',
  anotherCondition ? 'class-a' : 'class-b'
)}>
```

## Icon Migration

```jsx
// Before: import { SearchIcon } from '@chakra-ui/icons';
// After:
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

// Usage
<MagnifyingGlassIcon className="h-5 w-5" />
```

## Testing Checklist

- [ ] Visual comparison (pixel-perfect)
- [ ] Responsive breakpoints
- [ ] Hover states
- [ ] Focus states
- [ ] Disabled states
- [ ] Loading states
- [ ] Error states
- [ ] Keyboard navigation
- [ ] Screen reader compatibility
- [ ] Performance metrics



