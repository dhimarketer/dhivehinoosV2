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
    rollupOptions: {
      output: {
        // Fix: Disable manual chunking - let Vite handle dependencies automatically
        // The issue: vendor chunk imports React but loads before vendor-react
        // Vite's automatic chunking respects module dependencies and load order
        manualChunks: undefined,
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
    chunkSizeWarningLimit: 1000, // Increase warning threshold since we have a large bundle
    // Optimize chunking strategy
    target: 'esnext', // Target modern browsers for smaller bundle
  },
})
