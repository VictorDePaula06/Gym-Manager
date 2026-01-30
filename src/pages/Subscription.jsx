
import React from 'react';
import { Check, Star, Shield, Zap, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

const Subscription = () => {
    const { user, trialInfo } = useAuth();

    const handleSimulatePayment = async () => {
        if (!confirm("[DEV ONLY] Simular pagamento bem-sucedido via Stripe?")) return;

        try {
            const tenantRef = doc(db, 'tenants', user.tenantId);
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 30);

            await updateDoc(tenantRef, {
                subscriptionStatus: 'active',
                active: true,
                current_period_end: Timestamp.fromDate(futureDate)
            });
            alert("Pagamento simulado! Verifique a aba Configurações.");
        } catch (error) {
            console.error(error);
            alert("Erro ao simular.");
        }
    };

    // DADOS DE EXEMPLO - SUBSTITUIR PELOS LINKS REAIS DO STRIPE TEST
    // Você vai pegar esses links no Dashboard do Stripe > Payment Links
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
            link: 'https://buy.stripe.com/test_9B69AUfuT3NUggA1jDbo400', // Link Real de Teste
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
            link: 'https://buy.stripe.com/test_8x28wQfuT5W25BW1jDbo401', // Link Real de Teste
            recommended: true
        }
    ];

    return (
        <div className="fade-in" style={{ paddingBottom: '3rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                    Escolha seu Plano
                </h1>
                <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto', fontSize: '1.1rem' }}>
                    Invista na gestão profissional da sua academia. Sem taxas de 'setup', cancele quando quiser.
                </p>

                {/* DEV TOOL */}
                <div style={{ marginTop: '1rem' }}>
                    <button
                        onClick={handleSimulatePayment}
                        style={{
                            background: 'transparent',
                            border: '1px dashed #334155',
                            color: '#64748b',
                            padding: '0.4rem 0.8rem',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            display: 'inline-flex', alignItems: 'center', gap: '0.5rem'
                        }}
                    >
                        <RefreshCw size={12} /> [DEV] Simular Webhook
                    </button>
                </div>

                {trialInfo?.isTrial && (
                    <div style={{
                        display: 'inline-block',
                        background: 'rgba(234, 179, 8, 0.1)',
                        color: '#eab308',
                        padding: '0.5rem 1rem',
                        borderRadius: '20px',
                        marginTop: '1.5rem',
                        fontWeight: '500'
                    }}>
                        Você tem {trialInfo.daysRemaining} dias restantes no seu teste grátis.
                    </div>
                )}
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '2rem',
                maxWidth: '1000px',
                margin: '0 auto'
            }}>
                {PLANS.map(plan => (
                    <div key={plan.id} className="glass-panel" style={{
                        padding: '2.5rem',
                        position: 'relative',
                        border: plan.recommended ? '2px solid var(--primary)' : '1px solid var(--border-glass)',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        {plan.recommended && (
                            <div style={{
                                position: 'absolute',
                                top: '-15px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                background: 'var(--primary)',
                                color: 'white',
                                padding: '0.5rem 1.5rem',
                                borderRadius: '20px',
                                fontSize: '0.9rem',
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}>
                                <Star size={14} fill="white" /> MELHOR VALOR
                            </div>
                        )}

                        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{plan.name}</h3>
                            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '0.25rem' }}>
                                <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>R$</span>
                                <span style={{ fontSize: '3.5rem', fontWeight: '800', lineHeight: '1' }}>{plan.price}</span>
                                <span style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{plan.period}</span>
                            </div>
                            {plan.save && (
                                <span style={{
                                    display: 'inline-block',
                                    marginTop: '0.5rem',
                                    background: 'rgba(16, 185, 129, 0.1)',
                                    color: '#10b981',
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '12px',
                                    fontSize: '0.9rem',
                                    fontWeight: '600'
                                }}>
                                    {plan.save}
                                </span>
                            )}
                        </div>

                        <div style={{ flex: 1, marginBottom: '2.5rem' }}>
                            {plan.features.map((feature, idx) => (
                                <div key={idx} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                                    <div style={{
                                        background: 'rgba(59, 130, 246, 0.1)',
                                        borderRadius: '50%',
                                        padding: '2px',
                                        height: '20px',
                                        width: '20px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginTop: '2px'
                                    }}>
                                        <Check size={12} color="var(--primary)" />
                                    </div>
                                    <span>{feature}</span>
                                </div>
                            ))}
                        </div>

                        <a
                            href={`${plan.link}?client_reference_id=${user.uid}&prefilled_email=${encodeURIComponent(user.email)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-primary"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '100%',
                                padding: '1rem',
                                fontSize: '1.1rem',
                                textAlign: 'center',
                                background: plan.recommended ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                border: plan.recommended ? 'none' : '1px solid var(--border-glass)',
                                color: plan.recommended ? 'white' : 'var(--text-main)'
                            }}
                        >
                            Assinar {plan.name}
                        </a>

                        <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            Pagamento seguro via Stripe
                        </p>
                    </div>
                ))}
            </div>

            <div style={{ marginTop: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <p>
                    <Shield size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '5px' }} />
                    Seus dados estão protegidos. Garantia de 7 dias ou seu dinheiro de volta.
                </p>
            </div>
        </div>
    );
};

export default Subscription;
