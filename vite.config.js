import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: true,
    headers: {
      // Permite que o Firebase detecte o fechamento do popup do Google
      // (senão o signInWithPopup fica travado carregando por causa do COOP).
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifestFilename: 'manifest.json',
      workbox: {
        // O bundle passou de 2 MB (SDK do Gemini); sobe o limite de pré-cache do PWA.
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
      includeAssets: ['favicon.png', 'apple-touch-icon.png'],
      manifest: {
        id: '/',
        name: 'Vector GymHub',
        short_name: 'Vector',
        description: 'Gerenciamento de Academia Completo',
        theme_color: '#121214',
        background_color: '#121214',
        display: 'standalone',
        orientation: 'any',
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
        // Desligado em DEV: o service worker cacheava e mostrava versão antiga
        // no F5. Em produção o PWA continua normal.
        enabled: false,
        type: 'module'
      }
    })
  ],
})
