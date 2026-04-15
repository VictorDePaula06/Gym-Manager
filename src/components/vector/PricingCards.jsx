import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FaCheck } from 'react-icons/fa';

gsap.registerPlugin(ScrollTrigger);

const PricingCards = () => {
    const cardsRef = useRef([]);

    useEffect(() => {
        cardsRef.current.forEach((card, index) => {
            gsap.fromTo(card,
                { opacity: 0, y: 50 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.8,
                    delay: index * 0.2, // Stagger effect
                    scrollTrigger: {
                        trigger: card,
                        start: "top 85%",
                        toggleActions: "play none none reverse"
                    }
                }
            );
        });
    }, []);

    const whatsappLink = "https://wa.me/5521982626387?text=Ol%C3%A1%21%20Gostaria%20de%20assinar%20o%20Vector%20GymHub%20para%20Personal%20Trainers.";

    const plans = [
        {
            name: "Mensal",
            price: "R$ 97,00",
            period: "/mês",
            features: [
                "Gestão Ilimitada de Alunos",
                "Controle Financeiro Completo",
                "App do Aluno (Área do Cliente)",
                "Montagem de Treinos",
                "Avaliação Física e Fotos",
                "Suporte via WhatsApp"
            ],
            highlight: false,
            buttonText: "Começar Agora"
        },
        {
            name: "Anual (Oferta)",
            price: "R$ 900,00",
            period: "/ano",
            features: [
                "Tudo do Plano Mensal",
                "Desconto de 2 meses (R$ 264 OFF)",
                "Prioridade no Suporte",
                "Consultoria de Setup Inicial",
                "Selo de Personal Verificado"
            ],
            highlight: true,
            buttonText: "Aproveitar Oferta"
        }
    ];

    return (
        <section className="pricing-section py-24 px-4 bg-[#0a0a0a] relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-900 rounded-full blur-[120px] opacity-10 pointer-events-none"></div>

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="mb-20 text-center">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                        Planos Simples
                    </h2>
                    <p className="text-gray-400 text-lg">
                        Comece grátis por 7 dias. Cancele quando quiser.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center max-w-4xl mx-auto">
                    {plans.map((plan, index) => (
                        <div
                            key={index}
                            ref={el => cardsRef.current[index] = el}
                            className={`pricing-card relative p-8 rounded-3xl transition-transform duration-300 hover:-translate-y-2
                ${plan.highlight
                                    ? 'bg-[#1a1a1a] border-2 border-[#06b6d4] shadow-[0_0_30px_rgba(6,182,212,0.2)]'
                                    : 'bg-[#111] border border-gray-800 hover:border-gray-600'
                                }
              `}
                        >
                            {plan.highlight && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#06b6d4] text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider">
                                    Melhor Valor
                                </div>
                            )}

                            <h3 className={`text-xl font-bold mb-2 ${plan.highlight ? 'text-white' : 'text-gray-300'}`}>
                                {plan.name}
                            </h3>
                            <div className="flex items-baseline mb-8">
                                <span className="text-4xl font-black text-white">{plan.price}</span>
                                <span className="text-gray-500 ml-2">{plan.period}</span>
                            </div>

                            <ul className="space-y-4 mb-8">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-start text-gray-400">
                                        <FaCheck className={`mt-1 mr-3 flex-shrink-0 ${plan.highlight ? 'text-[#06b6d4]' : 'text-gray-500'}`} size={14} />
                                        <span className="text-sm">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <a
                                href={whatsappLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`w-full py-4 rounded-xl font-bold transition-all duration-300 block text-center
                ${plan.highlight
                                        ? 'bg-[#06b6d4] text-white hover:bg-[#0891b2] hover:shadow-lg'
                                        : 'bg-[#222] text-white hover:bg-[#333]'
                                    }
              `}>
                                {plan.buttonText}
                            </a>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default PricingCards;
