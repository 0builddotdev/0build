import { defineConfig } from 'vite';
import { minifyHtmlLiteralsPlugin } from './base.js';

export default defineConfig({
  plugins: [minifyHtmlLiteralsPlugin()],
  build: {
    emptyOutDir: false,
    lib: {
      entry: 'src/js/hwc/core.ts',
      name: '__Z_CORE__',
      fileName: 'js/hwc/core',
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
