import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: 'localhost',   // Force localhost
    port: 55000,         // High port to avoid conflicts
    strictPort: true,
    hmr: {
      host: 'localhost',
      port: 55001,       // HMR on a different high port
    },
    open: false,
    proxy: {
      '/api/osrm': {
        target: 'https://routing.openstreetmap.de',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/osrm/, ''),
        secure: true,
      },
      '/api/route': {
        target: 'https://router.project-osrm.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/route/, '/route/v1'),
        secure: true,
      }
    }
  },
  preview: {
    host: 'localhost',
    port: 55002,         // Preview port
  },
})
