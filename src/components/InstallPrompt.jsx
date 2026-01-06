import { useState, useEffect } from 'react';
import { Download, X, Share } from 'lucide-react';

const InstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            return;
        }

        // Android / Desktop (Chromium) - Standard Logic
        const handler = (e) => {
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

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            // Show the install prompt
            deferredPrompt.prompt();

            // Wait for the user to respond to the prompt
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response to the install prompt: ${outcome}`);

            // We've used the prompt, and can't use it again, throw it away
            setDeferredPrompt(null);
            setIsVisible(false);
        }
    };

    if (!isVisible) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '90%',
            maxWidth: '400px',
            zIndex: 1000,
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
                    marginTop: '2px'
                }}>
                    <Download size={24} />
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
