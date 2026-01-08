import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Cargamos las variables que empiezan con VITE_
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      // Esto previene errores de "process is not defined" en el navegador
      'process.env': env
    },
    resolve: {
      alias: {
        // Mantenemos tu alias para la raíz
        '@': path.resolve(__dirname, '.'),
      }
    },
    // Aseguramos que los archivos .tsx en la raíz se procesen bien
    build: {
      outDir: 'dist',
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
        },
      },
    },
  };
});
