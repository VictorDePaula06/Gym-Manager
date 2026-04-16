import { useState, useEffect } from 'react';
import { X, Timer, ChevronUp, ChevronDown } from 'lucide-react';

export default function RestTimer({ initialDuration = 60, onComplete, onCancel }) {
    const [timeLeft, setTimeLeft] = useState(initialDuration);
    const [duration, setDuration] = useState(initialDuration);
    const [isActive, setIsActive] = useState(true);

    useEffect(() => {
        let interval = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            clearInterval(interval);
            onComplete && onComplete();
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft, onComplete]);

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
        const newTime = Math.max(5, timeLeft + amount);
        setTimeLeft(newTime);
        setDuration(Math.max(newTime, duration));
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 2000,
            background: 'rgba(0,0,0,0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(15px)',
            color: 'white'
        }}>
            <div style={{
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
