import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import './styles/theme-utils.css'
import App from './App.jsx'

import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
  onNeedRefresh() {
    console.log('SW: Nova versão disponível');
    if (confirm('Nova versão disponível. Atualizar?')) {
      updateSW(true)
    }
  },
  onOfflineReady() {
    console.log('SW: App pronto para uso offline');
  },
  onRegisterError(error) {
    console.error('SW: Erro ao registrar service worker', error);
  },
  onRegistered(r) {
    console.log('SW: Service Worker registrado com sucesso (Scope: ' + r.scope + ')');
    if (r.active) {
      console.log('SW: Service Worker ativo');
    }
  }
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
