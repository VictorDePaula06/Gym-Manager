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
            return;
        }

        // Android / Desktop (Chromium) - Standard Logic
        const handler = (e) => {
            console.log('PWA: Evento beforeinstallprompt capturado', e);
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            // Update UI notify the user they can install the PWA
            setIsVisible(true);
        };
        window.addEventListener('beforeinstallprompt', handler);

        // iOS Logic
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
        const isStandalone = window.navigator.standalone === true; // iOS Safari specific

        if (isIosDevice && !isStandalone) {
            setIsIOS(true);
            setIsVisible(true);
        }

        // Force Debug Mode
        if (isDebug) {
            console.log('PWA: Modo Debug Ativado');
            setIsVisible(true);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, [location.search]);

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
                    position: 'relative'
                }}>
                    <Download size={24} />
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
