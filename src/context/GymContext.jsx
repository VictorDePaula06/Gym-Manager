import { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, setDoc, getDoc, query, orderBy, increment, arrayUnion } from 'firebase/firestore';
import { setGeminiKey, clearGeminiKey } from '../services/gemini';
import { computeFirstDueDate } from '../utils/payments';
import { planLimits } from '../config/plans';
import { normalizeCheckin } from '../config/checkin';

const GymContext = createContext();

// Código de acesso do aluno (pra vincular a conta Google no 1º login).
// Alfabeto sem caracteres ambíguos (I, O, 0, 1).
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const generateAccessCode = () =>
    Array.from({ length: 6 }, () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]).join('');

export const useGym = () => useContext(GymContext);
import { useAuth } from './AuthContext';

export const GymProvider = ({ children }) => {
    const { user, plan } = useAuth();
    const [students, setStudents] = useState([]);
    const [loadingStudents, setLoadingStudents] = useState(true);
    const [loadingSettings, setLoadingSettings] = useState(true);

    const loading = loadingStudents || loadingSettings;

    const [settings, setSettings] = useState({
        gymName: 'Vector GymHub',
        logoUrl: null,
        theme: 'dark'
    });
    const [expenses, setExpenses] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [teacherPayments, setTeacherPayments] = useState([]);
    const [exerciseLibrary, setExerciseLibrary] = useState([]);
    const [aiConfig, setAiConfig] = useState({ configured: false });

    useEffect(() => {
        // If no user, reset state
        if (!user) {
            setStudents([]);
            setExpenses([]);
            setTeachers([]);
            setTeacherPayments([]);
            setSettings({ gymName: 'Vector GymHub', logoUrl: null, theme: 'dark', checkinConfig: normalizeCheckin(null) });
            setAiConfig({ configured: false });
            clearGeminiKey(); // remove a chave de IA da memória ao deslogar

            // RESET LOADING STATES to prevent flash on next login
            setLoadingStudents(true);
            setLoadingSettings(true);
            return;
        }

        setLoadingStudents(true);
        setLoadingSettings(true);

        // Define Base Path using TENANT ID (Owner ID)
        const tenantId = user.tenantId || user.uid; // Fallback to uid if tenantId missing (safety)
        const userBasePath = `users/${tenantId}`;

        console.log(`[GymContext] Initializing for Tenant: ${tenantId} (Role: ${user.role})`);

        // Fetch Students (Adaptive Role-based Listener)
        let unsubscribeStudents = () => {};
        if (user.role === 'student') {
            const studentId = user.studentId;
            if (studentId) {
                unsubscribeStudents = onSnapshot(doc(db, `${userBasePath}/students`, studentId), (docSnap) => {
                    if (docSnap.exists()) {
                        setStudents([{ id: docSnap.id, ...docSnap.data() }]);
                    } else {
                        setStudents([]);
                    }
                    setLoadingStudents(false);
                }, (error) => {
                    console.error("Error fetching own student doc:", error);
                    setLoadingStudents(false);
                });
            } else {
                setStudents([]);
                setLoadingStudents(false);
            }
        } else {
            // Owner/Teacher: Listen to full collection
            unsubscribeStudents = onSnapshot(collection(db, `${userBasePath}/students`), (snapshot) => {
                const studentsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setStudents(studentsData);
                setLoadingStudents(false);
            }, (error) => {
                console.error("Error fetching students collection:", error);
                setLoadingStudents(false);
            });
        }

        // Restricted Listeners (Owner/Teacher only)
        let unsubscribeExpenses = () => {};
        let unsubscribeTeachers = () => {};
        let unsubscribeTeacherPayments = () => {};
        let unsubscribeAiConfig = () => {};

        if (user.role !== 'student') {
            // Chave de IA: doc separado do settings/global (que o aluno lê) para
            // a chave do personal NÃO ser carregada na sessão do aluno.
            unsubscribeAiConfig = onSnapshot(doc(db, `${userBasePath}/settings`, 'ai_config'), (docSnap) => {
                const key = docSnap.exists() ? docSnap.data().geminiApiKey : null;
                setGeminiKey(key);
                setAiConfig({ configured: !!key });
            }, (error) => { console.error("Error fetching AI config:", error); });

            // ... (keep expenses, teachers, payments logic as is from previous correct edit)
            unsubscribeExpenses = onSnapshot(collection(db, `${userBasePath}/expenses`), (snapshot) => {
                const expensesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setExpenses(expensesData);
            }, (error) => { console.error("Error fetching expenses:", error); });

            unsubscribeTeachers = onSnapshot(collection(db, `${userBasePath}/teachers`), (snapshot) => {
                const teachersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setTeachers(teachersData);
            }, (error) => { console.error("Error fetching teachers:", error); });

            unsubscribeTeacherPayments = onSnapshot(collection(db, `${userBasePath}/teacher_payments`), (snapshot) => {
                const paymentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setTeacherPayments(paymentsData);
            }, (error) => { console.error("Error fetching teacher payments:", error); });
        }

        // Listener for Settings (Available to all authenticated users)
        const unsubscribeSettings = onSnapshot(doc(db, `${userBasePath}/settings`, 'global'), (docSnap) => {
            const data = docSnap.exists() ? docSnap.data() : {};

            setSettings({
                gymName: data.gymName || 'Vector GymHub',
                // Use local default logo if DB has none
                logoUrl: data.logoUrl || '/logo.png',
                whatsapp: data.whatsapp || '',
                theme: data.theme || 'dark',
                enableTeachers: data.enableTeachers !== undefined ? data.enableTeachers : true, // Default to true for existing users
                checkinConfig: normalizeCheckin(data.checkinConfig),
            });

            if (data.theme === 'light') {
                document.documentElement.setAttribute('data-theme', 'light');
            } else {
                document.documentElement.setAttribute('data-theme', 'dark');
            }
            setLoadingSettings(false);
        });

        return () => {
            unsubscribeStudents();
            unsubscribeExpenses();
            unsubscribeTeachers();
            unsubscribeSettings();
            unsubscribeTeacherPayments();
            unsubscribeAiConfig();
        };
    }, [user]);

    // Listener for Exercise Library (Available to all authenticated users)
    useEffect(() => {
        if (!user) {
            setExerciseLibrary([]);
            return;
        }

        const tenantId = user.tenantId || user.uid;
        const q = query(collection(db, `users/${tenantId}/exercise_library`), orderBy('name', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setExerciseLibrary(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => unsubscribe();
    }, [user]);

    const getUserBasePath = () => {
        if (!user) throw new Error("User not authenticated");
        // Use tenantId if available (it should be attached by AuthContext)
        return `users/${user.tenantId || user.uid}`;
    };

    const updateSettings = async (newSettings) => {
        try {
            const basePath = getUserBasePath();
            await setDoc(doc(db, `${basePath}/settings`, 'global'), newSettings, { merge: true });
        } catch (error) {
            console.error("Error updating settings:", error);
            throw error;
        }
    };

    // Salva/remove a chave Gemini num doc separado (não exposto à sessão do aluno).
    const updateAiConfig = async (geminiApiKey) => {
        try {
            const basePath = getUserBasePath();
            const key = (geminiApiKey || '').trim() || null;
            await setDoc(doc(db, `${basePath}/settings`, 'ai_config'), { geminiApiKey: key }, { merge: true });
            setGeminiKey(key);
            setAiConfig({ configured: !!key });
        } catch (error) {
            console.error("Error updating AI config:", error);
            throw error;
        }
    };

    const addStudent = async (studentData) => {
        try {
            // Trava por plano: bloqueia ao atingir o limite de alunos do tier.
            const { maxStudents, name: planName } = planLimits(plan);
            if (students.length >= maxStudents) {
                const err = new Error("PLAN_LIMIT_REACHED");
                err.planName = planName;
                err.maxStudents = maxStudents;
                throw err;
            }

            const basePath = getUserBasePath();
            const tenantId = user.tenantId || user.uid;
            const normalizedEmail = (studentData.email || '').toLowerCase().trim();

            // 0. CHECK IF EMAIL ALREADY EXISTS (GLOBAL UNICITY & LOCAL)
            if (normalizedEmail) {
                // Check locally first (Immediate feedback for same gym)
                const existsLocally = students.some(s => (s.email || '').toLowerCase().trim() === normalizedEmail);
                if (existsLocally) {
                    throw new Error("EMAIL_EXISTS");
                }

                // Check globally via Registry
                const emailKey = normalizedEmail.replace(/\./g, '_');
                const accessRef = doc(db, 'student_access', emailKey);
                const accessSnap = await getDoc(accessRef);
                if (accessSnap.exists()) {
                    throw new Error("EMAIL_EXISTS");
                }
            }

            // Define o primeiro vencimento já no cadastro (destrava alerta e evita
            // status indefinido para aluno novo). Não sobrescreve se já vier definido.
            if (!studentData.nextPaymentDate) {
                const firstDue = computeFirstDueDate(studentData.startDate, studentData.paymentDay);
                if (firstDue) studentData = { ...studentData, nextPaymentDate: firstDue.toISOString() };
            }

            // 1. Add to main students collection
            const docRef = await addDoc(collection(db, `${basePath}/students`), studentData);
            const studentId = docRef.id;

            // 1b. Gera um CÓDIGO DE ACESSO único (o aluno usa pra vincular a conta
            // Google no 1º login). Lookup global student_codes/{code} → aluno.
            let accessCode = null;
            for (let i = 0; i < 5; i++) {
                const c = generateAccessCode();
                const codeSnap = await getDoc(doc(db, 'student_codes', c));
                if (!codeSnap.exists()) { accessCode = c; break; }
            }
            if (accessCode) {
                await setDoc(doc(db, 'student_codes', accessCode), { tenantId, studentId });
                await updateDoc(doc(db, `${basePath}/students`, studentId), { accessCode });
            }

            // 2. Register in student_access if email is present
            if (normalizedEmail) {
                const emailKey = normalizedEmail.replace(/\./g, '_');
                await setDoc(doc(db, 'student_access', emailKey), {
                    email: studentData.email,
                    password: studentData.password || null,
                    name: studentData.name,
                    tenantId: tenantId,
                    studentId: studentId
                });
            }
        } catch (error) {
            console.error("Error adding student:", error);
            throw error;
        }
    };

    const updateStudent = async (id, studentData) => {
        try {
            const basePath = getUserBasePath();
            const tenantId = user.tenantId || user.uid;
            
            // Get old data to check if email changed
            const oldStudentRef = doc(db, `${basePath}/students`, id);
            const oldStudentSnap = await getDoc(oldStudentRef);
            const oldData = oldStudentSnap.exists() ? oldStudentSnap.data() : {};

            const { id: _, ...data } = studentData;
            const normalizedEmail = (data.email || '').toLowerCase().trim();

            // 2. CHECK EMAIL UNICITY BEFORE ANY WRITE
            if (normalizedEmail) {
                // Local check (excluding self)
                const existsLocally = students.some(s => s.id !== id && (s.email || '').toLowerCase().trim() === normalizedEmail);
                if (existsLocally) {
                    throw new Error("EMAIL_EXISTS");
                }

                // Global check
                const emailKey = normalizedEmail.replace(/\./g, '_');
                const accessRef = doc(db, 'student_access', emailKey);
                const accessSnap = await getDoc(accessRef);

                if (accessSnap.exists()) {
                    const accessData = accessSnap.data();
                    
                    const isSameStudent = accessData.studentId === id || 
                                         (!accessData.studentId && normalizedEmail === (oldData.email || '').toLowerCase().trim());

                    if (!isSameStudent) {
                        throw new Error("EMAIL_EXISTS");
                    }
                }
            }

            // 3. Perform the main update
            await updateDoc(oldStudentRef, data);

            // 4. Sync student_access
            const oldEmailNormalized = (oldData.email || '').toLowerCase().trim();

            if (normalizedEmail) {
                const emailKey = normalizedEmail.replace(/\./g, '_');
                
                // If email changed, delete old access record
                if (oldEmailNormalized && oldEmailNormalized !== normalizedEmail) {
                    const oldEmailKey = oldEmailNormalized.replace(/\./g, '_');
                    await deleteDoc(doc(db, 'student_access', oldEmailKey));
                }

                // Update or Create access record
                await setDoc(doc(db, 'student_access', emailKey), {
                    email: data.email,
                    password: data.password || oldData.password || null,
                    name: data.name,
                    tenantId: tenantId,
                    studentId: id
                }, { merge: true });
            } else if (oldEmailNormalized) {
                // Email was removed
                const oldEmailKey = oldEmailNormalized.replace(/\./g, '_');
                await deleteDoc(doc(db, 'student_access', oldEmailKey));
            }
        } catch (error) {
            console.error("Error updating student:", error);
            throw error;
        }
    };

    const deleteStudent = async (id) => {
        try {
            const basePath = getUserBasePath();
            
            // Get data to find email
            const studentRef = doc(db, `${basePath}/students`, id);
            const studentSnap = await getDoc(studentRef);
            
            if (studentSnap.exists()) {
                const data = studentSnap.data();
                if (data.email) {
                    const emailKey = data.email.toLowerCase().trim().replace(/\./g, '_');
                    await deleteDoc(doc(db, 'student_access', emailKey));
                }
            }

            await deleteDoc(studentRef);
        } catch (error) {
            console.error("Error deleting student:", error);
            throw error;
        }
    };

    const addExpense = async (expenseData) => {
        try {
            const basePath = getUserBasePath();
            await addDoc(collection(db, `${basePath}/expenses`), expenseData);
        } catch (error) {
            console.error("Error adding expense:", error);
            throw error;
        }
    };

    const deleteExpense = async (id) => {
        try {
            const basePath = getUserBasePath();
            await deleteDoc(doc(db, `${basePath}/expenses`, id));
        } catch (error) {
            console.error("Error deleting expense:", error);
            throw error;
        }
    };

    const addTeacher = async (teacherData) => {
        try {
            const basePath = getUserBasePath();
            await addDoc(collection(db, `${basePath}/teachers`), teacherData);
        } catch (error) {
            console.error("Error adding teacher:", error);
            throw error;
        }
    };

    const updateTeacher = async (id, teacherData) => {
        try {
            const basePath = getUserBasePath();
            const { id: _, ...data } = teacherData;
            await updateDoc(doc(db, `${basePath}/teachers`, id), data);
        } catch (error) {
            console.error("Error updating teacher:", error);
            throw error;
        }
    };

    const deleteTeacher = async (id) => {
        try {
            const basePath = getUserBasePath();
            await deleteDoc(doc(db, `${basePath}/teachers`, id));
        } catch (error) {
            console.error("Error deleting teacher:", error);
            throw error;
        }
    };

    const addTeacherPayment = async (paymentData) => {
        try {
            const basePath = getUserBasePath();
            await addDoc(collection(db, `${basePath}/teacher_payments`), paymentData);
        } catch (error) {
            console.error("Error adding teacher payment:", error);
            throw error;
        }
    };

    const deleteTeacherPayment = async (id) => {
        try {
            const basePath = getUserBasePath();
            await deleteDoc(doc(db, `${basePath}/teacher_payments`, id));
        } catch (error) {
            console.error("Error deleting teacher payment:", error);
            throw error;
        }
    };

    const [isTrainingMode, setIsTrainingMode] = useState(false);

    const value = {
        students,
        loading,
        plan,                        // 'bronze' | 'prata' | 'ouro'
        planInfo: planLimits(plan),  // { name, maxStudents, ai, ... }
        settings,
        updateSettings,
        // IA só vale se o plano permitir (Bronze = sem IA, mesmo com chave salva)
        aiConfig: { ...aiConfig, configured: aiConfig.configured && planLimits(plan).ai },
        aiPlanBlocked: !planLimits(plan).ai,   // true no Bronze → mostrar upsell
        updateAiConfig,
        addStudent,
        updateStudent,
        deleteStudent,
        // Gera (ou regenera) o código de acesso de um aluno já existente.
        generateStudentCode: async (studentId) => {
            const basePath = `users/${user.tenantId || user.uid}`;
            const tenantId = user.tenantId || user.uid;
            let accessCode = null;
            for (let i = 0; i < 5; i++) {
                const c = generateAccessCode();
                const codeSnap = await getDoc(doc(db, 'student_codes', c));
                if (!codeSnap.exists()) { accessCode = c; break; }
            }
            if (accessCode) {
                await setDoc(doc(db, 'student_codes', accessCode), { tenantId, studentId });
                await updateDoc(doc(db, `${basePath}/students`, studentId), { accessCode });
            }
            return accessCode;
        },
        expenses,
        addExpense,
        deleteExpense,
        teachers,
        addTeacher,
        updateTeacher,
        deleteTeacher,
        addTeacherPayment,
        deleteTeacherPayment,
        teacherPayments,
        exerciseLibrary,
        isTrainingMode,
        setIsTrainingMode,
        addExerciseToLibrary: async (data) => {
            const basePath = `users/${user.tenantId || user.uid}`;
            await addDoc(collection(db, `${basePath}/exercise_library`), { ...data, createdAt: new Date().toISOString() });
        },
        updateExerciseInLibrary: async (id, data) => {
            const basePath = `users/${user.tenantId || user.uid}`;
            await updateDoc(doc(db, `${basePath}/exercise_library`, id), data);
        },
        deleteExerciseFromLibrary: async (id) => {
            const basePath = `users/${user.tenantId || user.uid}`;
            await deleteDoc(doc(db, `${basePath}/exercise_library`, id));
        },
        logWorkoutCompletion: async (studentId, workoutData) => {
            try {
                const basePath = getUserBasePath();
                console.log(`[GymContext] Logging workout for student ${studentId} at path: ${basePath}/students/${studentId}/training_logs`);
                const logsRef = collection(db, `${basePath}/students/${studentId}/training_logs`);
                await addDoc(logsRef, {
                    ...workoutData,
                    timestamp: new Date().toISOString()
                });
                console.log("[GymContext] Workout logged successfully");
            } catch (error) {
                console.error("Error logging workout completion:", error);
                throw error;
            }
        },
        // Ranking do desafio: registra o treino no placar do mês (por aluno).
        // Guarda a DATA de cada treino (dates[]) pra dar pra contar só os que
        // caem dentro da janela do desafio. Mantém 'count' (total do mês).
        addWorkoutToLeaderboard: async (studentId, name, photo, completedAt) => {
            try {
                const basePath = getUserBasePath();
                const now = new Date();
                const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                const when = completedAt || now.toISOString();
                const ref = doc(db, `${basePath}/leaderboard`, monthKey);
                // Garante que o doc existe e atualiza o campo aninhado via dot-path.
                await setDoc(ref, { month: monthKey }, { merge: true });
                await updateDoc(ref, {
                    [`entries.${studentId}.name`]: name || 'Aluno',
                    [`entries.${studentId}.photo`]: photo || null,
                    [`entries.${studentId}.count`]: increment(1),
                    [`entries.${studentId}.dates`]: arrayUnion(when),
                });
                console.log('[Ranking] treino registrado para', studentId, when);
            } catch (error) {
                console.error("Erro ao atualizar ranking (leaderboard):", error);
            }
        }
    };

    return (
        <GymContext.Provider value={value}>
            {children}
        </GymContext.Provider>
    );
};
