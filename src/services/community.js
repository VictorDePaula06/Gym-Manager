import { db, storage } from '../firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, arrayUnion, arrayRemove, increment } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { compressImage } from '../utils/imageOptimizer';

// Feed comunitário isolado por personal (tenant): users/{tenantId}/feed
const feedCol = (tenantId) => collection(db, `users/${tenantId}/feed`);
const postDoc = (tenantId, postId) => doc(db, `users/${tenantId}/feed`, postId);

export const subscribeFeed = (tenantId, cb) => {
    const q = query(feedCol(tenantId), orderBy('createdAt', 'desc'));
    return onSnapshot(
        q,
        (snap) => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
        (err) => { console.error('Erro no feed:', err); cb([]); }
    );
};

export const uploadPostImage = async (tenantId, file) => {
    let toUpload = file;
    try {
        const blob = await compressImage(file, 1080, 0.8);
        toUpload = new File([blob], file.name, { type: 'image/jpeg' });
    } catch (e) {
        console.warn('Compressão falhou, usando original', e);
    }
    const storageRef = ref(storage, `community/${tenantId}/${Date.now()}_${toUpload.name}`);
    await uploadBytes(storageRef, toUpload);
    return getDownloadURL(storageRef);
};

export const createPost = async (tenantId, post) => {
    return addDoc(feedCol(tenantId), {
        authorId: post.authorId,
        authorName: post.authorName || 'Aluno',
        authorPhoto: post.authorPhoto || null,
        text: (post.text || '').trim(),
        imageUrl: post.imageUrl || null,
        likes: [],
        commentCount: 0,
        createdAt: new Date().toISOString(),
    });
};

export const toggleLike = async (tenantId, postId, studentId, alreadyLiked) => {
    await updateDoc(postDoc(tenantId, postId), {
        likes: alreadyLiked ? arrayRemove(studentId) : arrayUnion(studentId),
    });
};

export const subscribeComments = (tenantId, postId, cb) => {
    const q = query(collection(db, `users/${tenantId}/feed/${postId}/comments`), orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snap) => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
};

export const addComment = async (tenantId, postId, comment) => {
    await addDoc(collection(db, `users/${tenantId}/feed/${postId}/comments`), {
        authorId: comment.authorId,
        authorName: comment.authorName || 'Aluno',
        text: (comment.text || '').trim(),
        createdAt: new Date().toISOString(),
    });
    await updateDoc(postDoc(tenantId, postId), { commentCount: increment(1) });
};

export const deletePost = async (tenantId, postId) => {
    await deleteDoc(postDoc(tenantId, postId));
};

export const updatePost = async (tenantId, postId, data) => {
    await updateDoc(postDoc(tenantId, postId), { ...data, editedAt: new Date().toISOString() });
};

// Placar do desafio mensal (treinos concluídos por aluno).
export const subscribeLeaderboard = (tenantId, monthKey, cb) => {
    return onSnapshot(
        doc(db, `users/${tenantId}/leaderboard`, monthKey),
        (snap) => cb(snap.exists() ? (snap.data().entries || {}) : {}),
        (err) => { console.error('Erro no ranking:', err); cb({}); }
    );
};

// Configuração do desafio do mês (definida pelo professor, lida pelo aluno).
export const subscribeChallenge = (tenantId, monthKey, cb) => {
    return onSnapshot(
        doc(db, `users/${tenantId}/challenges`, monthKey),
        (snap) => cb(snap.exists() ? snap.data() : null),
        (err) => { console.error('Erro no desafio:', err); cb(null); }
    );
};

export const saveChallenge = async (tenantId, monthKey, data) => {
    await setDoc(doc(db, `users/${tenantId}/challenges`, monthKey), {
        title: data.title || '',
        description: data.description || '',
        prize: data.prize || '',
        startDate: data.startDate || '',
        endDate: data.endDate || '',
        updatedAt: new Date().toISOString(),
    }, { merge: true });
};

// Status do desafio a partir das datas (YYYY-MM-DD).
export const getChallengeStatus = (ch) => {
    if (!ch || (!ch.startDate && !ch.endDate)) return null;
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (ch.startDate && today < ch.startDate) return { label: 'Agendado', color: '#94a3b8', daysLeft: null };
    if (ch.endDate && today > ch.endDate) return { label: 'Encerrado', color: '#ef4444', daysLeft: null };
    let daysLeft = null;
    if (ch.endDate) {
        const [y, m, dd] = ch.endDate.split('-').map(Number);
        daysLeft = Math.ceil((new Date(y, m - 1, dd, 23, 59) - d) / 86400000);
    }
    return { label: 'Em andamento', color: '#10b981', daysLeft };
};
