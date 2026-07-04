import { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGym } from '../context/GymContext';
import { useToast } from '../context/ToastContext';
import { useDialog } from '../context/DialogContext';
import { Trophy, Heart, MessageCircle, Trash2, Save, Users, Medal, Pencil, X, ImagePlus, Send, Gift, Clock, BarChart3 } from 'lucide-react';
import { subscribeFeed, createPost, uploadPostImage, toggleLike, subscribeComments, addComment, deletePost, subscribeLeaderboard, subscribeChallenge, saveChallenge, getChallengeStatus } from '../services/community';

const timeAgo = (iso) => {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'agora';
    if (m < 60) return `${m}min atrás`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h atrás`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d atrás`;
    return new Date(iso).toLocaleDateString('pt-BR');
};

const Avatar = ({ name, photo, size = 40 }) => (
    <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, overflow: 'hidden', background: 'var(--input-bg)', border: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {photo ? <img src={photo} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{(name || '?').charAt(0).toUpperCase()}</span>}
    </div>
);

const fmtDay = (ymd) => { const [, m, d] = ymd.split('-'); return `${Number(d)}/${Number(m)}`; };

function CircleProgress({ pct, size = 84 }) {
    const r = (size - 10) / 2;
    const c = 2 * Math.PI * r;
    const off = c - (Math.max(0, Math.min(100, pct)) / 100) * c;
    return (
        <div style={{ position: 'relative', width: size, height: size }}>
            <svg width={size} height={size}>
                <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--border-glass)" strokeWidth="7" fill="none" />
                <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--primary)" strokeWidth="7" fill="none" strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: 'stroke-dashoffset 0.5s' }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.05rem' }}>{Math.round(pct)}%</div>
        </div>
    );
}

function PostCard({ tenantId, post, me, canModerate }) {
    const { addToast } = useToast();
    const { confirm } = useDialog();
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState([]);
    const [commentText, setCommentText] = useState('');
    const liked = Array.isArray(post.likes) && post.likes.includes(me.id);
    const likeCount = Array.isArray(post.likes) ? post.likes.length : 0;

    useEffect(() => {
        if (!showComments) return;
        return subscribeComments(tenantId, post.id, setComments);
    }, [showComments, tenantId, post.id]);

    const handleComment = async () => {
        if (!commentText.trim()) return;
        try { await addComment(tenantId, post.id, { authorId: me.id, authorName: me.name, text: commentText }); setCommentText(''); }
        catch { addToast('Erro ao comentar.', 'error'); }
    };
    const handleDelete = async () => {
        const ok = await confirm({ title: 'Excluir post', message: 'Remover esta publicação do feed?', confirmText: 'Excluir', type: 'danger' });
        if (ok) deletePost(tenantId, post.id).catch(() => addToast('Erro ao excluir.', 'error'));
    };

    return (
        <div className="glass-panel" style={{ padding: '1.1rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <Avatar name={post.authorName} photo={post.authorPhoto} />
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600 }}>{post.authorName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{timeAgo(post.createdAt)}</div>
                </div>
                {(canModerate || post.authorId === me.id) && (
                    <button onClick={handleDelete} title="Remover" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><Trash2 size={16} /></button>
                )}
            </div>
            {post.text && <p style={{ margin: '0 0 0.75rem 0', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{post.text}</p>}
            {post.imageUrl && <img src={post.imageUrl} alt="post" style={{ width: '100%', maxHeight: '440px', objectFit: 'cover', borderRadius: '14px', marginBottom: '0.75rem', display: 'block' }} />}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', paddingTop: '0.25rem' }}>
                <button onClick={() => toggleLike(tenantId, post.id, me.id, liked)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', color: liked ? '#ef4444' : 'var(--text-muted)', fontWeight: 600 }}>
                    <Heart size={20} fill={liked ? '#ef4444' : 'none'} /> {likeCount > 0 && likeCount}
                </button>
                <button onClick={() => setShowComments(s => !s)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    <MessageCircle size={20} /> {post.commentCount > 0 ? post.commentCount : 'Comentar'}
                </button>
            </div>
            {showComments && (
                <div style={{ marginTop: '0.9rem', borderTop: '1px solid var(--border-glass)', paddingTop: '0.9rem' }}>
                    {comments.map(c => (
                        <div key={c.id} style={{ display: 'flex', gap: '0.6rem', marginBottom: '0.7rem' }}>
                            <Avatar name={c.authorName} size={30} />
                            <div style={{ background: 'var(--input-bg)', borderRadius: '12px', padding: '0.5rem 0.75rem', flex: 1 }}>
                                <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>{c.authorName}</div>
                                <div style={{ fontSize: '0.9rem' }}>{c.text}</div>
                            </div>
                        </div>
                    ))}
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <input value={commentText} onChange={e => setCommentText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleComment(); }} placeholder="Escreva um comentário..." style={{ flex: 1, padding: '0.6rem 0.85rem', borderRadius: '20px', border: '1px solid var(--border-glass)', background: 'var(--card-bg)', color: 'var(--text-main)', outline: 'none' }} />
                        <button onClick={handleComment} disabled={!commentText.trim()} style={{ background: 'var(--primary)', border: 'none', color: '#fff', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: commentText.trim() ? 1 : 0.5 }}><Send size={16} /></button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function CommunityManager() {
    const { user } = useAuth();
    const { settings } = useGym();
    const { addToast } = useToast();
    const tenantId = user?.tenantId || user?.uid;

    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthName = now.toLocaleDateString('pt-BR', { month: 'long' });

    const [tab, setTab] = useState('feed');
    const [posts, setPosts] = useState([]);
    const [visibleCount, setVisibleCount] = useState(4);
    const [board, setBoard] = useState({});
    const [challenge, setChallenge] = useState(null);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({ title: '', description: '', prize: '', startDate: '', endDate: '' });
    const [saving, setSaving] = useState(false);

    // Composer do personal
    const [text, setText] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [publishing, setPublishing] = useState(false);
    const fileRef = useRef(null);

    const me = { id: tenantId, name: settings?.gymName || 'Personal', photo: settings?.logoUrl || null };

    useEffect(() => {
        if (!tenantId) return;
        const u1 = subscribeFeed(tenantId, setPosts);
        const u2 = subscribeLeaderboard(tenantId, monthKey, setBoard);
        const u3 = subscribeChallenge(tenantId, monthKey, setChallenge);
        return () => { u1(); u2(); u3(); };
    }, [tenantId, monthKey]);

    const ranking = useMemo(() => (
        Object.entries(board || {}).map(([id, e]) => ({ id, name: e.name, photo: e.photo, n: e.count || 0 })).filter(e => e.n > 0).sort((a, b) => b.n - a.n)
    ), [board]);

    const totalTreinos = useMemo(() => Object.values(board || {}).reduce((s, e) => s + (e.count || 0), 0), [board]);
    const totalLikes = useMemo(() => posts.reduce((s, p) => s + (Array.isArray(p.likes) ? p.likes.length : 0), 0), [posts]);
    const totalComments = useMemo(() => posts.reduce((s, p) => s + (p.commentCount || 0), 0), [posts]);
    const status = getChallengeStatus(challenge);
    const challengeTitle = challenge?.title || `Desafio de ${monthName}`;

    // % do período decorrido (progresso do desafio)
    const periodPct = useMemo(() => {
        if (!challenge?.startDate || !challenge?.endDate) return null;
        const [sy, sm, sd] = challenge.startDate.split('-').map(Number);
        const [ey, em, ed] = challenge.endDate.split('-').map(Number);
        const start = new Date(sy, sm - 1, sd), end = new Date(ey, em - 1, ed, 23, 59);
        const total = end - start; if (total <= 0) return 100;
        return ((Date.now() - start) / total) * 100;
    }, [challenge]);

    const openEditor = () => {
        setForm({ title: challenge?.title || '', description: challenge?.description || '', prize: challenge?.prize || '', startDate: challenge?.startDate || '', endDate: challenge?.endDate || '' });
        setEditing(true);
    };
    const handleSaveChallenge = async () => {
        setSaving(true);
        try { await saveChallenge(tenantId, monthKey, form); addToast('Desafio salvo!', 'success'); setEditing(false); }
        catch (e) { console.error(e); addToast('Erro ao salvar.', 'error'); } finally { setSaving(false); }
    };

    const pickImage = (e) => { const f = e.target.files?.[0]; if (!f) return; setImageFile(f); setImagePreview(URL.createObjectURL(f)); };
    const handlePublish = async () => {
        if (!text.trim() && !imageFile) return;
        setPublishing(true);
        try {
            let imageUrl = null;
            if (imageFile) imageUrl = await uploadPostImage(tenantId, imageFile);
            await createPost(tenantId, { authorId: me.id, authorName: me.name, authorPhoto: me.photo, text, imageUrl });
            setText(''); setImageFile(null); setImagePreview(null);
            addToast('Publicado! 💪', 'success');
        } catch (e) { console.error(e); addToast('Erro ao publicar.', 'error'); } finally { setPublishing(false); }
    };

    const inputStyle = { width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--border-glass)', background: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };
    const labelStyle = { display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' };
    const tabBtn = (key, label) => (
        <button onClick={() => setTab(key)} style={{ padding: '0.6rem 1rem', background: 'none', border: 'none', borderBottom: `2px solid ${tab === key ? 'var(--primary)' : 'transparent'}`, color: tab === key ? 'var(--text-main)' : 'var(--text-muted)', fontWeight: tab === key ? 700 : 500, cursor: 'pointer', fontSize: '0.9rem' }}>{label}</button>
    );

    const rankingCard = (top) => (
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '1rem' }}><Trophy size={18} color="#fbbf24" /> Ranking{top ? ' (Top 5)' : ''}</h3>
                {top && <button onClick={() => setTab('ranking')} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>Ver completo</button>}
            </div>
            {ranking.length === 0 ? <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Nenhum treino concluído ainda.</p> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {(top ? ranking.slice(0, 5) : ranking).map((t, i) => (
                        <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', padding: '0.5rem 0.4rem' }}>
                            <span style={{ width: '26px', height: '26px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem', color: i < 3 ? '#111' : 'var(--text-muted)', background: ['#fbbf24', '#cbd5e1', '#d19a5c'][i] || 'var(--input-bg)' }}>{i + 1}</span>
                            <Avatar name={t.name} photo={t.photo} size={32} />
                            <span style={{ flex: 1, fontWeight: 600, fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</span>
                            <span style={{ textAlign: 'right', fontWeight: 700, fontSize: '0.9rem' }}>{t.n}<div style={{ fontSize: '0.68rem', fontWeight: 500, color: 'var(--text-muted)' }}>treino{t.n > 1 ? 's' : ''}</div></span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const statCell = (value, label) => (
        <div style={{ textAlign: 'center', padding: '0.75rem 0.25rem' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>{value}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{label}</div>
        </div>
    );

    return (
        <div style={{ maxWidth: '1040px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                    <h1>Comunidade</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Conecte, motive e acompanhe seus alunos.</p>
                </div>
                <button onClick={openEditor} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.1rem', borderRadius: '10px', border: '1px solid var(--border-glass)', background: 'var(--card-bg)', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 600 }}>
                    <Pencil size={16} /> Editar desafio
                </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-glass)', marginBottom: '1.5rem', overflowX: 'auto' }}>
                {tabBtn('feed', 'Feed')}
                {tabBtn('ranking', 'Ranking')}
                {tabBtn('desafios', 'Desafios')}
            </div>

            {/* Banner do desafio */}
            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(16,185,129,0.14), rgba(16,185,129,0.04))', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(251,191,36,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Trophy size={34} color="#fbbf24" />
                </div>
                <div style={{ flex: 1, minWidth: '220px' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Desafio do mês</div>
                    <h2 style={{ margin: '0.15rem 0 0.35rem', fontSize: '1.4rem' }}>{challengeTitle}</h2>
                    <p style={{ margin: '0 0 0.75rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{challenge?.description || 'Defina o desafio do mês em "Editar desafio".'}</p>
                    <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Users size={15} /> {ranking.length} participantes</span>
                        {status?.daysLeft != null && status.daysLeft >= 0 && <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Clock size={15} /> {status.daysLeft} dias restantes</span>}
                        {challenge?.prize && <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Gift size={15} /> Prêmio: {challenge.prize}</span>}
                    </div>
                </div>
                {periodPct != null && (
                    <div style={{ textAlign: 'center' }}>
                        <CircleProgress pct={periodPct} />
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>do período</div>
                    </div>
                )}
            </div>

            {tab === 'feed' && (
                <div className="community-mgr-grid">
                    {/* Ranking + Resumo (sidebar) — direita estreita */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', order: 2 }}>
                        {rankingCard(true)}
                        <div className="glass-panel" style={{ padding: '1.25rem' }}>
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 0.5rem', fontSize: '1rem' }}><BarChart3 size={18} color="#3b82f6" /> Resumo da comunidade</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
                                {statCell(ranking.length, 'Participantes')}
                                {statCell(totalTreinos, 'Treinos')}
                                {statCell(posts.length, 'Posts')}
                                {statCell(totalLikes, 'Curtidas')}
                                {statCell(totalComments, 'Comentários')}
                                {statCell(ranking[0]?.n || 0, 'Recorde')}
                            </div>
                        </div>
                    </div>

                    {/* Feed (esquerda larga) */}
                    <div style={{ order: 1 }}>
                        {/* Composer do personal */}
                        <div className="glass-panel" style={{ padding: '1.1rem', marginBottom: '1.25rem' }}>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <Avatar name={me.name} photo={me.photo} />
                                <textarea value={text} onChange={e => setText(e.target.value)} rows={2} placeholder="Compartilhe algo com a comunidade..." style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-main)', resize: 'none', outline: 'none', fontSize: '1rem', fontFamily: 'inherit' }} />
                            </div>
                            {imagePreview && (
                                <div style={{ position: 'relative', marginTop: '0.75rem' }}>
                                    <img src={imagePreview} alt="preview" style={{ width: '100%', maxHeight: '320px', objectFit: 'cover', borderRadius: '12px', display: 'block' }} />
                                    <button onClick={() => { setImageFile(null); setImagePreview(null); }} style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer' }}><X size={16} /></button>
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', borderTop: '1px solid var(--border-glass)', paddingTop: '0.75rem' }}>
                                <button onClick={() => fileRef.current?.click()} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}><ImagePlus size={20} /> Foto</button>
                                <input ref={fileRef} type="file" accept="image/*" onChange={pickImage} style={{ display: 'none' }} />
                                <button onClick={handlePublish} disabled={publishing || (!text.trim() && !imageFile)} className="btn-primary" style={{ padding: '0.6rem 1.5rem', opacity: (publishing || (!text.trim() && !imageFile)) ? 0.6 : 1 }}>
                                    {publishing ? 'Publicando...' : 'Publicar'}
                                </button>
                            </div>
                        </div>

                        {posts.length === 0 ? (
                            <div className="glass-panel" style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>Nenhum post ainda. Publique algo pra começar! 💪</div>
                        ) : (
                            <>
                                {posts.slice(0, visibleCount).map(post => <PostCard key={post.id} tenantId={tenantId} post={post} me={me} canModerate />)}
                                {visibleCount < posts.length && (
                                    <button
                                        onClick={() => setVisibleCount(c => c + 4)}
                                        style={{ width: '100%', padding: '0.85rem', background: 'var(--card-bg)', border: '1px solid var(--border-glass)', borderRadius: '12px', color: 'var(--text-main)', fontWeight: 600, cursor: 'pointer' }}
                                    >
                                        Ver mais posts ({posts.length - visibleCount})
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}

            {tab === 'ranking' && rankingCard(false)}

            {tab === 'desafios' && (
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0 }}>Desafio atual</h3>
                        <button onClick={openEditor} className="btn-primary" style={{ padding: '0.5rem 1rem' }}><Pencil size={16} /> Editar</button>
                    </div>
                    <p style={{ color: 'var(--text-muted)' }}><strong style={{ color: 'var(--text-main)' }}>{challengeTitle}</strong>{challenge?.startDate && challenge?.endDate ? ` · ${fmtDay(challenge.startDate)} a ${fmtDay(challenge.endDate)}` : ''}{challenge?.prize ? ` · Prêmio: ${challenge.prize}` : ''}</p>
                    <p style={{ color: 'var(--text-muted)' }}>{challenge?.description || 'Sem descrição.'}</p>
                </div>
            )}

            {/* Modal de edição */}
            {editing && (
                <div className="modal-backdrop" onClick={() => !saving && setEditing(false)}>
                    <div className="glass-panel" onClick={e => e.stopPropagation()} style={{ padding: '1.75rem', width: '95%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Trophy size={20} color="#fbbf24" /> Editar desafio</h3>
                            <button onClick={() => setEditing(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div><label style={labelStyle}>Título</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Ex: Julho sem faltar treino" style={inputStyle} /></div>
                            <div><label style={labelStyle}>Descrição / regras</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Ex: Complete o máximo de treinos possíveis este mês!" style={{ ...inputStyle, resize: 'vertical' }} /></div>
                            <div><label style={labelStyle}>Prêmio (opcional)</label><input value={form.prize} onChange={e => setForm({ ...form, prize: e.target.value })} placeholder="Ex: Camiseta Oficial Vector" style={inputStyle} /></div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div><label style={labelStyle}>Início</label><input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} style={inputStyle} /></div>
                                <div><label style={labelStyle}>Fim</label><input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} style={inputStyle} /></div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button onClick={handleSaveChallenge} disabled={saving} className="btn-primary" style={{ flex: 1, padding: '0.8rem', opacity: saving ? 0.7 : 1 }}><Save size={18} /> {saving ? 'Salvando...' : 'Salvar desafio'}</button>
                            <button onClick={() => setEditing(false)} disabled={saving} style={{ padding: '0.8rem 1.5rem', borderRadius: '12px', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-glass)', cursor: 'pointer' }}>Cancelar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
