// Classic Blog Theme - Traditional blog layout with warm colors
import { extendTheme } from '@chakra-ui/react';
import { baseTheme } from './base';

export const classicTheme = extendTheme(baseTheme, {
  colors: {
    brand: {
      50: '#fef5e7',
      100: '#fce8c4',
      200: '#f9d19e',
      300: '#f6ba78',
      400: '#f3a352',
      500: '#f08c2c', // Warm orange
      600: '#c06f23',
      700: '#90521a',
      800: '#603512',
      900: '#301809',
    },
    gray: {
      50: '#faf9f7',
      100: '#f5f3f0',
      200: '#e8e5df',
      300: '#d4cfc4',
      400: '#a8a089',
      500: '#7c715e',
      600: '#5a5244',
      700: '#3d3730',
      800: '#201c1a',
      900: '#0a0908',
    },
  },
  fonts: {
    ...baseTheme.fonts,
    heading: `Georgia, "Times New Roman", serif`,
    body: `Georgia, "Times New Roman", serif`,
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'brand',
      },
    },
    Card: {
      baseStyle: {
        container: {
          bg: 'gray.50',
          borderRadius: 'md',
          boxShadow: 'md',
          border: '1px solid',
          borderColor: 'gray.300',
        },
      },
    },
  },
  styles: {
    global: {
      body: {
        bg: 'gray.50',
        color: 'gray.800',
      },
    },
  },
});

