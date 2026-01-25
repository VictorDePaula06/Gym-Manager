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

    const plans = [
        {
            name: "Starter",
            price: "R$ 97",
            period: "/mês",
            features: ["Até 100 alunos", "Gestão Financeira Básica", "App do Aluno", "Suporte via Email"],
            highlight: false
        },
        {
            name: "Pro",
            price: "R$ 197",
            period: "/mês",
            features: ["Alunos Ilimitados", "Analytics Avançado", "Gestão de Treinos IA", "Suporte Prioritário 24/7", "Automação de Marketing"],
            highlight: true
        },
        {
            name: "Enterprise",
            price: "Sob Consulta",
            period: "",
            features: ["Multifiliais", "API Personalizada", "Gerente de Conta Dedicado", "White Label Total"],
            highlight: false
        }
    ];

    return (
        <section className="py-24 px-4 bg-[#0a0a0a] relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-900 rounded-full blur-[120px] opacity-10 pointer-events-none"></div>

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="mb-20 text-center">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                        Planos Flexíveis
                    </h2>
                    <p className="text-gray-400 text-lg">
                        Escolha a potência ideal para o seu negócio.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                    {plans.map((plan, index) => (
                        <div
                            key={index}
                            ref={el => cardsRef.current[index] = el}
                            className={`relative p-8 rounded-3xl transition-transform duration-300 hover:-translate-y-2
                ${plan.highlight
                                    ? 'bg-[#1a1a1a] border-2 border-[#ccff00] shadow-[0_0_30px_rgba(204,255,0,0.1)]'
                                    : 'bg-[#111] border border-gray-800 hover:border-gray-600'
                                }
              `}
                        >
                            {plan.highlight && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#ccff00] text-black text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider">
                                    Mais Popular
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
                                        <FaCheck className="text-[#ccff00] mt-1 mr-3 flex-shrink-0" size={14} />
                                        <span className="text-sm">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <button className={`w-full py-4 rounded-xl font-bold transition-all duration-300
                ${plan.highlight
                                    ? 'bg-[#ccff00] text-black hover:bg-[#b3e600] hover:shadow-lg'
                                    : 'bg-[#222] text-white hover:bg-[#333]'
                                }
              `}>
                                Começar Agora
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default PricingCards;
