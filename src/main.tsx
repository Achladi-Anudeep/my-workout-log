import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { Sync } from './store/sync';
import { startUpdates } from './lib/update';
import './index.css';

Sync.init();
startUpdates();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
