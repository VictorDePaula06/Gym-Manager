import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useGym } from '../context/GymContext';
import { useToast } from '../context/ToastContext';
import { Plus, Search, Video, Trash2, Edit2, Play, Loader2, Dumbbell, X } from 'lucide-react';
import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

export default function ExerciseLibrary() {
    const { exerciseLibrary, addExerciseToLibrary, updateExerciseInLibrary, deleteExerciseFromLibrary } = useGym();
    const { addToast } = useToast();
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExercise, setEditingExercise] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [videoPreview, setVideoPreview] = useState(null);

    const [form, setForm] = useState({
        name: '',
        category: 'Geral',
        videoUrl: ''
    });

    const categories = ['Peito', 'Costas', 'Ombros', 'Bíceps', 'Tríceps', 'Pernas', 'Abdômen', 'Geral'];

    const filteredExercises = exerciseLibrary.filter(ex => 
        ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ex.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleOpenModal = (exercise = null) => {
        if (exercise) {
            setEditingExercise(exercise);
            setForm({
                name: exercise.name,
                category: exercise.category || 'Geral',
                videoUrl: exercise.videoUrl || ''
            });
            setVideoPreview(exercise.videoUrl);
        } else {
            setEditingExercise(null);
            setForm({ name: '', category: 'Geral', videoUrl: '' });
            setVideoPreview(null);
        }
        setIsModalOpen(true);
    };

    const handleVideoUpload = async (file) => {
        if (!file) return;
        if (file.size > 20 * 1024 * 1024) {
            addToast("Vídeo muito grande (máx 20MB)", 'error');
            return;
        }

        setIsUploading(true);
        try {
            const videoRef = ref(storage, `library_videos/${Date.now()}_${file.name}`);
            await uploadBytes(videoRef, file);
            const url = await getDownloadURL(videoRef);
            setForm(prev => ({ ...prev, videoUrl: url }));
            setVideoPreview(url);
            addToast("Vídeo carregado com sucesso!", 'success');
        } catch (error) {
            console.error("Upload error:", error);
            addToast("Erro no upload do vídeo", 'error');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name) return addToast("Nome é obrigatório", 'error');

        try {
            if (editingExercise) {
                await updateExerciseInLibrary(editingExercise.id, form);
                addToast("Exercício atualizado!", 'success');
            } else {
                await addExerciseToLibrary(form);
                addToast("Exercício cadastrado!", 'success');
            }
            setIsModalOpen(false);
        } catch (error) {
            addToast("Erro ao salvar exercício", 'error');
        }
    };

    const handleDelete = async (exercise) => {
        if (!window.confirm(`Excluir "${exercise.name}"? Isso removerá o vínculo global do vídeo.`)) return;
        
        try {
            await deleteExerciseFromLibrary(exercise.id);
            // Optional: delete video from storage if it exists
            addToast("Exercício removido", 'success');
        } catch (error) {
            addToast("Erro ao excluir", 'error');
        }
    };

    return (
        <>
            <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Meus Exercícios</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Gerencie sua biblioteca global de vídeos e execuções.</p>
                </div>
                <button 
                    onClick={() => handleOpenModal()}
                    className="btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <Plus size={20} /> Novo Exercício
                </button>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ position: 'relative' }}>
                    <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={20} />
                    <input 
                        type="text" 
                        placeholder="Buscar por nome ou categoria..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '1rem 1rem 1rem 3rem',
                            background: 'var(--input-bg)',
                            border: '1px solid var(--border-glass)',
                            borderRadius: '12px',
                            color: 'var(--text-main)',
                            fontSize: '1rem'
                        }}
                    />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {filteredExercises.map(ex => (
                    <div key={ex.id} className="glass-panel hover-scale" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <span style={{ 
                                    fontSize: '0.7rem', 
                                    textTransform: 'uppercase', 
                                    padding: '2px 8px', 
                                    background: 'var(--primary-glow)', 
                                    color: 'var(--primary)', 
                                    borderRadius: '4px',
                                    fontWeight: 'bold'
                                }}>
                                    {ex.category || 'Geral'}
                                </span>
                                <h3 style={{ marginTop: '0.5rem', fontSize: '1.1rem' }}>{ex.name}</h3>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button onClick={() => handleOpenModal(ex)} style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                    <Edit2 size={18} />
                                </button>
                                <button onClick={() => handleDelete(ex)} style={{ padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', border: 'none', borderRadius: '8px', cursor: 'pointer', color: '#ef4444' }}>
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        {ex.videoUrl ? (
                            <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', aspectVideo: '16/9', background: '#000' }}>
                                <video 
                                    src={ex.videoUrl} 
                                    style={{ width: '100%', display: 'block' }}
                                    muted
                                    onMouseOver={e => e.target.play()}
                                    onMouseOut={e => {e.target.pause(); e.target.currentTime = 0;}}
                                />
                                <div style={{ position: 'absolute', bottom: '0.5rem', right: '0.5rem', background: 'rgba(0,0,0,0.6)', padding: '4px', borderRadius: '4px' }}>
                                    <Video size={14} color="white" />
                                </div>
                            </div>
                        ) : (
                            <div style={{ 
                                height: '120px', 
                                background: 'rgba(255,255,255,0.02)', 
                                border: '1px dashed var(--border-glass)', 
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--text-muted)'
                            }}>
                                <span style={{ fontSize: '0.9rem' }}>Sem vídeo cadastrado</span>
                            </div>
                        )}
                    </div>
                ))}

                {filteredExercises.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem' }}>
                        <Dumbbell size={48} color="var(--text-muted)" style={{ opacity: 0.2, marginBottom: '1rem' }} />
                        <p style={{ color: 'var(--text-muted)' }}>Nenhum exercício encontrado na sua biblioteca.</p>
                    </div>
                ) }
            </div>

            </div>

            {/* Modal para Adicionar/Editar - Renderizado via Portal para cobrir tudo */}
            {isModalOpen && createPortal(
                <div 
                    className="modal-backdrop-custom"
                    onClick={(e) => e.target === e.currentTarget && setIsModalOpen(false)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(5, 10, 20, 0.95)', // Fundo sólido/transparente sem blur para evitar bugs
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 99999,
                        padding: '1rem'
                    }}
                >
                    <div 
                        className="glass-panel" 
                        style={{ 
                            width: '100%', 
                            maxWidth: '500px', 
                            padding: '2rem', 
                            position: 'relative',
                            background: 'var(--bg-card)',
                            boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <button 
                            onClick={() => setIsModalOpen(false)} 
                            style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                        >
                            <X size={24} />
                        </button>
                        
                        <h2 style={{ marginBottom: '1.5rem' }}>{editingExercise ? 'Editar Exercício' : 'Novo Exercício'}</h2>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Nome do Exercício</label>
                                <input 
                                    type="text" 
                                    value={form.name}
                                    onChange={e => setForm({...form, name: e.target.value})}
                                    placeholder="Ex: Levantamento Terra"
                                    style={{ width: '100%', padding: '0.75rem', background: 'var(--input-bg)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: 'var(--text-main)' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Categoria</label>
                                <select 
                                    value={form.category}
                                    onChange={e => setForm({...form, category: e.target.value})}
                                    style={{ width: '100%', padding: '0.75rem', background: 'var(--input-bg)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: 'var(--text-main)' }}
                                >
                                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Vídeo Demonstrativo</label>
                                <div style={{ 
                                    border: '1px dashed var(--border-glass)', 
                                    borderRadius: '12px', 
                                    padding: '1rem',
                                    textAlign: 'center',
                                    background: 'rgba(255,255,255,0.02)'
                                }}>
                                    {isUploading ? (
                                        <div style={{ padding: '1rem' }}>
                                            <Loader2 size={24} className="animate-spin" color="var(--primary)" />
                                            <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Subindo vídeo...</p>
                                        </div>
                                    ) : (
                                        <>
                                            {videoPreview ? (
                                                <div style={{ marginBottom: '1rem' }}>
                                                    <video src={videoPreview} style={{ width: '100%', borderRadius: '8px' }} controls />
                                                    <button 
                                                        type="button"
                                                        onClick={() => { setForm({...form, videoUrl: ''}); setVideoPreview(null); }}
                                                        style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer' }}
                                                    >
                                                        Remover Vídeo
                                                    </button>
                                                </div>
                                            ) : (
                                                <div onClick={() => document.getElementById('lib-video-upload').click()} style={{ cursor: 'pointer', padding: '1rem' }}>
                                                    <Video size={32} color="var(--text-muted)" style={{ marginBottom: '0.5rem' }} />
                                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Clique para selecionar o vídeo</p>
                                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', opacity: 0.6 }}>MP4 recomendado, máx 20MB</p>
                                                </div>
                                            )}
                                        </>
                                    )}
                                    <input 
                                        type="file" 
                                        id="lib-video-upload" 
                                        accept="video/*" 
                                        style={{ display: 'none' }} 
                                        onChange={e => handleVideoUpload(e.target.files[0])}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button 
                                    type="button" 
                                    onClick={() => setIsModalOpen(false)}
                                    style={{ flex: 1, padding: '0.75rem', background: 'transparent', border: '1px solid var(--border-glass)', borderRadius: '8px', color: 'var(--text-muted)', cursor: 'pointer' }}
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit"
                                    className="btn-primary"
                                    style={{ flex: 2, padding: '0.75rem', borderRadius: '8px' }}
                                >
                                    {editingExercise ? 'Salvar Alterações' : 'Criar Exercício'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
