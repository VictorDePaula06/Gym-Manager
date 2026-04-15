
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, TrendingUp, Users, Check, ArrowRight, FileText, DollarSign, GraduationCap, X, Plus, ChevronDown, Activity } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import PricingCards from '../components/vector/PricingCards';

gsap.registerPlugin(ScrollTrigger);

export default function LandingPage() {
    const navigate = useNavigate();
    const [activeFeature, setActiveFeature] = useState(null);
    const [openFaq, setOpenFaq] = useState(null);
    const [scrolled, setScrolled] = useState(false);
    const containerRef = useRef(null);

    // Scroll Listener
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

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
            title: 'Seus Alunos',
            shortDesc: 'Controle total de matrículas e avaliações.',
            longDesc: 'Tenha todos os seus alunos na palma da mão. Acompanhe a evolução física com gráficos, fotos comparativas e avaliações detalhadas para mostrar resultados reais.',
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
            shortDesc: 'Controle quem pagou e quem deve.',
            longDesc: 'Diga adeus às cobranças manuais constrangedoras. Saiba exatamente quem pagou, quem está atrasado e tenha uma visão clara do seu faturamento mensal como Personal.',
            icon: DollarSign,
            color: '14, 165, 233', // Sky Blue (Cyan-ish)
            images: [
                { src: '/img/financial-dashboard.png', label: 'Dashboard Financeiro' },
                { src: '/img/financial-student.png', label: 'Histórico de Pagamentos' }
            ]
        },
        {
            id: 'workouts',
            title: 'Prescrição de Treinos',
            shortDesc: 'Fichas personalizadas em segundos.',
            longDesc: 'Monte treinos completos com nossa biblioteca de exercícios ou crie os seus próprios. Envie o treino diretamente para o WhatsApp do aluno ou gere um PDF profissional.',
            icon: Dumbbell,
            color: '249, 115, 22', // Orange
            images: [
                { src: '/img/workouts-grid.png', label: 'Biblioteca de Treinos' },
                { src: '/img/workout-editor.png', label: 'Editor de Fichas' },
                { src: '/img/workouts-main.png', label: 'Visão Geral' }
            ]
        },
        /* REMOVED TEACHERS SECTION FOR PERSONAL TRAINER PIVOT */
        {
            id: 'reports',
            title: 'Relatórios Pro',
            shortDesc: 'Mostre seu valor com dados.',
            longDesc: 'Gere relatórios de evolução para seus alunos e mostre o quanto eles melhoraram com sua consultoria. Dados visuais que ajudam a reter alunos por mais tempo.',
            icon: FileText,
            color: '236, 72, 153', // Pink
            images: [
                { src: '/img/reports-main.png', label: 'Central de Relatórios' },
                { src: '/img/reports-download.png', label: 'Exportação PDF' }
            ]
        },
        {
            id: 'assessments',
            title: 'Avaliação Física',
            shortDesc: 'Monitore a evolução corporal.',
            longDesc: 'Registre dobras cutâneas, perímetros e peso. Gere gráficos automáticos de composição corporal para mostrar ao aluno que o treino está funcionando.',
            icon: Activity,
            color: '139, 92, 246', // Violet (Reusing the color from the removed 'Teachers' card or similar)
            images: [
                { src: '/img/assessments.png', label: 'Avaliações Físicas' },
                { src: '/img/body-map.png', label: 'Mapa Corporal' }
            ]
        },
        {
            id: 'dashboard',
            title: 'Seu Painel',
            shortDesc: 'Seu negócio em uma tela.',
            longDesc: 'Comece o dia sabendo exatamente como está sua consultoria. Alunos ativos, faturamento do mês e aniversariantes do dia em um único lugar.',
            icon: TrendingUp,
            color: '234, 179, 8', // Yellow
            images: [
                { src: '/img/dashboard-hero.png', label: 'Visão Geral' },
                { src: '/img/dashboard-overview.png', label: 'Resumo do Negócio' }
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
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    opacity: scrolled ? 1 : 0, // Hide logo at top to avoid redundancy
                    transform: scrolled ? 'translateY(0)' : 'translateY(-10px)',
                    transition: 'all 0.3s ease',
                    pointerEvents: scrolled ? 'auto' : 'none'
                }}>
                    {/* Small Icon + Text (Only visible on scroll) */}
                    <img src="/logo.png" alt="Vector GymHub" style={{ height: '32px', width: 'auto' }} />
                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold', letterSpacing: '-0.5px', color: 'white' }}>Vector GymHub</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button
                        onClick={() => navigate('/login')}
                        style={{
                            background: 'transparent',
                            color: 'white',
                            border: '1px solid rgba(255,255,255,0.2)',
                            padding: '0.6rem 1.2rem',
                            borderRadius: '99px',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            transition: 'all 0.3s'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.background = 'rgba(255,255,255,0.1)';
                            e.target.style.borderColor = 'white';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = 'transparent';
                            e.target.style.borderColor = 'rgba(255,255,255,0.2)';
                        }}
                    >
                        Login
                    </button>
                    <a
                        href="https://wa.me/5521982626387?text=Ol%C3%A1%21%20Gostaria%20de%20solicitar%20meu%20Teste%20Gr%C3%A1tis%20de%207%20dias%20do%20Vector%20GymHub."
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            ...buttonPrimaryStyle,
                            padding: '0.6rem 1.5rem',
                            fontSize: '0.9rem',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        Teste Grátis (7 Dias)
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
                    zIndex: 1,
                    textAlign: 'center',
                    maxWidth: '800px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '1.5rem'
                }}>
                    {/* Hero Logo (Mobile Focus) - ADDED HERE */}
                    <img
                        src="/LogoTransparente.png"
                        alt="Vector GymHub Logo"
                        style={{
                            width: '550px',
                            maxWidth: '100%',
                            height: 'auto',
                            marginBottom: '-3rem',
                            marginTop: '-4rem',
                            transform: 'scale(1.3)', // Zoom in to ignore transparent borders
                            filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.3))'
                        }}
                    />

                    {/* Badge */}
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

                            <span style={{ color: '#cbd5e1', fontSize: '0.9rem', fontWeight: '500' }}>
                                O App nº 1 para Personal Trainers
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
                        A Plataforma Definitiva para sua <br />
                        <span style={{
                            background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>
                            Consultoria Online
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
                        Abandone as planilhas e o PDF. Tenha controle total dos seus alunos, anamneses e treinos em um app moderno que valoriza seu trabalho.
                    </p>

                    {/* CTA Buttons */}
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <a
                            href="https://wa.me/5521982626387?text=Ol%C3%A1%2C%20quero%20conhecer%20o%20Vector%20GymHub"
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
                                href="https://wa.me/5521982626387?text=Ol%C3%A1%21%20Gostaria%20de%20contratar%20o%20Vector%20GymHub%20para%20minha%20academia."
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

            {/* Mobile Section */}
            <section style={{
                padding: '8rem 2rem',
                background: 'linear-gradient(to right, #0f172a, #1e293b)',
                overflow: 'hidden'
            }}>
                <div style={{
                    maxWidth: '1200px',
                    margin: '0 auto',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '4rem',
                    alignItems: 'center'
                }}>
                    {/* Text Content */}
                    <div style={{ textAlign: 'left' }}>
                        <div style={{
                            display: 'inline-block',
                            padding: '0.5rem 1rem',
                            background: 'rgba(16, 185, 129, 0.1)',
                            color: '#10b981',
                            borderRadius: '99px',
                            fontWeight: 'bold',
                            fontSize: '0.9rem',
                            marginBottom: '1.5rem',
                            border: '1px solid rgba(16, 185, 129, 0.2)'
                        }}>
                            📱 App Completo
                        </div>
                        <h2 style={{
                            fontSize: '3rem',
                            fontWeight: 'bold',
                            color: 'white',
                            lineHeight: '1.1',
                            marginBottom: '1.5rem'
                        }}>
                            Consultoria na <span style={{ color: '#06b6d4' }}>Palma da Mão</span>
                        </h2>
                        <p style={{
                            color: '#94a3b8',
                            fontSize: '1.1rem',
                            lineHeight: '1.6',
                            marginBottom: '2rem'
                        }}>
                            Gerencie seus alunos de qualquer lugar. Monte treinos, verifique pagamentos e responda dúvidas direto pelo seu celular.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {[
                                "Web App ultra rápido: Acesse de qualquer lugar",
                                "Painel do aluno com treinos e avaliações",
                                "Monte treinos completos pelo celular em segundos"
                            ].map((item, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#e2e8f0' }}>
                                    <div style={{
                                        background: 'rgba(6, 182, 212, 0.2)',
                                        borderRadius: '50%',
                                        padding: '4px',
                                        display: 'flex'
                                    }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                    </div>
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Mobile Image - CSS Phone Mockup */}
                    <div style={{
                        position: 'relative',
                        display: 'flex',
                        justifyContent: 'center',
                        perspective: '1000px'
                    }}>
                        {/* Glow Effect */}
                        <div style={{
                            position: 'absolute',
                            width: '300px',
                            height: '500px',
                            background: '#06b6d4',
                            filter: 'blur(120px)',
                            opacity: '0.3',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            borderRadius: '50%',
                            zIndex: 0
                        }}></div>

                        {/* Phone Bezel */}
                        <div style={{
                            position: 'relative',
                            width: '280px',
                            height: '560px',
                            background: '#0f172a',
                            borderRadius: '40px',
                            border: '8px solid #334155',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 0 0 2px #000',
                            overflow: 'hidden',
                            zIndex: 1,
                            transform: 'rotateY(-5deg) rotateX(5deg)',
                            transition: 'transform 0.3s ease'
                        }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'rotateY(0) rotateX(0) scale(1.02)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'rotateY(-5deg) rotateX(5deg)'}
                        >
                            {/* Notch */}
                            <div style={{
                                position: 'absolute',
                                top: '0',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: '120px',
                                height: '25px',
                                background: '#000',
                                borderBottomLeftRadius: '16px',
                                borderBottomRightRadius: '16px',
                                zIndex: 10
                            }}></div>

                            {/* Screen Content - Updating to use Finance Screenshot */}
                            <img
                                src="/img/mobile-dashboard-final.png"
                                alt="Dashboard Financeiro"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                }}
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section className="pricing-section" style={{
                padding: '6rem 2rem',
                background: 'linear-gradient(to bottom, #0f172a, #1e293b)',
                textAlign: 'center'
            }}>
                <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                    <h2 style={{
                        fontSize: '2.5rem',
                        fontWeight: 'bold',
                        marginBottom: '1rem',
                        color: 'white'
                    }}>
                        Escolha seu Plano
                    </h2>
                    <div style={{
                        display: 'inline-block',
                        background: 'rgba(6, 182, 212, 0.1)',
                        color: '#06b6d4',
                        padding: '0.5rem 1rem',
                        borderRadius: '99px',
                        fontSize: '0.9rem',
                        fontWeight: 'bold',
                        marginBottom: '2rem',
                        border: '1px solid rgba(6, 182, 212, 0.2)'
                    }}>
                        ⚡ Teste Grátis por 7 Dias Sem Compromisso
                    </div>
                    <p style={{ color: '#94a3b8', marginBottom: '3rem', fontSize: '1.1rem' }}>
                        Invista na gestão profissional da sua academia. Sem taxas de 'setup', cancele quando quiser.
                    </p>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                        gap: '2rem',
                        alignItems: 'center'
                    }}>
                        {/* Monthly Plan */}
                        <div style={{
                            background: 'rgba(30, 41, 59, 0.4)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '24px',
                            padding: '3rem 2rem',
                            position: 'relative',
                            transition: 'transform 0.3s'
                        }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-10px)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'white' }}>
                                Mensal
                            </h3>
                            <div style={{
                                fontSize: '3.5rem',
                                fontWeight: '800',
                                color: 'white',
                                marginBottom: '0.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem'
                            }}>
                                <span style={{ fontSize: '1.2rem', color: '#94a3b8', fontWeight: 'normal' }}>R$</span>
                                97,00
                                <span style={{ fontSize: '1rem', color: '#94a3b8', fontWeight: 'normal' }}>/mês</span>
                            </div>

                            <ul style={{
                                textAlign: 'left',
                                marginBottom: '2.5rem',
                                marginTop: '2rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1rem',
                                color: '#cbd5e1'
                            }}>
                                {[
                                    'Gestão Ilimitada de Alunos',
                                    'Controle Financeiro Completo',
                                    'Montagem de Treinos Personalizada',
                                    'Acesso para Professores',
                                    'Suporte via WhatsApp'
                                ].map((item, index) => (
                                    <li key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{
                                            background: 'rgba(30, 41, 59, 0.8)',
                                            borderRadius: '50%',
                                            padding: '4px',
                                            color: '#3b82f6'
                                        }}>
                                            <Check size={14} />
                                        </div>
                                        {item}
                                    </li>
                                ))}
                            </ul>

                            <a
                                href="https://wa.me/5521982626387?text=Ol%C3%A1%21%20Tenho%20interesse%20no%20Plano%20Mensal%20(R%24%2097)%20do%20Vector%20GymHub."
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: 'block',
                                    width: '100%',
                                    padding: '1rem',
                                    borderRadius: '12px',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    textDecoration: 'none',
                                    transition: 'background 0.3s'
                                }}
                                onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
                                onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
                            >
                                Falar com Consultor
                            </a>
                            <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#64748b' }}>Pagamento seguro via Stripe</p>
                        </div>

                        {/* Annual Plan (Highlighted) */}
                        <div style={{
                            background: 'rgba(15, 23, 42, 0.8)',
                            border: '2px solid #10b981', // Emerald green border
                            borderRadius: '24px',
                            padding: '3rem 2rem',
                            position: 'relative',
                            boxShadow: '0 20px 40px -10px rgba(16, 185, 129, 0.2)',
                            transform: 'scale(1.05)'
                        }}>
                            {/* Best Value Badge */}
                            <div style={{
                                position: 'absolute',
                                top: '-18px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                background: '#10b981',
                                padding: '0.5rem 1.5rem',
                                borderRadius: '9999px',
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: '0.9rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                whiteSpace: 'nowrap'
                            }}>
                                <span style={{ fontSize: '1.1rem' }}>★</span> MELHOR VALOR
                            </div>

                            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'white' }}>
                                Anual (Oferta)
                            </h3>
                            <div style={{
                                fontSize: '4rem',
                                fontWeight: '800',
                                color: 'white',
                                marginBottom: '0.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem'
                            }}>
                                <span style={{ fontSize: '1.2rem', color: '#94a3b8', fontWeight: 'normal' }}>R$</span>
                                900,00
                                <span style={{ fontSize: '1rem', color: '#94a3b8', fontWeight: 'normal' }}>/ano</span>
                            </div>

                            <div style={{
                                display: 'inline-block',
                                background: 'rgba(16, 185, 129, 0.1)',
                                color: '#10b981',
                                padding: '0.25rem 1rem',
                                borderRadius: '99px',
                                fontSize: '0.9rem',
                                fontWeight: 'bold',
                                marginBottom: '2rem'
                            }}>
                                Economize R$ 264,00
                            </div>

                            <ul style={{
                                textAlign: 'left',
                                marginBottom: '2.5rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1rem',
                                color: '#e2e8f0'
                            }}>
                                <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{
                                        background: 'rgba(16, 185, 129, 0.2)',
                                        borderRadius: '50%',
                                        padding: '4px',
                                        color: '#10b981'
                                    }}>
                                        <Check size={14} />
                                    </div>
                                    <strong>Todo o Pacote Mensal Incluso</strong>
                                </li>
                                {[
                                    '2 Meses de Acesso Grátis',
                                    'Prioridade Máxima no Suporte',
                                    'Consultoria de Setup Inicial'
                                ].map((item, index) => (
                                    <li key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{
                                            background: 'rgba(16, 185, 129, 0.2)',
                                            borderRadius: '50%',
                                            padding: '4px',
                                            color: '#10b981'
                                        }}>
                                            <Check size={14} />
                                        </div>
                                        {item}
                                    </li>
                                ))}
                            </ul>

                            <a
                                href="https://wa.me/5521982626387?text=Ol%C3%A1%21%20Quero%20aproveitar%20a%20oferta%20do%20Plano%20Anual%20(R%24%20900)%20do%20Vector%20GymHub."
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: 'block',
                                    width: '100%',
                                    padding: '1rem',
                                    borderRadius: '12px',
                                    background: '#10b981',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    textDecoration: 'none',
                                    boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.39)',
                                    transition: 'transform 0.2s'
                                }}
                                onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
                                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                            >
                                Falar com Consultor (Oferta)
                            </a>
                            <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#64748b' }}>Pagamento seguro via Stripe</p>
                        </div>
                    </div>
                </div>
            </section >

            {/* Contact Section */}
            < section style={{
                padding: '6rem 2rem',
                background: '#0f172a',
                borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                display: 'flex',
                justifyContent: 'center'
            }
            }>
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
                        action="https://formsubmit.co/j.17jvictor@gmail.com"
                        method="POST"
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1.5rem',
                            textAlign: 'left'
                        }}
                    >
                        {/* Configurações do FormSubmit */}
                        <input type="hidden" name="_subject" value="Novo Lead - Vector GymHub" />
                        <input type="hidden" name="_captcha" value="false" />
                        <input type="hidden" name="_next" value="http://localhost:5173/?success=true" />
                        <input type="hidden" name="_template" value="table" />
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
            </section >

            {/* FAQ Section */}
            <section style={{
                padding: '4rem 2rem',
                maxWidth: '800px',
                margin: '0 auto'
            }}>
                <h2 style={{
                    textAlign: 'center',
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    marginBottom: '3rem',
                    color: 'white'
                }}>
                    Dúvidas Frequentes
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {[
                        {
                            q: "Preciso instalar algum programa no computador?",
                            a: "Não! O Vector GymHub é 100% online (nas nuvens). Você acessa pelo navegador de qualquer computador, tablet ou celular, igual acessa seu e-mail ou banco. Se seu computador estragar, seus dados continuam salvos."
                        },
                        {
                            q: "Funciona em iPhone e Android?",
                            a: "Sim. O sistema é otimizado para celulares e funciona como um aplicativo. Você não precisa baixar nada na loja de aplicativos, basta acessar pelo navegador e adicionar à tela inicial."
                        },
                        {
                            q: "Meus dados estão seguros?",
                            a: "Muito mais seguros do que no papel ou planilha. Usamos criptografia de ponta (a mesma dos bancos) e realizamos backups automáticos diários. Ninguém além de você tem acesso às informações da sua academia."
                        },
                        {
                            q: "Como funciona o suporte?",
                            a: "Nosso suporte é humanizado e rápido. Nada de robôs. Você terá um canal direto no WhatsApp com nosso time de sucesso do cliente para tirar dúvidas e ajudar na configuração inicial."
                        }
                    ].map((faq, index) => (
                        <div
                            key={index}
                            onClick={() => setOpenFaq(openFaq === index ? null : index)}
                            style={{
                                background: 'rgba(30, 41, 59, 0.4)',
                                borderRadius: '12px',
                                border: '1px solid rgba(255, 255, 255, 0.05)',
                                cursor: 'pointer',
                                overflow: 'hidden',
                                transition: 'all 0.3s'
                            }}
                        >
                            <div style={{
                                padding: '1.5rem',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                fontWeight: 'bold',
                                color: openFaq === index ? '#06b6d4' : '#e2e8f0'
                            }}>
                                {faq.q}
                                <ChevronDown
                                    size={20}
                                    style={{
                                        transform: openFaq === index ? 'rotate(180deg)' : 'rotate(0)',
                                        transition: 'transform 0.3s',
                                        color: openFaq === index ? '#06b6d4' : '#64748b'
                                    }}
                                />
                            </div>
                            <div style={{
                                height: openFaq === index ? 'auto' : '0',
                                opacity: openFaq === index ? '1' : '0',
                                overflow: 'hidden',
                                transition: 'all 0.3s'
                            }}>
                                <div style={{
                                    padding: '0 1.5rem 1.5rem 1.5rem',
                                    color: '#94a3b8',
                                    lineHeight: '1.6'
                                }}>
                                    {faq.a}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer */}
            < footer style={{
                padding: '4rem 2rem',
                textAlign: 'center',
                color: '#64748b',
                borderTop: '1px solid rgba(255,255,255,0.05)'
            }}>
                <p>&copy; {new Date().getFullYear()} Vector GymHub. Todos os direitos reservados.</p>
                <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', opacity: 0.5 }}>v0.0.2</p>
            </footer >

            {/* Global Responsive Styles */}
            < style > {`
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
            `}</style >
        </div >
    );
}
