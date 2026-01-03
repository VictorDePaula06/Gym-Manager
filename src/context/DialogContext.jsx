import React, { createContext, useContext, useState, useRef } from 'react';

const DialogContext = createContext();

export const useDialog = () => useContext(DialogContext);

export const DialogProvider = ({ children }) => {
    const [dialog, setDialog] = useState(null);
    const resolveRef = useRef(null);

    const confirm = ({ title, message, confirmText = 'Confirmar', cancelText = 'Cancelar', type = 'info' }) => {
        return new Promise((resolve) => {
            setDialog({ title, message, confirmText, cancelText, type });
            resolveRef.current = resolve;
        });
    };

    const handleClose = (result) => {
        setDialog(null);
        if (resolveRef.current) {
            resolveRef.current(result);
            resolveRef.current = null;
        }
    };

    return (
        <DialogContext.Provider value={{ confirm }}>
            {children}
            {dialog && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.7)',
                    zIndex: 10000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(4px)'
                }}>
                    <div
                        className="fade-in"
                        style={{
                            background: 'var(--card-bg, #1e293b)',
                            padding: '2rem',
                            borderRadius: '16px',
                            maxWidth: '400px',
                            width: '90%',
                            border: '1px solid var(--border-glass, rgba(255,255,255,0.1))',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
                        }}
                    >
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'white' }}>{dialog.title}</h3>
                        <p style={{ color: 'var(--text-muted, #94a3b8)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                            {dialog.message}
                        </p>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                            <button
                                onClick={() => handleClose(false)}
                                style={{
                                    padding: '0.6rem 1.2rem',
                                    borderRadius: '8px',
                                    background: 'transparent',
                                    border: '1px solid var(--border-glass, rgba(255,255,255,0.1))',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontWeight: '500'
                                }}
                            >
                                {dialog.cancelText}
                            </button>
                            <button
                                onClick={() => handleClose(true)}
                                style={{
                                    padding: '0.6rem 1.2rem',
                                    borderRadius: '8px',
                                    background: dialog.type === 'danger' ? '#ef4444' : 'var(--primary, #10b981)',
                                    border: 'none',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontWeight: '600'
                                }}
                            >
                                {dialog.confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DialogContext.Provider>
    );
};
