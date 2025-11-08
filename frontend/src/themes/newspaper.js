// Newspaper Style Theme - Traditional newspaper layout
import { extendTheme } from '@chakra-ui/react';
import { baseTheme } from './base';

export const newspaperTheme = extendTheme(baseTheme, {
  colors: {
    brand: {
      50: '#f5f5f5',
      100: '#e0e0e0',
      200: '#bdbdbd',
      300: '#9e9e9e',
      400: '#757575',
      500: '#424242', // Dark gray/black
      600: '#212121',
      700: '#1a1a1a',
      800: '#0f0f0f',
      900: '#000000',
    },
    gray: {
      50: '#ffffff',
      100: '#fafafa',
      200: '#f0f0f0',
      300: '#e0e0e0',
      400: '#bdbdbd',
      500: '#9e9e9e',
      600: '#757575',
      700: '#424242',
      800: '#212121',
      900: '#000000',
    },
  },
  fonts: {
    ...baseTheme.fonts,
    heading: `"Times New Roman", Times, serif`,
    body: `"Times New Roman", Times, serif`,
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'gray',
        variant: 'outline',
      },
    },
    Card: {
      baseStyle: {
        container: {
          bg: 'white',
          borderRadius: 'none',
          boxShadow: 'none',
          border: '2px solid',
          borderColor: 'gray.900',
        },
      },
    },
  },
  styles: {
    global: {
      body: {
        bg: 'gray.100',
        color: 'gray.900',
      },
    },
  },
});

