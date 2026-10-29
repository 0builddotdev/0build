import { defineConfig } from 'vite';
import shared, { minifyHtmlLiteralsPlugin } from './base.js';

export default defineConfig({
  plugins: [minifyHtmlLiteralsPlugin()],
  build: {
    emptyOutDir: false,
    ...shared,
    lib: {
      entry: 'src/js/hwc/components.ts',
      name: '__Z_COMPONENTS__',
      fileName: 'js/hwc/components',
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
