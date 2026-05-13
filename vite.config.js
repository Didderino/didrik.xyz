import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Plain SPA build. Static assets in /public/ are served at the URL root.
// Vercel auto-detects this config and runs `npm run build` on deploy.
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    sourcemap: false,
  },
});
