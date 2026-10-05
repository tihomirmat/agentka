import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { BRAND } from './src/brand';

// base './' keeps every asset URL relative, so the build works from any folder
// (hosted preview, sub-path, file server). Routing uses the URL hash for the same reason.
export default defineConfig({
  base: './',
  plugins: [
    react(),
    {
      // The product name lives in src/brand.ts only; index.html gets it at build time.
      name: 'brand-html',
      transformIndexHtml: (html) => html.replace(/%BRAND%/g, BRAND),
    },
  ],
  resolve: {
    alias: { '@': new URL('./src', import.meta.url).pathname },
  },
  build: { chunkSizeWarningLimit: 900 },
});
