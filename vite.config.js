import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/50.017-Graphics-and-Visualisation-Project/',
  build: {
    emptyOutDir: true,
    outDir: './docs',
  },
});
