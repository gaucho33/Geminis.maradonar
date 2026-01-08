import React from 'react';
// Cambiamos la ruta para que coincida exactamente con el importmap
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("No se encontró el elemento raíz 'root'. La interpelación no puede comenzar.");
}

// Inicializamos el asombro
const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
