import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

// Initialize IndexedDB on startup (fails gracefully if unavailable)
import { getDB } from './db/index.js';
getDB().catch((err) => console.error('IndexedDB init failed:', err));

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
