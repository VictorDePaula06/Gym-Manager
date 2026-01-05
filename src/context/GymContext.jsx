import { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';

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
        gymName: 'GymManager',
        logoUrl: null,
        theme: 'dark'
    });
    const [expenses, setExpenses] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [teacherPayments, setTeacherPayments] = useState([]);

    useEffect(() => {
        // If no user, reset state
        if (!user) {
            setStudents([]);
            setExpenses([]);
            setTeachers([]);
            setTeacherPayments([]);
            setSettings({ gymName: 'GymManager', logoUrl: null, theme: 'dark' });

            // RESET LOADING STATES to prevent flash on next login
            setLoadingStudents(true);
            setLoadingSettings(true);
            return;
        }

        setLoadingStudents(true);
        setLoadingSettings(true);

        // Define Base Path for current user
        const userBasePath = `users/${user.uid}`;

        // Listener for students collection
        const unsubscribeStudents = onSnapshot(collection(db, `${userBasePath}/students`), (snapshot) => {
            const studentsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setStudents(studentsData);
            setLoadingStudents(false);
        }, (error) => {
            console.error("Error fetching students:", error);
            setLoadingStudents(false);
        });

        // Listener for expenses collection
        const unsubscribeExpenses = onSnapshot(collection(db, `${userBasePath}/expenses`), (snapshot) => {
            const expensesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setExpenses(expensesData);
        }, (error) => {
            console.error("Error fetching expenses:", error);
        });

        // Listener for teachers collection
        const unsubscribeTeachers = onSnapshot(collection(db, `${userBasePath}/teachers`), (snapshot) => {
            const teachersData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setTeachers(teachersData);
        }, (error) => {
            console.error("Error fetching teachers:", error);
        });

        // Listener for teacher payments
        const unsubscribeTeacherPayments = onSnapshot(collection(db, `${userBasePath}/teacher_payments`), (snapshot) => {
            const paymentsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setTeacherPayments(paymentsData);
        }, (error) => {
            console.error("Error fetching teacher payments:", error);
        });

        // Listener for Settings
        const unsubscribeSettings = onSnapshot(doc(db, `${userBasePath}/settings`, 'global'), (docSnap) => {
            const data = docSnap.exists() ? docSnap.data() : {};

            setSettings({
                gymName: data.gymName || 'GymManager',
                // Use local demo logo if DB has none, for preview purposes
                logoUrl: data.logoUrl || '/logo-demo.png',
                whatsapp: data.whatsapp || '',
                theme: data.theme || 'dark'
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

    const getUserBasePath = () => {
        if (!user) throw new Error("User not authenticated");
        return `users/${user.uid}`;
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
            await addDoc(collection(db, `${basePath}/students`), studentData);
        } catch (error) {
            console.error("Error adding student:", error);
            throw error;
        }
    };

    const updateStudent = async (id, studentData) => {
        try {
            const basePath = getUserBasePath();
            const { id: _, ...data } = studentData;
            await updateDoc(doc(db, `${basePath}/students`, id), data);
        } catch (error) {
            console.error("Error updating student:", error);
            throw error;
        }
    };

    const deleteStudent = async (id) => {
        try {
            const basePath = getUserBasePath();
            await deleteDoc(doc(db, `${basePath}/students`, id));
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
        teacherPayments
    };

    return (
        <GymContext.Provider value={value}>
            {children}
        </GymContext.Provider>
    );
};
