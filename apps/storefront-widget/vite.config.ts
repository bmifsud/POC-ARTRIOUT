import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    minify: 'esbuild',
    lib: {
      entry: 'src/index.ts',
      name: 'NailLabWidget',
      fileName: 'nail-lab-widget',
      formats: ['iife', 'es', 'umd']
    },
    rollupOptions: {
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        }
      }
    }
  }
});
