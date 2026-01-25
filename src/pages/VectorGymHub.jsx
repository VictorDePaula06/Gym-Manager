import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import SmoothScrollWrapper from '../components/vector/SmoothScrollWrapper';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
    Dumbbell, TrendingUp, Users, Check, ArrowRight, FileText,
    DollarSign, GraduationCap, X, Plus
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';

gsap.registerPlugin(ScrollTrigger);

const VectorGymHub = () => {
    const navigate = useNavigate();
    const [activeFeature, setActiveFeature] = useState(null);
    const containerRef = useRef(null);
    const heroRef = useRef(null);
    const cardsRef = useRef([]);

    // Set dark mode
    useEffect(() => {
        document.documentElement.classList.add('dark');

        // GSAP Animations
        const ctx = gsap.context(() => {
            // Hero Animation
            gsap.fromTo('.hero-content > *',
                { y: 50, opacity: 0 },
                { y: 0, opacity: 1, duration: 1, stagger: 0.2, ease: "power3.out", delay: 0.5 }
            );

            // Cards Animation
            cardsRef.current.forEach((card, index) => {
                if (card) {
                    gsap.fromTo(card,
                        { y: 100, opacity: 0 },
                        {
                            y: 0,
                            opacity: 1,
                            duration: 0.8,
                            ease: "power3.out",
                            scrollTrigger: {
                                trigger: card,
                                start: "top 90%",
                                toggleActions: "play none none reverse"
                            }
                        }
                    );
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
            color: '14, 165, 233', // Sky Blue
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

    const whatsappLink = "https://wa.me/5521982626387?text=Ol%C3%A1%2C%20gostaria%20de%20uma%20demonstra%C3%A7%C3%A3o%20do%20Gym%20Manager";

    return (
        <SmoothScrollWrapper>
            <div ref={containerRef} className="min-h-screen bg-[#0f172a] text-[#f8fafc] font-sans selection:bg-[#ccff00] selection:text-black overflow-x-hidden">

                {/* Header */}
                <header className="fixed top-0 w-full z-40 bg-[#0f172a]/80 backdrop-blur-md border-b border-white/5 px-8 py-6 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#06b6d4] to-[#3b82f6]"></div>
                        <span className="text-2xl font-bold tracking-tight">Vector GymHub</span>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={() => navigate('/login')}
                            className="text-[#94a3b8] hover:text-white transition-colors"
                        >
                            Login
                        </button>
                        <a
                            href={whatsappLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-[#ccff00] hover:bg-[#bbe600] text-black font-bold py-2 px-6 rounded-full transition-transform hover:scale-105 flex items-center gap-2"
                        >
                            <FaWhatsapp />
                            Demonstração
                        </a>
                    </div>
                </header>

                {/* Hero Section */}
                <section ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center pt-32 pb-16 px-6 bg-[radial-gradient(circle_at_50%_-20%,_#1e293b_0%,_#0f172a_100%)]">
                    {/* Background Glow */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[60%] bg-[radial-gradient(circle,_rgba(6,182,212,0.15)_0%,_rgba(0,0,0,0)_70%)] pointer-events-none"></div>

                    <div className="hero-content relative z-10 text-center max-w-4xl mb-16">
                        <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 px-6 py-3 rounded-full backdrop-blur-md mb-8">
                            <img src="/logo.png" alt="" className="h-6" />
                            <span className="text-gray-300 font-medium text-sm">O sistema nº 1 para sua academia</span>
                        </div>

                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">
                            A Evolução da sua <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-br from-[#06b6d4] to-[#3b82f6]">
                                Gestão Fitness
                            </span>
                        </h1>

                        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-12 font-light">
                            Abandone as planilhas. Tenha controle total de alunos, financeiro e treinos em uma plataforma moderna e intuitiva.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <a
                                href={whatsappLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-[#ccff00] text-black font-bold py-4 px-8 rounded-full text-lg shadow-[0_0_30px_rgba(204,255,0,0.3)] hover:shadow-[0_0_50px_rgba(204,255,0,0.5)] transition-all hover:-translate-y-1 flex items-center justify-center gap-2"
                            >
                                Começar Agora <ArrowRight size={20} />
                            </a>
                            <button
                                onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
                                className="bg-white/5 border border-white/10 text-white font-bold py-4 px-8 rounded-full text-lg hover:bg-white/10 transition-colors"
                            >
                                Ver Recursos
                            </button>
                        </div>
                    </div>

                    {/* 3D Image Container */}
                    <div className="relative z-[5] w-full max-w-5xl perspective-[2000px] -mb-24">
                        <div className="transform rotate-x-[20deg] scale-90 animate-[float_6s_ease-in-out_infinite] rounded-3xl bg-[#1e293b] p-3 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border border-white/10">
                            <img
                                src="/img/dashboard-hero.png"
                                alt="Dashboard"
                                className="w-full h-auto rounded-2xl shadow-2xl block"
                            />
                            {/* Reflection */}
                            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-3xl pointer-events-none"></div>
                        </div>
                    </div>
                </section>

                {/* Features Grid */}
                <section id="features" className="py-24 px-6 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <div
                            key={feature.id}
                            ref={el => cardsRef.current[index] = el}
                            onClick={() => setActiveFeature(feature)}
                            className="group relative bg-[#1e293b]/40 border border-[#06b6d4]/20 rounded-2xl p-8 cursor-pointer overflow-hidden hover:border-[rgb(var(--feature-color))] transition-all duration-300 hover:-translate-y-2"
                            style={{ '--feature-color': feature.color }}
                        >
                            <div className="relative z-10 h-full flex flex-col justify-between min-h-[280px]">
                                <div>
                                    <h3 className="text-xl font-bold mb-4 uppercase tracking-wider group-hover:text-[#ccff00] transition-colors">{feature.title}</h3>
                                    <p className="text-gray-400 group-hover:text-gray-300">{feature.shortDesc}</p>
                                </div>
                                <div className="flex justify-end mt-8">
                                    <div
                                        className="w-10 h-10 rounded-full border border-[rgb(var(--feature-color))] flex items-center justify-center text-[rgb(var(--feature-color))]"
                                        style={{ color: `rgb(${feature.color})`, borderColor: `rgb(${feature.color})` }}
                                    >
                                        <Plus size={24} />
                                    </div>
                                </div>
                            </div>
                            {/* Hover Glow */}
                            <div className="absolute inset-0 bg-gradient-to-br from-[rgb(var(--feature-color))] to-transparent opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none" style={{ background: `linear-gradient(135deg, rgba(${feature.color}, 0.1) 0%, transparent 100%)` }}></div>
                        </div>
                    ))}
                </section>

                {/* Pricing */}
                <section className="py-24 px-6 bg-gradient-to-b from-[#0f172a] to-[#1e293b] text-center">
                    <div className="max-w-2xl mx-auto">
                        <h2 className="text-4xl font-bold mb-4 text-white">Comece sua transformação hoje</h2>
                        <p className="text-gray-400 mb-12 text-lg">Tudo o que você precisa para gerenciar sua academia em um único lugar.</p>

                        <div className="bg-[#1e293b]/60 border border-[#06b6d4]/30 rounded-3xl p-12 relative backdrop-blur-md shadow-2xl">
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#06b6d4] to-[#3b82f6] text-white font-bold px-6 py-2 rounded-full text-sm shadow-lg">
                                7 DIAS GRÁTIS
                            </div>

                            <h3 className="text-3xl font-bold mb-2 text-white">Plano Completo</h3>
                            <div className="text-6xl font-extrabold text-[#06b6d4] mb-2">
                                R$ 97,00
                                <span className="text-lg text-gray-400 font-normal ml-2">/mês</span>
                            </div>
                            <p className="text-gray-400 mb-8">Acesso ilimitado a todas as funcionalidades</p>

                            <ul className="text-left space-y-4 mb-10 text-gray-300 max-w-sm mx-auto">
                                {[
                                    'Alunos Ilimitados',
                                    'Gestão Financeira Completa',
                                    'App do Aluno',
                                    'Fichas de Treino Personalizadas',
                                    'Avaliações Físicas',
                                    'Suporte Prioritário'
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3">
                                        <div className="bg-[#06b6d4]/10 rounded-full p-1 text-[#06b6d4]">
                                            <Check size={16} />
                                        </div>
                                        {item}
                                    </li>
                                ))}
                            </ul>

                            <a
                                href={whatsappLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full bg-gradient-to-r from-[#06b6d4] to-[#0891b2] text-white font-bold py-4 rounded-xl text-lg hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all transform hover:-translate-y-1"
                            >
                                Começar Teste Grátis
                            </a>
                        </div>
                    </div>
                </section>

                {/* Contact */}
                <section className="py-24 px-6 bg-[#0f172a] border-t border-white/5 flex justify-center">
                    <div className="w-full max-w-xl text-center">
                        <h2 className="text-4xl font-bold mb-4 text-white">Ficou com alguma dúvida?</h2>
                        <p className="text-gray-400 mb-12">Preencha o formulário abaixo e entraremos em contato.</p>

                        <form className="space-y-6 text-left">
                            <div>
                                <label className="block text-gray-300 mb-2 text-sm">Seu Nome</label>
                                <input type="text" placeholder="Como podemos te chamar?" className="w-full p-4 bg-[#1e293b]/50 border border-white/10 rounded-xl text-white focus:border-[#06b6d4] outline-none transition-colors" />
                            </div>
                            <div>
                                <label className="block text-gray-300 mb-2 text-sm">Seu E-mail</label>
                                <input type="email" placeholder="seu@email.com" className="w-full p-4 bg-[#1e293b]/50 border border-white/10 rounded-xl text-white focus:border-[#06b6d4] outline-none transition-colors" />
                            </div>
                            <div>
                                <label className="block text-gray-300 mb-2 text-sm">Mensagem</label>
                                <textarea rows="4" placeholder="Como podemos ajudar?" className="w-full p-4 bg-[#1e293b]/50 border border-white/10 rounded-xl text-white focus:border-[#06b6d4] outline-none transition-colors resize-none"></textarea>
                            </div>
                            <button type="submit" className="w-full bg-gradient-to-r from-[#06b6d4] to-[#0891b2] text-white font-bold py-4 rounded-xl text-lg hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all">
                                Enviar Mensagem
                            </button>
                        </form>
                    </div>
                </section>

                {/* Footer */}
                <footer className="py-8 text-center text-gray-600 text-sm border-t border-white/5">
                    <p>&copy; {new Date().getFullYear()} Vector GymHub. Todos os direitos reservados.</p>
                </footer>

                {/* Modal Overlay */}
                {activeFeature && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                        onClick={() => setActiveFeature(null)}
                    >
                        <div
                            className="bg-[#1e293b] rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-y-auto border border-white/10 shadow-2xl relative animate-in fade-in zoom-in duration-300"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-8 border-b border-white/10 flex justify-between items-start sticky top-0 bg-[#1e293b] z-20">
                                <div className="flex gap-6 items-center">
                                    <div
                                        className="p-4 rounded-2xl"
                                        style={{ background: `rgba(${activeFeature.color}, 0.1)`, color: `rgb(${activeFeature.color})` }}
                                    >
                                        <activeFeature.icon size={32} />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-bold text-white">{activeFeature.title}</h2>
                                        <p className="text-gray-400 mt-1">{activeFeature.longDesc}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setActiveFeature(null)}
                                    className="text-gray-500 hover:text-white transition-colors"
                                >
                                    <X size={32} />
                                </button>
                            </div>

                            <div className="p-8 bg-[#0f172a] grid grid-cols-1 md:grid-cols-2 gap-8">
                                {activeFeature.images.map((img, index) => (
                                    <div key={index} className="space-y-4">
                                        <div className="rounded-2xl overflow-hidden border border-white/10 shadow-lg group">
                                            <img
                                                src={img.src}
                                                alt={img.label}
                                                className="w-full h-auto transform group-hover:scale-105 transition-transform duration-500"
                                            />
                                        </div>
                                        <p className="text-center text-gray-400 font-medium">{img.label}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="p-6 border-t border-white/10 flex justify-end gap-4 bg-[#1e293b] sticky bottom-0 z-20">
                                <button
                                    onClick={() => setActiveFeature(null)}
                                    className="px-6 py-3 rounded-lg border border-white/10 text-white hover:bg-white/5 transition-colors"
                                >
                                    Fechar
                                </button>
                                <a
                                    href={whatsappLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-[#ccff00] text-black font-bold px-6 py-3 rounded-lg hover:bg-[#bbe600] transition-colors"
                                >
                                    Quero Contratar
                                </a>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </SmoothScrollWrapper>
    );
};

export default VectorGymHub;
