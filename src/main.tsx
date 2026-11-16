import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register Service Worker for PWA offline capabilities and installability
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('Orienta IA PWA Service Worker registrado:', registration.scope);
      })
      .catch((error) => {
        console.warn('Registro de Service Worker falló:', error);
      });
  });
}

createRoot(document.getElementById('root')!).render(<App />);
