import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, LogOut } from 'lucide-react';

export default function PaymentRequired() {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div style={{
            height: '100vh',
            width: '100vw',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#111827',
            color: 'white',
            padding: '2rem',
            textAlign: 'center'
        }}>
            <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                padding: '2rem',
                borderRadius: '50%',
                marginBottom: '2rem',
                color: '#ef4444'
            }}>
                <Lock size={64} />
            </div>

            <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: 'bold' }}>Acesso Suspenso</h1>

            <p style={{ maxWidth: '600px', fontSize: '1.1rem', color: '#9ca3af', marginBottom: '3rem', lineHeight: '1.6' }}>
                A conta desta academia está temporariamente suspensa devido a pendências financeiras ou administrativas.
                <br /><br />
                Para restabelecer o acesso imediato ao sistema, por favor entre em contato com o suporte ou administrador.
            </p>

            <button
                onClick={handleLogout}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '1rem 2rem',
                    background: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.05)'}
                onMouseOut={(e) => e.target.style.background = 'transparent'}
            >
                <LogOut size={20} />
                Sair da Conta
            </button>
        </div>
    );
}
