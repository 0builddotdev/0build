import { defineConfig } from 'vite';
import { minifyHtmlLiteralsPlugin } from './base';

export default defineConfig({
  plugins: [minifyHtmlLiteralsPlugin()],
  build: {
    emptyOutDir: false,
    lib: {
      entry: 'src/js/hwc/components.ts',
      name: '__Z_COMPONENTS__',
      fileName: 'js/hwc/components',
      formats: ['iife'],
    },
    rollupOptions: {
      external: ['lit', 'lucide', 'apexcharts'],
      output: {
        globals: {
          lit: 'zLit',
          'lit/decorators.js': 'zLitDecorators',
          'lit/directives/repeat.js': 'zLitRepeat',
          'lit/directives/unsafe-html.js': 'zLitUnsafeHTML',
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
