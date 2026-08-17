import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

console.log('Main.tsx loading...');

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope)
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error)
      })
  })
}

const container = document.getElementById('root');
console.log('Root element:', container);

if (container) {
  console.log('Rendering App...');
  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
} else {
  console.error('Root element not found!');
}
