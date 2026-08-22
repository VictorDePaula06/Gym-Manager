import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useGym } from '../../context/GymContext';
import { Dumbbell, Calendar, CreditCard, ChevronRight, TrendingUp, MessageCircle, CheckCircle2, Weight, User, Camera, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { db, storage } from '../../firebase';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { compressImage } from '../../utils/imageOptimizer';
import { getPaymentStatus } from '../../utils/payments';
import CheckinCard from './CheckinCard';

export default function StudentDashboard() {
    const { user } = useAuth();
    const { students, settings, updateStudentProfilePicture } = useGym();
    const [weeklyLogs, setWeeklyLogs] = useState([]);
    const [allLogs, setAllLogs] = useState([]);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const photoInputRef = useRef(null);

    const studentData = students.find(s => s.id === user?.studentId);

    // Fetch Training Logs for Current Week
    useEffect(() => {
        if (!user?.studentId || !user?.tenantId) return;

        const tenantId = user.tenantId;
        const studentId = user.studentId;
        
        // Calculate start of current week (Monday)
        const now = new Date();
        const firstDayOfWeek = new Date(now);
        const day = now.getDay(); // 0 is Sunday, 1 is Monday
        const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when today is Sunday
        firstDayOfWeek.setDate(diff);
        firstDayOfWeek.setHours(0, 0, 0, 0);

        const logsRef = collection(db, `users/${tenantId}/students/${studentId}/training_logs`);
        const q = query(
            logsRef, 
            where('completedAt', '>=', firstDayOfWeek.toISOString()),
            orderBy('completedAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const logs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setWeeklyLogs(logs);
        });

        return () => unsubscribe();
    }, [user]);

    // Histórico completo — usado pra calcular sequência de semanas treinando
    // e o lembrete de "faz tempo que você não treina".
    useEffect(() => {
        if (!user?.studentId || !user?.tenantId) return;
        const logsRef = collection(db, `users/${user.tenantId}/students/${user.studentId}/training_logs`);
        const q = query(logsRef, orderBy('completedAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setAllLogs(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsubscribe();
    }, [user]);

    // Segunda-feira da semana de uma data (chave estável pra agrupar por semana)
    const mondayKey = (date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d.getFullYear(), d.getMonth(), diff);
        return monday.toISOString().slice(0, 10);
    };

    // Sequência de semanas consecutivas com pelo menos 1 treino (não conta a
    // semana atual como "quebra" se ela ainda não acabou e só não treinou ainda).
    const weekStreak = (() => {
        if (allLogs.length === 0) return 0;
        const trainedWeeks = new Set(allLogs.map(l => mondayKey(l.completedAt || l.timestamp)));
        const today = new Date();
        let cursor = new Date(mondayKey(today));
        if (!trainedWeeks.has(mondayKey(today))) {
            cursor.setDate(cursor.getDate() - 7); // semana atual em aberto, começa da anterior
        }
        let streak = 0;
        while (trainedWeeks.has(mondayKey(cursor))) {
            streak++;
            cursor.setDate(cursor.getDate() - 7);
        }
        return streak;
    })();

    // Lembrete: dias desde o último treino vs. meta de frequência semanal do aluno.
    const trainingReminder = (() => {
        if (allLogs.length === 0) return null;
        const lastLog = allLogs[0];
        const lastDate = new Date(lastLog.completedAt || lastLog.timestamp);
        const daysSince = Math.floor((Date.now() - lastDate.getTime()) / 86400000);

        const targetPerWeek = parseInt(studentData?.trainingFrequency) || 3;
        const expectedGapDays = Math.max(1, Math.floor(7 / targetPerWeek));
        // Um dia de folga além do esperado antes de avisar.
        if (daysSince > expectedGapDays + 1) {
            return { daysSince };
        }
        return null;
    })();

    const handlePhotoChange = async (e) => {
        const file = e.target.files[0];
        e.target.value = '';
        if (!file || !studentData) return;

        setUploadingPhoto(true);
        try {
            let toUpload = file;
            try {
                const blob = await compressImage(file, 800, 0.8);
                toUpload = new File([blob], file.name, { type: 'image/jpeg' });
            } catch (err) {
                console.warn('Compressão falhou, usando original', err);
            }
            const photoRef = ref(storage, `students/${studentData.id}_${Date.now()}_${toUpload.name}`);
            await uploadBytes(photoRef, toUpload);
            const url = await getDownloadURL(photoRef);
            await updateStudentProfilePicture(studentData.id, url);
        } catch (err) {
            console.error('Erro ao trocar foto de perfil:', err);
        } finally {
            setUploadingPhoto(false);
        }
    };

    if (!studentData) {
        return (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
                <p style={{ color: 'var(--text-muted)' }}>Sincronizando seus dados...</p>
            </div>
        );
    }

    // Get training days for current week
    const weekDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    const trainingDaysMap = weeklyLogs.reduce((acc, log) => {
        const date = new Date(log.completedAt);
        const dayIndex = date.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
        // Map 0 -> 6 (Dom), 1 -> 0 (Seg), 2 -> 1 (Ter), etc.
        const mappedIndex = dayIndex === 0 ? 6 : dayIndex - 1;
        acc[mappedIndex] = true;
        return acc;
    }, {});

    // Get active workouts count
    const workoutCount = Object.keys(studentData.workoutSheets || {}).length + (Object.keys(studentData.workouts || {}).length > 0 ? 1 : 0);

    return (
        <div style={{ color: 'var(--text-main)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <div
                    onClick={() => !uploadingPhoto && photoInputRef.current?.click()}
                    style={{
                        position: 'relative',
                        width: '64px',
                        height: '64px',
                        flexShrink: 0,
                        cursor: uploadingPhoto ? 'default' : 'pointer'
                    }}
                    title="Trocar foto de perfil"
                >
                    <div style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        border: '2px solid var(--border-glass)',
                        background: 'var(--input-bg)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        {studentData.profilePictureUrl ? (
                            <img src={studentData.profilePictureUrl} alt={studentData.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <User size={28} color="var(--text-muted)" />
                        )}
                        {uploadingPhoto && (
                            <div style={{
                                position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <Loader2 size={18} color="white" className="animate-spin" />
                            </div>
                        )}
                    </div>
                    <div style={{
                        position: 'absolute', bottom: '-3px', right: '-3px',
                        width: '22px', height: '22px', borderRadius: '50%',
                        background: 'var(--primary)', border: '2px solid var(--background)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Camera size={11} color="white" />
                    </div>
                    <input
                        ref={photoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        style={{ display: 'none' }}
                    />
                </div>
                <div>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Olá, {studentData.name.split(' ')[0]}! 👋</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Pronto para o treino de hoje?</p>
                </div>
                {weekStreak > 0 && (
                    <div style={{
                        marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.35rem',
                        background: 'rgba(249, 115, 22, 0.12)', border: '1px solid rgba(249, 115, 22, 0.3)',
                        color: '#f97316', padding: '0.4rem 0.75rem', borderRadius: '99px',
                        fontSize: '0.8rem', fontWeight: 700, flexShrink: 0
                    }}>
                        🔥 {weekStreak} {weekStreak === 1 ? 'semana' : 'semanas'}
                    </div>
                )}
            </div>

            {trainingReminder && (
                <div className="glass-panel" style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '1rem 1.25rem', marginBottom: '1.5rem',
                    background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)'
                }}>
                    <Calendar size={20} color="#f59e0b" style={{ flexShrink: 0 }} />
                    <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                        Faz <strong>{trainingReminder.daysSince} dias</strong> que você não treina. Bora manter o ritmo? 💪
                    </p>
                </div>
            )}

            <CheckinCard />

            <div className="student-home-grid">
            {/* Weekly Activity Tracker */}
            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', gridColumn: '1 / -1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <TrendingUp size={18} className="text-primary" />
                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>ATIVIDADE SEMANAL</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {Object.keys(trainingDaysMap).length} / 7 dias
                    </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                    {weekDays.map((day, idx) => {
                        const trained = trainingDaysMap[idx];
                        const isToday = new Date().getDay() === (idx === 6 ? 0 : idx + 1);

                        return (
                            <div key={day} style={{ 
                                flex: 1, 
                                display: 'flex', 
                                flexDirection: 'column', 
                                alignItems: 'center', 
                                gap: '0.5rem' 
                            }}>
                                <div style={{ 
                                    width: '100%', 
                                    aspectRatio: '1', 
                                    borderRadius: '12px', 
                                    background: trained ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                                    border: trained ? '1px solid var(--primary)' : isToday ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: trained ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                                    position: 'relative'
                                }}>
                                    {trained ? <CheckCircle2 size={18} /> : <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'currentColor' }} />}
                                    {isToday && !trained && (
                                        <div style={{ position: 'absolute', bottom: '-2px', width: '12px', height: '2px', background: 'var(--text-muted)', borderRadius: '1px' }} />
                                    )}
                                </div>
                                <span style={{ fontSize: '0.65rem', color: isToday ? 'var(--primary)' : 'var(--text-muted)', fontWeight: isToday ? 'bold' : 'normal' }}>
                                    {day}
                                </span>
                            </div>
                        );
                    })}
                </div>
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

            {/* Volume Load da semana (séries × reps × carga) */}
            {(() => {
                const weekVolume = weeklyLogs.reduce((sum, l) => sum + (l.volumeLoad || 0), 0);
                if (!weekVolume) return null;
                return (
                    <div className="glass-panel" style={{ padding: '1.1rem 1.25rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                        <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(16,185,129,0.15)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Weight size={22} />
                        </div>
                        <div>
                            <div style={{ fontSize: '1.15rem', fontWeight: 800 }}>{Math.round(weekVolume).toLocaleString('pt-BR')} kg</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Volume levantado essa semana</div>
                        </div>
                    </div>
                );
            })()}

            {/* Payment Status Bar */}
            {(() => {
                const isActive = studentData.status?.toLowerCase() === 'active';
                const payStatus = getPaymentStatus(studentData);
                const nextPaymentDate = payStatus.next;
                const isOverdue = isActive && payStatus.isOverdue;
                const cyclesOverdue = payStatus.cyclesOverdue;
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
                                }}>{cyclesOverdue > 1 ? `${cyclesOverdue} VENCIDAS` : 'PENDENTE'}</span>
                            )}
                        </div>

                        {/* Status Message */}
                        <div>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: isOverdue ? 'var(--text-main)' : 'var(--text-muted)' }}>
                                {isOverdue
                                    ? `${cyclesOverdue > 1 ? `${cyclesOverdue} mensalidades em atraso` : 'Mensalidade vencida'}${nextPaymentDate ? ` desde ${nextPaymentDate.toLocaleDateString('pt-BR')}` : ''}.`
                                    : isActive
                                        ? `Tudo certo!${nextPaymentDate ? ` Próximo vencimento em ${nextPaymentDate.toLocaleDateString('pt-BR')}.` : ''}`
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
                    <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Sua Ficha de Treino</h3>
                    <Link to="/student/workouts" style={{ color: 'var(--primary)', fontSize: '0.85rem', textDecoration: 'none' }}>Ver todos</Link>
                </div>
                <Link to="/student/workouts" style={{ textDecoration: 'none' }}>
                    <div className="glass-panel ficha-cta-card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
        </div>
    );
}
