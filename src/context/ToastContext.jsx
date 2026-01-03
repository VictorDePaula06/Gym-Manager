import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'success', duration = 3000) => {
        const id = Date.now().toString();
        setToasts(prev => [...prev, { id, message, type }]);

        if (duration) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ addToast, removeToast }}>
            {children}
            <div style={{
                position: 'fixed',
                top: '20px',
                right: '20px',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                pointerEvents: 'none' // Allow clicks through container
            }}>
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className="fade-in"
                        style={{
                            minWidth: '300px',
                            background: 'var(--card-bg, #1a1b23)',
                            border: `1px solid ${toast.type === 'success' ? '#10b981' :
                                    toast.type === 'error' ? '#ef4444' :
                                        '#3b82f6'
                                }`,
                            padding: '1rem',
                            borderRadius: '12px',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            color: 'white',
                            pointerEvents: 'auto', // Re-enable clicks
                            animation: 'slideInRight 0.3s ease-out'
                        }}
                    >
                        {toast.type === 'success' && <CheckCircle size={20} color="#10b981" />}
                        {toast.type === 'error' && <AlertCircle size={20} color="#ef4444" />}
                        {toast.type === 'info' && <Info size={20} color="#3b82f6" />}

                        <span style={{ flex: 1, fontSize: '0.9rem' }}>{toast.message}</span>

                        <button
                            onClick={() => removeToast(toast.id)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                        >
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>

            <style>{`
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}</style>
        </ToastContext.Provider>
    );
};
