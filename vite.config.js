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
  },
  preview: {
    host: 'localhost',
    port: 55002,         // Preview port
  },
})
