import { useState, useEffect, useRef } from 'react';
import { Timer } from 'lucide-react';

export default function RestTimer({ initialDuration = 60, onComplete, onCancel }) {
    // O fim do descanso é um horário-alvo fixo (não um contador que soma tick
    // a tick) — assim, se a aba ficar em segundo plano e o navegador atrasar
    // ou pausar o setInterval, ao voltar o tempo restante é recalculado
    // corretamente na hora, em vez de continuar "congelado".
    const endTimeRef = useRef(Date.now() + initialDuration * 1000);
    const [timeLeft, setTimeLeft] = useState(initialDuration);
    const [duration, setDuration] = useState(initialDuration);
    const completedRef = useRef(false);

    useEffect(() => {
        const tick = () => {
            const remaining = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000));
            setTimeLeft(remaining);
        };
        tick();
        const interval = setInterval(tick, 250);
        // Corrige na hora assim que a aba volta a ficar visível.
        document.addEventListener('visibilitychange', tick);
        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', tick);
        };
    }, []);

    useEffect(() => {
        if (timeLeft <= 0 && !completedRef.current) {
            completedRef.current = true;
            onComplete && onComplete();
        }
    }, [timeLeft, onComplete]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const progress = ((duration - timeLeft) / duration) * 100;
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    const adjustTime = (amount) => {
        endTimeRef.current += amount * 1000;
        const newTime = Math.max(5, Math.round((endTimeRef.current - Date.now()) / 1000));
        endTimeRef.current = Date.now() + newTime * 1000;
        setTimeLeft(newTime);
        setDuration((prev) => Math.max(newTime, prev));
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 2000,
            background: '#050705',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            color: 'white'
        }}>
            <style>{`
                @keyframes restGlowPulse {
                    0%, 100% { opacity: 0.55; transform: translate(-50%, -50%) scale(1); }
                    50% { opacity: 0.9; transform: translate(-50%, -50%) scale(1.15); }
                }
                @keyframes restGlowPulseSlow {
                    0%, 100% { opacity: 0.25; transform: translate(-50%, -50%) scale(0.9) rotate(0deg); }
                    50% { opacity: 0.5; transform: translate(-50%, -50%) scale(1.05) rotate(20deg); }
                }
                @keyframes restRingRotate {
                    from { transform: translate(-50%, -50%) rotate(0deg); }
                    to { transform: translate(-50%, -50%) rotate(360deg); }
                }
                @keyframes restParticleFloat {
                    0% { transform: translateY(0) translateX(0); opacity: 0; }
                    15% { opacity: 0.7; }
                    85% { opacity: 0.7; }
                    100% { transform: translateY(-90px) translateX(var(--drift, 15px)); opacity: 0; }
                }
            `}</style>

            {/* Fundo animado leve (CSS puro, sem vídeo/imagem) */}
            <div style={{
                position: 'absolute',
                top: '46%', left: '50%',
                width: '560px', height: '560px',
                background: 'radial-gradient(circle, rgba(16,185,129,0.34) 0%, rgba(16,185,129,0) 68%)',
                borderRadius: '50%',
                animation: 'restGlowPulse 4s ease-in-out infinite',
                pointerEvents: 'none'
            }} />
            <div style={{
                position: 'absolute',
                top: '55%', left: '60%',
                width: '420px', height: '420px',
                background: 'radial-gradient(circle, rgba(59,130,246,0.22) 0%, rgba(59,130,246,0) 70%)',
                borderRadius: '50%',
                animation: 'restGlowPulseSlow 7s ease-in-out infinite',
                pointerEvents: 'none'
            }} />
            {/* Anel cônico girando bem devagar atrás do relógio */}
            <div style={{
                position: 'absolute',
                top: '46%', left: '50%',
                width: '340px', height: '340px',
                background: 'conic-gradient(from 0deg, rgba(16,185,129,0) 0%, rgba(16,185,129,0.18) 25%, rgba(16,185,129,0) 50%)',
                borderRadius: '50%',
                animation: 'restRingRotate 14s linear infinite',
                pointerEvents: 'none'
            }} />
            {/* Partículas leves subindo (puro CSS, sem imagens) */}
            {[...Array(10)].map((_, i) => {
                const left = 8 + ((i * 37) % 84);
                const delay = (i * 0.9) % 9;
                const dur = 6 + (i % 4);
                const drift = (i % 2 === 0 ? 1 : -1) * (10 + (i % 3) * 8);
                const size = 3 + (i % 3);
                return (
                    <div key={i} style={{
                        position: 'absolute',
                        bottom: '10%',
                        left: `${left}%`,
                        width: `${size}px`,
                        height: `${size}px`,
                        borderRadius: '50%',
                        background: i % 3 === 0 ? 'rgba(59,130,246,0.6)' : 'rgba(16,185,129,0.6)',
                        filter: 'blur(0.5px)',
                        animation: `restParticleFloat ${dur}s ease-in-out ${delay}s infinite`,
                        '--drift': `${drift}px`,
                        pointerEvents: 'none'
                    }} />
                );
            })}
            <div style={{
                position: 'absolute', inset: 0,
                background: 'radial-gradient(ellipse at center, transparent 0%, rgba(5,7,5,0.6) 75%)',
                pointerEvents: 'none'
            }} />

            <div style={{
                position: 'relative',
                textAlign: 'center',
                width: '100%',
                maxWidth: '400px',
                padding: '2rem'
            }}>
                <div style={{ marginBottom: '2rem' }}>
                    <Timer size={48} className="text-primary" style={{ marginBottom: '1rem' }} />
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Tempo de Descanso</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Recupere o fôlego para a próxima série</p>
                </div>

                {/* Circular Timer */}
                <div style={{ position: 'relative', width: '200px', height: '200px', margin: '0 auto 2rem auto' }}>
                    <svg width="200" height="200" style={{ transform: 'rotate(-90deg)' }}>
                        <circle
                            cx="100" cy="100" r={radius}
                            stroke="rgba(255,255,255,0.1)"
                            strokeWidth="12"
                            fill="transparent"
                        />
                        <circle
                            cx="100" cy="100" r={radius}
                            stroke="var(--primary)"
                            strokeWidth="12"
                            fill="transparent"
                            strokeDasharray={circumference}
                            style={{
                                strokeDashoffset,
                                transition: 'stroke-dashoffset 1s linear',
                                strokeLinecap: 'round'
                            }}
                        />
                    </svg>
                    <div style={{
                        position: 'absolute',
                        top: '50%', left: '50%',
                        transform: 'translate(-50%, -50%)',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '3rem', fontWeight: 'bold', fontFamily: 'monospace' }}>
                            {formatTime(timeLeft)}
                        </div>
                    </div>
                </div>

                {/* Adjustments */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '3rem' }}>
                    <button
                        onClick={() => adjustTime(-15)}
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '0.75rem 1.5rem', color: 'white' }}
                    >
                        -15s
                    </button>
                    <button
                        onClick={() => adjustTime(15)}
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '0.75rem 1.5rem', color: 'white' }}
                    >
                        +15s
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <button
                        onClick={onComplete}
                        className="btn-primary"
                        style={{ width: '100%', padding: '1.25rem', borderRadius: '16px', fontWeight: 'bold', fontSize: '1.1rem' }}
                    >
                        Pular Descanso
                    </button>
                </div>
            </div>
        </div>
    );
}
