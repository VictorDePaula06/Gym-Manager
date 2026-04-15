import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useGym } from '../../context/GymContext';
import { Dumbbell, ChevronRight, Play, X, Info, ChevronLeft } from 'lucide-react';

export default function StudentWorkouts() {
    const { user } = useAuth();
    const { students, exerciseLibrary } = useGym();
    const [selectedSheetId, setSelectedSheetId] = useState('legacy');
    const [currentVariation, setCurrentVariation] = useState('A');
    const [activeExercise, setActiveExercise] = useState(null);

    const studentData = students.find(s => s.id === user?.studentId);

    useEffect(() => {
        if (studentData) {
            const sheets = studentData.workoutSheets || {};
            const sheetIds = Object.keys(sheets);
            
            if (sheetIds.length > 0) {
                // Find the latest sheet based on createdAt
                const sortedSheetIds = sheetIds.sort((a, b) => 
                    new Date(sheets[b].createdAt || 0) - new Date(sheets[a].createdAt || 0)
                );
                setSelectedSheetId(sortedSheetIds[0]);
            } else {
                setSelectedSheetId('legacy');
            }
        }
    }, [studentData]);

    if (!studentData) {
        return <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Buscando seus treinos...</div>;
    }

    const sheets = studentData.workoutSheets || {};
    const hasLegacy = Object.keys(studentData.workouts || {}).length > 0;
    
    const getCurrentWorkouts = () => {
        if (selectedSheetId === 'legacy') return studentData.workouts || {};
        return sheets[selectedSheetId]?.workouts || {};
    };

    const currentWorkouts = getCurrentWorkouts();
    const variations = Object.keys(currentWorkouts).sort();
    
    // Ensure currentVariation is valid for selection
    const activeVar = variations.includes(currentVariation) ? currentVariation : (variations[0] || 'A');

    const rawExercises = currentWorkouts[activeVar]?.exercises || [];
    
    // Fallback logic: if exercise has no videoUrl, try to find it in the library
    const exercises = rawExercises.map(ex => {
        if (!ex.videoUrl && ex.name) {
            const libraryMatch = exerciseLibrary.find(l => 
                l.name.trim().toLowerCase() === ex.name.trim().toLowerCase()
            );
            if (libraryMatch && libraryMatch.videoUrl) {
                return { ...ex, videoUrl: libraryMatch.videoUrl, fromLibrary: true };
            }
        }
        return ex;
    });

    return (
        <div style={{ color: 'var(--text-main)' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Dumbbell className="text-primary" /> Seus Treinos
            </h2>

            {/* Sheet Title (Replaces Selector) */}
            <div style={{ marginBottom: '1rem', padding: '1rem', background: 'var(--border-glass)', borderRadius: '12px', borderLeft: '4px solid var(--primary)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Ficha Atual</span>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'white' }}>
                    {selectedSheetId === 'legacy' ? 'Treinos Base' : sheets[selectedSheetId]?.name || 'Sua Ficha'}
                </h3>
            </div>

            {/* Variation Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {variations.length > 0 ? variations.map(v => (
                    <button
                        key={v}
                        onClick={() => setCurrentVariation(v)}
                        style={{
                            flex: 1,
                            padding: '0.75rem',
                            borderRadius: '12px',
                            background: activeVar === v ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                            color: activeVar === v ? '#60a5fa' : 'var(--text-muted)',
                            border: activeVar === v ? '1px solid #3b82f6' : '1px solid var(--border-glass)',
                            fontWeight: 'bold',
                            fontSize: '1.1rem'
                        }}
                    >
                        {v}
                    </button>
                )) : (
                    <div style={{ textAlign: 'center', width: '100%', padding: '2rem', background: 'var(--border-glass)', borderRadius: '12px' }}>
                        <Info size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Nenhum treino definido para esta ficha.</p>
                    </div>
                )}
            </div>

            {/* Exercise List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {exercises.map((ex, idx) => (
                    <div 
                        key={idx} 
                        className="glass-panel" 
                        onClick={() => setActiveExercise(ex)}
                        style={{ 
                            padding: '1.25rem', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '1rem',
                            cursor: 'pointer',
                            transition: 'transform 0.1s'
                        }}
                    >
                        <div style={{ 
                            width: '40px', 
                            height: '40px', 
                            borderRadius: '50%', 
                            background: 'rgba(255,255,255,0.05)', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            fontSize: '0.9rem',
                            fontWeight: 'bold',
                            color: 'var(--primary)'
                        }}>
                            {idx + 1}
                        </div>
                        <div style={{ flex: 1 }}>
                            <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem' }}>{ex.name}</h4>
                            <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                <span>{ex.sets} séries</span>
                                <span>•</span>
                                <span>{ex.reps} reps</span>
                                {ex.weight && (
                                    <>
                                        <span>•</span>
                                        <span>{ex.weight}kg</span>
                                    </>
                                )}
                            </div>
                        </div>
                        {ex.videoUrl && (
                            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.5rem', borderRadius: '50%', color: '#10b981' }}>
                                <Play size={16} fill="currentColor" />
                            </div>
                        )}
                        <ChevronRight size={20} color="var(--text-muted)" />
                    </div>
                ))}
            </div>

            {/* Exercise Details Modal */}
            {activeExercise && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    zIndex: 1000,
                    background: 'rgba(0,0,0,0.85)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(10px)',
                    padding: '1rem'
                }}>
                    <div className="glass-panel" style={{
                        width: '95%',
                        maxWidth: '500px',
                        maxHeight: '90vh',
                        padding: '1.5rem',
                        borderRadius: '24px',
                        overflowY: 'auto',
                        position: 'relative',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                    }}>
                        {/* Pull Handle for Mobile */}
                        <div style={{ 
                            width: '40px', 
                            height: '4px', 
                            background: 'rgba(255,255,255,0.1)', 
                            borderRadius: '2px', 
                            margin: '-0.5rem auto 1.5rem auto' 
                        }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <div>
                                <h3 style={{ fontSize: '1.25rem', margin: '0 0 0.25rem 0' }}>{activeExercise.name}</h3>
                                <div style={{ display: 'flex', gap: '0.75rem', color: 'var(--primary)', fontWeight: '600', fontSize: '0.9rem' }}>
                                    <span>{activeExercise.sets} Séries</span>
                                    <span>•</span>
                                    <span>{activeExercise.reps} Reps</span>
                                    {activeExercise.weight && <span>• {activeExercise.weight}kg</span>}
                                </div>
                            </div>
                            <button onClick={() => setActiveExercise(null)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', padding: '0.5rem', color: 'white', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>

                        {activeExercise.videoUrl ? (
                            <div style={{ width: '100%', borderRadius: '16px', overflow: 'hidden', background: '#000', marginBottom: '1rem', aspectRatio: '16/9', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                                <video 
                                    src={activeExercise.videoUrl} 
                                    controls 
                                    autoPlay
                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                />
                            </div>
                        ) : (
                            <div style={{ 
                                width: '100%', 
                                borderRadius: '16px', 
                                background: 'rgba(148, 163, 184, 0.05)', 
                                padding: '3rem 1rem', 
                                textAlign: 'center',
                                border: '1px dashed var(--border-glass)',
                                marginBottom: '1.5rem'
                            }}>
                                <Play size={40} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                                <p style={{ color: 'var(--text-muted)' }}>Sem vídeo demonstrativo disponível.</p>
                            </div>
                        )}

                        {activeExercise.observations && (
                            <div style={{ background: 'rgba(59, 130, 246, 0.05)', padding: '1rem', borderRadius: '12px', borderLeft: '3px solid var(--primary)' }}>
                                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                                    <strong>Obs:</strong> {activeExercise.observations}
                                </p>
                            </div>
                        )}

                        <button 
                            onClick={() => setActiveExercise(null)}
                            className="btn-primary"
                            style={{ 
                                width: '100%', 
                                padding: '1rem', 
                                borderRadius: '14px', 
                                border: 'none', 
                                fontWeight: 'bold',
                                marginTop: '1.5rem',
                                boxShadow: '0 4px 15px var(--primary-glow)'
                            }}
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
