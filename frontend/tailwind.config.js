/** @type {import('tailwindcss').Config} */
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
          500: '#06aef4', // Standard.mv primary color
          600: '#005bb3',
          700: '#004280',
          800: '#092768', // Standard.mv dark accent
          900: '#00111a',
        },
        newspaper: {
          'cyan-blue': '#00AEC7',
          'pitch-black': '#000000',
          'light-gray': '#F3F4F6',
          white: '#FFFFFF',
        },
        standard: {
          primary: '#06aef4',
          'primary-90': '#06aef4e6',
          'dark-accent': '#092768',
          'dark-accent-90': '#092768e6',
          excerpt: '#555555',
          text: '#000000',
        },
      },
      fontFamily: {
        // Newspaper style: Serif for headlines
        heading: ['Merriweather', 'Playfair Display', 'Libre Baskerville', 'Georgia', 'serif'],
        serif: ['Merriweather', 'Playfair Display', 'Libre Baskerville', 'Georgia', 'serif'],
        // Sans-serif for metadata, dates, body text
        body: ['Inter', 'Roboto', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        meta: ['Inter', 'Roboto', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        category: ['Inter', 'Roboto', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      fontSize: {
        // Standard.mv font sizes
        'headline': ['54px', { lineHeight: '1.048', letterSpacing: '-0.01852em' }],
        'headline-md': ['36px', { lineHeight: '1.111' }],
        'headline-sm': ['28px', { lineHeight: '1.238' }],
        'body-lg': ['19px', { lineHeight: '1.6' }],
        'body-md': ['17px', { lineHeight: '1.6' }],
        'body-sm': ['16px', { lineHeight: '1.6' }],
        'category': ['11px', { lineHeight: '1.4', letterSpacing: '0.09091em' }],
        'meta': ['11px', { lineHeight: '1.4' }],
      },
      maxWidth: {
        'content': '840px', // Standard.mv max width without sidebar
        'content-sidebar': '760px', // Standard.mv max width with sidebar
        'newspaper': '1240px', // Newspaper layout max width
      },
      borderRadius: {
        'none': '0', // Standard.mv uses no border radius
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
    function({ addUtilities }) {
      addUtilities({
        '.scrollbar-hide': {
          /* IE and Edge */
          '-ms-overflow-style': 'none',
          /* Firefox */
          'scrollbar-width': 'none',
          /* Safari and Chrome */
          '&::-webkit-scrollbar': {
            display: 'none'
          }
        }
      })
    },
  ],
}



