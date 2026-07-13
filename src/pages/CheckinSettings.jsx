import { useState, useEffect } from 'react';
import { useGym } from '../context/GymContext';
import { useToast } from '../context/ToastContext';
import { DEFAULT_CHECKIN } from '../config/checkin';
import { ClipboardList, Plus, Trash2, Save, Loader2, RotateCcw } from 'lucide-react';

const TYPES = [
    { value: 'scale', label: 'Escala 1-5' },
    { value: 'number', label: 'Número' },
    { value: 'text', label: 'Texto livre' },
    { value: 'choice', label: 'Opções' },
];

export default function CheckinSettings() {
    const { settings, updateSettings } = useGym();
    const { addToast } = useToast();
    const [cfg, setCfg] = useState(settings?.checkinConfig || DEFAULT_CHECKIN);
    const [saving, setSaving] = useState(false);

    useEffect(() => { if (settings?.checkinConfig) setCfg(settings.checkinConfig); }, [settings?.checkinConfig]);

    const setQ = (i, patch) => setCfg((c) => ({ ...c, questions: c.questions.map((q, idx) => (idx === i ? { ...q, ...patch } : q)) }));
    const removeQ = (i) => setCfg((c) => ({ ...c, questions: c.questions.filter((_, idx) => idx !== i) }));
    const addQ = () => setCfg((c) => ({ ...c, questions: [...c.questions, { id: `q_${Date.now()}`, label: '', type: 'scale' }] }));

    const save = async () => {
        setSaving(true);
        try {
            const clean = { ...cfg, questions: cfg.questions.filter((q) => (q.label || '').trim()) };
            await updateSettings({ checkinConfig: clean });
            addToast('Check-in salvo!', 'success');
        } catch (e) {
            console.error(e);
            addToast('Erro ao salvar.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const inputStyle = { width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--input-bg)', color: 'var(--text-main)', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };

    return (
        <div className="glass-panel" style={{ padding: '2rem', marginTop: '2rem' }}>
            <h2 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <ClipboardList size={22} color="var(--primary)" /> Check-in dos alunos
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                O aluno responde esse feedback no app. Defina quando ele aparece e as perguntas.
            </p>

            {/* Ligar/desligar */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={cfg.enabled !== false} onChange={(e) => setCfg({ ...cfg, enabled: e.target.checked })} />
                <span style={{ fontWeight: 600 }}>Ativar check-in</span>
            </label>

            {/* Cadência */}
            <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Quando pedir o check-in</label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <button type="button" onClick={() => setCfg({ ...cfg, cadence: 'weekly' })}
                        style={{ padding: '0.6rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, border: `1px solid ${cfg.cadence !== 'workouts' ? 'var(--primary)' : 'var(--border-glass)'}`, background: cfg.cadence !== 'workouts' ? 'var(--primary)' : 'transparent', color: cfg.cadence !== 'workouts' ? '#fff' : 'var(--text-main)' }}>
                        Semanalmente
                    </button>
                    <button type="button" onClick={() => setCfg({ ...cfg, cadence: 'workouts' })}
                        style={{ padding: '0.6rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, border: `1px solid ${cfg.cadence === 'workouts' ? 'var(--primary)' : 'var(--border-glass)'}`, background: cfg.cadence === 'workouts' ? 'var(--primary)' : 'transparent', color: cfg.cadence === 'workouts' ? '#fff' : 'var(--text-main)' }}>
                        A cada N treinos
                    </button>
                    {cfg.cadence === 'workouts' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input type="number" min={1} value={cfg.threshold || 5} onChange={(e) => setCfg({ ...cfg, threshold: Number(e.target.value) })} style={{ ...inputStyle, width: '80px' }} />
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>treinos</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Perguntas */}
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Perguntas</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {cfg.questions.map((q, i) => (
                    <div key={q.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.85rem', borderRadius: '10px', border: '1px solid var(--border-glass)', background: 'var(--card-bg)' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <input value={q.label} onChange={(e) => setQ(i, { label: e.target.value })} placeholder="Texto da pergunta" style={inputStyle} />
                            <button type="button" onClick={() => removeQ(i)} title="Remover" style={{ flexShrink: 0, background: 'rgba(239,68,68,0.1)', border: 'none', color: '#ef4444', borderRadius: '8px', padding: '0.5rem', cursor: 'pointer' }}>
                                <Trash2 size={16} />
                            </button>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                            <select value={q.type} onChange={(e) => setQ(i, { type: e.target.value })} style={{ ...inputStyle, width: 'auto' }}>
                                {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                            {q.type === 'choice' && (
                                <input
                                    value={(q.options || []).join(', ')}
                                    onChange={(e) => setQ(i, { options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                                    placeholder="Opções separadas por vírgula. Ex: Sim, Não"
                                    style={{ ...inputStyle, flex: 1, minWidth: '180px' }}
                                />
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                <button type="button" onClick={addQ} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 600 }}>
                    <Plus size={16} /> Adicionar pergunta
                </button>
                <button type="button" onClick={() => setCfg(DEFAULT_CHECKIN)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1rem', borderRadius: '8px', border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem' }}>
                    <RotateCcw size={14} /> Restaurar padrão
                </button>
            </div>

            <button onClick={save} disabled={saving} className="btn-primary" style={{ marginTop: '1.5rem', padding: '0.75rem 1.5rem', opacity: saving ? 0.7 : 1 }}>
                {saving ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> Salvar check-in</>}
            </button>
        </div>
    );
}
