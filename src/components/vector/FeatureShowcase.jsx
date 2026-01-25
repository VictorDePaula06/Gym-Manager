import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FaDumbbell, FaChartLine, FaMobileAlt, FaUsers } from 'react-icons/fa';

gsap.registerPlugin(ScrollTrigger);

const features = [
    {
        icon: <FaDumbbell />,
        title: "Treinos Inteligentes",
        description: "Algoritmos que adaptam as cargas e séries para cada aluno.",
        color: "from-blue-500 to-cyan-400"
    },
    {
        icon: <FaChartLine />,
        title: "Analytics em Tempo Real",
        description: "Visualize o crescimento da sua academia com dashboards precisos.",
        color: "from-purple-500 to-pink-500"
    },
    {
        icon: <FaMobileAlt />,
        title: "App Nativo",
        description: "Seus alunos conectados 24/7 com sua academia no bolso.",
        color: "from-green-400 to-emerald-600"
    },
    {
        icon: <FaUsers />,
        title: "Gestão de Comunidade",
        description: "Ferramentas para engajar e reter seus alunos por mais tempo.",
        color: "from-orange-400 to-red-500"
    }
];

const FeatureShowcase = () => {
    const containerRef = useRef(null);
    const cardsRef = useRef([]);

    useEffect(() => {
        const cards = cardsRef.current;

        // Horizontal scroll capability for larger screens or specialized reveal
        // For this design, let's do a staggered reveal on scroll

        cards.forEach((card, index) => {
            gsap.fromTo(card,
                {
                    opacity: 0,
                    y: 450,
                },
                {
                    opacity: 1,
                    y: 0,
                    duration: 1.5,
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: card,
                        start: "top 95%", // Start animation when card is near bottom of viewport
                        end: "top 40%",
                        scrub: 1, // Smoothly link animation to scrollbar
                    }
                }
            );
        });

    }, []);

    return (
        <section ref={containerRef} className="py-24 px-4 bg-black relative z-10">
            <div className="max-w-7xl mx-auto">
                <div className="mb-20 text-center">
                    <h2 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500 mb-6">
                        Por que escolher a <span className="text-[#ccff00]">Vector?</span>
                    </h2>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                        Tecnologia de ponta para transformar a gestão do seu negócio fitness.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            ref={el => cardsRef.current[index] = el}
                            className="group relative p-8 rounded-3xl bg-[#111] border border-gray-800 hover:border-gray-600 transition-colors overflow-hidden"
                        >
                            {/* Hover Clean Gradient */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>

                            <div className="relative z-10">
                                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-3xl text-white mb-6 shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                                    {feature.icon}
                                </div>

                                <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-[#ccff00] transition-colors">
                                    {feature.title}
                                </h3>

                                <p className="text-gray-400 leading-relaxed font-light">
                                    {feature.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FeatureShowcase;
