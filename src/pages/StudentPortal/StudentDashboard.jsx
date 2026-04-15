import { useAuth } from '../../context/AuthContext';
import { useGym } from '../../context/GymContext';
import { Dumbbell, Calendar, CreditCard, ChevronRight, TrendingUp, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function StudentDashboard() {
    const { user } = useAuth();
    const { students, settings } = useGym();

    const studentData = students.find(s => s.id === user?.studentId);

    if (!studentData) {
        return (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
                <p style={{ color: 'var(--text-muted)' }}>Sincronizando seus dados...</p>
            </div>
        );
    }

    // Get active workouts count
    const workoutCount = Object.keys(studentData.workoutSheets || {}).length + (Object.keys(studentData.workouts || {}).length > 0 ? 1 : 0);

    return (
        <div style={{ color: 'var(--text-main)' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Olá, {studentData.name.split(' ')[0]}! 👋</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Pronto para o treino de hoje?</p>
            </div>

            {/* Quick Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                <div className="glass-panel" style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', color: 'var(--primary)' }}>
                        <Dumbbell size={20} />
                        <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>TREINOS</span>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{workoutCount}</div>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>Fichas Ativas</p>
                </div>
                <div className="glass-panel" style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', color: '#10b981' }}>
                        <Calendar size={20} />
                        <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>FREQUÊNCIA</span>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{studentData.trainingFrequency || '-'}</div>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>Vezes/Semana</p>
                </div>
            </div>

            {/* Payment Status Bar */}
            {(() => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                let nextPaymentDate = null;
                const targetDay = parseInt(studentData.paymentDay);
                
                // 1. Tentar ler o dado salvo no banco
                if (studentData.nextPaymentDate) {
                    nextPaymentDate = studentData.nextPaymentDate.seconds 
                        ? new Date(studentData.nextPaymentDate.seconds * 1000) 
                        : new Date(studentData.nextPaymentDate);
                }

                // 2. Inteligência Anti-Pulo (Sincronizar com ADM)
                if (!isNaN(targetDay)) {
                    let baseDateString = studentData.lastPaymentDate || studentData.startDate;
                    let baseDate = null;
                    if (baseDateString) {
                        baseDate = baseDateString.seconds 
                            ? new Date(baseDateString.seconds * 1000) 
                            : new Date(baseDateString);
                    }
                    
                    if (baseDate && !isNaN(baseDate.getTime())) {
                        let expectedDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), targetDay);
                        if (expectedDate <= baseDate) {
                            expectedDate.setMonth(expectedDate.getMonth() + 1);
                        }
                        
                        // Prioriza a mensalidade pendente mais antiga
                        if (!nextPaymentDate || expectedDate < nextPaymentDate) {
                            nextPaymentDate = expectedDate;
                        }
                    } else if (!nextPaymentDate) {
                        nextPaymentDate = new Date(today.getFullYear(), today.getMonth(), targetDay);
                    }
                }

                if (nextPaymentDate) nextPaymentDate.setHours(0, 0, 0, 0);
                const isActive = studentData.status?.toLowerCase() === 'active';
                const isOverdue = isActive && nextPaymentDate && nextPaymentDate < today;
                const statusColor = isOverdue ? '#ef4444' : isActive ? '#10b981' : '#f59e0b';

                return (
                    <div className="glass-panel" style={{ 
                        padding: '1.25rem', 
                        marginBottom: '2rem', 
                        borderLeft: `4px solid ${statusColor}`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem'
                    }}>
                        {/* Header Row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <CreditCard size={20} style={{ color: statusColor }} />
                                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-main)' }}>Status da Mensalidade</span>
                            </div>
                            {isOverdue && (
                                <span style={{ 
                                    padding: '0.2rem 0.6rem', 
                                    background: 'rgba(239, 68, 68, 0.1)', 
                                    color: '#ef4444', 
                                    borderRadius: '6px', 
                                    fontSize: '0.65rem', 
                                    fontWeight: '900',
                                    letterSpacing: '0.05em'
                                }}>PENDENTE</span>
                            )}
                        </div>

                        {/* Status Message */}
                        <div>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: isOverdue ? 'var(--text-main)' : 'var(--text-muted)' }}>
                                {isOverdue 
                                    ? `Atraso detectado desde ${nextPaymentDate.toLocaleDateString('pt-BR')}.` 
                                    : isActive 
                                        ? 'Tudo certo com seu plano! Treino liberado.' 
                                        : 'Sua assinatura não está ativa no momento.'}
                            </p>
                        </div>

                        {/* WhatsApp Action Button */}
                        {isOverdue && settings.whatsapp && (
                            <a 
                                href={`https://wa.me/${settings.whatsapp.replace(/\D/g, '')}?text=Olá,%20gostaria%20de%20falar%20sobre%20minha%20mensalidade.`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    padding: '0.65rem',
                                    background: '#25d366',
                                    color: '#fff',
                                    borderRadius: '10px',
                                    fontSize: '0.75rem',
                                    fontWeight: 'bold',
                                    textDecoration: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    boxShadow: '0 4px 12px rgba(37, 211, 102, 0.2)',
                                    marginTop: '0.25rem'
                                }}
                            >
                                <MessageCircle size={16} />
                                FALAR COM A EQUIPE
                            </a>
                        )}

                        {isActive && !isOverdue && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>
                                <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 'bold' }}>SISTEMA REGULARIZADO</span>
                            </div>
                        )}
                    </div>
                );
            })()}

            {/* Next Workout Card */}
            <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Último Treino Adicionado</h3>
                    <Link to="/student/workouts" style={{ color: 'var(--primary)', fontSize: '0.85rem', textDecoration: 'none' }}>Ver todos</Link>
                </div>
                <Link to="/student/workouts" style={{ textDecoration: 'none' }}>
                    <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <p style={{ margin: '0 0 0.5rem 0', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Treino atual</p>
                            <h4 style={{ margin: 0, fontSize: '1.25rem', color: 'white' }}>Acesse sua ficha completa</h4>
                            <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Clique para ver os exercícios e vídeos</p>
                        </div>
                        <ChevronRight color="var(--text-muted)" />
                    </div>
                </Link>
            </div>

            {/* Assessment Progress Preview */}
            <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Seu Progresso</h3>
                <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
                    <TrendingUp size={32} style={{ color: 'var(--text-muted)', marginBottom: '1rem', opacity: 0.5 }} />
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Acompanhe suas medidas e fotos de evolução na aba de Evolução.</p>
                    <Link to="/student/assessments" style={{ 
                        display: 'inline-block', 
                        marginTop: '1rem', 
                        padding: '0.5rem 1.5rem', 
                        background: 'var(--border-glass)', 
                        borderRadius: '8px', 
                        color: 'white', 
                        textDecoration: 'none',
                        fontSize: '0.9rem'
                    }}>
                        Ver Evolução
                    </Link>
                </div>
            </div>
        </div>
    );
}
