import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      $hwc: path.resolve(__dirname, './src/js/hwc'),
    },
  },
});
