import { defineConfig } from 'vite';
import cssSourcemap from '../src';

export default defineConfig({
  plugins: [
    cssSourcemap({
      extensions: ['.css', '.scss'],
      enabled: true,
      folder: 'sourcemaps',
      getURL: (fileName) => `sourcemaps/${fileName}`,
    }),
  ],
  build: {
    sourcemap: true,
    minify: false,
    emptyOutDir: true,
    rollupOptions: {
      input: {
        // Test Case 1: Full app with many CSS imports
        index: './index.html',
        // Test Case 2: Simple page with minimal CSS
        foo: './foo.html',
        // Test Case 3: Minimal single CSS file
        minimal: './minimal.html',
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'js/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
      },
    },
  },
});
