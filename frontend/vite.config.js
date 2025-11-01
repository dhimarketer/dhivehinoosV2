import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
        // Disable manual chunking entirely to avoid React loading issues
        // This ensures all dependencies load in correct order
        // manualChunks: undefined,
      },
    },
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Optimize asset handling
    assetsInlineLimit: 4096, // Inline assets smaller than 4kb
  },
})
