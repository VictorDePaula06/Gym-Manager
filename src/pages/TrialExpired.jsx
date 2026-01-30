import { useNavigate } from 'react-router-dom';
import { LogOut, Lock, CheckCircle, MessageCircle, CreditCard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGym } from '../context/GymContext';

const TrialExpired = () => {
    const { logout, user } = useAuth();
    const { settings } = useGym();
    const navigate = useNavigate();

    const handleContactSupport = () => {
        const phone = settings?.whatsapp?.replace(/\D/g, '') || '5511999999999'; // Fallback if not set
        const message = `Olá, meu período de teste acabou e gostaria de assinar o Vector GymHub PRO. Meu email é: ${user?.email}`;
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: '#020617', // slate-950
            color: 'white'
        }}>
            {/* Background Effects */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                pointerEvents: 'none'
            }}>
                <div style={{
                    position: 'absolute',
                    top: '-10%',
                    right: '-5%',
                    width: '500px',
                    height: '500px',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)', // blue-600/10
                    borderRadius: '50%',
                    filter: 'blur(64px)'
                }}></div>
                <div style={{
                    position: 'absolute',
                    bottom: '-10%',
                    left: '-5%',
                    width: '500px',
                    height: '500px',
                    backgroundColor: 'rgba(5, 150, 105, 0.1)', // emerald-600/10
                    borderRadius: '50%',
                    filter: 'blur(64px)'
                }}></div>
            </div>

            <div style={{
                maxWidth: '32rem', // max-w-lg
                width: '100%',
                backgroundColor: 'rgba(15, 23, 42, 0.8)', // slate-900/80
                backdropFilter: 'blur(24px)',
                borderRadius: '1rem',
                border: '1px solid #1e293b', // slate-800
                padding: '2rem',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                position: 'relative',
                zIndex: 10
            }}>

                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        width: '5rem',
                        height: '5rem',
                        backgroundColor: '#1e293b',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem auto',
                        border: '1px solid #334155',
                        boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)'
                    }}>
                        <Lock size={40} color="#10b981" />
                    </div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'white' }}>Período de Teste Finalizado</h1>
                    <p style={{ color: '#94a3b8', fontSize: '1.125rem' }}>
                        Libere seu acesso total e continue evoluindo.
                    </p>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                    <div style={{
                        backgroundColor: 'rgba(30, 41, 59, 0.5)', // slate-800/50
                        borderRadius: '0.75rem',
                        padding: '1rem',
                        border: '1px solid rgba(51, 65, 85, 0.5)' // slate-700/50
                    }}>
                        <h3 style={{ color: 'white', fontWeight: '600', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ width: '0.25rem', height: '1.5rem', backgroundColor: '#10b981', borderRadius: '9999px', display: 'block' }}></span>
                            O que você ganha no PRO:
                        </h3>
                        <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: 0, margin: 0, listStyle: 'none' }}>
                            {[
                                'Acesso ilimitado a alunos',
                                'Gerador de Treinos com IA',
                                'Gestão Financeira Completa',
                                'Suporte Prioritário no WhatsApp'
                            ].map((item, index) => (
                                <li key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#cbd5e1' }}>
                                    <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '0.25rem', borderRadius: '50%', display: 'flex' }}>
                                        <CheckCircle size={14} color="#10b981" />
                                    </div>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <button
                        onClick={handleContactSupport}
                        style={{
                            width: '100%',
                            backgroundColor: '#059669', // emerald-600
                            color: 'white',
                            fontWeight: 'bold',
                            padding: '1rem 1.5rem',
                            borderRadius: '0.75rem',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            transition: 'all 0.2s',
                            boxShadow: '0 4px 6px -1px rgba(6, 78, 59, 0.2)'
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#047857'}
                        onMouseOut={(e) => e.target.style.backgroundColor = '#059669'}
                    >
                        <MessageCircle size={20} />
                        Falar com Consultor e Ativar
                    </button>

                    <button
                        onClick={() => navigate('/app/subscription')}
                        style={{
                            width: '100%',
                            backgroundColor: '#2563eb', // blue-600
                            color: 'white',
                            fontWeight: 'bold',
                            padding: '1rem 1.5rem',
                            borderRadius: '0.75rem',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            transition: 'all 0.2s',
                            boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#1d4ed8'}
                        onMouseOut={(e) => e.target.style.backgroundColor = '#2563eb'}
                    >
                        <CreditCard size={20} />
                        Assinar Agora
                    </button>

                    <button
                        onClick={handleLogout}
                        style={{
                            width: '100%',
                            backgroundColor: '#1e293b', // slate-800
                            color: '#94a3b8',
                            fontWeight: '500',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '0.75rem',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            transition: 'colors 0.2s'
                        }}
                        onMouseOver={(e) => {
                            e.target.style.backgroundColor = '#334155';
                            e.target.style.color = 'white';
                        }}
                        onMouseOut={(e) => {
                            e.target.style.backgroundColor = '#1e293b';
                            e.target.style.color = '#94a3b8';
                        }}
                    >
                        <LogOut size={18} />
                        Sair da Conta
                    </button>
                </div>

                <div style={{ marginTop: '2rem', textAlign: 'center', borderTop: '1px solid #1e293b', paddingTop: '1.5rem' }}>
                    <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Seu dados estão salvos e seguros aguardando seu retorno.
                    </p>
                </div>
            </div>
        </div>
    );
};
export default TrialExpired;
