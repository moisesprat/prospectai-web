import { defineConfig } from 'vite';
import { resolve } from 'path';

const MODAL_URL = 'https://moisesprat--prospectai-backend-fastapi-app.modal.run';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main:                     resolve(__dirname, 'index.html'),
        stats:                    resolve(__dirname, 'stats.html'),
        report:                   resolve(__dirname, 'report.html'),
        reports:                  resolve(__dirname, 'reports.html'),
        architecture:             resolve(__dirname, 'architecture.html'),
        patternsHub:              resolve(__dirname, 'patterns/index.html'),
        patternAdversarialCritic: resolve(__dirname, 'patterns/adversarial-critic.html'),
        patternParallelExecution: resolve(__dirname, 'patterns/parallel-execution.html'),
        patternOutputValidation:  resolve(__dirname, 'patterns/output-validation.html'),
        patternModelTiering:      resolve(__dirname, 'patterns/model-tiering.html'),
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
