import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
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
  fonts: {
    heading: '"Inter", sans-serif',
    body: '"Inter", sans-serif',
  },
  breakpoints: {
    base: '0px',
    sm: '480px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  styles: {
    global: {
      body: {
        bg: 'gray.50',
        color: 'gray.800',
        fontSize: { base: '14px', md: '16px' },
        lineHeight: { base: '1.5', md: '1.6' },
      },
    },
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'brand',
      },
      baseStyle: {
        fontSize: { base: 'sm', md: 'md' },
        px: { base: 3, md: 4 },
        py: { base: 2, md: 3 },
      },
    },
    Card: {
      baseStyle: {
        container: {
          boxShadow: { base: 'sm', md: 'md' },
          borderRadius: { base: 'md', md: 'lg' },
        },
      },
    },
    Container: {
      baseStyle: {
        px: { base: 4, md: 6 },
        maxW: { base: '100%', md: 'container.md', lg: 'container.lg', xl: 'container.xl' },
      },
    },
    Heading: {
      baseStyle: {
        fontSize: {
          '4xl': { base: '2xl', md: '3xl', lg: '4xl' },
          '3xl': { base: 'xl', md: '2xl', lg: '3xl' },
          '2xl': { base: 'lg', md: 'xl', lg: '2xl' },
          'xl': { base: 'md', md: 'lg', lg: 'xl' },
          'lg': { base: 'sm', md: 'md', lg: 'lg' },
          'md': { base: 'xs', md: 'sm', lg: 'md' },
        },
      },
    },
    Text: {
      baseStyle: {
        fontSize: { base: 'sm', md: 'md' },
      },
    },
  },
});

export default theme;
