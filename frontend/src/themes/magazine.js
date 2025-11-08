// Magazine Layout Theme - Bold, visual, asymmetric layouts
import { extendTheme } from '@chakra-ui/react';
import { baseTheme } from './base';

export const magazineTheme = extendTheme(baseTheme, {
  colors: {
    brand: {
      50: '#fff5f5',
      100: '#fed7d7',
      200: '#feb2b2',
      300: '#fc8181',
      400: '#f56565',
      500: '#e53e3e', // Bold red
      600: '#c53030',
      700: '#9b2c2c',
      800: '#742a2a',
      900: '#63171b',
    },
    gray: {
      50: '#f7fafc',
      100: '#edf2f7',
      200: '#e2e8f0',
      300: '#cbd5e0',
      400: '#a0aec0',
      500: '#718096',
      600: '#4a5568',
      700: '#2d3748',
      800: '#1a202c',
      900: '#171923',
    },
  },
  fonts: {
    ...baseTheme.fonts,
    heading: `"Playfair Display", Georgia, serif`,
    body: `Inter, sans-serif`,
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'brand',
        size: 'lg',
      },
      variants: {
        solid: {
          bg: 'brand.500',
          color: 'white',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          letterSpacing: 'wide',
          _hover: {
            bg: 'brand.600',
            transform: 'scale(1.05)',
          },
        },
      },
    },
    Card: {
      baseStyle: {
        container: {
          bg: 'white',
          borderRadius: 'xl',
          boxShadow: 'xl',
          border: 'none',
        },
      },
    },
  },
  styles: {
    global: {
      body: {
        bg: 'gray.50',
        color: 'gray.900',
      },
    },
  },
});

