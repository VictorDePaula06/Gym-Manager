import { db } from '../firebase';
import { collection, addDoc, onSnapshot, query, orderBy, getDocs, limit } from 'firebase/firestore';

// Check-ins do aluno: users/{tenantId}/students/{studentId}/checkins
const checkinsCol = (tenantId, studentId) =>
    collection(db, `users/${tenantId}/students/${studentId}/checkins`);

// Aluno envia um check-in (respostas + data).
export const submitCheckin = async (tenantId, studentId, answers) => {
    return addDoc(checkinsCol(tenantId, studentId), {
        answers: answers || {},
        createdAt: new Date().toISOString(),
    });
};

// Personal acompanha o histórico de check-ins do aluno (mais recente primeiro).
export const subscribeCheckins = (tenantId, studentId, cb) => {
    const q = query(checkinsCol(tenantId, studentId), orderBy('createdAt', 'desc'));
    return onSnapshot(
        q,
        (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
        (err) => { console.error('Erro nos check-ins:', err); cb([]); }
    );
};

// Último check-in do aluno (pra decidir se está na hora de pedir outro).
export const getLastCheckin = async (tenantId, studentId) => {
    const q = query(checkinsCol(tenantId, studentId), orderBy('createdAt', 'desc'), limit(1));
    const snap = await getDocs(q);
    return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
};
