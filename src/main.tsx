import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { Sync } from './store/sync';
import './index.css';

Sync.init();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
