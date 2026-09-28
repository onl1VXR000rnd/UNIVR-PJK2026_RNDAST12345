import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' makes the built bundle portable for GitHub Pages sub-paths
export default defineConfig({
  plugins: [react()],
  base: './',
});
