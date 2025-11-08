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
        // Single vendor chunk to avoid loading order issues
        // All node_modules in one chunk ensures proper dependency resolution
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // Put all vendor code in one chunk to ensure proper load order
            return 'vendor';
          }
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
    // Optimize asset handling - reduce inline limit to force separate files
    assetsInlineLimit: 2048, // Inline assets smaller than 2kb (reduced from 4kb)
    // Build optimizations
    cssMinify: true,
    // Optimize CSS for faster loading
    cssTarget: 'chrome80', // Target modern browsers for better CSS optimization
    // Optimize chunking strategy - target modern browsers for smaller bundle
    target: 'esnext', // Target modern browsers for smaller bundle
    // Enable tree shaking
    treeshake: true,
  },
})
