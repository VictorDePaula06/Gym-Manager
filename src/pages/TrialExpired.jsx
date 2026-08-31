import { useNavigate } from 'react-router-dom';
import { LogOut, Lock, CheckCircle, MessageCircle, CreditCard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const TrialExpired = () => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    const handleContactSupport = () => {
        const phone = '5521982626387';
        const message = `Olá, meu período de teste acabou e gostaria de assinar o Alivia Fitness PRO. Meu email é: ${user?.email}`;
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="fade-in" style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            backgroundColor: 'var(--bg-app)',
            color: 'var(--text-main)'
        }}>
            <div className="glass-panel" style={{
                maxWidth: '32rem',
                width: '100%',
                padding: '2rem',
            }}>

                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        width: '5rem',
                        height: '5rem',
                        background: 'rgba(16, 185, 129, 0.1)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem auto',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                    }}>
                        <Lock size={40} color="var(--primary)" />
                    </div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--text-main)' }}>Período de Teste Finalizado</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.125rem' }}>
                        Libere seu acesso total e continue evoluindo.
                    </p>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                    <div style={{
                        background: 'var(--input-bg)',
                        borderRadius: '0.75rem',
                        padding: '1rem',
                        border: '1px solid var(--border-glass)'
                    }}>
                        <h3 style={{ color: 'var(--text-main)', fontWeight: '600', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ width: '0.25rem', height: '1.5rem', background: 'var(--primary)', borderRadius: '9999px', display: 'block' }}></span>
                            O que você ganha no PRO:
                        </h3>
                        <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: 0, margin: 0, listStyle: 'none' }}>
                            {[
                                'Acesso ilimitado a alunos',
                                'Relatórios de evolução',
                                'Gestão Financeira Completa',
                                'Suporte Prioritário no WhatsApp'
                            ].map((item, index) => (
                                <li key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-main)' }}>
                                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.25rem', borderRadius: '50%', display: 'flex' }}>
                                        <CheckCircle size={14} color="var(--primary)" />
                                    </div>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <button
                        onClick={() => navigate('/app/subscription')}
                        className="btn-primary"
                        style={{
                            width: '100%',
                            fontWeight: 'bold',
                            padding: '1rem 1.5rem',
                            borderRadius: '0.75rem',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                        }}
                    >
                        <CreditCard size={20} />
                        Ver Planos e Assinar
                    </button>

                    <button
                        onClick={handleLogout}
                        style={{
                            width: '100%',
                            background: 'transparent',
                            color: 'var(--text-muted)',
                            fontWeight: '500',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '0.75rem',
                            border: '1px solid var(--border-glass)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                        }}
                    >
                        <LogOut size={18} />
                        Sair da Conta
                    </button>
                </div>

                <div style={{ marginTop: '2rem', textAlign: 'center', borderTop: '1px solid var(--border-glass)', paddingTop: '1.5rem' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                        Seus dados estão salvos e seguros aguardando seu retorno.
                    </p>
                    <button
                        onClick={handleContactSupport}
                        style={{
                            marginTop: '0.75rem',
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            textDecoration: 'underline',
                        }}
                    >
                        <MessageCircle size={13} />
                        Tem dúvidas? Fale com a gente antes de assinar
                    </button>
                </div>
            </div>
        </div>
    );
};
export default TrialExpired;
