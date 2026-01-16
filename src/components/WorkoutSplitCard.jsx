import React from 'react';
import { ChevronRight, Dumbbell } from 'lucide-react';

const WorkoutSplitCard = ({ split, name, exerciseCount, onClick, active }) => {
    return (
        <div
            onClick={onClick}
            style={{
                background: active ? 'rgba(16, 185, 129, 0.1)' : 'var(--card-bg)',
                border: active ? '1px solid #10b981' : '1px solid var(--border-glass)',
                borderRadius: '16px',
                padding: '1.5rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: '100%',
                position: 'relative',
                overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
                if (!active) {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                }
            }}
            onMouseLeave={(e) => {
                if (!active) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = 'var(--border-glass)';
                }
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{
                    width: '48px', height: '48px',
                    borderRadius: '50%',
                    background: active ? '#10b981' : 'rgba(255,255,255,0.05)',
                    color: active ? 'white' : 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.5rem', fontWeight: 'bold'
                }}>
                    {split}
                </div>
                {active && <div style={{ background: '#10b981', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 'bold' }}>ATIVO</div>}
            </div>

            <div>
                <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem', color: 'var(--text-main)' }}>{name || `Treino ${split}`}</h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Dumbbell size={14} /> {exerciseCount || 0} exercícios
                </p>
            </div>

            <div style={{
                position: 'absolute', right: '-10px', bottom: '-10px',
                opacity: 0.05, transform: 'rotate(-15deg)', pointerEvents: 'none'
            }}>
                <span style={{ fontSize: '8rem', fontWeight: '900' }}>{split}</span>
            </div>
        </div>
    );
};

export default WorkoutSplitCard;
