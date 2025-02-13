import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
      "8e07-2401-4900-47fc-324e-9db7-a3d9-41ff-92eb.ngrok-free.app" // Add your ngrok URL
    ]
  }
})