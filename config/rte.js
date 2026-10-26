import { defineConfig } from 'vite';
import { minifyHtmlLiteralsPlugin } from './base';

export default defineConfig({
  plugins: [minifyHtmlLiteralsPlugin()],
  build: {
    emptyOutDir: false,
    lib: {
      entry: 'src/js/hwc/rte.ts',
      name: '__Z_RTE__',
      fileName: 'js/hwc/rte',
      formats: ['iife'],
    },
    rollupOptions: {
      external: [
        'lit',
        'lit/decorators.js',
        'lit/directives/repeat.js',
        'lit/directives/unsafe-html.js',
        'lit/directives/class-map.js',
      ],
      output: {
        globals: {
          lit: 'zLit',
          'lit/decorators.js': 'zLitDecorators',
          'lit/directives/repeat.js': 'zLitRepeat',
          'lit/directives/unsafe-html.js': 'zLitUnsafeHTML',
          'lit/directives/class-map.js': 'zLitClassMap',
          lucide: 'zLucide',
          apexcharts: 'zApexCharts',
        },
      },
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  esbuild: {
    legalComments: 'none',
  },
});
