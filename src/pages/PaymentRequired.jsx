import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, LogOut, Check, Shield, Star, MessageCircle } from 'lucide-react';

export default function PaymentRequired() {
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    // LINKS DE TESTE - SUBSTITUIR
    const PLANS = [
        {
            id: 'monthly',
            name: 'Mensal',
            price: '97,00',
            period: '/mês',
            features: [
                'Gestão Ilimitada de Alunos',
                'Controle Financeiro Completo',
                'Montagem de Treinos Personalizada',
                'Acesso para Professores',
                'Suporte via WhatsApp'
            ],
            link: 'https://buy.stripe.com/test_9B69AUfuT3NUggA1jDbo400',
            recommended: false
        },
        {
            id: 'annual',
            name: 'Anual (Oferta)',
            price: '900,00',
            period: '/ano',
            save: 'Economize R$ 264,00',
            features: [
                'Todo o Pacote Mensal Incluso',
                '2 Meses de Acesso Grátis',
                'Prioridade Máxima no Suporte',
                'Consultoria de Setup Inicial'
            ],
            link: 'https://buy.stripe.com/test_8x28wQfuT5W25BW1jDbo401',
            recommended: true
        }
    ];

    return (
        <div style={{
            minHeight: '100vh',
            width: '100vw',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: '#0f172a',
            color: 'white',
            padding: '4rem 2rem',
            overflowY: 'auto'
        }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <div style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    padding: '1.5rem',
                    borderRadius: '50%',
                    marginBottom: '1.5rem',
                    color: '#ef4444',
                    display: 'inline-block'
                }}>
                    <Lock size={48} />
                </div>

                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: 'bold' }}>Hora de Assinar</h1>
                <p style={{ maxWidth: '600px', fontSize: '1.1rem', color: '#9ca3af', marginBottom: '1rem', lineHeight: '1.6', margin: '0 auto' }}>
                    O período de teste (ou sua assinatura) expirou. <br />
                    Para continuar aproveitando o <b>Gym Manager</b>, escolha um plano abaixo.
                </p>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '2rem',
                maxWidth: '900px',
                width: '100%',
                marginBottom: '4rem'
            }}>
                {PLANS.map(plan => (
                    <div key={plan.id} style={{
                        background: 'rgba(30, 41, 59, 0.4)',
                        border: plan.recommended ? '2px solid #3b82f6' : '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '16px',
                        padding: '2rem',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        {plan.recommended && (
                            <div style={{
                                position: 'absolute',
                                top: '-12px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                background: '#3b82f6',
                                color: 'white',
                                padding: '0.25rem 1rem',
                                borderRadius: '20px',
                                fontSize: '0.8rem',
                                fontWeight: 'bold'
                            }}>
                                RECOMENDADO
                            </div>
                        )}

                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{plan.name}</h3>
                            <div style={{ fontSize: '3rem', fontWeight: '800', color: 'white' }}>
                                <span style={{ fontSize: '1rem', verticalAlign: 'middle', marginRight: '5px' }}>R$</span>
                                {plan.price}
                                <span style={{ fontSize: '1rem', color: '#94a3b8', fontWeight: 'normal' }}>{plan.period}</span>
                            </div>
                        </div>

                        <div style={{ flex: 1, marginBottom: '2rem' }}>
                            {plan.features.map((f, i) => (
                                <div key={i} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', color: '#cbd5e1' }}>
                                    <Check size={18} color="#10b981" />
                                    <span>{f}</span>
                                </div>
                            ))}
                        </div>

                        <a
                            href={`${plan.link}?client_reference_id=${user?.uid}&prefilled_email=${encodeURIComponent(user?.email)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: 'block',
                                width: '100%',
                                padding: '1rem',
                                borderRadius: '12px',
                                background: plan.recommended ? '#3b82f6' : 'rgba(255,255,255,0.1)',
                                color: 'white',
                                textAlign: 'center',
                                textDecoration: 'none',
                                fontWeight: 'bold',
                                transition: 'all 0.2s'
                            }}
                        >
                            Assinar Agora
                        </a>
                    </div>
                ))}
            </div>

            <div style={{ marginTop: '3rem', textAlign: 'center', marginBottom: '2rem' }}>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1rem' }}>
                    Já realizou o pagamento?
                </p>
                <a
                    href="https://wa.me/5521982626387?text=Ol%C3%A1%2C%20j%C3%A1%20fiz%20o%20pagamento%20da%20minha%20assinatura%20do%20Gym%20manager%20e%20gostaria%20de%20liberar%20meu%20acesso."
                    target="_blank"
                    rel="noreferrer"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        color: '#10b981',
                        textDecoration: 'none',
                        fontWeight: '600',
                        padding: '0.8rem 1.8rem',
                        borderRadius: '999px',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        transition: 'all 0.2s',
                        fontSize: '0.95rem'
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.2)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
                        e.currentTarget.style.transform = 'translateY(0)';
                    }}
                >
                    <MessageCircle size={20} />
                    Enviar Comprovante / Liberar Acesso
                </a>
            </div>

            <button
                onClick={handleLogout}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                }}
            >
                <LogOut size={16} /> Entrar com outra conta
            </button>
        </div>
    );
}
