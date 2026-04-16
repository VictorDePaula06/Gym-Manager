import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useGym } from '../../context/GymContext';
import { Dumbbell, ChevronRight, Play, X, Info, ChevronLeft, CheckCircle2, Clock, Trophy } from 'lucide-react';
import RestTimer from '../../components/RestTimer';

export default function StudentWorkouts() {
    const { user } = useAuth();
    const { students, exerciseLibrary } = useGym();
    const [selectedSheetId, setSelectedSheetId] = useState('legacy');
    const [currentVariation, setCurrentVariation] = useState('A');
    const [activeExercise, setActiveExercise] = useState(null);
    
    // Active Workout States
    const { logWorkoutCompletion, setIsTrainingMode } = useGym();
    const [isWorkoutActive, setIsWorkoutActive] = useState(false);
    const [workoutStartTime, setWorkoutStartTime] = useState(null);
    const [currentExIndex, setCurrentExIndex] = useState(0);
    const [completedSets, setCompletedSets] = useState(0); // For current exercise
    const [workoutProgress, setWorkoutProgress] = useState([]); // Array of {exerciseName, setsDone}
    const [showRestTimer, setShowRestTimer] = useState(false);
    const [isFinished, setIsFinished] = useState(false);

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

    const startWorkout = () => {
        setIsWorkoutActive(true);
        setWorkoutStartTime(new Date());
        setCurrentExIndex(0);
        setCompletedSets(0);
        setWorkoutProgress(exercises.map(ex => ({ name: ex.name, totalSets: parseInt(ex.sets) || 0, done: 0 })));
        setIsFinished(false);
        setIsTrainingMode(true);
    };

    const handleNextSet = () => {
        const currentEx = exercises[currentExIndex];
        const totalSets = parseInt(currentEx.sets) || 0;

        if (completedSets + 1 < totalSets) {
            setCompletedSets(prev => prev + 1);
            // Update progress
            const newProgress = [...workoutProgress];
            newProgress[currentExIndex].done += 1;
            setWorkoutProgress(newProgress);
            
            // Only show timer if restTime > 0
            if ((currentEx.restTime ?? 60) > 0) {
                setShowRestTimer(true);
            }
        } else {
            // Finished all sets for this exercise
            const newProgress = [...workoutProgress];
            newProgress[currentExIndex].done += 1;
            setWorkoutProgress(newProgress);
            
            if (currentExIndex + 1 < exercises.length) {
                setCurrentExIndex(prev => prev + 1);
                setCompletedSets(0);
                
                // Show timer if next exercise restTime > 0 (or use current for transition)
                const nextEx = exercises[currentExIndex + 1];
                if ((nextEx?.restTime ?? 60) > 0) {
                    setShowRestTimer(true);
                }
            } else {
                finishWorkout();
            }
        }
    };

    const finishWorkout = async () => {
        const endTime = new Date();
        const durationMinutes = Math.round((endTime - workoutStartTime) / 60000);
        
        const logData = {
            sheetName: selectedSheetId === 'legacy' ? 'Treinos Base' : sheets[selectedSheetId]?.name || 'Sua Ficha',
            variation: activeVar,
            duration: durationMinutes,
            exercisesCompleted: exercises.length,
            completedAt: endTime.toISOString()
        };

        try {
            await logWorkoutCompletion(user.studentId, logData);
            setIsFinished(true);
            setIsWorkoutActive(false);
            setIsTrainingMode(false);
        } catch (error) {
            alert("Erro ao salvar treino. Tente novamente.");
        }
    };

    if (isWorkoutActive && exercises[currentExIndex]) {
        return (
            <div style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                zIndex: 99999,
                background: 'var(--background)',
                color: 'white',
                display: 'flex',
                flexDirection: 'column',
                padding: 'env(safe-area-inset-top) 1.5rem 1.5rem 1.5rem',
                overflowY: 'auto'
            }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', padding: '0.5rem' }}>
                    <div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Treino em Andamento</span>
                        <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Variação {activeVar}</h3>
                    </div>
                </div>

                {/* Exercise Focus Card */}
                <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '24px', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ color: 'var(--primary)', fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                            EXERCÍCIO {currentExIndex + 1} DE {exercises.length}
                        </div>
                        <h2 style={{ fontSize: '1.75rem', margin: '0 0 1rem 0' }}>{exercises[currentExIndex].name}</h2>
                        
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{exercises[currentExIndex].sets}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>SÉRIES</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{exercises[currentExIndex].reps}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>REPS</div>
                            </div>
                            {exercises[currentExIndex].weight && (
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{exercises[currentExIndex].weight}kg</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>CARGA</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Video Player */}
                    {exercises[currentExIndex].videoUrl ? (
                        <div style={{ width: '100%', borderRadius: '16px', overflow: 'hidden', background: '#000', marginBottom: '1rem', aspectRatio: '16/9' }}>
                            <video 
                                src={exercises[currentExIndex].videoUrl} 
                                controls 
                                autoPlay
                                loop
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            />
                        </div>
                    ) : (
                        <div style={{ 
                            width: '100%', 
                            borderRadius: '16px', 
                            background: 'rgba(255,255,255,0.02)', 
                            padding: '3rem 1rem', 
                            textAlign: 'center',
                            border: '1px dashed var(--border-glass)'
                        }}>
                            <Play size={40} style={{ opacity: 0.1 }} />
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Sem vídeo para este exercício</p>
                        </div>
                    )}

                    {/* progress set */}
                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1.5rem', borderRadius: '20px', textAlign: 'center', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                        <div style={{ fontSize: '0.9rem', color: '#10b981', fontWeight: 'bold', marginBottom: '0.5rem' }}>SUA PROGRESSÃO</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Série {completedSets + 1} de {parseInt(exercises[currentExIndex].sets) || 0}</div>
                    </div>

                    {/* Progress Percentage */}
                    <div style={{ marginTop: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                            <span>Progresso Total</span>
                            <span>{Math.round((currentExIndex / exercises.length) * 100)}%</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${(currentExIndex / exercises.length) * 100}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.3s ease' }} />
                        </div>
                    </div>

                    <button 
                        onClick={handleNextSet}
                        className="btn-primary"
                        style={{ width: '100%', padding: '1.25rem', borderRadius: '16px', fontWeight: 'bold', fontSize: '1.1rem', marginTop: '1rem' }}
                    >
                        Concluir Série
                    </button>
                    {completedSets > 0 && (
                         <button 
                            onClick={() => setCompletedSets(prev => Math.max(0, prev - 1))}
                            style={{ width: '100%', padding: '0.75rem', color: 'var(--text-muted)', background: 'none', border: 'none', fontSize: '0.9rem' }}
                        >
                            Corrigir (Voltar 1 série)
                        </button>
                    )}
                </div>

                {/* Rest Timer Modal */}
                {showRestTimer && (
                    <RestTimer 
                        initialDuration={exercises[currentExIndex]?.restTime ?? 60} 
                        onComplete={() => setShowRestTimer(false)}
                        onCancel={() => { setShowRestTimer(false); setIsWorkoutActive(false); }}
                    />
                )}
            </div>
        );
    }

    return (
        <div style={{ color: 'var(--text-main)' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Dumbbell className="text-primary" /> Seus Treinos
            </h2>

            {/* Sheet Title */}
            <div style={{ marginBottom: '1rem', padding: '1rem', background: 'var(--border-glass)', borderRadius: '12px', borderLeft: '4px solid var(--primary)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Ficha Atual</span>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'white' }}>
                    {selectedSheetId === 'legacy' ? 'Treinos Base' : sheets[selectedSheetId]?.name || 'Sua Ficha'}
                </h3>
            </div>

            {/* Variation Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
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

            {/* Start Workout Button */}
            {exercises.length > 0 && (
                <button 
                    onClick={startWorkout}
                    className="btn-primary"
                    style={{ 
                        width: '100%', 
                        padding: '1.25rem', 
                        borderRadius: '16px', 
                        fontSize: '1.1rem', 
                        fontWeight: 'bold', 
                        marginBottom: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.75rem',
                        boxShadow: '0 8px 25px rgba(16, 185, 129, 0.3)'
                    }}
                >
                    <Play size={24} fill="currentColor" /> Iniciar Treino {activeVar}
                </button>
            )}

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

            {/* Success Modal */}
            {isFinished && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    zIndex: 99999, background: 'rgba(0,0,0,0.95)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
                    backdropFilter: 'blur(10px)'
                }}>
                    <div className="glass-panel" style={{ padding: '2.5rem', borderRadius: '32px', textAlign: 'center', maxWidth: '400px', width: '100%' }}>
                        <div style={{ width: '80px', height: '80px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
                            <Trophy size={40} color="#10b981" />
                        </div>
                        <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Treino Concluído!</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Parabéns! Seu professor já foi notificado da sua dedicação hoje.</p>
                        <button onClick={() => setIsFinished(false)} className="btn-primary" style={{ width: '100%', padding: '1rem', borderRadius: '16px', fontWeight: 'bold' }}>
                            Voltar ao Início
                        </button>
                    </div>
                </div>
            )}

            {/* Exercise Details Modal (Preview) */}
            {activeExercise && !isWorkoutActive && (
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
                            <div style={{ width: '100%', borderRadius: '16px', overflow: 'hidden', background: '#000', marginBottom: '1rem', aspectRatio: '16/9' }}>
                                <video 
                                    src={activeExercise.videoUrl} 
                                    controls 
                                    autoPlay
                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                />
                            </div>
                        ) : (
                            <div style={{ width: '100%', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', padding: '3rem 1rem', textAlign: 'center', marginBottom: '1rem' }}>
                                <Play size={40} style={{ opacity: 0.1 }} />
                                <p style={{ color: 'var(--text-muted)' }}>Sem vídeo disponível</p>
                            </div>
                        )}

                        {activeExercise.observations && (
                            <div style={{ background: 'rgba(59, 130, 246, 0.05)', padding: '1rem', borderRadius: '12px', borderLeft: '3px solid var(--primary)' }}>
                                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                    <strong>Obs:</strong> {activeExercise.observations}
                                </p>
                            </div>
                        )}

                        <button onClick={() => setActiveExercise(null)} className="btn-primary" style={{ width: '100%', padding: '1rem', borderRadius: '14px', marginTop: '1.5rem', fontWeight: 'bold' }}>
                            Fechar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
