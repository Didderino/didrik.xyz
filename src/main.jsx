// Vite entry point. The previous Babel-standalone setup compiled JSX in the
// browser on every load; now Vite pre-compiles at build time and the user gets
// a tiny optimized bundle.
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import App from './app.jsx';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <>
    <App />
    {/* Vercel Analytics — only beacons in production. Dashboard:
        https://vercel.com/didriks-vault/didrik-blog/analytics */}
    <Analytics />
  </>
);
