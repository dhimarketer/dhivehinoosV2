// Minimal Clean Theme - Lots of whitespace, simple design
import { extendTheme } from '@chakra-ui/react';
import { baseTheme } from './base';

export const minimalTheme = extendTheme(baseTheme, {
  colors: {
    brand: {
      50: '#f0f0f0',
      100: '#d0d0d0',
      200: '#b0b0b0',
      300: '#909090',
      400: '#707070',
      500: '#505050', // Neutral gray
      600: '#404040',
      700: '#303030',
      800: '#202020',
      900: '#101010',
    },
    gray: {
      50: '#ffffff',
      100: '#fafafa',
      200: '#f5f5f5',
      300: '#e5e5e5',
      400: '#d4d4d4',
      500: '#a3a3a3',
      600: '#737373',
      700: '#525252',
      800: '#404040',
      900: '#262626',
    },
  },
  components: {
    Button: {
      defaultProps: {
        variant: 'ghost',
        colorScheme: 'gray',
      },
      variants: {
        solid: {
          bg: 'gray.900',
          color: 'white',
          _hover: {
            bg: 'gray.800',
          },
        },
      },
    },
    Card: {
      baseStyle: {
        container: {
          bg: 'white',
          borderRadius: 'none',
          boxShadow: 'none',
          border: 'none',
        },
      },
    },
  },
  styles: {
    global: {
      body: {
        bg: 'white',
        color: 'gray.900',
      },
    },
  },
  space: {
    ...baseTheme.space,
    // Larger spacing for minimal theme
    16: '4rem',
    20: '5rem',
    24: '6rem',
    32: '8rem',
  },
});

