import { defineConfig, type Plugin } from 'vite';
import { fileURLToPath, URL } from 'node:url';
import { rm } from 'node:fs/promises';
import { resolve } from 'node:path';

// Directories under public/assets/images/ that exist only for sprite
// preprocessing (pre-rembg sources, side-by-side compares, alpha mattes) —
// nothing in src/ loads them. .gitignore keeps most of them out of git, but
// Vite copies publicDir verbatim into the build, so without this they bloat
// dist by ~20 MB. They live in public/ (not tools/) so the rembg pipeline
// can keep dropping outputs next to the runtime sprites; we just prune them
// from the build output after Vite has finished copying.
const BUILD_PRUNE_PATHS = [
  'assets/images/enemy',
  'assets/images/alpha',
  'assets/images/rembg-compare'
];

function prunePublicArtifacts(): Plugin {
  let absOutDir!: string; // set in configResolved (runs before closeBundle)
  return {
    name: 'prune-public-artifacts',
    apply: 'build',
    configResolved(config) {
      absOutDir = resolve(config.root, config.build.outDir);
    },
    async closeBundle() {
      await Promise.all(
        BUILD_PRUNE_PATHS.map((rel) =>
          rm(resolve(absOutDir, rel), { recursive: true, force: true })
        )
      );
    }
  };
}

// Jam build config — base: './' is critical for itch.io HTML5 upload (relative paths).
// Phaser is split into its own chunk to keep the main bundle small.
export default defineConfig({
  base: './',
  plugins: [prunePublicArtifacts()],
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
        // Vite 8 bundles with Rolldown, where the Rollup-era object form of
        // `manualChunks` is gone — chunk groups are declared via `advancedChunks`.
        advancedChunks: {
          groups: [{ name: 'phaser', test: /[\\/]node_modules[\\/]phaser[\\/]/ }]
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
