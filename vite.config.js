import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      $js: fileURLToPath(new URL('./src/js', import.meta.url)),
    },
  },
});
