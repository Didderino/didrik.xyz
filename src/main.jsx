// Vite entry point. The previous Babel-standalone setup compiled JSX in the
// browser on every load; now Vite pre-compiles at build time and the user gets
// a tiny optimized bundle.
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app.jsx';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
