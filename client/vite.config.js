import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/photobooth/',
  plugins: [react()],
  server: {
    proxy: {}
  }
});
