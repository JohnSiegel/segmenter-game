import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { App } from './app';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
