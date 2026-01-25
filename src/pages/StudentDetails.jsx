
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useGym } from '../context/GymContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useDialog } from '../context/DialogContext';
import { db, storage } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, doc, getDoc, arrayUnion, arrayRemove, deleteDoc } from 'firebase/firestore';
import { Trash2, Plus, Edit2, ArrowLeft, Download, User, Activity, Dumbbell, DollarSign, Scale, MessageCircle, CheckCircle, Image as ImageIcon, Camera, ChevronLeft, ChevronRight, Accessibility, AlertCircle, Sparkles, X } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import BodyMeasurementMap from '../components/BodyMeasurementMap';
import StudentCard from '../components/StudentCard';
import { generateWorkout } from '../utils/workoutRecommendations';

export default function StudentDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { students, updateStudent, settings } = useGym();
    const { user } = useAuth();
    const { addToast } = useToast();
    const { confirm } = useDialog();
    const [student, setStudent] = useState(null);
    const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'overview');
    const [assessments, setAssessments] = useState([]);
    const [showAssessmentForm, setShowAssessmentForm] = useState(false);
    const [editingAssessmentId, setEditingAssessmentId] = useState(null);

    // New state for multiple sheets
    const [selectedSheetId, setSelectedSheetId] = useState('default');
    const [isCreatingSheet, setIsCreatingSheet] = useState(false);
    const [newSheetName, setNewSheetName] = useState('');
    const [useRecommendation, setUseRecommendation] = useState(false); // New state for AI gen
    const [selectedLevel, setSelectedLevel] = useState('Iniciante'); // Manual override
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    const [newAssessment, setNewAssessment] = useState({
        weight: '',
        height: '',
        bodyFat: '',
        muscleMass: '',
        notes: '',
        // Detailed Measurements
        bicepsRight: '', bicepsLeft: '',
        tricepsRight: '', tricepsLeft: '',
        chest: '', waist: '', abdomen: '',
        hips: '',
        thighRight: '', thighLeft: '',
        calfRight: '', calfLeft: ''
    });

    // Comparison State
    const [selectedAssessments, setSelectedAssessments] = useState([]);
    const [showComparison, setShowComparison] = useState(false);

    const [paymentForm, setPaymentForm] = useState({
        value: '',
        method: 'Cartão de Crédito',
        date: new Date().toISOString().split('T')[0]
    });
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [expandedPhoto, setExpandedPhoto] = useState(null);
    const [galleryItems, setGalleryItems] = useState([]); // Local state for interaction
    const [selectedIndex, setSelectedIndex] = useState(0);

    const scrollRef = useRef(null);

    const scroll = (scrollOffset) => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: scrollOffset, behavior: 'smooth' });
        }
    };

    useEffect(() => {
        const found = students.find(s => s.id === id);
        if (found) {
            setStudent(found);

            setGalleryItems(found.photoGallery || []);


            if (found.workoutSheets && Object.keys(found.workoutSheets).length > 0 && selectedSheetId === 'default') {
                const sheetIds = Object.keys(found.workoutSheets).sort();
                setSelectedSheetId(sheetIds[sheetIds.length - 1]);
            }
        }
    }, [id, students]);

    // Keyboard Navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!expandedPhoto) return;
            if (e.key === 'ArrowRight') handleNext();
            if (e.key === 'ArrowLeft') handlePrev();
            if (e.key === 'Escape') setExpandedPhoto(null);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [expandedPhoto, selectedIndex, galleryItems]);

    const handleNext = () => {
        const nextIndex = (selectedIndex + 1) % galleryItems.length;
        setSelectedIndex(nextIndex);
        setExpandedPhoto(galleryItems[nextIndex]);
    };

    const handlePrev = () => {
        const prevIndex = (selectedIndex - 1 + galleryItems.length) % galleryItems.length;
        setSelectedIndex(prevIndex);
        setExpandedPhoto(galleryItems[prevIndex]);
    };

    useEffect(() => {
        if (!id || !user) return;

        const basePath = `users/${user.uid}`;
        const q = query(collection(db, `${basePath}/students`, id, 'assessments'), orderBy('date', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setAssessments(snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })));
        });

        return () => unsubscribe();
    }, [id, user]);

    const handleAddAssessment = async (e) => {
        e.preventDefault();
        try {
            const assessmentData = {
                ...newAssessment,
                // If editing, keep original date, else new date
                ...(editingAssessmentId ? {} : {
                    date: serverTimestamp(),
                    dateString: new Date().toLocaleDateString()
                })
            };

            if (editingAssessmentId) {
                // Ensure number format
                const cleanAssessment = { ...assessmentData };
                ['weight', 'height', 'bodyFat', 'muscleMass'].forEach(k => {
                    if (cleanAssessment[k]) cleanAssessment[k] = cleanAssessment[k].toString().replace(',', '.');
                });

                const basePath = `users/${user.uid}`;
                await updateDoc(doc(db, `${basePath}/students`, id, 'assessments', editingAssessmentId), cleanAssessment);
                addToast("Avaliação atualizada!", 'success');
            } else {
                const cleanAssessment = { ...assessmentData };
                ['weight', 'height', 'bodyFat', 'muscleMass'].forEach(k => {
                    if (cleanAssessment[k]) cleanAssessment[k] = cleanAssessment[k].toString().replace(',', '.');
                });
                const basePath = `users/${user.uid}`;
                await addDoc(collection(db, `${basePath}/students`, id, 'assessments'), cleanAssessment);
                addToast("Avaliação criada com sucesso!", 'success');
            }

            setShowAssessmentForm(false);
            setEditingAssessmentId(null);
            setNewAssessment({ weight: '', height: '', bodyFat: '', muscleMass: '', notes: '' });
        } catch (error) {
            console.error("Error saving assessment:", error);
            addToast("Erro ao salvar avaliação.", 'error');
        }
    };

    const handleDeleteAssessment = async (assessmentId) => {
        const confirmed = await confirm({
            title: 'Excluir Avaliação',
            message: 'Tem certeza que deseja excluir esta avaliação?',
            confirmText: 'Excluir',
            type: 'danger'
        });

        if (!confirmed) return;

        try {
            const basePath = `users/${user.uid}`;
            await deleteDoc(doc(db, `${basePath}/students`, id, 'assessments', assessmentId));
            addToast("Avaliação excluída com sucesso!", 'success');
        } catch (e) {
            addToast("Erro ao excluir avaliação.", 'error');
        }
    };

    const handleWhatsApp = async () => {
        if (!settings?.whatsapp) {
            const confirmed = await confirm({
                title: 'WhatsApp não configurado',
                message: 'Para entrar em contato com alunos, você precisa primeiro cadastrar o seu número de WhatsApp nas configurações.',
                confirmText: 'Ir para Configurações',
                cancelText: 'Cancelar',
                type: 'info'
            });

            if (confirmed) {
                navigate('/app/settings');
            }
            return;
        }

        if (!student.phone) return;

        let message = '';
        const phone = student.phone.replace(/\D/g, '');

        // Check for overdue payment
        if (student.nextPaymentDate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const dueDate = new Date(student.nextPaymentDate);
            dueDate.setHours(0, 0, 0, 0);

            if (dueDate < today) {
                const sendCharge = await confirm({
                    title: '⚠️ Pagamento Pendente',
                    message: `O pagamento de ${student.name} venceu em ${dueDate.toLocaleDateString('pt-BR')}. Deseja enviar uma mensagem de cobrança?`,
                    confirmText: 'Enviar Cobrança',
                    cancelText: 'Mensagem Normal',
                    type: 'warning'
                });

                if (sendCharge) {
                    message = `Olá ${student.name.split(' ')[0]}, notamos que sua mensalidade venceu em ${dueDate.toLocaleDateString('pt-BR')}. Gostaria de renovar seu plano?`;
                }
            }
        }

        const url = message
            ? `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`
            : `https://wa.me/55${phone}`;

        window.open(url, '_blank');
    };

    const getCurrentSheet = () => {
        if (!student) return null;

        if (student.workoutSheets && Object.keys(student.workoutSheets).length > 0) {
            if (student.workoutSheets[selectedSheetId]) {
                return { type: 'sheet', id: selectedSheetId, ...student.workoutSheets[selectedSheetId] };
            }
            const firstKey = Object.keys(student.workoutSheets)[0];
            return { type: 'sheet', id: firstKey, ...student.workoutSheets[firstKey] };
        }

        return { type: 'legacy', id: 'legacy', name: 'Ficha Principal', workouts: student.workouts || {} };
    };

    const handleCreateSheet = async () => {
        if (!newSheetName.trim() && !useRecommendation) return;

        try {
            // Generate or use name
            let finalName = newSheetName;
            let initialWorkouts = {};
            let generated = null;

            if (useRecommendation) {
                generated = generateWorkout(student, selectedLevel);
                initialWorkouts = generated.workouts;
                if (!finalName) finalName = generated.name;

                if (generated.needsProfessionalReview) {
                    const confirmed = await confirm({
                        title: '⚠️ Atenção: Limitações Identificadas',
                        message: `Este aluno possui histórico médico ou limitações (${generated.reviewReason}). A ficha foi adaptada para evitar movimentos lesivos, mas sugerimos fortemente que um profissional revise os exercícios. Deseja prosseguir?`,
                        confirmText: 'Estou ciente, criar ficha',
                        cancelText: 'Revisar agora',
                        type: 'warning'
                    });

                    if (!confirmed) return;
                }
            }

            if (!finalName) return;

            const sheetId = crypto.randomUUID();
            const newSheet = {
                name: finalName,
                createdAt: new Date().toISOString(),
                workouts: initialWorkouts,
                // Persist safety data
                needsProfessionalReview: useRecommendation && generated?.needsProfessionalReview,
                reviewReason: useRecommendation ? generated?.reviewReason : null
            };

            const updatedSheets = {
                ...(student.workoutSheets || {}),
                [sheetId]: newSheet
            };

            let finalUpdate = { workoutSheets: updatedSheets };

            if ((!student.workoutSheets || Object.keys(student.workoutSheets).length === 0) &&
                student.workouts &&
                Object.keys(student.workouts).length > 0) {

                const legacyId = crypto.randomUUID();
                finalUpdate.workoutSheets[legacyId] = {
                    name: "Ficha Anterior",
                    createdAt: new Date().toISOString(),
                    workouts: student.workouts
                };

                // Also explicitly define it so we don't rely only on merged updatedSheets
                updatedSheets[legacyId] = finalUpdate.workoutSheets[legacyId];
            }

            await updateStudent(id, finalUpdate);

            setNewSheetName('');
            setUseRecommendation(false);
            setIsCreatingSheet(false);
            setSelectedSheetId(sheetId);
            addToast(useRecommendation ? "Ficha gerada com sucesso!" : "Ficha criada com sucesso!", 'success');

        } catch (error) {
            console.error("Error creating sheet:", error);
            addToast("Erro ao criar nova ficha.", 'error');
        }
    };

    const handleAutoFillSheet = async (targetSheetId, level) => {
        try {
            const generated = generateWorkout(student, level);

            // Validation with Alert
            if (generated.needsProfessionalReview) {
                const confirmed = await confirm({
                    title: '⚠️ Atenção: Limitações Identificadas',
                    message: `Este aluno possui histórico médico ou limitações (${generated.reviewReason}). O treino será adaptado. Deseja prosseguir?`,
                    confirmText: 'Sim, preencher ficha',
                    cancelText: 'Cancelar',
                    type: 'warning'
                });
                if (!confirmed) return;
            }

            // Handle Legacy/Missing Sheet Case
            let currentSheetData = {};
            let finalSheetId = targetSheetId;

            if (student.workoutSheets && student.workoutSheets[targetSheetId]) {
                currentSheetData = student.workoutSheets[targetSheetId];
            } else {
                // Legacy or New Sheet
                currentSheetData = {
                    name: 'Ficha Principal', // Default name
                    createdAt: new Date().toISOString(),
                    workouts: {}
                };

                // If it's the virtual 'default' or 'legacy' ID, generate a real UUID
                if (targetSheetId === 'default' || targetSheetId === 'legacy') {
                    finalSheetId = crypto.randomUUID();
                }
            }

            const updatedSheet = {
                ...currentSheetData,
                name: generated.name || currentSheetData.name, // Update name with generated one
                workouts: generated.workouts,
                needsProfessionalReview: generated.needsProfessionalReview,
                reviewReason: generated.reviewReason
            };

            const updatedSheets = {
                ...(student.workoutSheets || {}),
                [finalSheetId]: updatedSheet
            };

            await updateStudent(id, { workoutSheets: updatedSheets });

            // If we migrated from legacy/default to a real ID, update the selection
            if (finalSheetId !== targetSheetId) {
                setSelectedSheetId(finalSheetId);
            }

            addToast("Ficha preenchida automaticamente!", 'success');

        } catch (error) {
            console.error("Error auto-filling sheet:", error);
            addToast("Erro ao gerar treino.", 'error');
        }
    };

    const handleDeleteSheet = async (sheetId) => {
        const confirmed = await confirm({
            title: 'Excluir Ficha',
            message: 'Tem certeza que deseja excluir esta ficha inteira? Todos os treinos nela serão perdidos.',
            confirmText: 'Excluir',
            type: 'danger'
        });

        if (!confirmed) return;

        try {
            // Handle Legacy Sheet Removal
            if (sheetId === 'legacy' || sheetId === 'default') {
                // Legacy sheets are stored in the root `workouts` field, not `workoutSheets`
                await updateStudent(id, {
                    workouts: {} // Clear the legacy field
                });
            } else {
                // Modern Sheet Removal
                const newSheets = { ...student.workoutSheets };
                delete newSheets[sheetId];

                await updateStudent(id, {
                    workoutSheets: newSheets
                });
            }

            setSelectedSheetId('default'); // Reset selection
            addToast("Ficha excluída com sucesso!", 'success');
        } catch (error) {
            console.error("Error deleting sheet:", error);
            addToast("Erro ao excluir ficha.", 'error');
        }
    }

    const shareSheetPDF = async () => {
        try {
            const doc = new jsPDF();
            const currentSheet = getCurrentSheet();
            const workouts = currentSheet.workouts || (currentSheet.type === 'legacy' ? currentSheet.workouts : {});
            const variations = Object.keys(workouts).sort();

            if (variations.length === 0) {
                addToast("Nenhum treino encontrado nesta ficha para compartilhar.", 'info');
                return;
            }

            // Header Layer (Professional Dark Theme)
            doc.setFillColor(15, 23, 42); // Dark Slate/Blue
            doc.rect(0, 0, 210, 40, 'F');

            if (settings?.logoUrl) {
                try {
                    const logoBase64 = await getBase64FromUrl(settings.logoUrl);
                    doc.addImage(logoBase64, 'PNG', 14, 5, 30, 30);
                } catch (e) {
                    console.error("Failed to load logo", e);
                }
            }

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.setTextColor(255, 255, 255);
            const gymName = settings?.gymName || "GymManager";
            doc.text(gymName, 105, 18, { align: 'center' });

            doc.setFontSize(14);
            doc.text("Ficha de Treino", 105, 30, { align: 'center' });

            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.text(`Aluno: ${student.name}`, 14, 50);
            doc.text(`Ficha: ${currentSheet.name || 'Principal'}`, 14, 58);
            if (student.goal) doc.text(`Objetivo: ${student.goal}`, 14, 66);

            let yPos = 70;

            variations.forEach((variation, index) => {
                if (yPos > 250) {
                    doc.addPage();
                    yPos = 20;
                }

                doc.setFillColor(33, 150, 243);
                doc.rect(14, yPos - 8, 182, 10, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(14);
                doc.text(`Treino ${variation}`, 105, yPos - 1, { align: 'center' });
                yPos += 10;

                // Add Observations if present
                let exercisesData = workouts[variation];
                if (exercisesData?.observations) {
                    doc.setFontSize(10);
                    doc.setTextColor(100);
                    const splitObs = doc.splitTextToSize(`Obs: ${exercisesData.observations}`, 180);
                    doc.text(splitObs, 14, yPos);
                    yPos += (splitObs.length * 5) + 5;
                    doc.setTextColor(255, 255, 255); // Reset? No, table handles its own colors.
                }

                let exercises = workouts[variation];
                if (!Array.isArray(exercises) && exercises?.exercises) {
                    exercises = exercises.exercises;
                }
                const tableBody = Array.isArray(exercises) ? exercises.map(ex => [
                    ex.name,
                    ex.sets || '-',
                    ex.reps || '-',
                    ex.technique || '-'
                ]) : [];

                autoTable(doc, {
                    startY: yPos,
                    head: [['Exercício', 'Séries', 'Reps', 'Técnica']],
                    body: tableBody,
                    theme: 'grid',
                    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
                    styles: { fontSize: 10 },
                    margin: { left: 14, right: 14 }
                });

                yPos = doc.lastAutoTable.finalY + 20;
            });

            // Footer
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);

                // Safety Warning if applicable
                if (currentSheet.needsProfessionalReview) {
                    doc.setFontSize(9);
                    doc.setTextColor(220, 38, 38); // Red
                    const reason = currentSheet.reviewReason || 'Limitações Identificadas';
                    doc.text(`⚠️ ATENÇÃO: Treino adaptado para: ${reason}. Recomendada revisão profissional.`, 105, 285, { align: 'center' });
                }

                doc.setFontSize(10);
                doc.setTextColor(150);
                doc.text(`Gerado por GymManager - Página ${i} de ${pageCount}`, 105, 292, { align: 'center' });
            }

            // Generate Blob and Share
            const blob = doc.output('blob');
            const file = new File([blob], `Treino_${student.name}.pdf`, { type: 'application/pdf' });

            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

            if (isMobile && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: `Treino - ${student.name}`,
                    text: `Olá ${student.name}, segue sua ficha de treino atualizada!`
                });
                addToast("Compartilhamento iniciado!", 'success');
            } else {
                // Fallback for Desktop: Notify user
                const phone = student.phone ? student.phone.replace(/\D/g, '') : '';
                if (phone) {
                    // We can't attach file via URL, so we guide the user
                    doc.save(`Treino_${student.name}.pdf`);
                    const message = `Olá ${student.name}, segue sua ficha de treino em anexo.`;
                    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(message)}`, '_blank');
                    addToast("PDF baixado. Anexe-o no WhatsApp que foi aberto.", 'info');
                } else {
                    doc.save(`Treino_${student.name}.pdf`);
                    addToast("Seu dispositivo não suporta compartilhamento direto. O PDF foi baixado.", 'info');
                }
            }

        } catch (error) {
            console.error("Erro ao compartilhar PDF:", error);
            addToast("Ocorreu um erro ao compartilhar.", 'error');
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
        try {
            const doc = new jsPDF();
            const currentSheet = getCurrentSheet();
            const workouts = currentSheet.workouts || (currentSheet.type === 'legacy' ? currentSheet.workouts : {});
            const variations = Object.keys(workouts).sort();

            if (variations.length === 0) {
                addToast("Nenhum treino encontrado nesta ficha para gerar o PDF.", 'info');
                return;
            }

            // Header Layer (Professional Dark Theme)
            doc.setFillColor(15, 23, 42); // Dark Slate/Blue
            doc.rect(0, 0, 210, 40, 'F');

            // Logo
            if (settings?.logoUrl) {
                try {
                    const logoBase64 = await getBase64FromUrl(settings.logoUrl);
                    // Increased size from 25x25 to 35x35 and adjusted position
                    doc.addImage(logoBase64, 'PNG', 14, 5, 30, 30);
                } catch (e) {
                    console.error("Failed to load logo", e);
                }
            }

            // Text
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            const gymName = settings?.gymName || "GymManager";
            doc.text(gymName, 105, 18, { align: 'center' });

            doc.setFontSize(14); // Slightly larger title
            doc.text("Ficha de Treino", 105, 30, { align: 'center' });

            // Reset for Body
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(12);
            doc.text(`Aluno: ${student.name}`, 14, 50); // Shifted down slightly
            doc.text(`Ficha: ${currentSheet.name || 'Principal'}`, 14, 58);
            if (student.objective) doc.text(`Objetivo: ${student.objective}`, 14, 66);

            let yPos = 70;

            variations.forEach((variation, index) => {
                if (yPos > 250) {
                    doc.addPage();
                    yPos = 20;
                }

                // Check for 'Rest' day
                if (workouts[variation]?.isRestDay) {
                    // Skip or handle rest day differently? For now let's assume standard format
                }

                doc.setFillColor(33, 150, 243);
                doc.rect(14, yPos - 8, 182, 10, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(14);
                doc.text(`Treino ${variation}`, 105, yPos - 1, { align: 'center' });
                yPos += 10;

                // Add Observations if present
                let exercisesData = workouts[variation];
                if (exercisesData?.observations) {
                    doc.setFontSize(10);
                    doc.setTextColor(100);
                    const splitObs = doc.splitTextToSize(`Obs: ${exercisesData.observations}`, 180);
                    doc.text(splitObs, 14, yPos);
                    yPos += (splitObs.length * 5) + 5;
                }

                let exercises = workouts[variation];
                if (!Array.isArray(exercises) && exercises?.exercises) {
                    exercises = exercises.exercises;
                }
                // Ensure exercises is array
                if (Array.isArray(exercises)) {
                    const tableBody = exercises.map(ex => [
                        ex.name,
                        ex.sets || '-',
                        ex.reps || '-',
                        ex.technique || '-'
                    ]);

                    autoTable(doc, {
                        startY: yPos,
                        head: [['Exercício', 'Séries', 'Reps', 'Técnica']],
                        body: tableBody,
                        theme: 'grid',
                        headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
                        styles: { fontSize: 10 },
                        margin: { left: 14, right: 14 }
                    });
                    yPos = doc.lastAutoTable.finalY + 20;
                }
            });

            // Footer
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(10);
                doc.setTextColor(150);
                doc.text(`Gerado por GymManager - Página ${i} de ${pageCount}`, 105, 290, { align: 'center' });
            }

            doc.save(`${student.name}_${currentSheet.name || 'Ficha'}.pdf`);
            addToast("PDF gerado com sucesso!", 'success');
        } catch (error) {
            console.error("Erro ao gerar PDF:", error);
            addToast("Ocorreu um erro ao gerar o PDF.", 'error');
        }
    };

    if (!student) return <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando...</div>;

    const TabButton = ({ id, label, icon: Icon }) => (
        <button
            onClick={() => setActiveTab(id)}
            style={{
                background: activeTab === id ? 'var(--primary)' : 'transparent',
                color: activeTab === id ? 'white' : 'var(--text-muted)',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'all 0.2s'
            }}
        >
            <Icon size={18} />
            {label}
        </button>
    );

    const handleOpenPaymentModal = () => {
        setPaymentForm({
            value: student.price || '89.90',
            method: 'Cartão de Crédito',
            date: new Date().toISOString().split('T')[0]
        });
        setShowPaymentModal(true);
    };

    const handleDeletePayment = async (indexToDelete) => {
        const confirmed = await confirm({
            title: 'Excluir Pagamento',
            message: 'Tem certeza que deseja remover este registro de pagamento?',
            confirmText: 'Excluir',
            type: 'danger'
        });

        if (!confirmed) return;

        try {
            const newHistory = student.paymentHistory.filter((_, index) => index !== indexToDelete);

            // Recalculate dates based on remaining history
            let newLastPaymentDate = null;
            let newNextPaymentDate = null;

            // Sort history to find the latest payment
            // Note: History is typically displayed DESC, but let's sort to be safe
            const sortedHistory = [...newHistory].sort((a, b) => new Date(b.date) - new Date(a.date));

            if (sortedHistory.length > 0) {
                const latestPayment = sortedHistory[0];
                newLastPaymentDate = latestPayment.date;

                const paymentDateObj = new Date(latestPayment.date);

                // Calculate next due date based on plan (Duplicate logic from register for safety/isolation)
                let monthsToAdd = 1;
                const plan = (student.plan || '').toLowerCase();
                if (plan.includes('trimestral') || plan.includes('quarterly')) monthsToAdd = 3;
                else if (plan.includes('semestral') || plan.includes('semiannual')) monthsToAdd = 6;
                else if (plan.includes('anual') || plan.includes('annual')) monthsToAdd = 12;

                const nextDueDate = new Date(paymentDateObj);
                nextDueDate.setMonth(nextDueDate.getMonth() + monthsToAdd);
                newNextPaymentDate = nextDueDate.toISOString();
            }
            // If no history remains, newNextPaymentDate is null (triggers fallback "due day this month" logic)

            await updateStudent(id, {
                ...student,
                paymentHistory: newHistory,
                lastPaymentDate: newLastPaymentDate,
                nextPaymentDate: newNextPaymentDate
            });
            addToast("Pagamento removido com sucesso.", 'success');
        } catch (error) {
            console.error("Error deleting payment:", error);
            addToast("Erro ao remover pagamento.", 'error');
        }
    };

    const handleRegisterPayment = async () => {
        try {
            const paymentAmount = parseFloat(paymentForm.value);
            // Fix timezone issue: split YYYY-MM-DD and create local date
            const [pYear, pMonth, pDay] = paymentForm.date.split('-').map(Number);
            const paymentDateObj = new Date(pYear, pMonth - 1, pDay, 12, 0, 0); // Noon to avoid DST/timezone shift

            // Calculate next due date based on plan
            let monthsToAdd = 1; // Default Monthly
            const plan = (student.plan || '').toLowerCase();

            if (plan.includes('trimestral') || plan.includes('quarterly')) monthsToAdd = 3;
            else if (plan.includes('semestral') || plan.includes('semiannual')) monthsToAdd = 6;
            else if (plan.includes('anual') || plan.includes('annual')) monthsToAdd = 12;

            const nextDueDate = new Date(paymentDateObj);
            nextDueDate.setMonth(nextDueDate.getMonth() + monthsToAdd);

            const newHistory = [
                {
                    date: paymentDateObj.toISOString(),
                    description: `Mensalidade - ${paymentDateObj.toLocaleDateString('pt-BR', { month: 'long' })}`,
                    value: paymentAmount,
                    status: 'Paid',
                    method: paymentForm.method
                },
                ...(student.paymentHistory || [])
            ];

            await updateStudent(id, {
                ...student,
                status: 'Active',
                paymentHistory: newHistory,
                lastPaymentDate: paymentDateObj.toISOString(),
                nextPaymentDate: nextDueDate.toISOString()
            });

            setShowPaymentModal(false);
            addToast(`Pagamento registrado! Próximo vencimento: ${nextDueDate.toLocaleDateString('pt-BR')}`, 'success');
        } catch (error) {
            console.error("Erro ao registrar pagamento:", error);
            addToast("Erro ao registrar pagamento.", 'error');
        }
    };

    const calculateAge = (dateString) => {
        if (!dateString) return null;
        const today = new Date();
        const birthDate = new Date(dateString);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const currentSheet = getCurrentSheet();
    const isLegacy = currentSheet?.type === 'legacy';

    // Sort legacy vs new (Newest First)
    const availableSheets = student.workoutSheets
        ? Object.entries(student.workoutSheets)
            .map(([k, v]) => ({ id: k, ...v }))
            .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        : [];

    const toggleAssessmentSelection = (assessment) => {
        if (selectedAssessments.find(a => a.id === assessment.id)) {
            setSelectedAssessments(selectedAssessments.filter(a => a.id !== assessment.id));
        } else {
            if (selectedAssessments.length >= 2) {
                addToast("Selecione no máximo 2 avaliações para comparar.", 'info');
                return;
            }
            setSelectedAssessments([...selectedAssessments, assessment]);
        }
    };

    const handlePhotoUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setUploadingPhoto(true);
        try {
            const storageRef = ref(storage, `students/${id}/photos/${Date.now()}_${file.name}`);
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);

            const photoData = {
                url: downloadURL,
                path: snapshot.ref.fullPath,
                date: new Date().toISOString(),
                name: file.name
            };

            await updateStudent(id, {
                photoGallery: arrayUnion(photoData)
            });

            setStudent(prev => ({
                ...prev,
                photoGallery: [...(prev.photoGallery || []), photoData]
            }));

            // If it's the first photo, set as profile picture automatically
            if (!student.profilePictureUrl) {
                await updateStudent(id, {
                    profilePictureUrl: downloadURL
                });
                setStudent(prev => ({ ...prev, profilePictureUrl: downloadURL }));
            }
            addToast("Foto enviada com sucesso!", 'success');

        } catch (error) {
            console.error("Error uploading photo:", error);
            addToast(`Erro ao enviar foto: ${error.message}`, 'error');
        } finally {
            setUploadingPhoto(false);
        }
    };

    const handleDeletePhoto = async (photo, indexToDelete) => {
        const confirmed = await confirm({
            title: 'Excluir Foto',
            message: 'Tem certeza que deseja excluir esta foto?',
            confirmText: 'Excluir',
            type: 'danger'
        });

        if (!confirmed) return;

        // Optimistically update UI
        // Use index for the local gallery state (guarantees single removal even with duplicates)
        if (indexToDelete !== undefined) {
            const newGallery = galleryItems.filter((_, i) => i !== indexToDelete);
            setGalleryItems(newGallery);
        } else {
            // Fallback if no index provided (legacy behavior, though we updated call site)
            setGalleryItems(prev => prev.filter(p => p.date !== photo.date));
        }

        setStudent(prev => ({
            ...prev,
            // Use date as unique key since simulated items have unique dates, 
            // or fall back to strictly not same object if dates matched (unlikely in this sim)
            photoGallery: prev.photoGallery ? prev.photoGallery.filter(p => p.date !== photo.date) : [],
            profilePictureUrl: prev.profilePictureUrl === photo.url ? null : prev.profilePictureUrl
        }));

        try {
            // Try deleting from storage if it has a path
            if (photo.path) {
                try {
                    const storageRef = ref(storage, photo.path);
                    await deleteObject(storageRef);
                } catch (storageError) {
                    console.warn("Could not delete from storage (might be local simulation):", storageError);
                }
            }

            await updateStudent(id, {
                photoGallery: arrayRemove(photo)
            });

            // If deleted photo was profile picture, unset it
            if (student.profilePictureUrl === photo.url) {
                await updateStudent(id, {
                    profilePictureUrl: null
                });
            }

            addToast("Foto excluída com sucesso!", 'success');

        } catch (error) {
            console.error("Error deleting photo:", error);
            addToast("Erro ao excluir foto.", 'error');
            // Revert UI on critical failure would go here, but complex with local state
        }
    };

    const handleSetProfilePicture = async (photoUrl) => {
        try {
            await updateStudent(id, {
                profilePictureUrl: photoUrl
            });
            setStudent(prev => ({ ...prev, profilePictureUrl: photoUrl }));
            addToast("Foto de perfil definida!", 'success');
        } catch (error) {
            console.error("Error setting profile picture:", error);
            addToast("Erro ao definir foto de perfil.", 'error');
        }
    };

    const ComparisonModal = () => {
        if (selectedAssessments.length !== 2) return null;

        // Ensure chronological order for comparison (Older -> Newer)
        const [a1, a2] = [...selectedAssessments].sort((a, b) => new Date(a.date.seconds * 1000) - new Date(b.date.seconds * 1000));

        const renderRow = (label, key, unit = '') => {
            const v1 = parseFloat(a1[key]) || 0;
            const v2 = parseFloat(a2[key]) || 0;
            const diff = v2 - v1;
            const isPositive = diff > 0;
            const neutral = Math.abs(diff) < 0.1;

            // Logic for colors (Reversed for Weight/Fat where Down is Good)
            const reverseColor = ['weight', 'bodyFat', 'waist', 'abdomen'].includes(key);
            let color = 'white';
            if (!neutral) {
                if (reverseColor) color = isPositive ? '#ef4444' : '#10b981';
                else color = isPositive ? '#10b981' : '#ef4444';
            }

            return (
                <div className="comparison-grid" style={{ padding: '0.8rem', borderBottom: '1px solid var(--border-glass)' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{label}</span>
                    <span style={{ fontWeight: 'bold' }}>{a1[key] ? `${a1[key]}${unit}` : '-'}</span>
                    <span style={{ fontWeight: 'bold' }}>{a2[key] ? `${a2[key]}${unit}` : '-'}</span>
                    <span style={{ color, fontWeight: 'bold', fontSize: '0.9rem' }}>
                        {neutral ? '-' : `${isPositive ? '+' : ''}${diff.toFixed(1)}${unit}`}
                    </span>
                </div>
            );
        };

        const downloadComparisonPDF = async () => {
            try {
                const doc = new jsPDF();

                // Header
                doc.setFillColor(15, 23, 42); // Dark Blue
                doc.rect(0, 0, 210, 40, 'F');

                if (settings?.logoUrl) {
                    try {
                        const logoBase64 = await getBase64FromUrl(settings.logoUrl);
                        doc.addImage(logoBase64, 'PNG', 14, 5, 30, 30);
                    } catch (e) {
                        console.error("Failed to load logo", e);
                    }
                }

                doc.setTextColor(255, 255, 255);
                doc.setFontSize(22);
                const gymName = settings?.gymName || "GymManager";
                doc.text(gymName, 105, 20, { align: 'center' });
                doc.setFontSize(12);
                doc.text("Relatório Comparativo de Evolução", 105, 30, { align: 'center' });

                // Student Info
                doc.setTextColor(0, 0, 0);
                doc.setFontSize(11);
                doc.text(`Aluno: ${student.name}`, 14, 50);
                doc.text(`Comparação: ${a1.dateString} vs ${a2.dateString}`, 14, 58);

                // Data Preparation
                const rows = [
                    // General
                    ['Peso (kg)', `${a1.weight}`, `${a2.weight}`, (a2.weight - a1.weight).toFixed(1)],
                    ['% Gordura', `${a1.bodyFat || '-'}`, `${a2.bodyFat || '-'}`, a1.bodyFat && a2.bodyFat ? (a2.bodyFat - a1.bodyFat).toFixed(1) : '-'],
                    ['Massa Magra (kg)', `${a1.muscleMass || '-'}`, `${a2.muscleMass || '-'}`, a1.muscleMass && a2.muscleMass ? (a2.muscleMass - a1.muscleMass).toFixed(1) : '-'],

                    // Upper Body
                    ['Bíceps Dir. (cm)', `${a1.bicepsRight || '-'}`, `${a2.bicepsRight || '-'}`, a1.bicepsRight && a2.bicepsRight ? (a2.bicepsRight - a1.bicepsRight).toFixed(1) : '-'],
                    ['Bíceps Esq. (cm)', `${a1.bicepsLeft || '-'}`, `${a2.bicepsLeft || '-'}`, a1.bicepsLeft && a2.bicepsLeft ? (a2.bicepsLeft - a1.bicepsLeft).toFixed(1) : '-'],
                    ['Peitoral (cm)', `${a1.chest || '-'}`, `${a2.chest || '-'}`, a1.chest && a2.chest ? (a2.chest - a1.chest).toFixed(1) : '-'],

                    // Trunk
                    ['Cintura (cm)', `${a1.waist || '-'}`, `${a2.waist || '-'}`, a1.waist && a2.waist ? (a2.waist - a1.waist).toFixed(1) : '-'],
                    ['Abdômen (cm)', `${a1.abdomen || '-'}`, `${a2.abdomen || '-'}`, a1.abdomen && a2.abdomen ? (a2.abdomen - a1.abdomen).toFixed(1) : '-'],
                    ['Quadril (cm)', `${a1.hips || '-'}`, `${a2.hips || '-'}`, a1.hips && a2.hips ? (a2.hips - a1.hips).toFixed(1) : '-'],

                    // Lower Body
                    ['Coxa Dir. (cm)', `${a1.thighRight || '-'}`, `${a2.thighRight || '-'}`, a1.thighRight && a2.thighRight ? (a2.thighRight - a1.thighRight).toFixed(1) : '-'],
                    ['Coxa Esq. (cm)', `${a1.thighLeft || '-'}`, `${a2.thighLeft || '-'}`, a1.thighLeft && a2.thighLeft ? (a2.thighLeft - a1.thighLeft).toFixed(1) : '-'],
                    ['Panturrilha Dir. (cm)', `${a1.calfRight || '-'}`, `${a2.calfRight || '-'}`, a1.calfRight && a2.calfRight ? (a2.calfRight - a1.calfRight).toFixed(1) : '-'],
                    ['Panturrilha Esq. (cm)', `${a1.calfLeft || '-'}`, `${a2.calfLeft || '-'}`, a1.calfLeft && a2.calfLeft ? (a2.calfLeft - a1.calfLeft).toFixed(1) : '-'],
                ];

                autoTable(doc, {
                    startY: 70,
                    head: [['Medida', `Valor (${a1.dateString})`, `Valor (${a2.dateString})`, 'Diferença']],
                    body: rows,
                    theme: 'grid',
                    headStyles: { fillColor: [30, 41, 59] },
                    styles: { fontSize: 10, halign: 'center' },
                    columnStyles: { 0: { halign: 'left', fontStyle: 'bold' } },
                    didParseCell: function (data) {
                        if (data.section === 'body' && data.column.index === 3) {
                            const val = parseFloat(data.cell.raw);
                            if (!isNaN(val) && val !== 0) {
                                // Logic for color: Weight/Fat/Waist/Abdomen Down is Good (Green), others Up is Good
                                const measure = data.row.raw[0].toString().toLowerCase();
                                const reverseColor = measure.includes('peso') || measure.includes('gordura') || measure.includes('cintura') || measure.includes('abdômen');

                                if (reverseColor) {
                                    data.cell.styles.textColor = val < 0 ? [16, 185, 129] : [239, 68, 68];
                                } else {
                                    data.cell.styles.textColor = val > 0 ? [16, 185, 129] : [239, 68, 68];
                                }

                                data.cell.text = (val > 0 ? '+' : '') + val.toFixed(1);
                            }
                        }
                    }
                });

                doc.save(`comparativo_${student.name.replace(/\s+/g, '_')}.pdf`);
                addToast("PDF comparativo gerado com sucesso!", 'success');
            } catch (error) {
                console.error("Erro ao gerar PDF comparativo:", error);
                addToast("Erro ao gerar PDF comparativo.", 'error');
            }
        };

        const shareComparisonPDF = async () => {
            try {
                const doc = new jsPDF();

                // Header
                doc.setFillColor(15, 23, 42); // Dark Blue
                doc.rect(0, 0, 210, 40, 'F');

                if (settings?.logoUrl) {
                    try {
                        const logoBase64 = await getBase64FromUrl(settings.logoUrl);
                        doc.addImage(logoBase64, 'PNG', 14, 5, 30, 30);
                    } catch (e) {
                        console.error("Failed to load logo", e);
                    }
                }

                doc.setTextColor(255, 255, 255);
                doc.setFontSize(22);
                const gymName = settings?.gymName || "GymManager";
                doc.text(gymName, 105, 20, { align: 'center' });
                doc.setFontSize(12);
                doc.text("Relatório Comparativo de Evolução", 105, 30, { align: 'center' });

                // Student Info
                doc.setTextColor(0, 0, 0);
                doc.setFontSize(11);
                doc.text(`Aluno: ${student.name}`, 14, 50);
                doc.text(`Comparação: ${a1.dateString} vs ${a2.dateString}`, 14, 58);

                // Data Preparation
                const rows = [
                    // General
                    ['Peso (kg)', `${a1.weight}`, `${a2.weight}`, (a2.weight - a1.weight).toFixed(1)],
                    ['% Gordura', `${a1.bodyFat || '-'}`, `${a2.bodyFat || '-'}`, a1.bodyFat && a2.bodyFat ? (a2.bodyFat - a1.bodyFat).toFixed(1) : '-'],
                    ['Massa Magra (kg)', `${a1.muscleMass || '-'}`, `${a2.muscleMass || '-'}`, a1.muscleMass && a2.muscleMass ? (a2.muscleMass - a1.muscleMass).toFixed(1) : '-'],

                    // Upper Body
                    ['Bíceps Dir. (cm)', `${a1.bicepsRight || '-'}`, `${a2.bicepsRight || '-'}`, a1.bicepsRight && a2.bicepsRight ? (a2.bicepsRight - a1.bicepsRight).toFixed(1) : '-'],
                    ['Bíceps Esq. (cm)', `${a1.bicepsLeft || '-'}`, `${a2.bicepsLeft || '-'}`, a1.bicepsLeft && a2.bicepsLeft ? (a2.bicepsLeft - a1.bicepsLeft).toFixed(1) : '-'],
                    ['Peitoral (cm)', `${a1.chest || '-'}`, `${a2.chest || '-'}`, a1.chest && a2.chest ? (a2.chest - a1.chest).toFixed(1) : '-'],

                    // Trunk
                    ['Cintura (cm)', `${a1.waist || '-'}`, `${a2.waist || '-'}`, a1.waist && a2.waist ? (a2.waist - a1.waist).toFixed(1) : '-'],
                    ['Abdômen (cm)', `${a1.abdomen || '-'}`, `${a2.abdomen || '-'}`, a1.abdomen && a2.abdomen ? (a2.abdomen - a1.abdomen).toFixed(1) : '-'],
                    ['Quadril (cm)', `${a1.hips || '-'}`, `${a2.hips || '-'}`, a1.hips && a2.hips ? (a2.hips - a1.hips).toFixed(1) : '-'],

                    // Lower Body
                    ['Coxa Dir. (cm)', `${a1.thighRight || '-'}`, `${a2.thighRight || '-'}`, a1.thighRight && a2.thighRight ? (a2.thighRight - a1.thighRight).toFixed(1) : '-'],
                    ['Coxa Esq. (cm)', `${a1.thighLeft || '-'}`, `${a2.thighLeft || '-'}`, a1.thighLeft && a2.thighLeft ? (a2.thighLeft - a1.thighLeft).toFixed(1) : '-'],
                    ['Panturrilha Dir. (cm)', `${a1.calfRight || '-'}`, `${a2.calfRight || '-'}`, a1.calfRight && a2.calfRight ? (a2.calfRight - a1.calfRight).toFixed(1) : '-'],
                    ['Panturrilha Esq. (cm)', `${a1.calfLeft || '-'}`, `${a2.calfLeft || '-'}`, a1.calfLeft && a2.calfLeft ? (a2.calfLeft - a1.calfLeft).toFixed(1) : '-'],
                ];

                autoTable(doc, {
                    startY: 70,
                    head: [['Medida', `Valor (${a1.dateString})`, `Valor (${a2.dateString})`, 'Diferença']],
                    body: rows,
                    theme: 'grid',
                    headStyles: { fillColor: [30, 41, 59] },
                    styles: { fontSize: 10, halign: 'center' },
                    columnStyles: { 0: { halign: 'left', fontStyle: 'bold' } },
                    didParseCell: function (data) {
                        if (data.section === 'body' && data.column.index === 3) {
                            const val = parseFloat(data.cell.raw);
                            if (!isNaN(val) && val !== 0) {
                                // Logic for color: Weight/Fat/Waist/Abdomen Down is Good (Green), others Up is Good
                                const measure = data.row.raw[0].toString().toLowerCase();
                                const reverseColor = measure.includes('peso') || measure.includes('gordura') || measure.includes('cintura') || measure.includes('abdômen');

                                if (reverseColor) {
                                    data.cell.styles.textColor = val < 0 ? [16, 185, 129] : [239, 68, 68];
                                } else {
                                    data.cell.styles.textColor = val > 0 ? [16, 185, 129] : [239, 68, 68];
                                }

                                data.cell.text = (val > 0 ? '+' : '') + val.toFixed(1);
                            }
                        }
                    }
                });

                const blob = doc.output('blob');
                const file = new File([blob], `Comparativo_${student.name}.pdf`, { type: 'application/pdf' });

                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: `Comparativo - ${student.name}`,
                        text: `Olá ${student.name}, confira seu comparativo de evolução!`
                    });
                    addToast("Compartilhamento iniciado!", 'success');
                } else {
                    const phone = student.phone ? student.phone.replace(/\D/g, '') : '';
                    if (phone) {
                        doc.save(`Comparativo_${student.name}.pdf`);
                        const message = `Olá ${student.name}, segue seu comparativo de evolução em anexo.`;
                        window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(message)}`, '_blank');
                        addToast("PDF baixado. Anexe-o no WhatsApp.", 'info');
                    } else {
                        doc.save(`Comparativo_${student.name}.pdf`);
                        addToast("PDF baixado.", 'info');
                    }
                }

            } catch (error) {
                console.error("Erro ao compartilhar PDF comparativo:", error);
                addToast("Erro ao compartilhar PDF comparativo.", 'error');
            }
        };

        return (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                <div className="glass-panel" style={{ width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', background: 'var(--card-bg)', padding: '0', color: 'var(--text-main)' }}>
                    <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'var(--card-bg)', zIndex: 10 }}>
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'var(--text-main)' }}>
                            <Scale size={24} color="var(--primary)" />
                            Comparativo de Evolução
                        </h3>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <button onClick={shareComparisonPDF} title="Compartilhar WhatsApp" style={{ background: 'transparent', border: '1px solid #25D366', color: '#25D366', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <MessageCircle size={20} />
                            </button>
                            <button onClick={downloadComparisonPDF} title="Baixar PDF" style={{ background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Download size={20} />
                            </button>
                            <button onClick={() => setShowComparison(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                        </div>
                    </div>

                    <div style={{ padding: '1.5rem' }}>
                        <div className="comparison-grid" style={{ padding: '0.8rem', background: 'var(--input-bg)', borderRadius: '8px', marginBottom: '1rem', fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                            <span>Medida</span>
                            <span>{a1.dateString}</span>
                            <span>{a2.dateString}</span>
                            <span>Diferença</span>
                        </div>

                        {/* General Data */}
                        <h5 style={{ color: 'var(--primary)', margin: '1rem 0 0.5rem 0', textTransform: 'uppercase', fontSize: '0.8rem' }}>Dados Gerais</h5>
                        {renderRow('Peso', 'weight', 'kg')}
                        {renderRow('Altura', 'height', 'm')}
                        {renderRow('% Gordura', 'bodyFat', '%')}
                        {renderRow('Massa Magra', 'muscleMass', 'kg')}

                        {/* Upper Body */}
                        <h5 style={{ color: 'var(--primary)', margin: '1.5rem 0 0.5rem 0', textTransform: 'uppercase', fontSize: '0.8rem' }}>Membros Superiores</h5>
                        {renderRow('Bíceps Direito', 'bicepsRight', 'cm')}
                        {renderRow('Bíceps Esquerdo', 'bicepsLeft', 'cm')}
                        {renderRow('Tríceps Direito', 'tricepsRight', 'cm')}
                        {renderRow('Tríceps Esquerdo', 'tricepsLeft', 'cm')}
                        {renderRow('Peitoral', 'chest', 'cm')}

                        {/* Trunk */}
                        <h5 style={{ color: 'var(--primary)', margin: '1.5rem 0 0.5rem 0', textTransform: 'uppercase', fontSize: '0.8rem' }}>Tronco</h5>
                        {renderRow('Cintura', 'waist', 'cm')}
                        {renderRow('Abdômen', 'abdomen', 'cm')}
                        {renderRow('Quadril', 'hips', 'cm')}

                        {/* Lower Body */}
                        <h5 style={{ color: 'var(--primary)', margin: '1.5rem 0 0.5rem 0', textTransform: 'uppercase', fontSize: '0.8rem' }}>Membros Inferiores</h5>
                        {renderRow('Coxa Direita', 'thighRight', 'cm')}
                        {renderRow('Coxa Esquerda', 'thighLeft', 'cm')}
                        {renderRow('Panturrilha Dir.', 'calfRight', 'cm')}
                        {renderRow('Panturrilha Esq.', 'calfLeft', 'cm')}
                    </div>
                </div>
            </div>
        );
    };

    const downloadAssessmentPDF = async (assessment) => {
        try {
            const doc = new jsPDF();

            // Header
            doc.setFillColor(15, 23, 42); // Dark Blue
            doc.rect(0, 0, 210, 40, 'F');

            if (settings?.logoUrl) {
                try {
                    const logoBase64 = await getBase64FromUrl(settings.logoUrl);
                    doc.addImage(logoBase64, 'PNG', 14, 5, 30, 30);
                } catch (e) {
                    console.error("Failed to load logo", e);
                }
            }

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            const gymName = settings?.gymName || "GymManager";
            doc.text(gymName, 105, 18, { align: 'center' });
            doc.setFontSize(14);
            doc.text("Relatório de Avaliação Física", 105, 30, { align: 'center' });

            // Student Info
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(11);
            doc.text(`Aluno: ${student.name}`, 14, 50);
            doc.text(`Data da Avaliação: ${assessment.dateString}`, 14, 58);
            if (student.email) doc.text(`Email: ${student.email}`, 14, 66);

            // Basic Measurements Table
            const basicData = [
                ['Peso', `${assessment.weight} kg`],
                ['Altura', assessment.height ? `${assessment.height} m` : '-'],
                ['Gordura Corporal', assessment.bodyFat ? `${assessment.bodyFat}%` : '-'],
                ['Massa Magra', assessment.muscleMass ? `${assessment.muscleMass} kg` : '-'],
            ];

            autoTable(doc, {
                startY: 75,
                head: [['Medida', 'Valor']],
                body: basicData,
                theme: 'striped',
                headStyles: { fillColor: [16, 185, 129] }, // Green primary
                styles: { fontSize: 10 }
            });

            // Detailed Measurements
            const detailedData = [
                ['Bíceps (D / E)', `${assessment.bicepsRight || '-'} cm  /  ${assessment.bicepsLeft || '-'} cm`],
                ['Tríceps (D / E)', `${assessment.tricepsRight || '-'} cm  /  ${assessment.tricepsLeft || '-'} cm`],
                ['Coxa (D / E)', `${assessment.thighRight || '-'} cm  /  ${assessment.thighLeft || '-'} cm`],
                ['Panturrilha (D / E)', `${assessment.calfRight || '-'} cm  /  ${assessment.calfLeft || '-'} cm`],
                ['Peitoral', `${assessment.chest || '-'} cm`],
                ['Cintura', `${assessment.waist || '-'} cm`],
                ['Abdômen', `${assessment.abdomen || '-'} cm`],
                ['Quadril', `${assessment.hips || '-'} cm`],
            ];

            doc.text("Medidas Circunferência", 14, doc.lastAutoTable.finalY + 15);

            autoTable(doc, {
                startY: doc.lastAutoTable.finalY + 20,
                head: [['Região', 'Medidas']],
                body: detailedData,
                theme: 'grid',
                headStyles: { fillColor: [30, 41, 59] }, // Slate
                styles: { fontSize: 10 }
            });

            // Notes
            if (assessment.notes) {
                doc.text("Notas / Observações", 14, doc.lastAutoTable.finalY + 15);
                doc.setFontSize(10);
                doc.setTextColor(100);
                const splitNotes = doc.splitTextToSize(assessment.notes, 180);
                doc.text(splitNotes, 14, doc.lastAutoTable.finalY + 22);
            }

            doc.save(`avaliacao_${student.name.replace(/\s+/g, '_')}_${assessment.dateString.replace(/\//g, '-')}.pdf`);
            addToast("PDF baixado com sucesso!", 'success');
        } catch (error) {
            console.error("Erro ao gerar PDF:", error);
            addToast("Erro ao baixar PDF.", 'error');
        }
    };

    const shareAssessmentPDF = async (assessment) => {
        try {
            const doc = new jsPDF();

            // Header
            doc.setFillColor(15, 23, 42); // Dark Blue
            doc.rect(0, 0, 210, 40, 'F');

            if (settings?.logoUrl) {
                try {
                    const logoBase64 = await getBase64FromUrl(settings.logoUrl);
                    doc.addImage(logoBase64, 'PNG', 14, 5, 30, 30);
                } catch (e) {
                    console.error("Failed to load logo", e);
                }
            }

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);

            const gymName = settings?.gymName || "GymManager";
            doc.text(gymName, 105, 18, { align: 'center' });
            doc.setFontSize(14);
            doc.text("Relatório de Avaliação Física", 105, 30, { align: 'center' });

            // Student Info
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(11);
            doc.text(`Aluno: ${student.name}`, 14, 50);
            doc.text(`Data da Avaliação: ${assessment.dateString}`, 14, 58);
            if (student.email) doc.text(`Email: ${student.email}`, 14, 66);

            // Basic Measurements Table
            const basicData = [
                ['Peso', `${assessment.weight} kg`],
                ['Altura', assessment.height ? `${assessment.height} m` : '-'],
                ['Gordura Corporal', assessment.bodyFat ? `${assessment.bodyFat}%` : '-'],
                ['Massa Magra', assessment.muscleMass ? `${assessment.muscleMass} kg` : '-'],
            ];

            autoTable(doc, {
                startY: 75,
                head: [['Medida', 'Valor']],
                body: basicData,
                theme: 'striped',
                headStyles: { fillColor: [16, 185, 129] }, // Green primary
                styles: { fontSize: 10 }
            });

            // Detailed Measurements
            const detailedData = [
                ['Bíceps (D / E)', `${assessment.bicepsRight || '-'} cm  /  ${assessment.bicepsLeft || '-'} cm`],
                ['Tríceps (D / E)', `${assessment.tricepsRight || '-'} cm  /  ${assessment.tricepsLeft || '-'} cm`],
                ['Coxa (D / E)', `${assessment.thighRight || '-'} cm  /  ${assessment.thighLeft || '-'} cm`],
                ['Panturrilha (D / E)', `${assessment.calfRight || '-'} cm  /  ${assessment.calfLeft || '-'} cm`],
                ['Peitoral', `${assessment.chest || '-'} cm`],
                ['Cintura', `${assessment.waist || '-'} cm`],
                ['Abdômen', `${assessment.abdomen || '-'} cm`],
                ['Quadril', `${assessment.hips || '-'} cm`],
            ];

            doc.text("Medidas Circunferência", 14, doc.lastAutoTable.finalY + 15);

            autoTable(doc, {
                startY: doc.lastAutoTable.finalY + 20,
                head: [['Região', 'Medidas']],
                body: detailedData,
                theme: 'grid',
                headStyles: { fillColor: [30, 41, 59] }, // Slate
                styles: { fontSize: 10 }
            });

            // Notes
            if (assessment.notes) {
                doc.text("Notas / Observações", 14, doc.lastAutoTable.finalY + 15);
                doc.setFontSize(10);
                doc.setTextColor(100);
                const splitNotes = doc.splitTextToSize(assessment.notes, 180);
                doc.text(splitNotes, 14, doc.lastAutoTable.finalY + 22);
            }

            const blob = doc.output('blob');
            const file = new File([blob], `Avaliacao_${student.name}_${assessment.dateString.replace(/\//g, '-')}.pdf`, { type: 'application/pdf' });

            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

            if (isMobile && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: `Avaliação - ${student.name}`,
                    text: `Olá ${student.name}, segue sua avaliação física de ${assessment.dateString}.`
                });
                addToast("Compartilhamento iniciado!", 'success');
            } else {
                const phone = student.phone ? student.phone.replace(/\D/g, '') : '';
                if (phone) {
                    doc.save(`Avaliacao_${student.name}.pdf`);
                    const message = `Olá ${student.name}, segue sua avaliação física de ${assessment.dateString} em anexo.`;
                    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(message)}`, '_blank');
                    addToast("PDF baixado. Anexe-o no WhatsApp que foi aberto.", 'info');
                } else {
                    doc.save(`Avaliacao_${student.name}.pdf`);
                    addToast("Seu dispositivo não suporta compartilhamento direto. O PDF foi baixado.", 'info');
                }
            }

        } catch (error) {
            console.error("Erro ao compartilhar PDF:", error);
            addToast("Erro ao compartilhar PDF.", 'error');
        }
    };

    return (
        <div style={{ paddingBottom: '4rem' }}>
            <style>{`
                .student-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                }
                .student-info {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }
                .student-actions {
                    display: flex;
                    gap: 1rem;
                }
                
                @media (max-width: 768px) {
                    .student-header {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 1.5rem;
                    }
                    .student-info { 
                        width: 100%;
                    }
                    .student-info h1 {
                        font-size: 1.5rem !important;
                        word-break: break-word;
                    }
                    .student-actions {
                        width: 100%;
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                    }
                    .student-actions button, .student-actions a {
                        justify-content: center;
                    }
                    .hide-mobile-chart {
                        display: none !important;
                    }
                    .comparison-grid {
                        grid-template-columns: 1.2fr 1fr 1fr 0.8fr !important;
                        font-size: 0.75rem !important;
                        gap: 0.25rem !important;
                    }
                    .comparison-grid span {
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                    }
                }

                .comparison-grid {
                    display: grid;
                    grid-template-columns: 1.5fr 1fr 1fr 1fr;
                    gap: 1rem;
                    align-items: center;
                }
            `}</style>

            {/* Header */}
            <div className="student-header">
                <div className="student-info">
                    <button onClick={() => navigate('/app/students')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: 0 }}>
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 style={{ fontSize: '1.8rem', marginBottom: '0.25rem', lineHeight: 1.2 }}>{student.name}</h1>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <span style={{
                                fontSize: '0.85rem',
                                padding: '0.2rem 0.8rem',
                                borderRadius: '20px',
                                background: student.status === 'Active' ? 'rgba(16, 185, 129, 0.2)' : student.status === 'Pending' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                color: student.status === 'Active' ? '#10b981' : student.status === 'Pending' ? '#eab308' : '#ef4444',
                            }}>
                                {student.status === 'Active' ? 'Ativo' : student.status === 'Pending' ? 'Pendente' : 'Inativo'}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="student-actions">
                    {student.phone && (
                        <button onClick={handleWhatsApp} style={{
                            background: '#25D366',
                            color: 'white',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '12px',
                            fontWeight: '600',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            boxShadow: '0 4px 12px rgba(37, 211, 102, 0.4)'
                        }}>
                            <MessageCircle size={20} />
                            <span className="hide-mobile">WhatsApp</span>
                        </button>
                    )}
                    <Link to={`/app/students/${id}/edit`} style={{
                        background: 'var(--input-bg)',
                        color: 'var(--text-main)',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '12px',
                        fontWeight: '600',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        border: '1px solid var(--border-glass)'
                    }}>
                        <Edit2 size={20} />
                        Editar
                    </Link>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '3rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1rem', overflowX: 'auto' }}>
                <TabButton id="overview" label="Visão Geral" icon={User} />
                <TabButton id="assessments" label="Avaliações" icon={Activity} />
                <TabButton id="map" label="Mapa Corporal" icon={Accessibility} />
                <TabButton id="workouts" label="Treinos" icon={Dumbbell} />
                <TabButton id="financial" label="Financeiro" icon={DollarSign} />
                <TabButton id="photos" label="Fotos" icon={ImageIcon} />
            </div>

            {/* Content Area */}
            <div style={{ marginTop: '2rem' }}>

                {activeTab === 'overview' && (<>
                    <style>{`
                        .details-overview-grid {
                            display: grid;
                            grid-template-columns: 350px 1fr;
                            gap: 2rem;
                            align-items: start;
                        }

                        @media (max-width: 1024px) {
                            .details-overview-grid {
                                grid-template-columns: 1fr 1fr; /* Tablet: 50/50 might be ok, or stacked? Let's go stacked for safety if narrow */
                            }
                        }

                        @media (max-width: 768px) {
                            .details-overview-grid {
                                grid-template-columns: 1fr;
                                gap: 1.5rem;
                            }
                        }
                    `}</style>
                    <div className="details-overview-grid">
                        {/* LEFT COLUMN: Profile & Personal */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {/* Profile Card */}
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                                <StudentCard student={student} settings={settings} style={{ width: '300px' }} />
                            </div>

                            {/* Plan Summary */}
                            {/* Plan Summary */}
                            {(() => {
                                // Payment Logic Lifted for Overview
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);

                                let nextPaymentDate = null;
                                if (student.nextPaymentDate) {
                                    nextPaymentDate = new Date(student.nextPaymentDate);
                                } else {
                                    const dueDay = parseInt(student.paymentDay);
                                    if (!isNaN(dueDay)) {
                                        nextPaymentDate = new Date(today.getFullYear(), today.getMonth(), dueDay);
                                    }
                                }

                                if (nextPaymentDate) nextPaymentDate.setHours(0, 0, 0, 0);
                                const isOverdue = nextPaymentDate && nextPaymentDate < today;

                                return (
                                    <div className="glass-panel" style={{
                                        padding: '1.5rem',
                                        background: isOverdue ? 'rgba(239, 68, 68, 0.1)' : 'var(--card-bg)',
                                        border: isOverdue ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid var(--border-glass)',
                                        position: 'relative'
                                    }}>
                                        <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                                            Plano Atual
                                            {isOverdue && <span style={{ marginLeft: '0.5rem', color: '#ef4444', fontWeight: 'bold' }}>(PENDENTE)</span>}
                                        </h4>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--text-main)' }}>
                                                {{
                                                    'Monthly': 'Mensal',
                                                    'monthly': 'Mensal',
                                                    'Quarterly': 'Trimestral',
                                                    'quarterly': 'Trimestral',
                                                    'Semiannual': 'Semestral',
                                                    'semiannual': 'Semestral',
                                                    'Annual': 'Anual',
                                                    'annual': 'Anual'
                                                }[student.plan] || student.plan}
                                            </span>
                                            <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>
                                                {student.price ? `R$ ${parseFloat(student.price).toFixed(2)}` : '-'}
                                            </span>
                                        </div>
                                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>
                                            {isOverdue ? 'Venceu em ' : 'Vence dia '}
                                            <span style={{ color: isOverdue ? '#ef4444' : 'var(--text-main)', fontWeight: isOverdue ? 'bold' : 'normal' }}>
                                                {nextPaymentDate
                                                    ? nextPaymentDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })
                                                    : student.paymentDay}
                                            </span>
                                        </p>

                                        {isOverdue && (
                                            <button
                                                onClick={handleWhatsApp}
                                                style={{
                                                    marginTop: '1rem',
                                                    width: '100%',
                                                    background: '#25D366',
                                                    color: 'white',
                                                    border: 'none',
                                                    padding: '0.6rem',
                                                    borderRadius: '8px',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '0.5rem'
                                                }}
                                            >
                                                <MessageCircle size={18} />
                                                Cobrar no WhatsApp
                                            </button>
                                        )}
                                    </div>
                                );
                            })()}

                            {/* Contact Info */}
                            <div className="glass-panel" style={{ padding: '1.5rem', background: 'var(--card-bg)' }}>
                                <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Contato</h4>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Email</label>
                                    <span style={{ color: 'var(--text-main)' }}>{student.email || '-'}</span>
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Telefone</label>
                                    <span style={{ color: 'var(--text-main)' }}>{student.phone || '-'}</span>
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Endereço</label>
                                    <span style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>{student.address || '-'}</span>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>CPF</label>
                                    <span style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>{student.cpf || '-'}</span>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Anamnesis & Extras */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)' }}>Anamnese e Objetivos</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
                                {/* Objective */}
                                <div className="glass-panel" style={{ padding: '1.5rem', background: 'var(--card-bg)', borderLeft: '3px solid var(--primary)' }}>
                                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Objetivo</label>
                                    <p style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: '0.5rem 0 0 0', color: 'var(--text-main)' }}>{student.objective || '---'}</p>
                                </div>

                                {/* Frequency */}
                                <div className="glass-panel" style={{ padding: '1.5rem', background: 'var(--card-bg)' }}>
                                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Frequência</label>
                                    <p style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: '0.5rem 0 0 0', color: 'var(--text-main)' }}>{student.trainingFrequency || '---'}</p>
                                </div>

                                {/* Routine */}
                                <div className="glass-panel" style={{ padding: '1.5rem', background: 'var(--card-bg)' }}>
                                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Rotina</label>
                                    <p style={{ fontSize: '1rem', margin: '0.5rem 0 0 0', color: 'var(--text-main)' }}>{student.routine || '---'}</p>
                                </div>

                                {/* Limitations */}
                                <div className="glass-panel" style={{
                                    padding: '1.5rem',
                                    background: student.limitations ? 'rgba(239, 68, 68, 0.1)' : 'var(--input-bg)',
                                    border: student.limitations ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--border-glass)'
                                }}>
                                    <label style={{ fontSize: '0.75rem', color: student.limitations ? '#b91c1c' : 'var(--text-muted)', textTransform: 'uppercase' }}>Limitações</label>
                                    <p style={{ fontSize: '1rem', margin: '0.5rem 0 0 0', color: student.limitations ? '#b91c1c' : 'var(--text-main)' }}>{student.limitations || 'Nenhuma'}</p>
                                </div>

                                {/* Diseases */}
                                <div className="glass-panel" style={{
                                    padding: '1.5rem',
                                    background: student.diseases ? 'rgba(234, 179, 8, 0.1)' : 'var(--input-bg)',
                                    border: student.diseases ? '1px solid rgba(234, 179, 8, 0.3)' : '1px solid var(--border-glass)'
                                }}>
                                    <label style={{ fontSize: '0.75rem', color: student.diseases ? '#b45309' : 'var(--text-muted)', textTransform: 'uppercase' }}>Histórico Médico</label>
                                    <p style={{ fontSize: '1rem', margin: '0.5rem 0 0 0', color: student.diseases ? '#b45309' : 'var(--text-main)' }}>{student.diseases || 'Nenhum'}</p>
                                </div>
                            </div>

                            {/* ZERO ASSESSMENTS PLACEHOLDER */}
                            {assessments.length === 0 && (
                                <div className="glass-panel" style={{
                                    padding: '3rem',
                                    textAlign: 'center',
                                    marginTop: '2rem',
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '2px dashed var(--border-glass)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <div style={{
                                        width: '64px', height: '64px', borderRadius: '50%',
                                        background: 'rgba(16, 185, 129, 0.1)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        marginBottom: '1rem'
                                    }}>
                                        <Activity size={32} color="#10b981" />
                                    </div>
                                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem' }}>Comece a monitorar o progresso</h3>
                                    <p style={{ color: 'var(--text-muted)', maxWidth: '450px', margin: '0 auto 1.5rem auto' }}>
                                        Nenhuma avaliação física foi registrada para este aluno ainda. Adicione a primeira para acompanhar a evolução.
                                    </p>
                                    <button
                                        onClick={() => { setActiveTab('assessments'); setShowAssessmentForm(true); }}
                                        style={{
                                            background: '#10b981',
                                            color: 'white',
                                            border: 'none',
                                            padding: '0.8rem 1.5rem',
                                            borderRadius: '12px',
                                            cursor: 'pointer',
                                            fontWeight: '600',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
                                            transition: 'transform 0.2s'
                                        }}
                                        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                    >
                                        <Plus size={20} />
                                        Realizar Primeira Avaliação
                                    </button>
                                </div>
                            )}

                            {/* Additional Info / Note placeholder if needed */}
                            {/* Additional Info / Note placeholder if needed */}
                            {/* CPF Deleted from here */}

                            {/* Progress Chart Section - Moved here for Dashboard Layout */}
                            {assessments.length > 0 && (
                                <div className="glass-panel hide-mobile-chart" style={{ padding: '1.5rem', background: 'var(--card-bg)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                        <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)' }}>Progresso (Peso & Gordura)</h3>
                                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent)' }}></div>
                                                Peso
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }}></div>
                                                Gordura
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ height: '400px', width: '100%' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={[...assessments].reverse().map(a => {
                                                let dateObj = new Date();
                                                if (a.date?.seconds) dateObj = new Date(a.date.seconds * 1000);
                                                else if (a.date instanceof Date) dateObj = a.date;
                                                else if (a.date) dateObj = new Date(a.date);

                                                const dateStr = !isNaN(dateObj) ? dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '??/??';

                                                return {
                                                    name: dateStr,
                                                    weight: parseFloat((a.weight || 0).toString().replace(',', '.')),
                                                    bodyFat: parseFloat((a.bodyFat || 0).toString().replace(',', '.'))
                                                };
                                            })}>
                                                <defs>
                                                    <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                                                    </linearGradient>
                                                    <linearGradient id="colorFat" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-glass)" vertical={false} />
                                                <XAxis
                                                    dataKey="name"
                                                    stroke="var(--text-muted)"
                                                    tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                                                    tickLine={false}
                                                    axisLine={false}
                                                />
                                                <YAxis
                                                    yAxisId="left"
                                                    orientation="left"
                                                    stroke="var(--accent)"
                                                    tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                                                    tickLine={false}
                                                    axisLine={false}
                                                    domain={['dataMin - 2', 'dataMax + 2']}
                                                />
                                                <YAxis
                                                    yAxisId="right"
                                                    orientation="right"
                                                    stroke="#10b981"
                                                    tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                                                    tickLine={false}
                                                    axisLine={false}
                                                    unit="%"
                                                />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-glass)', borderRadius: '8px', color: 'var(--text-main)' }}
                                                    itemStyle={{ color: 'var(--text-main)' }}
                                                    labelStyle={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}
                                                />
                                                <Area
                                                    yAxisId="left"
                                                    type="monotone"
                                                    dataKey="weight"
                                                    stroke="var(--accent)"
                                                    strokeWidth={2}
                                                    fillOpacity={1}
                                                    fill="url(#colorWeight)"
                                                    name="Peso (kg)"
                                                />
                                                <Area
                                                    yAxisId="right"
                                                    type="monotone"
                                                    dataKey="bodyFat"
                                                    stroke="#10b981"
                                                    strokeWidth={2}
                                                    fillOpacity={1}
                                                    fill="url(#colorFat)"
                                                    name="Gordura (%)"
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            )}

                            {/* Body Map removed from here */}
                        </div>
                    </div>
                </>)}

                {activeTab === 'map' && (
                    <div className="glass-panel" style={{ padding: '2rem', background: 'var(--card-bg)', minHeight: '600px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ width: '100%', maxWidth: '900px' }}>
                            <div style={{ marginBottom: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', color: 'var(--text-main)' }}>Mapa Corporal</h3>
                                {assessments.length > 0 ? (
                                    <span>
                                        Comparando: <strong style={{ color: 'var(--primary)' }}>
                                            {assessments[0].dateString || new Date(assessments[0].date.seconds * 1000).toLocaleDateString('pt-BR')}
                                        </strong>
                                        {' vs '}
                                        {assessments[1]
                                            ? (assessments[1].dateString || new Date(assessments[1].date.seconds * 1000).toLocaleDateString('pt-BR'))
                                            : 'Início'}
                                    </span>
                                ) : (
                                    <span>Nenhuma avaliação registrada.</span>
                                )}
                            </div>

                            {assessments.length > 0 && (
                                <BodyMeasurementMap
                                    current={assessments[0]}
                                    previous={assessments[1]}
                                    gender={student.gender}
                                />
                            )}
                        </div>
                    </div>
                )}
                {
                    activeTab === 'assessments' && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 style={{ margin: 0 }}>Histórico de Evolução</h3>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    {selectedAssessments.length === 2 && (
                                        <button
                                            onClick={() => setShowComparison(true)}
                                            style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', gap: '0.5rem', alignItems: 'center', boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)' }}
                                        >
                                            <Scale size={18} /> Comparar (2)
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setShowAssessmentForm(!showAssessmentForm)}
                                        className="btn-primary"
                                        style={{ padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.9rem' }}
                                    >
                                        <Plus size={18} /> Nova Avaliação
                                    </button>
                                </div>
                            </div>

                            {showComparison && <ComparisonModal />}

                            {showAssessmentForm && (
                                <form onSubmit={handleAddAssessment} className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', border: '1px solid var(--primary)' }}>
                                    <h4 style={{ marginTop: 0, marginBottom: '1rem' }}>{editingAssessmentId ? 'Editar Avaliação' : 'Registrar Nova Avaliação'}</h4>
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <h5 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.85rem', textTransform: 'uppercase' }}>Dados Gerais</h5>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                                            <div>
                                                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Peso (kg)</label>
                                                <input required type="number" step="0.1" style={{ width: '100%', padding: '0.5rem', background: 'var(--input-bg)', border: '1px solid var(--border-glass)', borderRadius: '6px', color: 'var(--text-main)' }}
                                                    value={newAssessment.weight} onChange={e => setNewAssessment({ ...newAssessment, weight: e.target.value })} />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Altura (m)</label>
                                                <input type="number" step="0.01" style={{ width: '100%', padding: '0.5rem', background: 'var(--input-bg)', border: '1px solid var(--border-glass)', borderRadius: '6px', color: 'var(--text-main)' }}
                                                    value={newAssessment.height} onChange={e => setNewAssessment({ ...newAssessment, height: e.target.value })} />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>% Gordura</label>
                                                <input type="number" step="0.1" style={{ width: '100%', padding: '0.5rem', background: 'var(--input-bg)', border: '1px solid var(--border-glass)', borderRadius: '6px', color: 'var(--text-main)' }}
                                                    value={newAssessment.bodyFat} onChange={e => setNewAssessment({ ...newAssessment, bodyFat: e.target.value })} />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Massa Magra (kg)</label>
                                                <input type="number" step="0.1" style={{ width: '100%', padding: '0.5rem', background: 'var(--input-bg)', border: '1px solid var(--border-glass)', borderRadius: '6px', color: 'var(--text-main)' }}
                                                    value={newAssessment.muscleMass} onChange={e => setNewAssessment({ ...newAssessment, muscleMass: e.target.value })} />
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <h5 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.85rem', textTransform: 'uppercase' }}>Medidas Detalhadas (cm)</h5>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '1rem' }}>
                                            {[
                                                { label: 'Bíceps Dir.', key: 'bicepsRight' }, { label: 'Bíceps Esq.', key: 'bicepsLeft' },
                                                { label: 'Tríceps Dir.', key: 'tricepsRight' }, { label: 'Tríceps Esq.', key: 'tricepsLeft' },
                                                { label: 'Peitoral', key: 'chest' }, { label: 'Cintura', key: 'waist' },
                                                { label: 'Abdômen', key: 'abdomen' }, { label: 'Quadril', key: 'hips' },
                                                { label: 'Coxa Dir.', key: 'thighRight' }, { label: 'Coxa Esq.', key: 'thighLeft' },
                                                { label: 'Panturrilha D.', key: 'calfRight' }, { label: 'Panturrilha E.', key: 'calfLeft' },
                                            ].map(field => (
                                                <div key={field.key} style={{ background: 'var(--input-bg)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                                                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>{field.label}</label>
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        style={{ width: '100%', padding: '0.25rem', background: 'transparent', border: 'none', color: 'var(--text-main)', borderBottom: '1px solid var(--text-muted)', outline: 'none', fontWeight: 'bold' }}
                                                        value={newAssessment[field.key] || ''}
                                                        onChange={e => setNewAssessment({ ...newAssessment, [field.key]: e.target.value })}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Notas / Medidas Adicionais</label>
                                        <textarea rows="3" style={{ width: '100%', padding: '0.5rem', background: 'var(--input-bg)', border: '1px solid var(--border-glass)', borderRadius: '6px', color: 'var(--text-main)' }}
                                            value={newAssessment.notes} onChange={e => setNewAssessment({ ...newAssessment, notes: e.target.value })} placeholder="Ex: Braço: 35cm, Peito: 100cm..." />
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                        <button type="button" onClick={() => setShowAssessmentForm(false)} style={{ background: 'transparent', border: '1px solid var(--border-glass)', color: 'var(--text-muted)', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' }}>Cancelar</button>
                                        <button type="submit" style={{ background: 'var(--primary)', border: 'none', color: 'white', padding: '0.5rem 1.5rem', borderRadius: '6px', cursor: 'pointer' }}>Salvar</button>
                                    </div>
                                </form>
                            )}

                            {assessments.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                                    <Activity size={32} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                                    <p>Nenhuma avaliação registrada.</p>
                                </div>
                            ) : (
                                <div style={{ position: 'relative' }}>
                                    {/* Navigation Arrows */}
                                    <button
                                        type="button"
                                        onClick={() => scroll(-300)}
                                        style={{
                                            position: 'absolute', left: '-1rem', top: '50%', transform: 'translateY(-50%)',
                                            zIndex: 10, background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none',
                                            borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
                                        }}
                                    >
                                        <ChevronLeft size={24} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => scroll(300)}
                                        style={{
                                            position: 'absolute', right: '-1rem', top: '50%', transform: 'translateY(-50%)',
                                            zIndex: 10, background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none',
                                            borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
                                        }}
                                    >
                                        <ChevronRight size={24} />
                                    </button>

                                    <div
                                        ref={scrollRef}
                                        style={{
                                            display: 'flex',
                                            gap: '1.5rem',
                                            overflowX: 'auto',
                                            padding: '0.5rem',
                                            paddingBottom: '1.5rem',
                                            scrollSnapType: 'x mandatory',
                                            msOverflowStyle: 'none',
                                            scrollbarWidth: 'none',
                                            alignItems: 'stretch'
                                        }}
                                    >
                                        <style>
                                            {`
                                            div::-webkit-scrollbar {
                                                display: none;
                                            }
                                        `}
                                        </style>
                                        {assessments.map((item, index) => {
                                            const previous = assessments[index + 1];

                                            const getDelta = (field, reverseColor = false, neutral = false) => {
                                                if (!previous || !item[field] || !previous[field]) return null;
                                                const currentVal = parseFloat(item[field]);
                                                const prevVal = parseFloat(previous[field]);
                                                const diff = currentVal - prevVal;

                                                if (Math.abs(diff) < 0.1) return null;

                                                const isPositive = diff > 0;
                                                let color = 'var(--text-muted)';

                                                if (!neutral) {
                                                    if (reverseColor) {
                                                        color = isPositive ? '#ef4444' : '#10b981';
                                                    } else {
                                                        color = isPositive ? '#10b981' : '#ef4444';
                                                    }
                                                }

                                                return (
                                                    <span style={{ fontSize: '0.75rem', color, marginLeft: '0.3rem', display: 'inline-flex', alignItems: 'center', fontWeight: 'bold' }}>
                                                        {isPositive ? '▲' : '▼'} {Math.abs(diff).toFixed(1)}
                                                    </span>
                                                );
                                            };

                                            return (
                                                <div
                                                    key={item.id}
                                                    className="glass-panel"
                                                    style={{
                                                        padding: '1.5rem',
                                                        position: 'relative',
                                                        border: selectedAssessments.find(a => a.id === item.id) ? '2px solid var(--primary)' : '1px solid var(--border-glass)',
                                                        boxShadow: 'var(--shadow-glass)',
                                                        transition: 'all 0.2s',
                                                        background: 'var(--card-bg)',
                                                        width: '340px',
                                                        flex: '0 0 auto',
                                                        scrollSnapAlign: 'start',
                                                        display: 'flex',
                                                        flexDirection: 'column'
                                                    }}
                                                    onClick={() => toggleAssessmentSelection(item)}
                                                >
                                                    {/* Selection Checkbox */}
                                                    <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
                                                        <div style={{
                                                            width: '20px', height: '20px',
                                                            borderRadius: '50%',
                                                            border: selectedAssessments.find(a => a.id === item.id) ? 'none' : '2px solid var(--text-muted)',
                                                            background: selectedAssessments.find(a => a.id === item.id) ? 'var(--primary)' : 'transparent',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            cursor: 'pointer'
                                                        }}>
                                                            {selectedAssessments.find(a => a.id === item.id) && <CheckCircle size={14} color="white" />}
                                                        </div>
                                                    </div>

                                                    {/* Header */}
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem' }}>
                                                        <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 'bold' }}>{item.dateString}</h3>
                                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Toque para selecionar</span>
                                                    </div>

                                                    {/* Actions */}
                                                    <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.8rem', justifyContent: 'center' }}>
                                                        <button type="button" onClick={(e) => { e.stopPropagation(); setNewAssessment(item); setEditingAssessmentId(item.id); setShowAssessmentForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa', cursor: 'pointer' }}><Edit2 size={16} /></button>
                                                        <button type="button" onClick={(e) => { e.stopPropagation(); handleDeleteAssessment(item.id); }} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                                        <button type="button" onClick={(e) => { e.stopPropagation(); shareAssessmentPDF(item); }} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#25D366', cursor: 'pointer' }}><MessageCircle size={16} /></button>
                                                        <button type="button" onClick={(e) => { e.stopPropagation(); downloadAssessmentPDF(item); }} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399', cursor: 'pointer' }}><Download size={16} /></button>
                                                    </div>

                                                    {/* Main Stats */}
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '1.5rem', marginTop: '1.5rem' }}>
                                                        {item.weight && <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.5rem 0.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}><span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>PESO</span><div style={{ display: 'flex', alignItems: 'flex-end' }}><strong>{item.weight}kg</strong>{getDelta('weight', true)}</div></div>}
                                                        {item.height && <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.5rem 0.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}><span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>ALTURA</span><strong>{item.height}m</strong></div>}
                                                        {item.bodyFat && <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.5rem 0.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}><span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>GC</span><div style={{ display: 'flex', alignItems: 'flex-end' }}><strong>{item.bodyFat}%</strong>{getDelta('bodyFat', true)}</div></div>}
                                                    </div>

                                                    {/* Details */}
                                                    <div style={{ display: 'grid', gap: '1rem' }}>
                                                        {[
                                                            { title: 'Superiores', items: [{ l: 'Bíceps', v: `${item.bicepsRight || '-'} / ${item.bicepsLeft || '-'}` }, { l: 'Tríceps', v: `${item.tricepsRight || '-'} / ${item.tricepsLeft || '-'}` }, { l: 'Peitoral', v: item.chest }] },
                                                            { title: 'Tronco', items: [{ l: 'Cintura', v: item.waist }, { l: 'Abdômen', v: item.abdomen }, { l: 'Quadril', v: item.hips }] },
                                                            { title: 'Inferiores', items: [{ l: 'Coxas', v: `${item.thighRight || '-'} / ${item.thighLeft || '-'}` }, { l: 'Panturrilhas', v: `${item.calfRight || '-'} / ${item.calfLeft || '-'}` }] }
                                                        ].map((s, i) => (
                                                            <div key={i} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', padding: '0.8rem' }}>
                                                                <h5 style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{s.title}</h5>
                                                                {s.items.map((it, ii) => (
                                                                    <div key={ii} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.2rem' }}>
                                                                        <span style={{ color: 'var(--text-muted)' }}>{it.l}</span><span>{it.v || '-'}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
                                        Selecione 2 avaliações para comparar.
                                    </p>
                                </div>

                            )
                            }
                        </div>
                    )
                }

                {
                    activeTab === 'workouts' && (
                        <div>
                            {/* Header: Sheet Selector */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: '2rem' }}>
                                <div>
                                    <h3 style={{ margin: 0, marginBottom: '0.5rem' }}>Fichas de Treino</h3>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {isLegacy && (
                                            <button
                                                onClick={() => setSelectedSheetId('legacy')}
                                                style={{
                                                    padding: '0.5rem 1rem',
                                                    borderRadius: '20px',
                                                    border: '1px solid var(--primary)',
                                                    background: 'var(--primary)',
                                                    color: 'white',
                                                    cursor: 'pointer',
                                                    fontSize: '0.9rem'
                                                }}
                                            >
                                                Ficha Principal
                                            </button>
                                        )}
                                        {availableSheets.map(s => (
                                            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <button
                                                    onClick={() => setSelectedSheetId(s.id)}
                                                    style={{
                                                        padding: '0.5rem 1rem',
                                                        borderRadius: '20px',
                                                        border: `1px solid ${selectedSheetId === s.id ? 'var(--primary)' : 'var(--border-glass)'}`,
                                                        background: selectedSheetId === s.id ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                                        color: selectedSheetId === s.id ? 'white' : 'var(--text-muted)',
                                                        cursor: 'pointer',
                                                        fontSize: '0.9rem'
                                                    }}
                                                >
                                                    {s.name}
                                                    {s.createdAt && (
                                                        <span style={{ fontSize: '0.75em', opacity: 0.7, fontWeight: 'normal' }}>
                                                            {' '}({new Date(s.createdAt).toLocaleDateString('pt-BR')})
                                                        </span>
                                                    )}
                                                </button>
                                                {selectedSheetId === s.id && (
                                                    <button
                                                        onClick={() => handleDeleteSheet(s.id)}
                                                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                                        title="Excluir Ficha"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        <button
                                            onClick={() => setIsCreatingSheet(true)}
                                            style={{
                                                padding: '0.5rem 1rem',
                                                borderRadius: '20px',
                                                border: '1px dashed var(--border-glass)',
                                                background: 'transparent',
                                                color: 'var(--text-muted)',
                                                cursor: 'pointer',
                                                fontSize: '0.9rem',
                                                display: 'flex', alignItems: 'center', gap: '0.25rem'
                                            }}
                                        >
                                            <Plus size={14} /> Nova Ficha
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {isCreatingSheet && (
                                <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', border: '1px dashed var(--primary)' }}>
                                    <h4 style={{ margin: 0, marginBottom: '1.25rem', fontSize: '1.1rem' }}>Criar Nova Ficha</h4>

                                    <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px' }}>
                                        <input
                                            type="checkbox"
                                            id="useRecommendation"
                                            checked={useRecommendation}
                                            onChange={(e) => setUseRecommendation(e.target.checked)}
                                            style={{ accentColor: 'var(--primary)', width: '18px', height: '18px', cursor: 'pointer' }}
                                        />
                                        <label htmlFor="useRecommendation" style={{ cursor: 'pointer', color: useRecommendation ? 'var(--primary)' : 'var(--text-muted)', fontWeight: useRecommendation ? 'bold' : 'normal', fontSize: '0.95rem' }}>
                                            Gerar Recomendação Inteligente
                                        </label>
                                    </div>

                                    {useRecommendation && (
                                        <div style={{ marginBottom: '1.25rem' }}>
                                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', marginLeft: '0.2rem' }}>Nível do Treino</label>
                                            <select
                                                value={selectedLevel}
                                                onChange={e => setSelectedLevel(e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    padding: '0.875rem',
                                                    borderRadius: '12px',
                                                    border: '1px solid var(--border-glass)',
                                                    background: 'var(--input-bg)',
                                                    color: 'var(--text-main)',
                                                    fontSize: '0.95rem',
                                                    outline: 'none',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <option value="Iniciante">Iniciante (Adaptação / AB)</option>
                                                <option value="Intermediário">Intermediário (Divisão ABC/ABCD)</option>
                                                <option value="Avançado">Avançado (Volume Maior)</option>
                                            </select>
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', gap: '1rem', flexDirection: 'row', flexWrap: 'wrap' }}>
                                        <style>
                                            {`
                                                @media (max-width: 640px) {
                                                    .sheet-form-actions {
                                                        flex-direction: column !important;
                                                    }
                                                    .sheet-form-actions button {
                                                        width: 100%;
                                                    }
                                                }
                                            `}
                                        </style>
                                        <input
                                            value={newSheetName}
                                            onChange={e => setNewSheetName(e.target.value)}
                                            placeholder={useRecommendation ? "Nome da ficha (Opcional)" : "Nome da ficha (ex: Hipertrofia 2025)"}
                                            style={{
                                                flex: 2,
                                                padding: '0.875rem',
                                                borderRadius: '12px',
                                                border: '1px solid var(--border-glass)',
                                                background: 'var(--input-bg)',
                                                color: 'var(--text-main)',
                                                outline: 'none',
                                                fontSize: '0.95rem',
                                                minWidth: '200px'
                                            }}
                                        />
                                        <div className="sheet-form-actions" style={{ display: 'flex', gap: '0.75rem', flex: 1 }}>
                                            <button
                                                onClick={handleCreateSheet}
                                                disabled={!useRecommendation && !newSheetName.trim()}
                                                style={{
                                                    flex: 1,
                                                    padding: '0 1.5rem',
                                                    background: 'var(--primary)',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '12px',
                                                    cursor: 'pointer',
                                                    fontWeight: '600',
                                                    minHeight: '48px',
                                                    whiteSpace: 'nowrap'
                                                }}
                                            >
                                                Criar
                                            </button>
                                            <button
                                                onClick={() => setIsCreatingSheet(false)}
                                                style={{
                                                    flex: 1,
                                                    padding: '0 1.5rem',
                                                    background: 'transparent',
                                                    color: 'var(--text-muted)',
                                                    border: '1px solid var(--border-glass)',
                                                    borderRadius: '12px',
                                                    cursor: 'pointer',
                                                    minHeight: '48px'
                                                }}
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Single "Ficha" Container */}
                            <div className="glass-panel" style={{ padding: '2rem', border: '1px solid var(--primary)', position: 'relative' }}>
                                <style>{`
                                    .sheet-header {
                                        display: flex;
                                        justify-content: space-between;
                                        align-items: flex-start;
                                        margin-bottom: 2rem;
                                    }
                                    .sheet-actions {
                                        display: flex;
                                        gap: 1rem;
                                    }
                                    .sheet-btn-text {
                                        display: inline;
                                    }
                                    @media (max-width: 768px) {
                                        .sheet-header {
                                            flex-direction: column;
                                            gap: 1rem;
                                        }
                                        .sheet-actions {
                                            width: 100%;
                                            display: grid;
                                            grid-template-columns: 1fr 1fr 1fr; /* Share, Download, Edit(if any) - actually just 2 or 3 buttons */
                                            gap: 0.5rem;
                                        }
                                        .sheet-actions button {
                                            justify-content: center !important;
                                            padding: 0.8rem !important;
                                            flex: 1;
                                        }
                                        .sheet-btn-text {
                                            display: none;
                                        }
                                    }
                                `}</style>

                                <div className="sheet-header">
                                    <div>
                                        <h2 style={{ fontSize: '1.5rem', margin: 0, marginBottom: '0.5rem' }}>{currentSheet?.name || 'Ficha de Treino'}</h2>
                                        <p style={{ color: 'var(--text-muted)' }}>
                                            {Object.keys(currentSheet?.workouts || {}).length} divisões ativas
                                        </p>
                                    </div>
                                    <div className="sheet-actions">
                                        {/* Magic Fill (Only if empty) */}
                                        {Object.keys(currentSheet?.workouts || {}).length === 0 && (
                                            <div style={{ display: 'flex', gap: '0.5rem', marginRight: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', padding: '0.3rem', borderRadius: '10px' }}>
                                                <select
                                                    value={selectedLevel}
                                                    onChange={e => setSelectedLevel(e.target.value)}
                                                    style={{
                                                        background: 'transparent', color: 'var(--primary)',
                                                        border: 'none', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer', outline: 'none'
                                                    }}
                                                >
                                                    <option value="Iniciante">Iniciante</option>
                                                    <option value="Intermediário">Intermediário</option>
                                                    <option value="Avançado">Avançado</option>
                                                </select>
                                                <button
                                                    onClick={() => handleAutoFillSheet(selectedSheetId, selectedLevel)}
                                                    title="Preencher ficha automaticamente"
                                                    style={{
                                                        background: 'var(--primary)', border: 'none', borderRadius: '8px',
                                                        color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0 0.8rem'
                                                    }}
                                                >
                                                    <Sparkles size={16} />
                                                </button>
                                            </div>
                                        )}
                                        <button
                                            onClick={shareSheetPDF}
                                            title="Compartilhar no WhatsApp"
                                            style={{
                                                background: 'var(--input-bg)',
                                                color: '#25D366',
                                                border: '1px solid var(--border-glass)',
                                                padding: '0.8rem 1.2rem',
                                                borderRadius: '12px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                fontWeight: '600',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <MessageCircle size={20} />
                                            <span className="sheet-btn-text">Compartilhar</span>
                                        </button>
                                        <button
                                            onClick={generatePDF}
                                            title="Baixar PDF"
                                            style={{
                                                background: 'var(--input-bg)',
                                                color: 'var(--text-main)',
                                                border: '1px solid var(--border-glass)',
                                                padding: '0.75rem 1.5rem',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                fontWeight: '600',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem'
                                            }}
                                        >
                                            <Dumbbell size={18} />
                                            <span className="sheet-btn-text">Baixar PDF</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                const keys = Object.keys(currentSheet?.workouts || {}).sort();
                                                const firstVar = keys.length > 0 ? keys[0] : 'A';
                                                // Use selectedSheetId directly if available to prevent legacy fallback issues
                                                const targetId = selectedSheetId && selectedSheetId !== 'default' ? selectedSheetId : (currentSheet?.id || 'legacy');
                                                navigate(`/app/workouts/${id}?variation=${firstVar}&sheetId=${targetId}`);
                                            }}
                                            style={{
                                                background: 'var(--primary)',
                                                color: 'white',
                                                border: 'none',
                                                padding: '0.75rem 1.5rem',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                fontWeight: '600',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem'
                                            }}
                                        >
                                            <Edit2 size={18} /> Editar Ficha
                                        </button>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1.5rem' }}>

                                    {/* Magic Fill Option (Only if empty) */}


                                    {/* List Divisions Inside */}
                                    {Object.keys(currentSheet?.workouts || {}).sort().map(variation => (
                                        <div
                                            key={variation}
                                            onClick={() => {
                                                const targetId = selectedSheetId && selectedSheetId !== 'default' ? selectedSheetId : (currentSheet?.id || 'legacy');
                                                navigate(`/app/workouts/${id}?variation=${variation}&sheetId=${targetId}`);
                                            }}
                                            className="glass-card-interactive"
                                            style={{
                                                padding: '1.5rem',
                                                background: 'var(--card-bg)',
                                                borderRadius: '16px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                textAlign: 'center',
                                                cursor: 'pointer',
                                                border: '1px solid var(--border-glass)',
                                                transition: 'all 0.3s ease',
                                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                                position: 'relative',
                                                overflow: 'hidden'
                                            }}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.transform = 'translateY(-5px)';
                                                e.currentTarget.style.borderColor = 'var(--primary)';
                                                e.currentTarget.style.boxShadow = '0 10px 20px rgba(16, 185, 129, 0.15)';
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.borderColor = 'var(--border-glass)';
                                                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                                            }}
                                        >
                                            <div style={{
                                                width: '48px',
                                                height: '48px',
                                                borderRadius: '50%',
                                                background: 'linear-gradient(135deg, var(--primary) 0%, #3b82f6 100%)',
                                                color: 'white',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                marginBottom: '1rem',
                                                fontWeight: 'bold',
                                                fontSize: '1.2rem',
                                                boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
                                            }}>
                                                {variation}
                                            </div>
                                            <span style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                                                {currentSheet?.workouts[variation]?.name || `Divisão ${variation}`}
                                            </span>
                                            {currentSheet?.workouts[variation]?.name && currentSheet?.workouts[variation]?.name !== `Treino ${variation}` && (
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                                                    Divisão {variation}
                                                </span>
                                            )}
                                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                {currentSheet?.workouts[variation]?.exercises?.length || 0} exercícios
                                            </span>
                                        </div>
                                    ))}

                                    {/* Add New Division Button */}
                                    <button
                                        onClick={() => {
                                            const keys = Object.keys(currentSheet?.workouts || {}).sort();
                                            const nextVar = keys.length === 0 ? 'A' : String.fromCharCode(keys[keys.length - 1].charCodeAt(0) + 1);
                                            navigate(`/app/workouts/${id}?variation=${nextVar}&sheetId=${currentSheet?.id || 'legacy'}`);
                                        }}
                                        style={{
                                            background: 'rgba(255,255,255,0.02)',
                                            border: '2px dashed var(--border-glass)',
                                            color: 'var(--text-muted)',
                                            borderRadius: '16px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            minHeight: '160px',
                                            gap: '0.8rem',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.borderColor = 'var(--primary)';
                                            e.currentTarget.style.color = 'var(--primary)';
                                            e.currentTarget.style.background = 'rgba(16, 185, 129, 0.05)';
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.borderColor = 'var(--border-glass)';
                                            e.currentTarget.style.color = 'var(--text-muted)';
                                            e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                                        }}
                                    >
                                        <div style={{
                                            width: '40px', height: '40px', borderRadius: '50%',
                                            border: '1px solid currentColor', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <Plus size={20} />
                                        </div>
                                        <span style={{ fontWeight: '600' }}>Nova Divisão</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }

                {
                    activeTab === 'financial' && (
                        <div>
                            <style>{`
                                .status-card {
                                    display: flex;
                                    align-items: center;
                                    justify-content: space-between;
                                    padding: 1rem;
                                    background: rgba(16, 185, 129, 0.1);
                                    border: 1px solid rgba(16, 185, 129, 0.2);
                                    border-radius: 12px; /* radius from glass-panel */
                                    margin-bottom: 2rem;
                                }

                                @media (max-width: 768px) {
                                    .status-card {
                                        flex-direction: column;
                                        align-items: stretch;
                                        gap: 1rem;
                                        text-align: center;
                                    }
                                    .status-card > div {
                                        flex-direction: column;
                                        text-align: center;
                                    }

                                    /* Financial Table to Cards Transformation */
                                    .financial-table, .financial-table tbody, .financial-table tr, .financial-table td {
                                        display: block;
                                        width: 100%;
                                    }
                                    
                                    .financial-table thead {
                                        display: none;
                                    }

                                    .financial-table tr {
                                        position: relative;
                                        margin-bottom: 1rem;
                                        background: var(--card-bg);
                                        border: 1px solid var(--border-glass);
                                        border-radius: 12px;
                                        padding: 1rem;
                                    }

                                    .financial-table td {
                                        padding: 0.25rem 0;
                                        text-align: left;
                                        border: none !important;
                                    }

                                    /* Date */
                                    .financial-table td:nth-child(1) {
                                        font-size: 0.85rem;
                                        color: var(--text-muted);
                                        margin-bottom: 0.25rem;
                                    }

                                    /* Description */
                                    .financial-table td:nth-child(2) {
                                        font-size: 1rem;
                                        font-weight: 500;
                                        margin-bottom: 0.5rem;
                                    }

                                    /* Value */
                                    .financial-table td:nth-child(3) {
                                        font-size: 1.2rem;
                                        font-weight: bold;
                                        color: var(--text-main);
                                        margin-bottom: 0.5rem;
                                    }

                                    /* Status & Method (Inline) */
                                    .financial-table td:nth-child(4),
                                    .financial-table td:nth-child(5) {
                                        display: inline-block;
                                        width: auto;
                                        margin-right: 1rem;
                                    }

                                    /* Delete Button */
                                    .financial-table td:nth-child(6) {
                                        position: absolute;
                                        top: 1rem;
                                        right: 1rem;
                                        width: auto;
                                    }
                                }
                            `}</style>

                            <div className="glass-panel status-card">
                                {(() => {
                                    const today = new Date();
                                    today.setHours(0, 0, 0, 0);

                                    let nextPaymentDate = null;
                                    if (student.nextPaymentDate) {
                                        nextPaymentDate = new Date(student.nextPaymentDate);
                                    } else {
                                        // Fallback if no nextPaymentDate set but paymentDay exists
                                        const dueDay = parseInt(student.paymentDay);
                                        if (!isNaN(dueDay)) {
                                            nextPaymentDate = new Date(today.getFullYear(), today.getMonth(), dueDay);
                                            // If today is past due day, assume next month? 
                                            // ideally we rely on stored nextPaymentDate. 
                                            // If we are guessing, and today > dueDay, maybe they are late for THIS month?
                                            // Let's stick to a simple logic: if no date stored, assume current month's day.
                                        }
                                    }

                                    // Check overlap
                                    // Make sure we clear time for comparison
                                    if (nextPaymentDate) {
                                        nextPaymentDate.setHours(0, 0, 0, 0);
                                    }

                                    const isOverdue = nextPaymentDate && nextPaymentDate < today;

                                    return (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            {isOverdue ? (
                                                <AlertCircle color="#ef4444" size={24} />
                                            ) : (
                                                <CheckCircle color="#10b981" size={24} />
                                            )}
                                            <div>
                                                <h4 style={{ color: isOverdue ? '#ef4444' : '#10b981', margin: 0 }}>
                                                    Status: {isOverdue ? 'Pendente' : 'Em dia'}
                                                </h4>
                                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                    {isOverdue ? 'Venceu em ' : 'Próximo pagamento em '}
                                                    {nextPaymentDate
                                                        ? nextPaymentDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })
                                                        : 'Data não def.'}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })()}
                                <button
                                    onClick={handleOpenPaymentModal}
                                    style={{
                                        background: 'transparent',
                                        border: '1px solid var(--primary)',
                                        color: 'var(--primary)',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '6px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Registrar Pagamento
                                </button>
                            </div>

                            {showPaymentModal && (
                                <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', border: '1px solid #10b981' }}>
                                    <h4 style={{ margin: 0, marginBottom: '1rem', color: '#10b981' }}>Registrar Pagamento</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                        <div>
                                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>Valor (R$)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={paymentForm.value}
                                                onChange={e => setPaymentForm({ ...paymentForm, value: e.target.value })}
                                                style={{ width: '100%', padding: '0.5rem', background: 'var(--input-bg)', border: '1px solid var(--border-glass)', borderRadius: '6px', color: 'var(--text-main)' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>Método</label>
                                            <select
                                                value={paymentForm.method}
                                                onChange={e => setPaymentForm({ ...paymentForm, method: e.target.value })}
                                                style={{ width: '100%', padding: '0.5rem', background: 'var(--input-bg)', border: '1px solid var(--border-glass)', borderRadius: '6px', color: 'var(--text-main)' }}
                                            >
                                                <option value="Cartão de Crédito">Cartão de Crédito</option>
                                                <option value="Pix">Pix</option>
                                                <option value="Dinheiro">Dinheiro</option>
                                                <option value="Débito">Débito</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>Data</label>
                                            <input
                                                type="date"
                                                value={paymentForm.date}
                                                onChange={e => setPaymentForm({ ...paymentForm, date: e.target.value })}
                                                style={{ width: '100%', padding: '0.5rem', background: 'var(--input-bg)', border: '1px solid var(--border-glass)', borderRadius: '6px', color: 'var(--text-main)' }}
                                            />
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                        <button
                                            onClick={() => setShowPaymentModal(false)}
                                            style={{ padding: '0.5rem 1.5rem', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-glass)', borderRadius: '8px', cursor: 'pointer' }}
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={handleRegisterPayment}
                                            style={{ padding: '0.5rem 1.5rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                                        >
                                            Confirmar Pagamento
                                        </button>
                                    </div>
                                </div>
                            )}

                            <h3 style={{ marginBottom: '1rem' }}>Histórico Financeiro</h3>
                            <table className="financial-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                <thead>
                                    <tr style={{ color: 'var(--text-muted)', textAlign: 'left', borderBottom: '1px solid var(--border-glass)' }}>
                                        <th style={{ padding: '1rem' }}>Data</th>
                                        <th>Descrição</th>
                                        <th>Valor</th>
                                        <th>Status</th>
                                        <th>Método</th>
                                        <th style={{ width: '50px' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {student.paymentHistory && student.paymentHistory.length > 0 ? (
                                        student.paymentHistory.map((payment, index) => (
                                            <tr key={index} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                <td style={{ padding: '1rem' }}>{new Date(payment.date).toLocaleDateString()}</td>
                                                <td>{payment.description}</td>
                                                <td>R$ {parseFloat(payment.value).toFixed(2)}</td>
                                                <td>
                                                    <span style={{ color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                                                        {payment.status === 'Paid' ? 'Pago' : 'Pendente'}
                                                    </span>
                                                </td>
                                                <td>{payment.method}</td>
                                                <td>
                                                    <button
                                                        onClick={() => handleDeletePayment(index)}
                                                        style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.25rem' }}
                                                        title="Remover pagamento"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td style={{ padding: '1rem' }}>{new Date(student.startDate).toLocaleDateString()}</td>
                                            <td>Plano {student.plan} - Contratação (Legado)</td>
                                            <td>
                                                {student.price ? `R$ ${parseFloat(student.price).toFixed(2)}` : 'R$ 89,90'}
                                            </td>
                                            <td><span style={{ color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>Pago</span></td>
                                            <td>Cartão de Crédito</td>
                                            <td>{/* Actions placeholder for legacy */}</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )
                }


                {
                    activeTab === 'photos' && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 style={{ margin: 0 }}>Galeria de Fotos</h3>
                                <div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        id="photo-upload"
                                        style={{ display: 'none' }}
                                        onChange={handlePhotoUpload}
                                        disabled={uploadingPhoto}
                                    />
                                    <label
                                        htmlFor="photo-upload"
                                        style={{
                                            background: 'var(--primary)',
                                            color: 'white',
                                            padding: '0.5rem 1rem',
                                            borderRadius: '8px',
                                            cursor: uploadingPhoto ? 'not-allowed' : 'pointer',
                                            display: 'flex',
                                            gap: '0.5rem',
                                            alignItems: 'center',
                                            opacity: uploadingPhoto ? 0.7 : 1
                                        }}
                                    >
                                        <Camera size={18} />
                                        {uploadingPhoto ? 'Enviando...' : 'Adicionar Foto'}
                                    </label>
                                </div>
                            </div>

                            {!galleryItems || galleryItems.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                                    <ImageIcon size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                                    <p>Nenhuma foto adicionada.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
                                    {galleryItems.map((photo, index) => (
                                        <div key={index} className="glass-panel" style={{ padding: '0.5rem', position: 'relative', overflow: 'hidden' }}>
                                            <div
                                                style={{ aspectRatio: '3/4', borderRadius: '6px', overflow: 'hidden', marginBottom: '0.5rem', background: '#000', cursor: 'zoom-in' }}
                                                onClick={() => {
                                                    setSelectedIndex(index);
                                                    setExpandedPhoto(photo);
                                                }}
                                            >
                                                <img src={photo.url} alt="Student" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0.25rem' }}>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(photo.date).toLocaleDateString()}</span>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>

                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation(); // Prevent opening lightbox
                                                            handleDeletePhoto(photo, index);
                                                        }}
                                                        title="Excluir"
                                                        style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', zIndex: 10 }}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>

                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )
                }
            </div>
            {/* Lightbox Modal */}
            {expandedPhoto && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.9)',
                    zIndex: 9999,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '2rem'
                }} onClick={() => setExpandedPhoto(null)}>
                    <div style={{ position: 'relative', width: 'auto', height: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={e => e.stopPropagation()}>
                        <img
                            src={expandedPhoto.url}
                            alt="Expanded"
                            style={{
                                maxHeight: '95vh',
                                maxWidth: '85vw',
                                objectFit: 'contain',
                                borderRadius: '8px',
                                boxShadow: '0 0 40px rgba(0,0,0,0.8)'
                            }}
                        />

                        {/* Navigation Arrows */}
                        <button
                            onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                            style={{
                                position: 'absolute',
                                left: '-80px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'transparent',
                                border: 'none',
                                color: 'white',
                                cursor: 'pointer',
                                padding: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                transition: 'transform 0.2s',
                            }}
                            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-50%) scale(1.2)'}
                            onMouseOut={e => e.currentTarget.style.transform = 'translateY(-50%) scale(1)'}
                        >
                            <ChevronLeft size={64} style={{ filter: 'drop-shadow(0 0 5px black)' }} />
                        </button>

                        <button
                            onClick={(e) => { e.stopPropagation(); handleNext(); }}
                            style={{
                                position: 'absolute',
                                right: '-80px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'transparent',
                                border: 'none',
                                color: 'white',
                                cursor: 'pointer',
                                padding: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                transition: 'transform 0.2s',
                            }}
                            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-50%) scale(1.2)'}
                            onMouseOut={e => e.currentTarget.style.transform = 'translateY(-50%) scale(1)'}
                        >
                            <ChevronRight size={64} style={{ filter: 'drop-shadow(0 0 5px black)' }} />
                        </button>

                        <button
                            onClick={() => setExpandedPhoto(null)}
                            style={{
                                position: 'absolute',
                                top: '-50px',
                                right: '-40px',
                                background: 'transparent',
                                border: 'none',
                                color: 'white',
                                cursor: 'pointer',
                                padding: '10px'
                            }}
                        >
                            <X size={32} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

