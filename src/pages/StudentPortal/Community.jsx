import { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useGym } from '../../context/GymContext';
import { useToast } from '../../context/ToastContext';
import { Heart, MessageCircle, ImagePlus, Send, Trophy, Loader2, Trash2, X } from 'lucide-react';
import { subscribeFeed, createPost, uploadPostImage, toggleLike, subscribeComments, addComment, deletePost } from '../../services/community';

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
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState([]);
    const [commentText, setCommentText] = useState('');

    const liked = Array.isArray(post.likes) && post.likes.includes(me.id);
    const likeCount = Array.isArray(post.likes) ? post.likes.length : 0;

    useEffect(() => {
        if (!showComments) return;
        const unsub = subscribeComments(tenantId, post.id, setComments);
        return () => unsub();
    }, [showComments, tenantId, post.id]);

    const handleLike = () => toggleLike(tenantId, post.id, me.id, liked).catch(() => addToast('Erro ao curtir.', 'error'));

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
                {post.authorId === me.id && (
                    <button onClick={() => deletePost(tenantId, post.id).catch(() => {})}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                        <Trash2 size={16} />
                    </button>
                )}
            </div>

            {post.text && <p style={{ margin: '0 0 0.75rem 0', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{post.text}</p>}

            {post.imageUrl && (
                <img src={post.imageUrl} alt="post" style={{ width: '100%', borderRadius: '14px', marginBottom: '0.75rem', display: 'block' }} />
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

    useEffect(() => {
        if (!tenantId) return;
        const unsub = subscribeFeed(tenantId, setPosts);
        return () => unsub();
    }, [tenantId]);

    // Desafio do mês: ranking simples por nº de posts no mês corrente
    const challenge = useMemo(() => {
        const now = new Date();
        const month = now.toLocaleDateString('pt-BR', { month: 'long' });
        const counts = {};
        posts.forEach(p => {
            const d = new Date(p.createdAt);
            if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
                counts[p.authorId] = counts[p.authorId] || { name: p.authorName, photo: p.authorPhoto, n: 0 };
                counts[p.authorId].n++;
            }
        });
        const top = Object.values(counts).sort((a, b) => b.n - a.n).slice(0, 3);
        return { month, top };
    }, [posts]);

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
        <div>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Comunidade</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Compartilhe seus treinos com a galera da {settings?.gymName || 'academia'}.</p>

            {/* Desafio do mês */}
            <div className="glass-panel" style={{ padding: '1.1rem', marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(168,85,247,0.12), rgba(59,130,246,0.10))', border: '1px solid rgba(168,85,247,0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                    <Trophy size={20} color="#a855f7" />
                    <strong style={{ textTransform: 'capitalize' }}>Desafio de {challenge.month}</strong>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 0.75rem 0' }}>Quem mais posta treinos no mês lidera o ranking. Bora?</p>
                {challenge.top.length === 0 ? (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Ninguém postou este mês ainda. Seja o primeiro! 🏆</p>
                ) : (
                    <div style={{ display: 'flex', gap: '1.25rem' }}>
                        {challenge.top.map((t, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontWeight: 800, color: ['#fbbf24', '#94a3b8', '#b45309'][i] }}>{i + 1}º</span>
                                <Avatar name={t.name} photo={t.photo} size={30} />
                                <div>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{t.name}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t.n} post{t.n > 1 ? 's' : ''}</div>
                                </div>
                            </div>
                        ))}
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
