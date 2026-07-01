import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useGym } from '../context/GymContext';
import { Dumbbell, ChevronRight, Search } from 'lucide-react';

const getPlanInfo = (student) => {
    if (student.workoutSheets && Object.keys(student.workoutSheets).length > 0) {
        const sheets = Object.values(student.workoutSheets);
        const count = sheets.length;
        const last = [...sheets].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0];
        return { hasPlan: true, label: `${count} ficha${count > 1 ? 's' : ''} · ${last?.name || 'Ficha'}` };
    }
    if (student.workouts && Object.keys(student.workouts).length > 0) {
        return { hasPlan: true, label: 'Ficha ativa' };
    }
    return { hasPlan: false, label: 'Sem plano de treino' };
};

export default function Workouts() {
    const { students } = useGym();
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all'); // all | with | without

    const withoutCount = useMemo(
        () => students.filter(s => !getPlanInfo(s).hasPlan).length,
        [students]
    );

    const list = useMemo(() => {
        const q = search.trim().toLowerCase();
        return students
            .map(s => ({ student: s, plan: getPlanInfo(s) }))
            .filter(x => {
                if (q && !(x.student.name || '').toLowerCase().includes(q)) return false;
                if (filter === 'with') return x.plan.hasPlan;
                if (filter === 'without') return !x.plan.hasPlan;
                return true;
            })
            // Sem plano primeiro (é o que precisa de ação), depois em ordem alfabética.
            .sort((a, b) => {
                if (a.plan.hasPlan !== b.plan.hasPlan) return a.plan.hasPlan ? 1 : -1;
                return (a.student.name || '').localeCompare(b.student.name || '');
            });
    }, [students, search, filter]);

    const chip = (key, label) => (
        <button
            onClick={() => setFilter(key)}
            style={{
                padding: '0.5rem 1rem',
                borderRadius: '20px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: filter === key ? 600 : 400,
                background: filter === key ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                color: filter === key ? '#fff' : 'var(--text-muted)',
                whiteSpace: 'nowrap',
            }}
        >
            {label}
        </button>
    );

    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <h1>Treinos</h1>
                <p style={{ color: 'var(--text-muted)' }}>Gerencie os planos de treino dos seus alunos.</p>
            </div>

            {/* Busca */}
            <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
                <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar aluno pelo nome..."
                    style={{
                        width: '100%', padding: '0.85rem 0.85rem 0.85rem 2.75rem',
                        background: 'var(--card-bg)', border: '1px solid var(--border-glass)',
                        borderRadius: '12px', color: 'var(--text-main)', fontSize: '0.95rem', outline: 'none',
                    }}
                />
            </div>

            {/* Filtros */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                {chip('all', 'Todos')}
                {chip('with', 'Com plano')}
                {chip('without', `Sem plano${withoutCount > 0 ? ` (${withoutCount})` : ''}`)}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {list.map(({ student, plan }) => (
                    <Link key={student.id} to={`/app/students/${student.id}`} state={{ activeTab: 'workouts' }} style={{ textDecoration: 'none' }}>
                        <div
                            className="glass-panel"
                            style={{
                                padding: '1.5rem',
                                cursor: 'pointer',
                                transition: 'transform 0.2s, border-color 0.2s',
                                borderLeft: `3px solid ${plan.hasPlan ? 'var(--primary)' : '#f59e0b'}`,
                            }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
                                    <div style={{
                                        padding: '0.75rem',
                                        background: plan.hasPlan ? 'rgba(59, 130, 246, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                                        borderRadius: '12px',
                                        color: plan.hasPlan ? '#3b82f6' : '#f59e0b',
                                        flexShrink: 0,
                                    }}>
                                        <Dumbbell size={24} />
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                        <h3 style={{ color: 'var(--text-main)', fontSize: '1.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{student.name}</h3>
                                        <p style={{
                                            fontSize: '0.85rem', marginTop: '0.25rem',
                                            color: plan.hasPlan ? 'var(--primary)' : '#f59e0b',
                                            fontWeight: plan.hasPlan ? 400 : 600,
                                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                        }}>
                                            {plan.label}
                                        </p>
                                    </div>
                                </div>
                                {plan.hasPlan
                                    ? <ChevronRight size={20} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                                    : <span style={{ flexShrink: 0, fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.12)', padding: '0.25rem 0.6rem', borderRadius: '8px' }}>Criar</span>}
                            </div>
                        </div>
                    </Link>
                ))}
                {list.length === 0 && (
                    <p style={{ color: 'var(--text-muted)' }}>
                        {students.length === 0 ? 'Nenhum aluno encontrado para atribuir treinos.' : 'Nenhum aluno encontrado com esse filtro.'}
                    </p>
                )}
            </div>
        </div>
    );
}
