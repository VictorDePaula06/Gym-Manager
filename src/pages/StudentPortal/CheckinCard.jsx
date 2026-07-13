import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useGym } from '../../context/GymContext';
import { useToast } from '../../context/ToastContext';
import { db } from '../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { submitCheckin, getLastCheckin } from '../../services/checkin';
import { isCheckinDue } from '../../config/checkin';
import { ClipboardList, X, Loader2 } from 'lucide-react';

const SCALE = [1, 2, 3, 4, 5];

export default function CheckinCard() {
    const { user } = useAuth();
    const { settings } = useGym();
    const { addToast } = useToast();
    const config = settings?.checkinConfig;

    const tenantId = user?.tenantId;
    const studentId = user?.studentId;

    const [due, setDue] = useState(false);
    const [open, setOpen] = useState(false);
    const [answers, setAnswers] = useState({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        let active = true;
        (async () => {
            if (!tenantId || !studentId || !config || config.enabled === false) { if (active) setDue(false); return; }
            try {
                const last = await getLastCheckin(tenantId, studentId);
                let workoutsSinceLast = 0;
                if (config.cadence === 'workouts') {
                    const since = last?.createdAt || '2000-01-01';
                    const q = query(collection(db, `users/${tenantId}/students/${studentId}/training_logs`), where('completedAt', '>', since));
                    const snap = await getDocs(q);
                    workoutsSinceLast = snap.size;
                }
                if (active) setDue(isCheckinDue({ config, lastCheckinAt: last?.createdAt, workoutsSinceLast }));
            } catch (e) {
                console.error('Erro ao checar check-in:', e);
            }
        })();
        return () => { active = false; };
    }, [tenantId, studentId, config]);

    const setAns = (id, value) => setAnswers((a) => ({ ...a, [id]: value }));

    const handleSubmit = async () => {
        setSaving(true);
        try {
            await submitCheckin(tenantId, studentId, answers);
            addToast('Check-in enviado! Seu personal vai ver. 💪', 'success');
            setOpen(false); setDue(false); setAnswers({});
        } catch (e) {
            console.error(e);
            addToast('Erro ao enviar o check-in.', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (!due || !config) return null;

    const renderQuestion = (q) => {
        const val = answers[q.id];
        if (q.type === 'scale') {
            return (
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                    {SCALE.map((n) => (
                        <button key={n} type="button" onClick={() => setAns(q.id, n)}
                            style={{
                                flex: 1, padding: '0.6rem 0', borderRadius: '10px', cursor: 'pointer', fontWeight: 700,
                                border: `1px solid ${val === n ? 'var(--primary)' : 'var(--border-glass)'}`,
                                background: val === n ? 'var(--primary)' : 'var(--input-bg)',
                                color: val === n ? '#fff' : 'var(--text-main)',
                            }}>
                            {n}
                        </button>
                    ))}
                </div>
            );
        }
        if (q.type === 'choice') {
            return (
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {(q.options || []).map((opt) => (
                        <button key={opt} type="button" onClick={() => setAns(q.id, opt)}
                            style={{
                                flex: 1, minWidth: '80px', padding: '0.6rem 0.5rem', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
                                border: `1px solid ${val === opt ? 'var(--primary)' : 'var(--border-glass)'}`,
                                background: val === opt ? 'var(--primary)' : 'var(--input-bg)',
                                color: val === opt ? '#fff' : 'var(--text-main)',
                            }}>
                            {opt}
                        </button>
                    ))}
                </div>
            );
        }
        if (q.type === 'number') {
            return (
                <input type="number" inputMode="decimal" value={val ?? ''} onChange={(e) => setAns(q.id, e.target.value)}
                    placeholder="Ex: 72"
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--border-glass)', background: 'var(--input-bg)', color: 'var(--text-main)', outline: 'none', boxSizing: 'border-box' }} />
            );
        }
        // text
        return (
            <textarea value={val ?? ''} onChange={(e) => setAns(q.id, e.target.value)} rows={3}
                placeholder="Escreva aqui (opcional)"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--border-glass)', background: 'var(--input-bg)', color: 'var(--text-main)', outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }} />
        );
    };

    return (
        <>
            {/* Card de aviso */}
            <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(59,130,246,0.06))', border: '1px solid rgba(16,185,129,0.35)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <ClipboardList size={22} color="var(--primary)" />
                    </div>
                    <div style={{ flex: 1 }}>
                        <strong style={{ display: 'block' }}>Check-in da semana</strong>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Conta pro seu personal como foi sua semana.</span>
                    </div>
                </div>
                <button onClick={() => setOpen(true)} className="btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '0.75rem' }}>
                    Responder agora
                </button>
            </div>

            {/* Modal do formulário */}
            {open && (
                <div className="modal-backdrop" onClick={() => !saving && setOpen(false)}>
                    <div className="glass-panel" onClick={(e) => e.stopPropagation()} style={{ padding: '1.5rem', width: '95%', maxWidth: '460px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><ClipboardList size={20} color="var(--primary)" /> Check-in da semana</h3>
                            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            {config.questions.map((q) => (
                                <div key={q.id}>
                                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>{q.label}</label>
                                    {q.type === 'scale' && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                                            <span>Ruim</span><span>Ótimo</span>
                                        </div>
                                    )}
                                    {renderQuestion(q)}
                                </div>
                            ))}
                        </div>

                        <button onClick={handleSubmit} disabled={saving} className="btn-primary" style={{ width: '100%', marginTop: '1.5rem', padding: '0.85rem', opacity: saving ? 0.7 : 1 }}>
                            {saving ? <Loader2 size={18} className="animate-spin" /> : 'Enviar check-in'}
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
