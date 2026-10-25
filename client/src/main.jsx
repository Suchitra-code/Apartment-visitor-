import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import './index.css';

// Initialize Theme
const isDark = localStorage.getItem('apartmenthub_theme') === 'dark';
if (isDark) {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            borderRadius: '14px',
            background: '#1e293b',
            color: '#fff',
            fontSize: '13px',
            fontWeight: 500,
          },
        }}
      />
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
