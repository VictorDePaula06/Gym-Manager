import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, TrendingUp, Users, Check, ArrowRight, FileText, DollarSign, X, Plus, ChevronDown, Activity, Sparkles, Crown } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Tema (verde esmeralda + grafite), alinhado ao app.
const ACCENT = '#10b981';
const ACCENT_DARK = '#059669';
const WHATS = 'https://wa.me/5521982626387';

// Planos (Bronze/Prata/Ouro). Preço mensal e anual (valor por mês no plano anual).
const PLANS = [
    {
        name: 'Bronze',
        monthly: '39,90',
        annual: '29,90',
        annualTotal: '358,80',
        saveYear: '120',
        color: '#c2803f',
        highlight: false,
        badge: null,
        icon: Dumbbell,
        features: ['Até 15 alunos', 'Gestão completa de alunos', 'Controle financeiro', 'Montagem de treinos', 'App do aluno + comunidade', 'Check-in e desafios'],
        note: 'Sem inteligência artificial',
        cta: 'Assinar Bronze',
    },
    {
        name: 'Prata',
        monthly: '79,90',
        annual: '59,90',
        annualTotal: '718,80',
        saveYear: '240',
        color: '#94a3b8',
        highlight: true,
        badge: 'Mais popular',
        icon: Sparkles,
        features: ['Até 40 alunos', 'Tudo do Bronze', 'Treinos com Inteligência Artificial', 'Relatórios de evolução', 'Suporte prioritário'],
        note: null,
        cta: 'Assinar Prata',
    },
    {
        name: 'Ouro',
        monthly: '149,90',
        annual: '119,90',
        annualTotal: '1.438,80',
        saveYear: '360',
        color: '#eab308',
        highlight: false,
        badge: null,
        icon: Crown,
        features: ['Alunos ilimitados', 'Tudo do Prata', 'IA sem limites', 'Suporte VIP no WhatsApp'],
        note: null,
        cta: 'Assinar Ouro',
    },
];

export default function LandingPage() {
    const navigate = useNavigate();
    const [activeFeature, setActiveFeature] = useState(null);
    const [openFaq, setOpenFaq] = useState(null);
    const [scrolled, setScrolled] = useState(false);
    const [billing, setBilling] = useState('annual'); // 'monthly' | 'annual'
    const containerRef = useRef(null);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from('.hero-content > *', { y: 30, duration: 1, stagger: 0.1, ease: 'power3.out', delay: 0.1 });
            gsap.from('.hero-image-container', { y: 50, duration: 1.2, ease: 'power3.out', delay: 0.4 });
            gsap.from('.feature-card', { y: 50, duration: 0.8, stagger: 0.1, ease: 'power3.out', scrollTrigger: { trigger: '#features', start: 'top 95%' } });
            gsap.from('.plan-card', { y: 40, duration: 0.7, stagger: 0.12, ease: 'power3.out', scrollTrigger: { trigger: '#planos', start: 'top 85%' } });
        }, containerRef);
        return () => ctx.revert();
    }, []);

    useEffect(() => {
        document.body.style.overflow = activeFeature ? 'hidden' : 'unset';
    }, [activeFeature]);

    const features = [
        { id: 'students', title: 'Seus Alunos', shortDesc: 'Controle total de matrículas e avaliações.', longDesc: 'Tenha todos os seus alunos na palma da mão. Acompanhe a evolução física com gráficos, fotos comparativas e avaliações detalhadas para mostrar resultados reais.', icon: Users, color: '16, 185, 129', images: [{ src: '/img/students-grid.png', label: 'Lista de Alunos' }, { src: '/img/assessments.png', label: 'Avaliações Físicas' }, { src: '/img/body-map.png', label: 'Mapa Corporal' }, { src: '/img/comparison.png', label: 'Comparativo de Evolução' }] },
        { id: 'financial', title: 'Financeiro', shortDesc: 'Controle quem pagou e quem deve.', longDesc: 'Diga adeus às cobranças manuais constrangedoras. Saiba exatamente quem pagou, quem está atrasado e tenha uma visão clara do seu faturamento mensal.', icon: DollarSign, color: '16, 185, 129', images: [{ src: '/img/financial-dashboard.png', label: 'Dashboard Financeiro' }, { src: '/img/financial-student.png', label: 'Histórico de Pagamentos' }] },
        { id: 'workouts', title: 'Prescrição de Treinos', shortDesc: 'Fichas personalizadas em segundos.', longDesc: 'Monte treinos completos com a biblioteca de exercícios ou crie os seus. Nos planos com IA, deixe a inteligência artificial montar a ficha pelo perfil do aluno.', icon: Dumbbell, color: '249, 115, 22', images: [{ src: '/img/workouts-grid.png', label: 'Biblioteca de Treinos' }, { src: '/img/workout-editor.png', label: 'Editor de Fichas' }, { src: '/img/workouts-main.png', label: 'Visão Geral' }] },
        { id: 'reports', title: 'Relatórios Pro', shortDesc: 'Mostre seu valor com dados.', longDesc: 'Gere relatórios de evolução e mostre ao aluno o quanto ele melhorou com a sua consultoria. Dados visuais que ajudam a reter alunos por mais tempo.', icon: FileText, color: '236, 72, 153', images: [{ src: '/img/reports-main.png', label: 'Central de Relatórios' }, { src: '/img/reports-download.png', label: 'Exportação PDF' }] },
        { id: 'assessments', title: 'Avaliação Física', shortDesc: 'Monitore a evolução corporal.', longDesc: 'Registre dobras, perímetros e peso. Gráficos automáticos de composição corporal para mostrar ao aluno que o treino está funcionando.', icon: Activity, color: '139, 92, 246', images: [{ src: '/img/assessments.png', label: 'Avaliações Físicas' }, { src: '/img/body-map.png', label: 'Mapa Corporal' }] },
        { id: 'dashboard', title: 'Seu Painel', shortDesc: 'Seu negócio em uma tela.', longDesc: 'Comece o dia sabendo como está sua consultoria: alunos ativos, faturamento do mês e o que precisa de atenção em um só lugar.', icon: TrendingUp, color: '234, 179, 8', images: [{ src: '/img/dashboard-hero.png', label: 'Visão Geral' }, { src: '/img/dashboard-overview.png', label: 'Resumo do Negócio' }] },
    ];

    const container = {
        minHeight: '100vh',
        background: '#0a0e0d',
        // Degradê contínuo em toda a página: brilhos verdes suaves distribuídos
        // no eixo vertical, sem quebras de cor entre seções.
        backgroundImage: `
            radial-gradient(1000px 550px at 68% 0%, rgba(16,185,129,0.12), transparent 55%),
            radial-gradient(900px 700px at 0% 28%, rgba(16,185,129,0.06), transparent 50%),
            radial-gradient(900px 700px at 100% 55%, rgba(16,185,129,0.06), transparent 50%),
            radial-gradient(1000px 800px at 40% 85%, rgba(16,185,129,0.07), transparent 55%)
        `,
        color: '#f8fafc',
        fontFamily: "'Inter', sans-serif",
        overflowX: 'hidden'
    };
    const btnPrimary = { background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_DARK} 100%)`, color: 'white', border: 'none', padding: '1rem 2rem', fontSize: '1.1rem', fontWeight: '600', borderRadius: '9999px', cursor: 'pointer', boxShadow: `0 4px 20px rgba(16, 185, 129, 0.35)`, transition: 'all 0.3s ease', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' };
    const cardStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '260px', cursor: 'pointer', transition: 'all 0.3s ease', position: 'relative', overflow: 'hidden' };

    return (
        <div ref={containerRef} style={container}>
            {/* Header — sem logo/nome (marca a definir) */}
            <header style={{ padding: '1.25rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'fixed', width: '100%', top: 0, zIndex: 40, boxSizing: 'border-box', backdropFilter: 'blur(12px)', background: scrolled ? 'rgba(11,15,14,0.85)' : 'transparent', borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent', transition: 'all 0.3s' }}>
                {/* Marca placeholder (só um ícone neutro, sem nome) */}
                <div style={{ width: '40px', height: '40px', borderRadius: '11px', background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 16px rgba(16,185,129,0.35)' }}>
                    <Dumbbell size={22} color="white" />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <button onClick={() => navigate('/login')} style={{ background: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '0.6rem 1.2rem', borderRadius: '99px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600' }}>Entrar</button>
                    <button onClick={() => navigate('/login')} style={{ ...btnPrimary, padding: '0.6rem 1.5rem', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>Teste grátis (7 dias)</button>
                </div>
            </header>

            {/* Hero */}
            <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '9rem 2rem 4rem', overflow: 'hidden', background: 'transparent' }}>
                <div style={{ position: 'absolute', top: '-15%', left: '50%', transform: 'translateX(-50%)', width: '80%', height: '55%', background: 'radial-gradient(circle, rgba(16,185,129,0.16) 0%, rgba(0,0,0,0) 70%)', zIndex: 0, pointerEvents: 'none' }} />

                <div className="hero-content" style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: '820px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', padding: '0.6rem 1.3rem', borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ color: ACCENT, fontSize: '0.9rem', fontWeight: 600 }}>💪 Feito para Personal Trainers</span>
                    </div>

                    <h1 style={{ fontSize: 'clamp(2.6rem, 6vw, 5rem)', fontWeight: 800, lineHeight: 1.08, margin: 0, letterSpacing: '-0.02em', background: 'linear-gradient(to bottom, #ffffff, #9ca3af)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        A plataforma definitiva<br />para sua{' '}
                        <span style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, #34d399 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>consultoria</span>
                    </h1>

                    <p style={{ fontSize: 'clamp(1.05rem, 2vw, 1.35rem)', color: '#9ca3af', maxWidth: '680px', margin: '0.5rem auto 1rem', lineHeight: 1.6 }}>
                        Abandone as planilhas e o PDF. Gerencie alunos, treinos, avaliações e pagamentos em um app moderno — com Inteligência Artificial para montar os treinos.
                    </p>

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button onClick={() => navigate('/login')} style={{ ...btnPrimary, padding: '1rem 2.5rem' }}>Começar grátis <ArrowRight size={20} /></button>
                        <button onClick={() => document.getElementById('planos').scrollIntoView({ behavior: 'smooth' })} style={{ ...btnPrimary, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', boxShadow: 'none', padding: '1rem 2rem' }}>Ver planos</button>
                    </div>
                </div>

                {/* Imagem do dashboard */}
                <div className="hero-image-container" style={{ position: 'relative', zIndex: 5, width: '100%', maxWidth: '1150px', perspective: '2000px', marginTop: '3rem', marginBottom: '-90px' }}>
                    <div style={{ transform: 'rotateX(18deg) scale(0.92)', transformStyle: 'preserve-3d', animation: 'floatHero 6s ease-in-out infinite', borderRadius: '24px', boxShadow: '0 50px 100px -20px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08)', background: '#111917', padding: '10px' }}>
                        <img src="/img/dashboard-hero.png" alt="Painel" style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '16px' }} />
                    </div>
                </div>
                <style>{`@keyframes floatHero { 0%,100% { transform: rotateX(18deg) scale(0.92) translateY(0);} 50% { transform: rotateX(18deg) scale(0.92) translateY(-18px);} }`}</style>
            </section>

            {/* Features */}
            <section id="features" style={{ padding: '6rem 2rem 4rem', maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {features.map((f) => (
                    <div key={f.id} className="feature-card" style={cardStyle} onClick={() => setActiveFeature(f)}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.borderColor = `rgb(${f.color})`; e.currentTarget.style.boxShadow = `0 12px 30px -10px rgba(${f.color}, 0.35)`; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}>
                        <div>
                            <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: `rgba(${f.color}, 0.12)`, color: `rgb(${f.color})`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                                <f.icon size={24} />
                            </div>
                            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.6rem' }}>{f.title}</h3>
                            <p style={{ color: '#9ca3af', lineHeight: 1.5, margin: 0 }}>{f.shortDesc}</p>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                            <div style={{ width: '38px', height: '38px', borderRadius: '50%', border: `1px solid rgb(${f.color})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: `rgb(${f.color})` }}><Plus size={22} /></div>
                        </div>
                    </div>
                ))}
            </section>

            {/* Modal de feature */}
            {activeFeature && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', backdropFilter: 'blur(5px)' }} onClick={() => setActiveFeature(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ background: '#111917', borderRadius: '24px', width: '100%', maxWidth: '1000px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div className="modal-header" style={{ padding: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1 }}>
                                <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                                    <div style={{ padding: '1rem', borderRadius: '16px', background: `rgba(${activeFeature.color}, 0.12)`, color: `rgb(${activeFeature.color})` }}><activeFeature.icon size={30} /></div>
                                    <h2 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0 }}>{activeFeature.title}</h2>
                                </div>
                                <p style={{ color: '#9ca3af', fontSize: '1.05rem', lineHeight: 1.6, margin: 0 }}>{activeFeature.longDesc}</p>
                            </div>
                            <button onClick={() => setActiveFeature(null)} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '0.5rem' }}><X size={30} /></button>
                        </div>
                        <div className="modal-body" style={{ padding: '2rem', background: '#0b0f0e' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                                {activeFeature.images.map((img, i) => (
                                    <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                                            <img src={img.src} alt={img.label} style={{ width: '100%', height: 'auto', display: 'block' }} />
                                        </div>
                                        <span style={{ textAlign: 'center', color: '#9ca3af', fontSize: '0.9rem' }}>{img.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div style={{ padding: '1.25rem 2rem', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button onClick={() => setActiveFeature(null)} style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'white', cursor: 'pointer' }}>Fechar</button>
                            <button onClick={() => navigate('/login')} style={{ ...btnPrimary, padding: '0.75rem 1.5rem', fontSize: '1rem' }}>Começar grátis</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile */}
            <section style={{ padding: '7rem 2rem', background: 'transparent', overflow: 'hidden' }}>
                <div style={{ maxWidth: '1150px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem', alignItems: 'center' }}>
                    <div style={{ textAlign: 'left' }}>
                        <div style={{ display: 'inline-block', padding: '0.4rem 1rem', background: 'rgba(16,185,129,0.1)', color: ACCENT, borderRadius: '99px', fontWeight: 700, fontSize: '0.85rem', marginBottom: '1.25rem', border: '1px solid rgba(16,185,129,0.2)' }}>📱 App completo</div>
                        <h2 style={{ fontSize: '2.6rem', fontWeight: 800, color: 'white', lineHeight: 1.12, marginBottom: '1.25rem' }}>Consultoria na <span style={{ color: ACCENT }}>palma da mão</span></h2>
                        <p style={{ color: '#9ca3af', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '2rem' }}>Gerencie seus alunos de qualquer lugar. Monte treinos, verifique pagamentos e acompanhe a evolução direto do celular. O aluno tem o próprio app com treinos, avaliações e comunidade.</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                            {['Web app ultrarrápido: acesse de qualquer lugar', 'App do aluno com treinos, check-in e evolução', 'Monte treinos completos pelo celular em segundos'].map((item, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#e2e8f0' }}>
                                    <div style={{ background: 'rgba(16,185,129,0.2)', borderRadius: '50%', padding: '5px', display: 'flex', color: ACCENT }}><Check size={14} /></div>
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', perspective: '1000px' }}>
                        <div style={{ position: 'absolute', width: '300px', height: '480px', background: ACCENT, filter: 'blur(120px)', opacity: 0.25, top: '50%', left: '50%', transform: 'translate(-50%, -50%)', borderRadius: '50%', zIndex: 0 }} />
                        <div style={{ position: 'relative', width: '270px', height: '540px', background: '#0b0f0e', borderRadius: '40px', border: '8px solid #26332e', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', overflow: 'hidden', zIndex: 1, transform: 'rotateY(-5deg) rotateX(5deg)' }}>
                            <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '110px', height: '22px', background: '#000', borderBottomLeftRadius: '14px', borderBottomRightRadius: '14px', zIndex: 10 }} />
                            <img src="/img/mobile-dashboard-final.png" alt="App" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                    </div>
                </div>
            </section>

            {/* App do Aluno (celular à esquerda) */}
            <section style={{ padding: '5rem 2rem 7rem', background: 'transparent', overflow: 'hidden' }}>
                <div style={{ maxWidth: '1150px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem', alignItems: 'center' }}>
                    {/* Celular */}
                    <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', perspective: '1000px' }}>
                        <div style={{ position: 'absolute', width: '300px', height: '480px', background: ACCENT, filter: 'blur(120px)', opacity: 0.22, top: '50%', left: '50%', transform: 'translate(-50%, -50%)', borderRadius: '50%', zIndex: 0 }} />
                        <div style={{ position: 'relative', width: '270px', height: '540px', background: '#0b0f0e', borderRadius: '40px', border: '8px solid #26332e', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', overflow: 'hidden', zIndex: 1, transform: 'rotateY(5deg) rotateX(5deg)' }}>
                            <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '110px', height: '22px', background: '#000', borderBottomLeftRadius: '14px', borderBottomRightRadius: '14px', zIndex: 10 }} />
                            <img src="/img/app-aluno.png" alt="App do aluno" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                    </div>
                    {/* Texto */}
                    <div style={{ textAlign: 'left' }}>
                        <div style={{ display: 'inline-block', padding: '0.4rem 1rem', background: 'rgba(16,185,129,0.1)', color: ACCENT, borderRadius: '99px', fontWeight: 700, fontSize: '0.85rem', marginBottom: '1.25rem', border: '1px solid rgba(16,185,129,0.2)' }}>🎓 App do aluno</div>
                        <h2 style={{ fontSize: '2.6rem', fontWeight: 800, color: 'white', lineHeight: 1.12, marginBottom: '1.25rem' }}>Seu aluno também <span style={{ color: ACCENT }}>tem app</span></h2>
                        <p style={{ color: '#9ca3af', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '2rem' }}>Cada aluno tem o próprio acesso: vê os treinos, marca os exercícios, responde o check-in da semana, acompanha a evolução e ainda entra na comunidade com ranking e desafios entre os alunos.</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                            {['Treinos com vídeos e séries pra marcar na hora', 'Check-in semanal: o aluno conta como foi a semana', 'Comunidade com ranking e desafios entre os alunos', 'Evolução com fotos e avaliações físicas'].map((item, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#e2e8f0' }}>
                                    <div style={{ background: 'rgba(16,185,129,0.2)', borderRadius: '50%', padding: '5px', display: 'flex', color: ACCENT }}><Check size={14} /></div>
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Planos */}
            <section id="planos" style={{ padding: '6rem 2rem', background: 'transparent', textAlign: 'center' }}>
                <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                    <div style={{ display: 'inline-block', background: 'rgba(16,185,129,0.1)', color: ACCENT, padding: '0.4rem 1rem', borderRadius: '99px', fontSize: '0.85rem', fontWeight: 700, marginBottom: '1.25rem', border: '1px solid rgba(16,185,129,0.2)' }}>⚡ 7 dias grátis com tudo liberado</div>
                    <h2 style={{ fontSize: '2.6rem', fontWeight: 800, marginBottom: '0.75rem', color: 'white' }}>Escolha seu plano</h2>
                    <p style={{ color: '#9ca3af', marginBottom: '2rem', fontSize: '1.05rem' }}>Teste 7 dias grátis. Sem fidelidade, cancele quando precisar.</p>

                    {/* Toggle Mensal / Anual */}
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '99px', padding: '0.3rem', marginBottom: '3rem' }}>
                        {[{ k: 'monthly', l: 'Mensal' }, { k: 'annual', l: 'Anual' }].map((opt) => {
                            const on = billing === opt.k;
                            return (
                                <button key={opt.k} onClick={() => setBilling(opt.k)} style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.55rem 1.4rem', borderRadius: '99px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem',
                                    background: on ? `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK})` : 'transparent',
                                    color: on ? 'white' : '#9ca3af', transition: 'all 0.2s',
                                }}>
                                    {opt.l}
                                    {opt.k === 'annual' && <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '99px', background: on ? 'rgba(255,255,255,0.2)' : 'rgba(16,185,129,0.15)', color: on ? 'white' : ACCENT }}>-25%</span>}
                                </button>
                            );
                        })}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '1.75rem', alignItems: 'stretch', paddingTop: '1.25rem' }}>
                        {PLANS.map((plan) => {
                            const featured = plan.highlight;
                            const isAnnual = billing === 'annual';
                            const value = isAnnual ? plan.annual : plan.monthly;
                            return (
                                <div key={plan.name} className="plan-card" style={{
                                    background: featured
                                        ? 'radial-gradient(120% 100% at 50% 0%, rgba(16,185,129,0.14) 0%, rgba(17,25,23,0.9) 55%)'
                                        : 'rgba(255,255,255,0.025)',
                                    border: featured ? `1.5px solid ${ACCENT}` : '1px solid rgba(255,255,255,0.09)',
                                    borderRadius: '24px', padding: '0', position: 'relative', overflow: 'hidden',
                                    display: 'flex', flexDirection: 'column', textAlign: 'left',
                                    boxShadow: featured ? `0 25px 60px -18px rgba(16,185,129,0.45)` : '0 12px 30px -18px rgba(0,0,0,0.6)',
                                    transform: featured ? 'scale(1.035)' : 'none', transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                                }}
                                    onMouseEnter={(e) => { if (!featured) { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = `0 22px 45px -20px ${plan.color}88`; } }}
                                    onMouseLeave={(e) => { if (!featured) { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 12px 30px -18px rgba(0,0,0,0.6)'; } }}
                                >
                                    {/* Barra metálica no topo */}
                                    <div style={{ height: '5px', width: '100%', background: `linear-gradient(90deg, transparent, ${plan.color}, transparent)` }} />

                                    {plan.badge && (
                                        <div style={{ position: 'absolute', top: '14px', right: '14px', background: ACCENT, color: 'white', padding: '0.3rem 0.85rem', borderRadius: '99px', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.03em', boxShadow: '0 6px 16px rgba(16,185,129,0.4)' }}>★ {plan.badge}</div>
                                    )}

                                    <div style={{ padding: '2rem 2rem 2.25rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '1.25rem' }}>
                                            <div style={{ width: '46px', height: '46px', borderRadius: '13px', background: `linear-gradient(135deg, ${plan.color}33, ${plan.color}11)`, border: `1px solid ${plan.color}66`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 6px 18px -6px ${plan.color}77` }}>
                                                <plan.icon size={22} color={plan.color} />
                                            </div>
                                            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, letterSpacing: '0.02em', color: plan.color }}>{plan.name}</h3>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.35rem' }}>
                                            <span style={{ fontSize: '1.1rem', color: '#9ca3af', fontWeight: 600, marginBottom: '0.55rem' }}>R$</span>
                                            <span style={{ fontSize: '3.1rem', fontWeight: 800, color: 'white', lineHeight: 1, letterSpacing: '-0.02em' }}>{value}</span>
                                            <span style={{ color: '#9ca3af', marginBottom: '0.55rem', fontSize: '0.95rem' }}>/mês</span>
                                        </div>
                                        {/* Detalhe do anual / mensal */}
                                        <div style={{ minHeight: '22px', marginTop: '0.6rem' }}>
                                            {isAnnual ? (
                                                <span style={{ fontSize: '0.82rem', color: '#9ca3af' }}>
                                                    R$ {plan.annualTotal} à vista/ano · <span style={{ color: ACCENT, fontWeight: 700 }}>economize R$ {plan.saveYear}</span>
                                                </span>
                                            ) : (
                                                <span style={{ fontSize: '0.82rem', color: '#6b7280' }}>
                                                    No anual sai R$ {plan.annual}/mês
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '1.4rem 0' }} />

                                        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.75rem', display: 'flex', flexDirection: 'column', gap: '0.85rem', flex: 1 }}>
                                            {plan.features.map((item, i) => (
                                                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', color: '#e5e7eb', fontSize: '0.93rem' }}>
                                                    <div style={{ width: '20px', height: '20px', flexShrink: 0, background: 'rgba(16,185,129,0.16)', borderRadius: '50%', color: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={13} /></div>
                                                    {item}
                                                </li>
                                            ))}
                                            {plan.note && (
                                                <li style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', color: '#6b7280', fontSize: '0.9rem' }}>
                                                    <div style={{ width: '20px', height: '20px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={15} /></div>
                                                    {plan.note}
                                                </li>
                                            )}
                                        </ul>

                                        <button onClick={() => navigate('/login')} style={{
                                            width: '100%', padding: '0.95rem', borderRadius: '13px', fontWeight: 700, cursor: 'pointer', fontSize: '0.98rem',
                                            border: featured ? 'none' : `1px solid ${plan.color}55`,
                                            background: featured ? `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK})` : 'transparent',
                                            color: 'white', boxShadow: featured ? '0 10px 24px rgba(16,185,129,0.4)' : 'none', transition: 'all 0.2s',
                                        }}
                                            onMouseEnter={(e) => { if (!featured) { e.currentTarget.style.background = `${plan.color}22`; } }}
                                            onMouseLeave={(e) => { if (!featured) { e.currentTarget.style.background = 'transparent'; } }}
                                        >{plan.cta}</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <p style={{ color: '#64748b', marginTop: '2rem', fontSize: '0.85rem' }}>Todo novo cadastro começa com 7 dias grátis no plano Ouro.</p>
                </div>
            </section>

            {/* Contato */}
            <section style={{ padding: '6rem 2rem', background: 'transparent', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'center' }}>
                <div style={{ width: '100%', maxWidth: '600px', textAlign: 'center' }}>
                    <h2 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: '1rem', color: 'white' }}>Ficou com alguma dúvida?</h2>
                    <p style={{ color: '#9ca3af', marginBottom: '2.5rem' }}>Deixe seu contato que a gente responde rapidinho.</p>
                    <form action="https://formsubmit.co/j.17jvictor@gmail.com" method="POST" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'left' }}>
                        <input type="hidden" name="_subject" value="Novo Lead - Landing" />
                        <input type="hidden" name="_captcha" value="false" />
                        <input type="hidden" name="_template" value="table" />
                        {[{ n: 'name', t: 'text', l: 'Seu nome', p: 'Como podemos te chamar?' }, { n: 'email', t: 'email', l: 'Seu e-mail', p: 'seu@email.com' }].map((fld) => (
                            <div key={fld.n}>
                                <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '0.5rem', fontSize: '0.9rem' }}>{fld.l}</label>
                                <input type={fld.t} name={fld.n} required placeholder={fld.p} style={{ width: '100%', padding: '1rem', boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', fontSize: '1rem', outline: 'none' }} onFocus={(e) => e.target.style.borderColor = ACCENT} onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                            </div>
                        ))}
                        <div>
                            <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Mensagem</label>
                            <textarea name="message" required rows="4" placeholder="Como podemos ajudar?" style={{ width: '100%', padding: '1rem', boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', fontSize: '1rem', outline: 'none', resize: 'vertical' }} onFocus={(e) => e.target.style.borderColor = ACCENT} onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                        </div>
                        <button type="submit" style={{ ...btnPrimary, justifyContent: 'center', marginTop: '0.5rem', padding: '1rem' }}>Enviar mensagem</button>
                    </form>
                </div>
            </section>

            {/* FAQ */}
            <section style={{ padding: '4rem 2rem', maxWidth: '800px', margin: '0 auto' }}>
                <h2 style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 800, marginBottom: '3rem', color: 'white' }}>Dúvidas frequentes</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {[
                        { q: 'Preciso instalar algum programa?', a: 'Não! É 100% online (nas nuvens). Você acessa pelo navegador de qualquer computador, tablet ou celular. Se seu aparelho estragar, seus dados continuam salvos.' },
                        { q: 'Funciona em iPhone e Android?', a: 'Sim. É otimizado para celular e funciona como um aplicativo. Não precisa baixar da loja — basta acessar pelo navegador e adicionar à tela inicial.' },
                        { q: 'Meus dados estão seguros?', a: 'Muito mais que no papel ou planilha. Criptografia de ponta e backups automáticos. Ninguém além de você acessa os dados dos seus alunos.' },
                        { q: 'Como funciona o teste grátis?', a: 'Todo novo cadastro começa com 7 dias grátis no plano Ouro (tudo liberado, com IA). Depois, é só escolher o plano que faz mais sentido pra você.' },
                    ].map((faq, i) => (
                        <div key={i} onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', overflow: 'hidden' }}>
                            <div style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, color: openFaq === i ? ACCENT : '#e2e8f0' }}>
                                {faq.q}
                                <ChevronDown size={20} style={{ transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.3s', color: openFaq === i ? ACCENT : '#64748b' }} />
                            </div>
                            {openFaq === i && (
                                <div style={{ padding: '0 1.5rem 1.5rem', color: '#9ca3af', lineHeight: 1.6 }}>{faq.a}</div>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer (sem nome) */}
            <footer style={{ padding: '3rem 2rem', textAlign: 'center', color: '#64748b', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <p style={{ margin: 0 }}>&copy; {new Date().getFullYear()} · Todos os direitos reservados.</p>
            </footer>

            {/* Responsivo */}
            <style>{`
                @media (max-width: 768px) {
                    header { padding: 0.85rem 1rem !important; }
                    section { padding-left: 1.25rem !important; padding-right: 1.25rem !important; }
                    .hero-content { padding-top: 2rem !important; }
                    .hero-image-container { margin-bottom: -30px !important; transform: rotateX(10deg) scale(0.85) !important; }
                    .modal-content { width: 95% !important; }
                    .modal-header, .modal-body { padding: 1.5rem !important; }
                }
            `}</style>
        </div>
    );
}
