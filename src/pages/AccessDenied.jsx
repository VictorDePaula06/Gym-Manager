import { useNavigate } from 'react-router-dom';
import { ShieldAlert, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AccessDenied() {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0f172a',
            color: 'white',
            textAlign: 'center',
            padding: '2rem'
        }}>
            <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                padding: '2rem',
                borderRadius: '50%',
                marginBottom: '2rem',
                border: '1px solid rgba(239, 68, 68, 0.2)'
            }}>
                <ShieldAlert size={64} color="#ef4444" />
            </div>

            <h1 style={{ fontSize: '2rem', marginBottom: '1rem', fontWeight: 'bold' }}>Acesso Bloqueado</h1>

            <p style={{ maxWidth: '500px', color: '#94a3b8', marginBottom: '3rem', lineHeight: '1.6' }}>
                Sua conta foi suspensa temporariamente ou bloqueada pelo administrador do sistema.
                Entre em contato com o suporte para mais informações.
            </p>

            <button
                onClick={handleLogout}
                style={{
                    background: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    padding: '1rem 2rem',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontWeight: '600',
                    transition: 'all 0.2s'
                }}
            >
                <LogOut size={20} />
                Voltar para o Login
            </button>
        </div>
    );
}
