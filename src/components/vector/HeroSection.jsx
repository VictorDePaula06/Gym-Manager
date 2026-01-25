import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FaArrowRight } from 'react-icons/fa';

gsap.registerPlugin(ScrollTrigger);

const HeroSection = () => {
    const heroRef = useRef(null);
    const titleRef = useRef(null);
    const subtitleRef = useRef(null);
    const ctaRef = useRef(null);

    useEffect(() => {
        const tl = gsap.timeline();

        tl.fromTo(titleRef.current,
            { y: 100, opacity: 0 },
            { y: 0, opacity: 1, duration: 1.2, ease: "power4.out", delay: 0.2 }
        )
            .fromTo(subtitleRef.current,
                { y: 50, opacity: 0 },
                { y: 0, opacity: 1, duration: 1, ease: "power3.out" },
                "-=0.8"
            )
            .fromTo(ctaRef.current,
                { y: 30, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.8, ease: "back.out(1.7)" },
                "-=0.6"
            );

        // Parallax effect on scroll
        gsap.to(heroRef.current, {
            scrollTrigger: {
                trigger: heroRef.current,
                start: "top top",
                end: "bottom top",
                scrub: true
            },
            y: 100, // Move down slightly slower than scroll
            opacity: 0.5
        });

    }, []);

    return (
        <section
            ref={heroRef}
            className="relative h-screen flex flex-col items-center justify-center bg-black text-white overflow-hidden"
            style={{
                backgroundImage: 'radial-gradient(circle at 50% 50%, #2a2a2a 0%, #000000 100%)'
            }}
        >
            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-20 pointer-events-none"></div>

            <div className="z-10 text-center px-4 max-w-5xl">
                <h1
                    ref={titleRef}
                    className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-br from-white via-gray-200 to-gray-500"
                    style={{ fontFamily: "'Inter', sans-serif" }} // Ensure a strong font
                >
                    VECTOR
                    <span className="block text-neon-green text-4xl md:text-6xl lg:text-7xl font-bold mt-2" style={{ color: '#ccff00' }}>GYM HUB</span>
                </h1>

                <p
                    ref={subtitleRef}
                    className="text-xl md:text-2xl text-gray-400 mb-10 max-w-2xl mx-auto font-light"
                >
                    A revolução na gestão da sua academia. Performance, design e resultados em um só lugar.
                </p>

                <div ref={ctaRef}>
                    <button className="group relative px-8 py-4 bg-[#ccff00] text-black font-bold text-lg rounded-full overflow-hidden transition-transform hover:scale-105">
                        <span className="relative z-10 flex items-center gap-2">
                            COMEÇAR AGORA <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                        </span>
                        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                    </button>
                </div>
            </div>

            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#ccff00] rounded-full blur-[150px] opacity-10 pointer-events-none"></div>
        </section>
    );
};

export default HeroSection;
