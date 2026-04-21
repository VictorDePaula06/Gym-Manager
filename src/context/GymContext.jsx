import { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, setDoc, getDoc, query, orderBy } from 'firebase/firestore';

const GymContext = createContext();

export const useGym = () => useContext(GymContext);
import { useAuth } from './AuthContext';

export const GymProvider = ({ children }) => {
    const { user } = useAuth();
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

    useEffect(() => {
        // If no user, reset state
        if (!user) {
            setStudents([]);
            setExpenses([]);
            setTeachers([]);
            setTeacherPayments([]);
            setSettings({ gymName: 'Vector GymHub', logoUrl: null, theme: 'dark' });

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

        if (user.role !== 'student') {
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

    const addStudent = async (studentData) => {
        try {
            const basePath = getUserBasePath();
            const tenantId = user.tenantId || user.uid;
            
            // 0. CHECK IF EMAIL ALREADY EXISTS (GLOBAL UNICITY)
            if (studentData.email) {
                const emailKey = studentData.email.toLowerCase().trim().replace(/\./g, '_');
                const accessRef = doc(db, 'student_access', emailKey);
                const accessSnap = await getDoc(accessRef);
                if (accessSnap.exists()) {
                    throw new Error("EMAIL_EXISTS");
                }
            }

            // 1. Add to main students collection
            const docRef = await addDoc(collection(db, `${basePath}/students`), studentData);
            const studentId = docRef.id;

            // 2. If has email and password, create student_access record
            if (studentData.email && studentData.password) {
                const emailKey = studentData.email.toLowerCase().trim().replace(/\./g, '_');
                await setDoc(doc(db, 'student_access', emailKey), {
                    email: studentData.email,
                    password: studentData.password,
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
            
            // 2. CHECK EMAIL UNICITY BEFORE ANY WRITE
            if (data.email) {
                const emailKey = data.email.toLowerCase().trim().replace(/\./g, '_');
                const accessRef = doc(db, 'student_access', emailKey);
                const accessSnap = await getDoc(accessRef);

                if (accessSnap.exists()) {
                    const accessData = accessSnap.data();
                    
                    // Case 1: studentId matches (New records)
                    // Case 2: studentId missing but email matches oldData (Legacy records)
                    const isSameStudent = accessData.studentId === id || 
                                         (!accessData.studentId && data.email.toLowerCase().trim() === oldData.email?.toLowerCase().trim());

                    if (!isSameStudent) {
                        throw new Error("EMAIL_EXISTS");
                    }
                }
            }

            // 3. Perform the main update
            await updateDoc(oldStudentRef, data);

            // 4. Sync student_access
            if (data.email && data.password) {
                const emailKey = data.email.toLowerCase().trim().replace(/\./g, '_');
                
                // If email changed, delete old access record
                const oldEmailNormalized = (oldData.email || '').toLowerCase().trim();
                const newEmailNormalized = (data.email || '').toLowerCase().trim();

                if (oldEmailNormalized && oldEmailNormalized !== newEmailNormalized) {
                    const oldEmailKey = oldEmailNormalized.replace(/\./g, '_');
                    await deleteDoc(doc(db, 'student_access', oldEmailKey));
                }

                await setDoc(doc(db, 'student_access', emailKey), {
                    email: data.email,
                    password: data.password,
                    name: data.name,
                    tenantId: tenantId,
                    studentId: id
                });
            } else if (oldData.email && !data.password) {
                // If password removed, maybe remove access? Or keep old?
                // For safety, if no password, they can't log in anyway.
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
        settings,
        updateSettings,
        addStudent,
        updateStudent,
        deleteStudent,
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
        }
    };

    return (
        <GymContext.Provider value={value}>
            {children}
        </GymContext.Provider>
    );
};
