import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// 1. Localizamos el punto de anclaje en el DOM
const rootElement = document.getElementById('root');

// 2. Verificamos la existencia antes de actuar (Negación del error)
if (!rootElement) {
  console.error("No se encontró el elemento 'root'. La estructura de poder del DOM ha fallado.");
} else {
  // 3. Inicializamos el asombro una sola vez
  const root = ReactDOM.createRoot(rootElement);

  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
