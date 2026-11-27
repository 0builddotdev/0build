import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      $hwc: fileURLToPath(new URL('./src/js/hwc', import.meta.url)),
    },
  },
});
