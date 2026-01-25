import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Download, X, Share } from 'lucide-react';

const InstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const location = useLocation();

    useEffect(() => {
        // Check for debug mode
        const searchParams = new URLSearchParams(location.search);
        const isDebug = searchParams.get('pwa-debug') === 'true';

        // Check if already installed (ignorar se estiver em debug)
        if (!isDebug && window.matchMedia('(display-mode: standalone)').matches) {
            console.log('PWA: App já está rodando em modo standalone');
            return;
        }

        // 1. Verificar se já capturamos o evento globalmente (no index.html)
        if (window.deferredPrompt) {
            console.log('PWA: Usando evento capturado globalmente');
            setDeferredPrompt(window.deferredPrompt);
            setIsVisible(true);
        }

        // 2. Ouvinte padrão para eventos futuros (caso o componente monte antes do evento)
        const handler = (e) => {
            console.log('PWA: Evento beforeinstallprompt capturado no componente', e);
            e.preventDefault();
            setDeferredPrompt(e);
            window.deferredPrompt = e; // Sincronizar com global
            setIsVisible(true);
        };
        window.addEventListener('beforeinstallprompt', handler);

        // iOS Logic
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
        const isStandalone = window.navigator.standalone === true;

        if (isIosDevice && !isStandalone) {
            setIsIOS(true);
            setIsVisible(true);
        }

        // Log para debug se estiver na página inicial
        if (location.pathname === '/') {
            console.log('PWA: Ocultando prompt na Landing Page por design.');
        }

        // Force Debug Mode
        if (isDebug) {
            console.log('PWA: Modo Debug Ativado');
            setIsVisible(true);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, [location.search, location.pathname]);

    const handleInstallClick = async () => {
        console.log('PWA: Tentando instalar...');

        if (!deferredPrompt && !new URLSearchParams(location.search).get('pwa-debug')) {
            alert('Erro: Instalação indisponível (deferredPrompt nulo).');
            return;
        }

        if (deferredPrompt) {
            try {
                // Show the install prompt
                await deferredPrompt.prompt();

                // Wait for the user to respond to the prompt
                const { outcome } = await deferredPrompt.userChoice;
                console.log(`User response to the install prompt: ${outcome}`);

                // Em debug, confirmar o resultado
                const isDebug = new URLSearchParams(location.search).get('pwa-debug') === 'true';
                if (isDebug) {
                    alert(`Resultado da instalação: ${outcome}`);
                }

                // We've used the prompt, and can't use it again, throw it away
                setDeferredPrompt(null);
                setIsVisible(false);
            } catch (error) {
                console.error('PWA: Erro na instalação', error);
                alert(`Erro ao tentar instalar: ${error.message}`);
            }
        } else {
            // Debug mode fallback forced
            alert('Modo Debug: O botão foi clicado, mas o navegador não forneceu o evento de instalação real (deferredPrompt é nulo). Provavelmente falta HTTPS ou suporte do navegador.');
        }
    };

    if (!isVisible || location.pathname === '/') return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: '24px', // Increased form 20px
            left: '50%',
            transform: 'translateX(-50%)',
            width: '95%', // Increased from 90% for mobile
            maxWidth: '380px', // Slightly reduced max-width to ensure it fits well
            zIndex: 9999, // Very high z-index
            animation: 'slideUp 0.5s ease-out'
        }}>
            <style>
                {`
                @keyframes slideUp {
                    from { transform: translate(-50%, 100%); opacity: 0; }
                    to { transform: translate(-50%, 0); opacity: 1; }
                }
                `}
            </style>
            <div className="glass-panel" style={{
                padding: '1rem',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'start', // Changed to start for better multi-line handling
                gap: '1rem',
                border: '1px solid var(--primary-glow)',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                position: 'relative'
            }}>
                <div style={{
                    minWidth: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary)',
                    marginTop: '2px',
                    position: 'relative',
                    overflow: 'hidden',
                    padding: '8px'
                }}>
                    <img src="/logo.png" alt="Instalar" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    {new URLSearchParams(location.search).get('pwa-debug') === 'true' && (
                        <span style={{
                            position: 'absolute',
                            top: -5,
                            right: -5,
                            background: 'red',
                            color: 'white',
                            fontSize: '0.5rem',
                            padding: '2px 4px',
                            borderRadius: '4px'
                        }}>DEBUG</span>
                    )}
                </div>

                <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: '600' }}>Instalar Aplicativo</h3>
                    <div style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {isIOS ? (
                            <span>
                                Para instalar no iPhone: toque em <Share size={12} style={{ display: 'inline', margin: '0 2px' }} /> <strong>Compartilhar</strong> e depois em <strong>Adicionar à Tela de Início</strong>.
                            </span>
                        ) : (
                            "Adicione à tela inicial para acesso rápido e melhor experiência."
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                    <button
                        onClick={() => setIsVisible(false)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            padding: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        <X size={16} />
                    </button>
                    {!isIOS && (
                        <button
                            onClick={handleInstallClick}
                            style={{
                                backgroundColor: 'var(--primary)',
                                color: '#fff',
                                border: 'none',
                                padding: '0.5rem 1rem',
                                borderRadius: '8px',
                                fontWeight: '500',
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            Instalar
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InstallPrompt;
