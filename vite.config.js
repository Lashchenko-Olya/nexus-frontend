import { defineConfig } from 'vite'
import react from '@vitejs/react-refresh'

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1600,
    // Це дозволить ігнорувати деякі помилки типів та перевірок
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  // Додаємо ігнорування помилок під час збірки
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  }
})