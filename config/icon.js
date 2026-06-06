import { defineConfig } from 'vite';
import shared, { minifyHtmlLiteralsPlugin } from './base.js';

export default defineConfig({
  plugins: [minifyHtmlLiteralsPlugin()],
  build: {
    emptyOutDir: false,
    ...shared,
    lib: {
      entry: 'src/js/hwc/icon.ts',
      name: '__Z_ICON__',
      fileName: 'js/hwc/icon',
      formats: ['iife'],
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  esbuild: {
    legalComments: 'none',
  },
});
