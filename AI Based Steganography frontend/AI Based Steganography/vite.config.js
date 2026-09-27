import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Ensure .exe files are always served as raw binary (application/octet-stream)
    {
      name: 'binary-mime-types',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url && (req.url.endsWith('.exe') || req.url.endsWith('.msi'))) {
            res.setHeader('Content-Type', 'application/octet-stream');
            res.setHeader('Content-Disposition', `attachment; filename="${req.url.split('/').pop()}"`);
          }
          next();
        });
      }
    }
  ],
  base: './',
  server: {
    port: 5173,
    strictPort: true,
    watch: {
      ignored: ['**/dist-installer/**', '**/release/**', '**/*.exe']
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
});

