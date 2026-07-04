import { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useGym } from '../../context/GymContext';
import { useToast } from '../../context/ToastContext';
import { useDialog } from '../../context/DialogContext';
import { Heart, MessageCircle, ImagePlus, Send, Trophy, Loader2, Trash2, X, Pencil, Check } from 'lucide-react';
import { subscribeFeed, createPost, uploadPostImage, toggleLike, subscribeComments, addComment, deletePost, updatePost, subscribeLeaderboard, subscribeChallenge, getChallengeStatus } from '../../services/community';
import { auth } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';

const timeAgo = (iso) => {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'agora';
    if (m < 60) return `${m}min`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d`;
    return new Date(iso).toLocaleDateString('pt-BR');
};

const Avatar = ({ name, photo, size = 40 }) => (
    <div style={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
        background: 'var(--input-bg)', border: '1px solid var(--border-glass)',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
        {photo
            ? <img src={photo} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{(name || '?').charAt(0).toUpperCase()}</span>}
    </div>
);

function PostCard({ tenantId, post, me }) {
    const { addToast } = useToast();
    const { confirm } = useDialog();
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState([]);
    const [commentText, setCommentText] = useState('');
    const [editing, setEditing] = useState(false);
    const [editText, setEditText] = useState(post.text || '');

    const liked = Array.isArray(post.likes) && post.likes.includes(me.id);
    const likeCount = Array.isArray(post.likes) ? post.likes.length : 0;

    useEffect(() => {
        if (!showComments) return;
        const unsub = subscribeComments(tenantId, post.id, setComments);
        return () => unsub();
    }, [showComments, tenantId, post.id]);

    const handleLike = () => toggleLike(tenantId, post.id, me.id, liked).catch(() => addToast('Erro ao curtir.', 'error'));

    const handleDelete = async () => {
        const ok = await confirm({
            title: 'Excluir post',
            message: 'Tem certeza que deseja excluir esta publicação? Essa ação não pode ser desfeita.',
            confirmText: 'Excluir',
            cancelText: 'Cancelar',
            type: 'danger'
        });
        if (ok) deletePost(tenantId, post.id).catch(() => addToast('Erro ao excluir.', 'error'));
    };

    const handleSaveEdit = async () => {
        try {
            await updatePost(tenantId, post.id, { text: editText.trim() });
            setEditing(false);
            addToast('Post atualizado.', 'success');
        } catch { addToast('Erro ao editar.', 'error'); }
    };

    const handleComment = async () => {
        if (!commentText.trim()) return;
        try {
            await addComment(tenantId, post.id, { authorId: me.id, authorName: me.name, text: commentText });
            setCommentText('');
        } catch { addToast('Erro ao comentar.', 'error'); }
    };

    return (
        <div className="glass-panel" style={{ padding: '1.1rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <Avatar name={post.authorName} photo={post.authorPhoto} />
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{post.authorName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{timeAgo(post.createdAt)}</div>
                </div>
                {post.authorId === me.id && !editing && (
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button onClick={() => { setEditText(post.text || ''); setEditing(true); }} title="Editar"
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.15rem' }}>
                            <Pencil size={16} />
                        </button>
                        <button onClick={handleDelete} title="Excluir"
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.15rem' }}>
                            <Trash2 size={16} />
                        </button>
                    </div>
                )}
            </div>

            {editing ? (
                <div style={{ marginBottom: '0.75rem' }}>
                    <textarea value={editText} onChange={e => setEditText(e.target.value)} rows={2}
                        style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '10px', border: '1px solid var(--border-glass)', background: 'var(--input-bg)', color: 'var(--text-main)', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <button onClick={handleSaveEdit} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'var(--primary)', color: '#fff', border: 'none', padding: '0.4rem 0.9rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}><Check size={14} /> Salvar</button>
                        <button onClick={() => setEditing(false)} style={{ background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-glass)', padding: '0.4rem 0.9rem', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
                    </div>
                </div>
            ) : (
                post.text && <p style={{ margin: '0 0 0.75rem 0', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{post.text}{post.editedAt && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}> (editado)</span>}</p>
            )}

            {post.imageUrl && (
                <img src={post.imageUrl} alt="post" style={{ width: '100%', maxHeight: '480px', objectFit: 'cover', borderRadius: '14px', marginBottom: '0.75rem', display: 'block' }} />
            )}

            <div style={{ display: 'flex', gap: '1.5rem', paddingTop: '0.25rem' }}>
                <button onClick={handleLike} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', color: liked ? '#ef4444' : 'var(--text-muted)', fontWeight: 600 }}>
                    <Heart size={20} fill={liked ? '#ef4444' : 'none'} /> {likeCount > 0 && likeCount}
                </button>
                <button onClick={() => setShowComments(s => !s)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    <MessageCircle size={20} /> {post.commentCount > 0 && post.commentCount}
                </button>
            </div>

            {showComments && (
                <div style={{ marginTop: '0.9rem', borderTop: '1px solid var(--border-glass)', paddingTop: '0.9rem' }}>
                    {comments.map(c => (
                        <div key={c.id} style={{ display: 'flex', gap: '0.6rem', marginBottom: '0.7rem' }}>
                            <Avatar name={c.authorName} size={30} />
                            <div style={{ background: 'var(--input-bg)', borderRadius: '12px', padding: '0.5rem 0.75rem', flex: 1 }}>
                                <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>{c.authorName}</div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{c.text}</div>
                            </div>
                        </div>
                    ))}
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <input
                            value={commentText}
                            onChange={e => setCommentText(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleComment(); }}
                            placeholder="Escreva um comentário..."
                            style={{ flex: 1, padding: '0.6rem 0.85rem', borderRadius: '20px', border: '1px solid var(--border-glass)', background: 'var(--card-bg)', color: 'var(--text-main)', outline: 'none' }}
                        />
                        <button onClick={handleComment} disabled={!commentText.trim()}
                            style={{ background: 'var(--primary)', border: 'none', color: '#fff', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: commentText.trim() ? 'pointer' : 'not-allowed', opacity: commentText.trim() ? 1 : 0.5 }}>
                            <Send size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function Community() {
    const { user } = useAuth();
    const { students, settings } = useGym();
    const { addToast } = useToast();
    const [posts, setPosts] = useState([]);
    const [text, setText] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [publishing, setPublishing] = useState(false);
    const fileRef = useRef(null);

    const tenantId = user?.tenantId;
    const myPhoto = students?.[0]?.profilePictureUrl || null;
    const me = useMemo(() => ({ id: user?.studentId, name: user?.name || 'Aluno', photo: myPhoto }), [user, myPhoto]);

    const [board, setBoard] = useState({});
    const [challengeCfg, setChallengeCfg] = useState(null);
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    useEffect(() => {
        if (!tenantId) return;
        let unsubFeed = () => {};
        let unsubBoard = () => {};
        let unsubChallenge = () => {};
        // Só assina depois que o login anônimo do aluno estiver pronto
        // (evita permission-denied transitório no F5).
        const start = () => {
            unsubFeed(); unsubBoard(); unsubChallenge();
            unsubFeed = subscribeFeed(tenantId, setPosts);
            unsubBoard = subscribeLeaderboard(tenantId, monthKey, setBoard);
            unsubChallenge = subscribeChallenge(tenantId, monthKey, setChallengeCfg);
        };
        if (auth.currentUser) start();
        const unsubAuth = onAuthStateChanged(auth, (fbUser) => { if (fbUser) start(); });
        return () => { unsubAuth(); unsubFeed(); unsubBoard(); unsubChallenge(); };
    }, [tenantId, monthKey]);

    // Desafio do mês: ranking por TREINOS CONCLUÍDOS (placar), não por posts.
    const challenge = useMemo(() => {
        const month = new Date().toLocaleDateString('pt-BR', { month: 'long' });
        const all = Object.entries(board || {})
            .map(([id, e]) => ({ id, name: e.name, photo: e.photo, n: e.count || 0 }))
            .filter(e => e.n > 0)
            .sort((a, b) => b.n - a.n);
        const myIndex = all.findIndex(e => e.id === me.id);
        return {
            month,
            top: all.slice(0, 3),
            total: all.length,
            myRank: myIndex >= 0 ? { pos: myIndex + 1, n: all[myIndex].n } : null,
        };
    }, [board, me.id]);

    const chStatus = getChallengeStatus(challengeCfg);

    const pickImage = (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setImageFile(f);
        setImagePreview(URL.createObjectURL(f));
    };

    const handlePublish = async () => {
        if (!text.trim() && !imageFile) return;
        setPublishing(true);
        try {
            let imageUrl = null;
            if (imageFile) imageUrl = await uploadPostImage(tenantId, imageFile);
            await createPost(tenantId, { authorId: me.id, authorName: me.name, authorPhoto: me.photo, text, imageUrl });
            setText(''); setImageFile(null); setImagePreview(null);
            addToast('Publicado! 💪', 'success');
        } catch (e) {
            console.error(e);
            addToast('Erro ao publicar.', 'error');
        } finally {
            setPublishing(false);
        }
    };

    return (
        <div className="student-feed">
            <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Comunidade</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Compartilhe seus treinos com a galera da {settings?.gymName || 'academia'}.</p>

            {/* Desafio do mês */}
            <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(59,130,246,0.08))', border: '1px solid rgba(168,85,247,0.35)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.9rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(168,85,247,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Trophy size={20} color="#a855f7" />
                        </div>
                        <div>
                            <strong style={{ textTransform: 'capitalize', display: 'block', lineHeight: 1.2 }}>{challengeCfg?.title || `Desafio de ${challenge.month}`}</strong>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{challengeCfg?.description || 'Quem mais treina lidera 🏆'}</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.3rem' }}>
                        {chStatus && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', fontWeight: 700, color: chStatus.color, background: `${chStatus.color}22`, padding: '0.25rem 0.55rem', borderRadius: '20px', whiteSpace: 'nowrap' }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: chStatus.color }} />
                                {chStatus.label}{chStatus.daysLeft != null && chStatus.daysLeft >= 0 ? ` · ${chStatus.daysLeft}d` : ''}
                            </span>
                        )}
                        {challenge.total > 0 && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '0.25rem 0.55rem', borderRadius: '20px', whiteSpace: 'nowrap' }}>
                                {challenge.total} participante{challenge.total > 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                </div>

                {challengeCfg?.prize && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: '10px', padding: '0.5rem 0.75rem', marginBottom: '0.9rem', fontSize: '0.82rem' }}>
                        <span>🏆</span><span><strong>Prêmio:</strong> {challengeCfg.prize}</span>
                    </div>
                )}

                {challenge.top.length === 0 ? (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, textAlign: 'center', padding: '0.5rem 0' }}>
                        Ninguém concluiu treino este mês ainda.<br />Seja o primeiro! 💪
                    </p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        {challenge.top.map((t, i) => {
                            const isMe = t.id === me.id;
                            return (
                                <div key={t.id} style={{
                                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                                    padding: '0.5rem 0.6rem', borderRadius: '12px',
                                    background: isMe ? 'rgba(168,85,247,0.18)' : 'rgba(255,255,255,0.03)',
                                    border: isMe ? '1px solid rgba(168,85,247,0.4)' : '1px solid transparent'
                                }}>
                                    <span style={{ fontSize: '1.2rem', width: '26px', textAlign: 'center' }}>{['🥇', '🥈', '🥉'][i]}</span>
                                    <Avatar name={t.name} photo={t.photo} size={34} />
                                    <span style={{ flex: 1, fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {t.name}{isMe && <span style={{ color: '#a855f7', fontWeight: 700 }}> (você)</span>}
                                    </span>
                                    <span style={{ fontWeight: 800, color: '#a855f7', fontSize: '0.95rem' }}>
                                        {t.n}<span style={{ fontSize: '0.7rem', fontWeight: 500, color: 'var(--text-muted)' }}> treino{t.n > 1 ? 's' : ''}</span>
                                    </span>
                                </div>
                            );
                        })}

                        {/* Sua posição, se estiver fora do top 3 */}
                        {challenge.myRank && challenge.myRank.pos > 3 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.6rem', borderRadius: '12px', background: 'rgba(168,85,247,0.18)', border: '1px solid rgba(168,85,247,0.4)', marginTop: '0.2rem' }}>
                                <span style={{ fontWeight: 800, width: '26px', textAlign: 'center', color: '#a855f7' }}>{challenge.myRank.pos}º</span>
                                <Avatar name={me.name} photo={me.photo} size={34} />
                                <span style={{ flex: 1, fontWeight: 600, fontSize: '0.9rem' }}>Você</span>
                                <span style={{ fontWeight: 800, color: '#a855f7', fontSize: '0.95rem' }}>
                                    {challenge.myRank.n}<span style={{ fontSize: '0.7rem', fontWeight: 500, color: 'var(--text-muted)' }}> treino{challenge.myRank.n > 1 ? 's' : ''}</span>
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Compositor */}
            <div className="glass-panel" style={{ padding: '1.1rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <Avatar name={me.name} photo={me.photo} />
                    <textarea
                        value={text}
                        onChange={e => setText(e.target.value)}
                        rows={2}
                        placeholder="Como foi o treino de hoje?"
                        style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-main)', resize: 'none', outline: 'none', fontSize: '1rem', fontFamily: 'inherit' }}
                    />
                </div>
                {imagePreview && (
                    <div style={{ position: 'relative', marginTop: '0.75rem' }}>
                        <img src={imagePreview} alt="preview" style={{ width: '100%', borderRadius: '12px', display: 'block' }} />
                        <button onClick={() => { setImageFile(null); setImagePreview(null); }}
                            style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <X size={16} />
                        </button>
                    </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', borderTop: '1px solid var(--border-glass)', paddingTop: '0.75rem' }}>
                    <button onClick={() => fileRef.current?.click()} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
                        <ImagePlus size={20} /> Foto
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" onChange={pickImage} style={{ display: 'none' }} />
                    <button
                        onClick={handlePublish}
                        disabled={publishing || (!text.trim() && !imageFile)}
                        style={{ background: 'var(--primary)', border: 'none', color: '#fff', padding: '0.6rem 1.5rem', borderRadius: '20px', fontWeight: 600, cursor: (publishing || (!text.trim() && !imageFile)) ? 'not-allowed' : 'pointer', opacity: (publishing || (!text.trim() && !imageFile)) ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        {publishing ? <><Loader2 size={16} className="animate-spin" /> Publicando</> : 'Publicar'}
                    </button>
                </div>
            </div>

            {/* Feed */}
            {posts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                    <MessageCircle size={40} style={{ opacity: 0.4, marginBottom: '1rem' }} />
                    <p>Nenhum post ainda. Comece a comunidade com o seu treino de hoje! 💪</p>
                </div>
            ) : (
                posts.map(post => <PostCard key={post.id} tenantId={tenantId} post={post} me={me} />)
            )}
        </div>
    );
}
