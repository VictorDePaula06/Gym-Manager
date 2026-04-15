import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'apple-touch-icon.png'],
      manifest: {
        id: '/',
        name: 'Vector GymHub',
        short_name: 'Vector',
        description: 'Gerenciamento de Academia Completo',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/app',
        icons: [
          {
            src: 'app-icon-192-v2.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'app-icon-512-v2.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'app-icon-512-v2.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module'
      }
    })
  ],
})
