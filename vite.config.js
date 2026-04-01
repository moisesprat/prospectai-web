import { defineConfig } from 'vite';

const MODAL_URL = 'https://moisesprat--prospectai-backend-fastapi-app.modal.run';

export default defineConfig({
  // Proxy /api requests to the Modal backend in dev.
  // This sidesteps CORS — the browser talks to localhost, Vite forwards to Modal.
  server: {
    proxy: {
      '/api': {
        target: MODAL_URL,
        changeOrigin: true,
      },
    },
  },
});
