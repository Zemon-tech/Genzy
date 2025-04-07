import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'node:url'
import { VitePWA } from 'vite-plugin-pwa'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', 
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png', 'offline.html'],
      manifest: false, // We're using our own manifest file
      injectRegister: 'auto',
      strategies: 'generateSW', 
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,json}'],
        cleanupOutdatedCaches: true, 
        clientsClaim: true, 
        skipWaiting: true, 
        navigationPreload: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*$/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              },
              networkTimeoutSeconds: 10
            }
          },
          // Add a general cache for all navigation requests (HTML)
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'navigation-cache',
              networkTimeoutSeconds: 5, 
              plugins: [
                {
                  // Custom handling for offline mode
                  handlerDidError: async () => {
                    if (!navigator.onLine) {
                      return await caches.match('/offline.html');
                    }
                    
                    // Always fallback to offline page on error
                    return await caches.match('/offline.html');
                  }
                }
              ]
            }
          },
          // Cache JS and CSS 
          {
            urlPattern: /\.(?:js|css)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-resources',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              }
            }
          }
        ],
        // Update offline fallback settings
        navigateFallback: '/offline.html',
        navigateFallbackDenylist: [/\/api\//], // Don't use fallback for API calls
      },
      devOptions: {
        // Enable PWA in development
        enabled: true,
        type: 'module',
        navigateFallback: 'index.html'
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Production build settings
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
  },
  // Development server settings
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