import { defineConfig } from 'vite';
import { copyFileSync } from 'fs';
import { resolve } from 'path';
import cssSourcemap from '../src';

/**
 * This playground tests the scenario where SCSS is used as a direct
 * rollup entrypoint (not imported via JS), simulating a traditional
 * server-rendered project where Vite outputs specific files referenced
 * in server-rendered HTML.
 *
 * The plugin ensures sourcemaps include all @imported/@use/@forward partials,
 * not just the entrypoint file.
 */
export default defineConfig({
  plugins: [
    cssSourcemap({
      extensions: ['.css', '.scss'],
      enabled: true,
    }),
    {
      name: 'copy-html',
      closeBundle() {
        copyFileSync(
          resolve(__dirname, 'index.html'),
          resolve(__dirname, 'dist/index.html'),
        );
      },
    },
  ],
  build: {
    sourcemap: true,
    minify: false,
    emptyOutDir: true,
    rollupOptions: {
      input: {
        // JS entrypoint
        main: 'javascript/main.js',
        // SCSS as direct entrypoint (the issue scenario)
        // This file uses @import to pull in other SCSS partials
        styles: 'styles/main.scss',
      },
      output: {
        dir: 'dist',
        entryFileNames: 'js/[name].js',
        chunkFileNames: 'js/[name].[hash].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
});
