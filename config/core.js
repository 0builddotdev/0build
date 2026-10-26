import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    emptyOutDir: false,
    lib: {
      entry: 'src/js/hwc/core.ts',
      name: '__Z_CORE__',
      fileName: 'js/hwc/core',
      formats: ['iife'],
    },
    rollupOptions: {
      output: {
        globals: {
          lit: 'Lit',
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
