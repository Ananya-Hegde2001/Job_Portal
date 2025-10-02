import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import Toaster from './components/Toaster.jsx';
import { AuthProvider } from './state/AuthContext.jsx';
import './styles.css';
import './i18n.js';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <>
          <App />
          <Toaster />
        </>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
