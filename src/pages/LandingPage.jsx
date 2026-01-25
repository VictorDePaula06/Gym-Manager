
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, TrendingUp, Users, Check, ArrowRight, FileText, DollarSign, GraduationCap, X, Plus } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function LandingPage() {
    const navigate = useNavigate();
    const [activeFeature, setActiveFeature] = useState(null);
    const containerRef = useRef(null);

    // GSAP Animations
    useEffect(() => {
        const ctx = gsap.context(() => {
            // Hero Animation
            gsap.from('.hero-content > *', {
                y: 30,
                duration: 1,
                stagger: 0.1,
                ease: "power3.out",
                delay: 0.2
            });

            // 3D Image Animation
            gsap.from('.hero-image-container', {
                y: 50,
                duration: 1.2,
                ease: "power3.out",
                delay: 0.5
            });

            // Features Animation
            gsap.from('.feature-card', {
                y: 50,
                duration: 0.8,
                stagger: 0.1,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: '#features',
                    start: "top 95%", // Trigger very early
                }
            });

            // Pricing Animation
            gsap.from('.pricing-card', {
                scale: 0.95,
                duration: 0.8,
                ease: "back.out(1.7)",
                scrollTrigger: {
                    trigger: '.pricing-section',
                    start: "top 90%",
                }
            });

        }, containerRef);

        return () => ctx.revert();
    }, []);

    // Lock body scroll when modal is open
    useEffect(() => {
        if (activeFeature) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [activeFeature]);

    const features = [
        {
            id: 'students',
            title: 'Gestão de Alunos',
            shortDesc: 'Controle total de matrículas e avaliações.',
            longDesc: 'Tenha controle total sobre matrículas, pagamentos e evolução física. Utilize avaliações detalhadas e mapas corporais interativos para entregar resultados visíveis aos seus alunos.',
            icon: Users,
            color: '16, 185, 129', // Emerald
            images: [
                { src: '/img/students-grid.png', label: 'Lista de Alunos' },
                { src: '/img/assessments.png', label: 'Avaliações Físicas' },
                { src: '/img/body-map.png', label: 'Mapa Corporal' },
                { src: '/img/comparison.png', label: 'Comparativo de Evolução' }
            ]
        },
        {
            id: 'financial',
            title: 'Financeiro',
            shortDesc: 'Fluxo de caixa e mensalidades.',
            longDesc: 'Organize suas finanças com facilidade. Visualize receitas, despesas e lucro líquido em um dashboard intuitivo. Acompanhe o histórico de pagamentos de cada aluno e evite inadimplência.',
            icon: DollarSign,
            color: '14, 165, 233', // Sky Blue (Cyan-ish)
            images: [
                { src: '/img/financial-dashboard.png', label: 'Dashboard Financeiro' },
                { src: '/img/financial-student.png', label: 'Histórico do Aluno' }
            ]
        },
        {
            id: 'workouts',
            title: 'Treinos',
            shortDesc: 'Montagem de fichas personalizadas.',
            longDesc: 'Crie treinos personalizados em segundos. Utilize nossa biblioteca de exercícios ou cadastre os seus. Imprima fichas ou envie em PDF diretamente para o aluno.',
            icon: Dumbbell,
            color: '249, 115, 22', // Orange
            images: [
                { src: '/img/workouts-grid.png', label: 'Gerenciamento de Treinos' },
                { src: '/img/workout-editor.png', label: 'Editor de Fichas' },
                { src: '/img/workouts-main.png', label: 'Visão Geral' }
            ]
        },
        {
            id: 'teachers',
            title: 'Professores',
            shortDesc: 'Gestão de equipe e comissões.',
            longDesc: 'Gerencie seus professores e personal trainers. Configure comissões, vincule alunos e acompanhe o desempenho da sua equipe.',
            icon: GraduationCap,
            color: '139, 92, 246', // Violet
            images: [
                { src: '/img/teacher-dashboard.png', label: 'Painel do Professor' },
                { src: '/img/teacher-profile.png', label: 'Perfil e Comissões' }
            ]
        },
        {
            id: 'reports',
            title: 'Relatórios',
            shortDesc: 'Dados para tomada de decisão.',
            longDesc: 'Exporte relatórios detalhados em PDF. Tenha em mãos dados precisos sobre alunos ativos, faturamento e retenção para tomar as melhores decisões para sua academia.',
            icon: FileText,
            color: '236, 72, 153', // Pink
            images: [
                { src: '/img/reports-main.png', label: 'Central de Relatórios' },
                { src: '/img/reports-download.png', label: 'Exportação PDF' }
            ]
        },
        {
            id: 'dashboard',
            title: 'Dashboard',
            shortDesc: 'Visão geral do seu negócio.',
            longDesc: 'Acompanhe os principais indicadores da sua academia em tempo real. Alunos ativos, faturamento mensal, aniversariantes e muito mais em uma única tela.',
            icon: TrendingUp,
            color: '234, 179, 8', // Yellow
            images: [
                { src: '/img/dashboard-hero.png', label: 'Dashboard Principal' },
                { src: '/img/dashboard-overview.png', label: 'Resumo Geral' }
            ]
        }
    ];

    // Styles
    const containerStyle = {
        minHeight: '100vh',
        background: '#0f172a', // Darker background
        color: '#f8fafc',
        fontFamily: "'Inter', sans-serif",
        overflowX: 'hidden'
    };

    const headerStyle = {
        padding: '1.5rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'fixed',
        width: '100%',
        top: 0,
        zIndex: 40,
        backdropFilter: 'blur(10px)',
        background: 'rgba(15, 23, 42, 0.8)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
    };

    const gridSectionStyle = {
        padding: '4rem 2rem',
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', // Adjusted for mobile
        gap: '2rem',
        id: 'features'
    };

    const cardStyle = {
        background: 'rgba(30, 41, 59, 0.4)',
        border: '1px solid rgba(6, 182, 212, 0.2)', // Cyan border
        borderRadius: '16px',
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: '280px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden'
    };

    const modalOverlayStyle = {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        backdropFilter: 'blur(5px)'
    };

    const modalContentStyle = {
        background: '#1e293b',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '1000px',
        maxHeight: '90vh',
        overflowY: 'auto',
        position: 'relative',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
    };

    const buttonPrimaryStyle = {
        background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', // Cyan gradient
        color: 'white',
        border: 'none',
        padding: '1rem 2rem',
        fontSize: '1.1rem',
        fontWeight: '600',
        borderRadius: '9999px',
        cursor: 'pointer',
        boxShadow: '0 4px 15px rgba(6, 182, 212, 0.4)',
        transition: 'all 0.3s ease',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        textDecoration: 'none'
    };

    return (
        <div ref={containerRef} style={containerStyle}>
            {/* Header */}
            <header style={headerStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                        width: '32px', height: '32px',
                        background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                        borderRadius: '8px'
                    }}></div>
                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>GymManager</span>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={() => navigate('/login')}
                        style={{
                            background: 'transparent',
                            color: '#94a3b8',
                            border: '1px solid rgba(255,255,255,0.1)',
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            cursor: 'pointer'
                        }}
                    >
                        Login
                    </button>
                    <a
                        href="https://wa.me/5521982626387?text=Ol%C3%A1%2C%20gostaria%20de%20uma%20demonstra%C3%A7%C3%A3o%20do%20Gym%20Manager"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ ...buttonPrimaryStyle, padding: '0.5rem 1.5rem', fontSize: '0.9rem' }}
                    >
                        Demonstração
                    </a>
                </div>
            </header>

            {/* High Impact Hero Section */}
            <section style={{
                position: 'relative',
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8rem 2rem 4rem',
                overflow: 'hidden',
                background: 'radial-gradient(circle at 50% 0%, #1e293b 0%, #0f172a 100%)'
            }}>
                {/* Background Glow Effects */}
                <div style={{
                    position: 'absolute',
                    top: '-20%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '80%',
                    height: '60%',
                    background: 'radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, rgba(0,0,0,0) 70%)',
                    zIndex: 0,
                    pointerEvents: 'none'
                }}></div>

                {/* Content Container */}
                <div className="hero-content" style={{
                    position: 'relative',
                    zIndex: 10,
                    textAlign: 'center',
                    maxWidth: '1000px',
                    marginBottom: '4rem'
                }}>
                    {/* Logo */}
                    <div style={{ marginBottom: '2rem', display: 'inline-block' }}>
                        <div className="hero-badge" style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '9999px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            backdropFilter: 'blur(10px)'
                        }}>
                            <img src="/logo.png" alt="GymManager" style={{ height: '24px' }} />
                            <span style={{ color: '#cbd5e1', fontSize: '0.9rem', fontWeight: '500' }}>
                                O sistema nº 1 para sua academia
                            </span>
                        </div>
                    </div>

                    {/* Headline */}
                    <h1 style={{
                        fontSize: 'clamp(3rem, 6vw, 5.5rem)',
                        fontWeight: '800',
                        lineHeight: '1.1',
                        marginBottom: '1.5rem',
                        letterSpacing: '-0.02em',
                        background: 'linear-gradient(to bottom, #ffffff, #94a3b8)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        textShadow: '0 20px 40px rgba(0,0,0,0.2)'
                    }}>
                        A Evolução da sua <br />
                        <span style={{
                            background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>
                            Gestão Fitness
                        </span>
                    </h1>

                    {/* Subheadline */}
                    <p style={{
                        fontSize: 'clamp(1.1rem, 2vw, 1.4rem)',
                        color: '#94a3b8',
                        maxWidth: '700px',
                        margin: '0 auto 3rem',
                        lineHeight: '1.6'
                    }}>
                        Abandone as planilhas. Tenha controle total de alunos, financeiro e treinos em uma plataforma moderna e intuitiva.
                    </p>

                    {/* CTA Buttons */}
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <a
                            href="https://wa.me/5521982626387?text=Ol%C3%A1%2C%20quero%20conhecer%20o%20Gym%20Manager"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                ...buttonPrimaryStyle,
                                padding: '1rem 2.5rem',
                                fontSize: '1.1rem',
                                boxShadow: '0 0 30px rgba(6, 182, 212, 0.3)'
                            }}
                        >
                            Começar Agora <ArrowRight size={20} />
                        </a>
                        <button
                            onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
                            style={{
                                ...buttonPrimaryStyle,
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                boxShadow: 'none'
                            }}
                        >
                            Ver Recursos
                        </button>
                    </div>
                </div>

                {/* 3D Dashboard Image */}
                <div className="hero-image-container" style={{
                    position: 'relative',
                    zIndex: 5,
                    width: '100%',
                    maxWidth: '1200px',
                    perspective: '2000px',
                    marginBottom: '-100px' // Pull subsequent content up slightly
                }}>
                    <div style={{
                        transform: 'rotateX(20deg) scale(0.9)',
                        transformStyle: 'preserve-3d',
                        animation: 'float 6s ease-in-out infinite',
                        borderRadius: '24px',
                        boxShadow: '0 50px 100px -20px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                        background: '#1e293b',
                        padding: '10px' // Frame
                    }}>
                        <img
                            src="/img/dashboard-hero.png"
                            alt="Dashboard GymManager"
                            style={{
                                width: '100%',
                                height: 'auto',
                                display: 'block',
                                borderRadius: '16px',
                                boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
                            }}
                        />

                        {/* Reflection/Sheen Effect */}
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 40%)',
                            borderRadius: '24px',
                            pointerEvents: 'none'
                        }}></div>
                    </div>
                </div>

                {/* CSS Animation for Float */}
                <style>{`
                    @keyframes float {
                        0%, 100% { transform: rotateX(20deg) scale(0.9) translateY(0); }
                        50% { transform: rotateX(20deg) scale(0.9) translateY(-20px); }
                    }
                `}</style>
            </section>

            {/* Feature Grid */}
            <section id="features" style={gridSectionStyle}>
                {features.map((feature) => (
                    <div
                        key={feature.id}
                        className="feature-card"
                        style={cardStyle}
                        onClick={() => setActiveFeature(feature)}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-5px)';
                            e.currentTarget.style.borderColor = `rgb(${feature.color})`;
                            e.currentTarget.style.boxShadow = `0 10px 30px -10px rgba(${feature.color}, 0.3)`;
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.2)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        <div>
                            <h3 style={{
                                fontSize: '1.2rem',
                                fontWeight: 'bold',
                                marginBottom: '1rem',
                                textTransform: 'uppercase',
                                letterSpacing: '1px'
                            }}>
                                {feature.title}
                            </h3>
                            <p style={{ color: '#94a3b8', lineHeight: '1.5' }}>
                                {feature.shortDesc}
                            </p>
                        </div>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            marginTop: '2rem'
                        }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                border: `1px solid rgb(${feature.color})`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: `rgb(${feature.color})`
                            }}>
                                <Plus size={24} />
                            </div>
                        </div>
                    </div>
                ))}
            </section>

            {/* Modal */}
            {activeFeature && (
                <div style={modalOverlayStyle} onClick={() => setActiveFeature(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={modalContentStyle}>
                        {/* Modal Header */}
                        <div className="modal-header" style={{
                            padding: '2rem',
                            borderBottom: '1px solid rgba(255,255,255,0.1)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'start'
                        }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>
                                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                                    <div style={{
                                        padding: '1rem',
                                        borderRadius: '16px',
                                        background: `rgba(${activeFeature.color}, 0.1)`,
                                        color: `rgb(${activeFeature.color})`
                                    }}>
                                        <activeFeature.icon size={32} />
                                    </div>
                                    <h2 style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>
                                        {activeFeature.title}
                                    </h2>
                                </div>
                                <p style={{ color: '#94a3b8', fontSize: '1.1rem', lineHeight: '1.6' }}>
                                    {activeFeature.longDesc}
                                </p>
                            </div>
                            <button
                                onClick={() => setActiveFeature(null)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#64748b',
                                    cursor: 'pointer',
                                    padding: '0.5rem'
                                }}
                            >
                                <X size={32} />
                            </button>
                        </div>

                        {/* Modal Body (Images) */}
                        <div className="modal-body" style={{ padding: '2rem', background: '#0f172a' }}>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                                gap: '2rem'
                            }}>
                                {activeFeature.images.map((img, index) => (
                                    <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        <div style={{
                                            borderRadius: '12px',
                                            overflow: 'hidden',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                                        }}>
                                            <img
                                                src={img.src}
                                                alt={img.label}
                                                style={{ width: '100%', height: 'auto', display: 'block' }}
                                            />
                                        </div>
                                        <span style={{
                                            textAlign: 'center',
                                            color: '#94a3b8',
                                            fontSize: '0.9rem',
                                            fontWeight: '500'
                                        }}>
                                            {img.label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div style={{
                            padding: '1.5rem 2rem',
                            borderTop: '1px solid rgba(255,255,255,0.1)',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '1rem'
                        }}>
                            <button
                                onClick={() => setActiveFeature(null)}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    background: 'transparent',
                                    color: 'white',
                                    cursor: 'pointer'
                                }}
                            >
                                Fechar
                            </button>
                            <a
                                href="https://wa.me/5521982626387?text=Ol%C3%A1%2C%20gostaria%20de%20saber%20mais%20sobre%20o%20Gym%20Manager"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    ...buttonPrimaryStyle,
                                    padding: '0.75rem 1.5rem',
                                    fontSize: '1rem'
                                }}
                            >
                                Quero Contratar
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* Pricing Section */}
            <section className="pricing-section" style={{
                padding: '6rem 2rem',
                background: 'linear-gradient(to bottom, #0f172a, #1e293b)',
                textAlign: 'center'
            }}>
                <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <h2 style={{
                        fontSize: '2.5rem',
                        fontWeight: 'bold',
                        marginBottom: '1rem',
                        color: 'white'
                    }}>
                        Comece sua transformação hoje
                    </h2>
                    <p style={{ color: '#94a3b8', marginBottom: '3rem', fontSize: '1.1rem' }}>
                        Tudo o que você precisa para gerenciar sua academia em um único lugar.
                    </p>

                    <div className="pricing-card" style={{
                        background: 'rgba(30, 41, 59, 0.6)',
                        border: '1px solid rgba(6, 182, 212, 0.3)',
                        borderRadius: '24px',
                        padding: '3rem 2rem',
                        position: 'relative',
                        backdropFilter: 'blur(10px)',
                        boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.5)'
                    }}>
                        {/* Badge */}
                        <div style={{
                            position: 'absolute',
                            top: '-15px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                            padding: '0.5rem 1.5rem',
                            borderRadius: '9999px',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '0.9rem',
                            boxShadow: '0 4px 12px rgba(6, 182, 212, 0.4)'
                        }}>
                            7 DIAS GRÁTIS
                        </div>

                        <h3 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'white' }}>
                            Plano Completo
                        </h3>
                        <div style={{
                            fontSize: '3rem',
                            fontWeight: '800',
                            color: '#06b6d4',
                            marginBottom: '0.5rem'
                        }}>
                            R$ 97,00
                            <span style={{ fontSize: '1rem', color: '#94a3b8', fontWeight: 'normal' }}>/mês</span>
                        </div>
                        <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>
                            Acesso ilimitado a todas as funcionalidades
                        </p>

                        <ul style={{
                            textAlign: 'left',
                            marginBottom: '2.5rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem',
                            color: '#cbd5e1'
                        }}>
                            {[
                                'Alunos Ilimitados',
                                'Gestão Financeira Completa',
                                'App do Aluno',
                                'Fichas de Treino Personalizadas',
                                'Avaliações Físicas',
                                'Suporte Prioritário'
                            ].map((item, index) => (
                                <li key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{
                                        background: 'rgba(6, 182, 212, 0.1)',
                                        borderRadius: '50%',
                                        padding: '4px',
                                        color: '#06b6d4'
                                    }}>
                                        <Check size={16} />
                                    </div>
                                    {item}
                                </li>
                            ))}
                        </ul>

                        <a
                            href="https://wa.me/5521982626387?text=Ol%C3%A1%2C%20quero%20aproveitar%20os%207%20dias%20gr%C3%A1tis%20do%20Gym%20Manager"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                ...buttonPrimaryStyle,
                                width: '100%',
                                justifyContent: 'center',
                                padding: '1rem',
                                fontSize: '1.1rem'
                            }}
                        >
                            Começar Teste Grátis
                        </a>
                    </div>
                </div>
            </section>

            {/* Contact Section */}
            <section style={{
                padding: '6rem 2rem',
                background: '#0f172a',
                borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                display: 'flex',
                justifyContent: 'center'
            }}>
                <div style={{
                    width: '100%',
                    maxWidth: '600px',
                    textAlign: 'center'
                }}>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem', color: 'white' }}>
                        Ficou com alguma dúvida?
                    </h2>
                    <p style={{ color: '#94a3b8', marginBottom: '3rem' }}>
                        Preencha o formulário abaixo e entraremos em contato o mais breve possível.
                    </p>

                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            const name = e.target.name.value;
                            const email = e.target.email.value; // Just for visual, or include in body
                            const message = e.target.message.value;

                            const subject = `Contato pelo Site - ${name}`;
                            const body = `Nome: ${name}%0D%0AEmail: ${email}%0D%0A%0D%0AMensagem:%0D%0A${message}`;

                            window.location.href = `mailto:j.17jvictor@gmail.com?subject=${subject}&body=${body}`;
                        }}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1.5rem',
                            textAlign: 'left'
                        }}
                    >
                        <div>
                            <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Seu Nome</label>
                            <input
                                type="text"
                                name="name"
                                required
                                placeholder="Como podemos te chamar?"
                                style={{
                                    width: '100%',
                                    padding: '1rem',
                                    background: 'rgba(30, 41, 59, 0.5)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '12px',
                                    color: 'white',
                                    fontSize: '1rem',
                                    outline: 'none',
                                    transition: 'border-color 0.3s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#06b6d4'}
                                onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Seu E-mail</label>
                            <input
                                type="email"
                                name="email"
                                required
                                placeholder="seu@email.com"
                                style={{
                                    width: '100%',
                                    padding: '1rem',
                                    background: 'rgba(30, 41, 59, 0.5)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '12px',
                                    color: 'white',
                                    fontSize: '1rem',
                                    outline: 'none',
                                    transition: 'border-color 0.3s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#06b6d4'}
                                onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Mensagem</label>
                            <textarea
                                name="message"
                                required
                                rows="4"
                                placeholder="Como podemos ajudar?"
                                style={{
                                    width: '100%',
                                    padding: '1rem',
                                    background: 'rgba(30, 41, 59, 0.5)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '12px',
                                    color: 'white',
                                    fontSize: '1rem',
                                    outline: 'none',
                                    resize: 'vertical',
                                    transition: 'border-color 0.3s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#06b6d4'}
                                onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                            ></textarea>
                        </div>

                        <button
                            type="submit"
                            style={{
                                ...buttonPrimaryStyle,
                                justifyContent: 'center',
                                marginTop: '1rem',
                                fontSize: '1.1rem',
                                padding: '1rem'
                            }}
                        >
                            Enviar Mensagem
                        </button>
                    </form>
                </div>
            </section>

            {/* Footer */}
            <footer style={{
                padding: '4rem 2rem',
                textAlign: 'center',
                color: '#64748b',
                borderTop: '1px solid rgba(255,255,255,0.05)'
            }}>
                <p>&copy; {new Date().getFullYear()} GymManager. Todos os direitos reservados.</p>
                <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', opacity: 0.5 }}>v0.0.2</p>
            </footer>

            {/* Global Responsive Styles */}
            <style>{`
                @media (max-width: 768px) {
                    /* Header Adjustments */
                    header {
                        padding: 1rem !important;
                    }
                    header span {
                        font-size: 1.2rem !important;
                    }
                    header button, header a {
                        padding: 0.5rem 0.75rem !important;
                        font-size: 0.85rem !important;
                    }

                    /* Layout Adjustments */
                    section {
                        padding-left: 1.5rem !important;
                        padding-right: 1.5rem !important;
                    }
                    
                    /* Typography Adjustments */
                    h1 {
                        font-size: 2.2rem !important; /* Smaller for mobile */
                        line-height: 1.2 !important;
                    }
                    h2 {
                        font-size: 1.8rem !important;
                    }
                    p {
                        font-size: 1rem !important;
                    }

                    /* Hero Specifics */
                    .hero-content {
                        padding-top: 6rem !important; /* More space for header */
                    }
                    .hero-image-container {
                        margin-bottom: -30px !important;
                        transform: rotateX(10deg) scale(0.8) !important;
                    }
                    
                    /* Modal Specifics */
                    .modal-content {
                        width: 95% !important;
                        margin: 1rem auto !important;
                        max-height: 90vh !important;
                    }
                    .modal-header {
                        padding: 1.5rem !important;
                    }
                    .modal-body {
                        padding: 1.5rem !important;
                    }
                }
            `}</style>
        </div>
    );
}
