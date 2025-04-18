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
      // input: ['./foo.html'],
      input: {
        foo: './foo.html',
      },
      // output: {
      //   entryFileNames: "[name].js",
      //   chunkFileNames: "js/[name].js",
      //   assetFileNames: "assets/[name]-[hash].[ext]",
      // },
    },
  },
});
