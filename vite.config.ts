import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

// Jam build config — base: './' is critical for itch.io HTML5 upload (relative paths).
// Phaser is split into its own chunk to keep the main bundle small.
export default defineConfig({
  base: './',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  logLevel: 'info',
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ['phaser']
        }
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        passes: 2
      },
      mangle: true,
      format: {
        comments: false
      }
    }
  },
  server: {
    port: 8080,
    host: true
  }
});
