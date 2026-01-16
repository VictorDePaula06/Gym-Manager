import { Link } from 'react-router-dom';
import { useGym } from '../context/GymContext';
import { Dumbbell, ChevronRight } from 'lucide-react';

export default function Workouts() {
    const { students } = useGym();

    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <h1>Treinos</h1>
                <p style={{ color: 'var(--text-muted)' }}>Gerencie os planos de treino dos seus alunos.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {students.map(student => (
                    <Link key={student.id} to={`/app/workouts/${student.id}`} style={{ textDecoration: 'none' }}>
                        <div className="glass-panel" style={{
                            padding: '1.5rem',
                            transition: 'transform 0.2s',
                            cursor: 'pointer',
                            ':hover': { transform: 'translateY(-4px)' } // Inline hover pseudo-class doesn't work in React style, handled by CSS usually
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{
                                        padding: '0.75rem',
                                        background: 'rgba(59, 130, 246, 0.1)',
                                        borderRadius: '12px',
                                        color: '#3b82f6'
                                    }}>
                                        <Dumbbell size={24} />
                                    </div>
                                    <div>
                                        <h3 style={{ color: 'var(--text-main)', fontSize: '1.1rem' }}>{student.name}</h3>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                                            {student.workouts ?
                                                `Treinos: ${Object.keys(student.workouts).sort().join(', ')}`
                                                : 'Sem plano de treino'}
                                        </p>
                                    </div>
                                </div>
                                <ChevronRight size={20} color="var(--text-muted)" />
                            </div>
                        </div>
                    </Link>
                ))}
                {students.length === 0 && (
                    <p style={{ color: 'var(--text-muted)' }}>Nenhum aluno encontrado para atribuir treinos.</p>
                )}
            </div>
        </div>
    )
}
