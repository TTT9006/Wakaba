import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173, proxy: { '/api': 'http://127.0.0.1:3001' } },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('recharts')) return 'vendor-charts';
            if (id.includes('pdfjs-dist') || id.includes('pptxgenjs') || id.includes('jszip')) {
              return 'vendor-doc-parser';
            }
            if (id.includes('motion') || id.includes('framer-motion')) {
              return 'vendor-motion';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            return 'vendor';
          }
          if (id.includes('packages/shared/jlpt-papers') || id.includes('packages/shared/data/jlpt')) {
            return 'jlpt-exams-data';
          }
          if (id.includes('packages/shared/grammar-')) {
            return 'grammar-data';
          }
          if (id.includes('packages/shared/radical-dictionary')) {
            return 'radicals-data';
          }
        },
      },
    },
  },
});

