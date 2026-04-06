import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import '@uploadcare/react-uploader/core.css';

const root = ReactDOM.createRoot(document.getElementById('root'));

// 2. Fast retrieval service worker (Asynchronous Process for Amazon-like speed)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').then((registration) => {
      console.log('SW registered:', registration.scope);
    }).catch((registrationError) => {
      console.log('SW registration failed:', registrationError);
    });
  });
}

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);