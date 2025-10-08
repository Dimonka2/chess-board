import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: 'builder',
  publicDir: false,
  server: {
    port: 3002,
    open: true,
    fs: {
      // Allow serving files from the project root (to access dist/)
      allow: ['..']
    }
  },
  resolve: {
    alias: {
      '/dist': path.resolve(__dirname, 'dist')
    }
  }
});
