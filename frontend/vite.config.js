import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    hmr: false,
    watch: {
      usePolling: true
    },
    open: true,
    host: true,  // Allow access from external networks
    strictPort: true,
    allowedHosts: [
      "localhost",
      "127.0.0.1",
      "f665-2401-4900-8382-5c0e-a9fb-e6e1-3ebd-c10d.ngrok-free.app" // Add your ngrok URL
    ],
    proxy: {
      // Proxy API requests to the backend server
      '/api': {
        target: 'http://localhost:5011',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      }
    }
  }
})