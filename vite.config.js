import { defineConfig } from 'vite';
import { resolve } from 'path';

const MODAL_URL = 'https://moisesprat--prospectai-backend-fastapi-app.modal.run';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main:         resolve(__dirname, 'index.html'),
        stats:        resolve(__dirname, 'stats.html'),
        report:       resolve(__dirname, 'report.html'),
        reports:      resolve(__dirname, 'reports.html'),
        architecture: resolve(__dirname, 'architecture.html'),
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: MODAL_URL,
        changeOrigin: true,
      },
    },
  },
});
