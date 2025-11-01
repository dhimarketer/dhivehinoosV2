import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { deferCssPlugin } from './vite-plugin-defer-css.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), deferCssPlugin()],
  resolve: {
    dedupe: ['react', 'react-dom'], // Ensure single React instance
  },
  server: {
    port: 3000,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable sourcemaps in production for better performance
    minify: 'esbuild', // Use esbuild for fast minification (default, but explicit)
    // Optimize chunk size warnings - Vite will automatically split large chunks
    chunkSizeWarningLimit: 500, // Warn if chunks exceed 500KB
    rollupOptions: {
      output: {
        // Simplified chunking - only separate react-icons, let Vite handle dependency order
        manualChunks: (id) => {
          // Only manually chunk react-icons - let Vite handle everything else for correct dependency order
          if (id.includes('react-icons')) {
            return 'react-icons';
          }
          // Let Vite automatically chunk everything else to maintain correct load order
        },
        // Optimize CSS output
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'assets/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
        // Optimize chunk file names
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
    // Enable CSS code splitting for better performance
    cssCodeSplit: true,
    // Optimize asset handling
    assetsInlineLimit: 4096, // Inline assets smaller than 4kb
    // Build optimizations
    cssMinify: true,
    // Optimize CSS for faster loading
    cssTarget: 'chrome80', // Target modern browsers for better CSS optimization
    // Optimize chunking strategy - target modern browsers for smaller bundle
    target: 'esnext', // Target modern browsers for smaller bundle
  },
})
