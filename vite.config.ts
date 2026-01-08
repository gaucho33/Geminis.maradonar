import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      'process.env': env
    },
    build: {
      rollupOptions: {
        // Forzamos a que no ignore las dependencias críticas
        external: [], 
      },
    },
    optimizeDeps: {
      // Forzamos la pre-inclusión de la librería de Google
      include: ['@google/generative-ai', 'mammoth']
    }
  };
});
