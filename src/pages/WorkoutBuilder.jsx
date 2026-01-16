import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useGym } from '../context/GymContext';
import { useToast } from '../context/ToastContext';
import { Plus, Trash2, Save, ChevronLeft, Dumbbell, FileDown, Check } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { commonExercises } from '../constants/exercises';

const getSortedVariations = (workouts, current) => {
    const keys = Object.keys(workouts || {});
    if (!keys.includes(current)) {
        keys.push(current);
    }
    return keys.sort();
};

export default function WorkoutBuilder() {
    const { id } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const { students, updateStudent, settings } = useGym();
    const { addToast } = useToast();

    const student = students.find(s => s.id === id);

    // Get sheetId from URL, default to 'legacy' (or handle empty)
    const sheetId = searchParams.get('sheetId') || 'legacy';

    // Helper to extract workouts based on sheetId
    const getTargetWorkouts = () => {
        if (!student) return {};
        if (sheetId === 'legacy') return student.workouts || {};
        return student.workoutSheets?.[sheetId]?.workouts || {};
    };

    const targetWorkouts = getTargetWorkouts();

    // Determine initial variation: URL param -> first existing -> 'A'
    const initialVariation = searchParams.get('variation') ||
        (Object.keys(targetWorkouts).length > 0 ? Object.keys(targetWorkouts).sort()[0] : 'A');

    const [currentVariation, setCurrentVariation] = useState(initialVariation);
    const [exercises, setExercises] = useState([]);
    const [workoutName, setWorkoutName] = useState(`Treino ${initialVariation}`);
    // Initialize sheet name, handle potentially undefined sheet safely
    const [sheetName, setSheetName] = useState(() => {
        if (sheetId === 'legacy') return 'Ficha Principal';
        return student.workoutSheets?.[sheetId]?.name || 'Nova Ficha';
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        // Update URL when variation state changes, to keep them in sync
        setSearchParams({ variation: currentVariation, sheetId }, { replace: true });
    }, [currentVariation, sheetId, setSearchParams]);

    useEffect(() => {
        if (student) {
            const workouts = getTargetWorkouts(); // Re-fetch to be safe
            const variationData = workouts[currentVariation];

            if (variationData) {
                setExercises(variationData.exercises || []);
                setWorkoutName(variationData.name || `Treino ${currentVariation}`);
            } else {
                setExercises([]);
                setWorkoutName(`Treino ${currentVariation}`);
            }
        }
    }, [student, currentVariation, sheetId]);

    const addExercise = () => {
        setExercises([...exercises, { id: crypto.randomUUID(), name: '', sets: 3, reps: '12', weight: '' }]);
    };

    const updateExercise = (exerciseId, field, value) => {
        setExercises(exercises.map(ex =>
            ex.id === exerciseId ? { ...ex, [field]: value } : ex
        ));
    };

    const removeExercise = (exerciseId) => {
        setExercises(exercises.filter(ex => ex.id !== exerciseId));
    };

    const handleSave = async () => {
        if (!student) return;
        setIsSaving(true);
        try {
            let updatedStudentData = { ...student };

            // Logic for saving based on sheetId
            if (sheetId === 'legacy') {
                const existingWorkouts = student.workouts || {};
                updatedStudentData.workouts = {
                    ...existingWorkouts,
                    [currentVariation]: {
                        name: workoutName,
                        lastUpdated: new Date().toISOString(),
                        exercises
                    }
                };
            } else {
                // Saving to a named sheet
                if (!student.workoutSheets || !student.workoutSheets[sheetId]) {
                    addToast("Erro: Ficha não encontrada.", 'error'); // Should not happen if came from selector
                    return;
                }

                const sheet = student.workoutSheets[sheetId];
                const updatedSheet = {
                    ...sheet,
                    workouts: {
                        ...(sheet.workouts || {}),
                        [currentVariation]: {
                            name: workoutName,
                            lastUpdated: new Date().toISOString(),
                            exercises
                        }
                    },
                    name: sheetName
                };

                updatedStudentData.workoutSheets = {
                    ...student.workoutSheets,
                    [sheetId]: updatedSheet
                };
            }

            await updateStudent(id, updatedStudentData);
            addToast(`Treino ${currentVariation} salvo com sucesso!`, 'success');
        } catch (error) {
            console.error("Erro ao salvar treino:", error);
            addToast("Erro ao salvar o treino. Tente novamente.", 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const getBase64FromUrl = async (url) => {
        const data = await fetch(url);
        const blob = await data.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => {
                const base64data = reader.result;
                resolve(base64data);
            }
        });
    }

    const generatePDF = async () => {
        const doc = new jsPDF();
        // Use targetWorkouts based on current sheet
        const workouts = getTargetWorkouts();
        const variations = Object.keys(workouts).sort();

        // Get Sheet Name
        let sheetName = "Ficha de Treino";
        if (sheetId !== 'legacy' && student.workoutSheets?.[sheetId]) {
            sheetName = student.workoutSheets[sheetId].name;
        }

        // Header Layer (Professional Dark Theme)
        doc.setFillColor(15, 23, 42); // Dark Slate/Blue
        doc.rect(0, 0, 210, 40, 'F');

        // Logo
        if (settings?.logoUrl) {
            try {
                const logoBase64 = await getBase64FromUrl(settings.logoUrl);
                doc.addImage(logoBase64, 'PNG', 14, 5, 30, 30);
            } catch (e) {
                console.error("Failed to load logo", e);
            }
        }

        // Header Text
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        const gymName = settings?.gymName || "GymManager";
        doc.text(gymName, 105, 18, { align: "center" });

        doc.setFontSize(14);
        doc.text(sheetName, 105, 30, { align: "center" });

        // Reset for Content
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);

        doc.text(`Aluno: ${student.name}`, 14, 50); // Shifted down
        doc.text(`Data de Emissão: ${new Date().toLocaleDateString()}`, 14, 58);

        // Iterate through all variations
        let currentY = 70; // Adjusted Y

        variations.forEach((variation, index) => {
            const data = workouts[variation];
            const exercisesList = data.exercises || [];

            // If not the first item, check if we need a page break or spacing
            if (index > 0) {
                if (doc.lastAutoTable.finalY > 250) {
                    doc.addPage();
                    currentY = 20;
                } else {
                    currentY = doc.lastAutoTable.finalY + 15;
                }
            }

            doc.setFontSize(16);
            doc.setTextColor(59, 130, 246); // Primary Blue
            doc.text(`Treino ${variation} - ${data.name || ''}`, 14, currentY);

            const tableColumn = ["Exercício", "Séries", "Repetições", "Carga (kg)"];
            const tableRows = exercisesList.map(exercise => [
                exercise.name,
                exercise.sets,
                exercise.reps,
                exercise.weight || '-'
            ]);

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: currentY + 5,
                theme: 'grid',
                headStyles: { fillColor: [59, 130, 246] },
                styles: { fontSize: 10, cellPadding: 3 },
                margin: { top: 20 }
            });
        });

        // Footer on all pages
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            const pageHeight = doc.internal.pageSize.height;
            doc.setFontSize(10);
            doc.setTextColor(150);
            doc.text("Gym Manager - Seu parceiro de treinos", 105, pageHeight - 10, { align: "center" });
            doc.text(`Página ${i} de ${pageCount}`, 190, pageHeight - 10, { align: "right" });
        }

        doc.save(`${student.name}_${sheetName}.pdf`);
    };

    if (!student) return <div style={{ padding: '2rem' }}>Carregando...</div>;

    const variations = getSortedVariations(targetWorkouts, currentVariation);

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '4rem' }}>
            <button onClick={() => navigate(`/app/students/${id}`, { state: { activeTab: 'workouts' } })} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: 'var(--text-muted)',
                marginBottom: '2rem',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer'
            }}>
                <ChevronLeft size={20} /> Voltar para Perfil
            </button>

            <style>{`
                .exercise-row {
                    display: grid;
                    grid-template-columns: minmax(200px, 3fr) 0.8fr 0.8fr 0.8fr auto;
                    gap: 1rem;
                    align-items: end;
                    margin-bottom: 1rem;
                    padding: 1rem;
                    background: var(--card-bg);
                    border-radius: 12px;
                }
                
                @media (max-width: 768px) {
                    .exercise-row {
                        grid-template-columns: 1fr 1fr 1fr auto !important;
                        gap: 0.5rem;
                        padding: 0.75rem;
                    }
                    /* Exercise Name: Full width top row */
                    .exercise-row > div:first-child {
                        grid-column: 1 / -1;
                        margin-bottom: 0.5rem;
                    }
                    /* Hide Delete Button text if any, keep icon */
                }
            `}</style>

            <div className="glass-panel" style={{ padding: '2rem' }}>
                <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 style={{ marginBottom: '0.5rem', fontSize: '1.5rem' }}>Editor de Treino</h1>
                        <p style={{ color: 'var(--text-muted)' }}>Aluno: <span style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>{student.name}</span></p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            onClick={generatePDF}
                            style={{
                                background: 'transparent',
                                border: '1px solid var(--border-glass)',
                                color: 'var(--text-main)',
                                padding: '0.75rem 1rem',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                fontSize: '0.9rem'
                            }}
                            title="Baixar PDF"
                        >
                            <FileDown size={20} />
                            <span className="hide-mobile">PDF</span>
                        </button>
                    </div>


                    {/* Sheet Name Input (Only for non-legacy) */}
                    {sheetId !== 'legacy' && (
                        <div style={{ width: '100%', marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Nome da Ficha</label>
                            <input
                                value={sheetName}
                                onChange={(e) => setSheetName(e.target.value)}
                                placeholder="Ex: Hipertrofia 2025"
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    background: 'var(--card-bg)',
                                    border: '1px solid var(--border-glass)',
                                    borderRadius: '8px',
                                    color: 'var(--text-main)',
                                    fontSize: '1.2rem',
                                    fontWeight: 'bold'
                                }}
                            />
                        </div>
                    )}

                    {/* Variation Selector */}
                    <div style={{ width: '100%', display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1rem', overflowX: 'auto' }}>
                        {variations.map(v => (
                            <button
                                key={v}
                                onClick={() => setCurrentVariation(v)}
                                style={{
                                    background: currentVariation === v ? 'var(--primary)' : 'var(--input-bg)',
                                    color: currentVariation === v ? 'white' : 'var(--text-muted)',
                                    border: 'none',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    minWidth: '60px',
                                    position: 'relative'
                                }}
                            >
                                <span style={{ fontSize: '1.2rem' }}>{v}</span>
                                <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                                    {student.workouts?.[v] ? 'Criado' : 'Novo'}
                                </span>
                            </button>
                        ))}

                        {/* Button to add next variation directly from builder */}
                        <button
                            onClick={() => {
                                const lastChar = variations[variations.length - 1];
                                const nextVar = String.fromCharCode(lastChar.charCodeAt(0) + 1);
                                setCurrentVariation(nextVar);
                            }}
                            style={{
                                background: 'transparent',
                                border: '1px dashed var(--border-glass)',
                                color: 'var(--text-muted)',
                                padding: '0.5rem 1rem',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            title="Adicionar nova divisão"
                        >
                            <Plus size={20} />
                        </button>
                    </div>

                    <div style={{ width: '100%', marginBottom: '2rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Nome do Treino</label>
                        <input
                            value={workoutName}
                            onChange={(e) => setWorkoutName(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                background: 'var(--card-bg)',
                                border: '1px solid var(--border-glass)',
                                borderRadius: '8px',
                                color: 'var(--text-main)',
                                fontSize: '1.1rem'
                            }}
                        />
                    </div>

                    <div style={{ width: '100%', marginBottom: '2rem' }}>
                        {exercises.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', background: 'var(--card-bg)', borderRadius: '12px', marginBottom: '1rem' }}>
                                <Dumbbell size={32} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                                <p>Este treino ainda está vazio.</p>
                            </div>
                        ) : (
                            exercises.map((exercise, index) => (
                                <div key={exercise.id} className="exercise-row">
                                    <div>
                                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Exercício</label>
                                        <input
                                            placeholder="ex: Supino Reto"
                                            value={exercise.name}
                                            list="exercise-suggestions"
                                            onChange={(e) => updateExercise(exercise.id, 'name', e.target.value)}
                                            style={{ width: '100%', padding: '0.5rem', background: 'var(--input-bg)', border: '1px solid var(--border-glass)', borderRadius: '6px', color: 'var(--text-main)' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Séries</label>
                                        <input
                                            type="number"
                                            value={exercise.sets}
                                            onChange={(e) => updateExercise(exercise.id, 'sets', e.target.value)}
                                            style={{ width: '100%', padding: '0.5rem', background: 'var(--input-bg)', border: '1px solid var(--border-glass)', borderRadius: '6px', color: 'var(--text-main)' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Reps</label>
                                        <input
                                            value={exercise.reps}
                                            onChange={(e) => updateExercise(exercise.id, 'reps', e.target.value)}
                                            style={{ width: '100%', padding: '0.5rem', background: 'var(--input-bg)', border: '1px solid var(--border-glass)', borderRadius: '6px', color: 'var(--text-main)' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Kg</label>
                                        <input
                                            value={exercise.weight}
                                            onChange={(e) => updateExercise(exercise.id, 'weight', e.target.value)}
                                            style={{ width: '100%', padding: '0.5rem', background: 'var(--input-bg)', border: '1px solid var(--border-glass)', borderRadius: '6px', color: 'var(--text-main)' }}
                                        />
                                    </div>
                                    <button
                                        onClick={() => removeExercise(exercise.id)}
                                        style={{ padding: '0.5rem', color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '6px', cursor: 'pointer', border: 'none', height: 'fit-content', alignSelf: 'end' }}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))
                        )}

                        <button
                            onClick={addExercise}
                            style={{
                                width: '100%',
                                padding: '1rem',
                                border: '1px dashed var(--border-glass)',
                                borderRadius: '12px',
                                background: 'transparent',
                                color: 'var(--text-muted)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                cursor: 'pointer',
                                marginTop: '1rem'
                            }}
                        >
                            <Plus size={20} /> Adicionar Exercício
                        </button>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            style={{
                                background: isSaving ? 'var(--text-muted)' : 'var(--primary)',
                                color: 'white',
                                padding: '1rem 2rem',
                                borderRadius: '12px',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                border: 'none',
                                cursor: isSaving ? 'not-allowed' : 'pointer',
                                opacity: isSaving ? 0.7 : 1
                            }}
                        >
                            <Save size={20} /> {isSaving ? 'Salvando...' : 'Salvar Treino'}
                        </button>
                    </div>
                </div>
            </div>

            <datalist id="exercise-suggestions">
                {commonExercises.map((ex) => (
                    <option key={ex} value={ex} />
                ))}
            </datalist>
        </div>
    );
}
