import React, { useState } from 'react';
import { Check, X, Star, Shield, Dumbbell, Sparkles, Crown, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

const WHATS = 'https://wa.me/5521982626387';

const PLANS = [
    { name: 'Bronze', color: '#c2803f', icon: Dumbbell, badge: null, highlight: false, monthly: '39,90', annual: '29,90', annualTotal: '358,80', save: '120', features: ['Até 15 alunos', 'Gestão completa de alunos', 'Controle financeiro', 'Treinos + app do aluno', 'Comunidade e desafios'], note: 'Sem inteligência artificial' },
    { name: 'Prata', color: '#94a3b8', icon: Sparkles, badge: 'Mais popular', highlight: true, monthly: '79,90', annual: '59,90', annualTotal: '718,80', save: '240', features: ['Até 40 alunos', 'Tudo do Bronze', 'Treinos com Inteligência Artificial', 'Relatórios de evolução', 'Suporte prioritário'], note: null },
    { name: 'Ouro', color: '#eab308', icon: Crown, badge: null, highlight: false, monthly: '149,90', annual: '119,90', annualTotal: '1.438,80', save: '360', features: ['Alunos ilimitados', 'Tudo do Prata', 'IA sem limites', 'Suporte VIP no WhatsApp'], note: null },
];

const Subscription = () => {
    const { user, trialInfo } = useAuth();
    const [billing, setBilling] = useState('annual');

    const handleSimulatePayment = async () => {
        if (!confirm('[DEV ONLY] Simular pagamento bem-sucedido via Stripe?')) return;
        try {
            const tenantRef = doc(db, 'tenants', user.tenantId);
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 30);
            await updateDoc(tenantRef, { subscriptionStatus: 'active', active: true, current_period_end: Timestamp.fromDate(futureDate) });
            alert('Pagamento simulado! Verifique a aba Configurações.');
        } catch (error) {
            console.error(error);
            alert('Erro ao simular.');
        }
    };

    const planLink = (plan) => {
        const cycle = billing === 'annual' ? 'Anual' : 'Mensal';
        const price = billing === 'annual' ? `R$ ${plan.annual}/mês (anual)` : `R$ ${plan.monthly}/mês`;
        const txt = `Olá! Quero assinar o plano ${plan.name} (${cycle} — ${price}) do Alivia Fitness. Meu e-mail: ${user?.email || ''}`;
        return `${WHATS}?text=${encodeURIComponent(txt)}`;
    };

    return (
        <div className="fade-in" style={{ paddingBottom: '3rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                <h1 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: '0.75rem' }}>Escolha seu plano</h1>
                <p style={{ color: 'var(--text-muted)', maxWidth: '620px', margin: '0 auto', fontSize: '1.05rem' }}>
                    Invista na gestão profissional da sua consultoria. Sem taxa de setup, cancele quando quiser.
                </p>

                {trialInfo?.isTrial && (
                    <div style={{ display: 'inline-block', background: 'rgba(234, 179, 8, 0.1)', color: '#eab308', padding: '0.5rem 1rem', borderRadius: '20px', marginTop: '1.25rem', fontWeight: 600, fontSize: '0.9rem' }}>
                        Você tem {trialInfo.daysRemaining} {trialInfo.daysRemaining === 1 ? 'dia restante' : 'dias restantes'} no seu teste grátis.
                    </div>
                )}

                {/* Toggle Mensal / Anual */}
                <div style={{ marginTop: '1.75rem', display: 'flex', justifyContent: 'center' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: 'var(--input-bg)', border: '1px solid var(--border-glass)', borderRadius: '99px', padding: '0.3rem' }}>
                        {[{ k: 'monthly', l: 'Mensal' }, { k: 'annual', l: 'Anual' }].map((opt) => {
                            const on = billing === opt.k;
                            return (
                                <button key={opt.k} onClick={() => setBilling(opt.k)} style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.3rem', borderRadius: '99px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem',
                                    background: on ? 'linear-gradient(135deg, var(--primary), #059669)' : 'transparent',
                                    color: on ? 'white' : 'var(--text-muted)', transition: 'all 0.2s',
                                }}>
                                    {opt.l}
                                    {opt.k === 'annual' && <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '99px', background: on ? 'rgba(255,255,255,0.2)' : 'rgba(16,185,129,0.15)', color: on ? 'white' : 'var(--primary)' }}>-25%</span>}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.75rem', maxWidth: '1050px', margin: '1rem auto 0', alignItems: 'stretch', paddingTop: '1rem' }}>
                {PLANS.map((plan) => {
                    const featured = plan.highlight;
                    const isAnnual = billing === 'annual';
                    const value = isAnnual ? plan.annual : plan.monthly;
                    return (
                        <div key={plan.name} className="glass-panel" style={{
                            padding: 0, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column',
                            border: featured ? '1.5px solid var(--primary)' : '1px solid var(--border-glass)',
                            boxShadow: featured ? '0 22px 55px -18px rgba(16,185,129,0.4)' : undefined,
                            transform: featured ? 'scale(1.03)' : 'none',
                        }}>
                            <div style={{ height: '5px', width: '100%', background: `linear-gradient(90deg, transparent, ${plan.color}, transparent)` }} />
                            {plan.badge && (
                                <div style={{ position: 'absolute', top: '14px', right: '14px', background: 'var(--primary)', color: 'white', padding: '0.3rem 0.8rem', borderRadius: '99px', fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <Star size={11} fill="white" /> {plan.badge}
                                </div>
                            )}

                            <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '1.25rem' }}>
                                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `linear-gradient(135deg, ${plan.color}33, ${plan.color}11)`, border: `1px solid ${plan.color}66`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <plan.icon size={21} color={plan.color} />
                                    </div>
                                    <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: plan.color }}>{plan.name}</h3>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.35rem' }}>
                                    <span style={{ fontSize: '1.1rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.5rem' }}>R$</span>
                                    <span style={{ fontSize: '3rem', fontWeight: 800, lineHeight: 1, color: 'var(--text-main)' }}>{value}</span>
                                    <span style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.95rem' }}>/mês</span>
                                </div>
                                <div style={{ minHeight: '20px', marginTop: '0.5rem' }}>
                                    {isAnnual
                                        ? <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>R$ {plan.annualTotal} à vista/ano · <span style={{ color: 'var(--primary)', fontWeight: 700 }}>economize R$ {plan.save}</span></span>
                                        : <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No anual sai R$ {plan.annual}/mês</span>}
                                </div>

                                <div style={{ height: '1px', background: 'var(--border-glass)', margin: '1.4rem 0' }} />

                                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', flex: 1 }}>
                                    {plan.features.map((item, i) => (
                                        <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-main)', fontSize: '0.9rem' }}>
                                            <div style={{ width: '20px', height: '20px', flexShrink: 0, background: 'rgba(16,185,129,0.15)', borderRadius: '50%', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={13} /></div>
                                            {item}
                                        </li>
                                    ))}
                                    {plan.note && (
                                        <li style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                                            <div style={{ width: '20px', height: '20px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={15} /></div>
                                            {plan.note}
                                        </li>
                                    )}
                                </ul>

                                <a href={planLink(plan)} target="_blank" rel="noopener noreferrer" className={featured ? 'btn-primary' : ''} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '0.9rem', borderRadius: '12px', fontWeight: 700, textDecoration: 'none', boxSizing: 'border-box',
                                    background: featured ? undefined : 'transparent',
                                    border: featured ? undefined : `1px solid ${plan.color}66`,
                                    color: featured ? 'white' : 'var(--text-main)',
                                }}>Assinar {plan.name}</a>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div style={{ textAlign: 'center', marginTop: '2.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                <p style={{ margin: 0 }}><Shield size={15} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '5px' }} /> Pagamento seguro · cancele quando quiser.</p>
                <button onClick={handleSimulatePayment} style={{ marginTop: '1.25rem', background: 'transparent', border: '1px dashed var(--border-glass)', color: 'var(--text-muted)', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                    <RefreshCw size={12} /> [DEV] Simular pagamento
                </button>
            </div>
        </div>
    );
};

export default Subscription;
