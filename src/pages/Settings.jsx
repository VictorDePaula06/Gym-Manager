import { useState, useEffect, useRef } from 'react';
import { useGym } from '../context/GymContext';
import { useToast } from '../context/ToastContext';
import { Save, Upload, Sun, Moon, Check, Loader2, CheckCircle } from 'lucide-react';
import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function Settings() {
    const { settings, updateSettings } = useGym();
    const { addToast } = useToast();
    const [formData, setFormData] = useState({
        gymName: '',
        whatsapp: '',
        theme: 'dark'
    });
    const [isSaving, setIsSaving] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if (settings) {
            setFormData(prev => ({
                ...prev,
                gymName: settings.gymName || 'GymManager',
                whatsapp: settings.whatsapp || '',
                theme: settings.theme || 'dark'
            }));
        }
    }, [settings]);

    // Track latest settings for cleanup
    const settingsRef = useRef(settings);

    useEffect(() => {
        settingsRef.current = settings;
    }, [settings]);

    // Apply Preview Theme
    useEffect(() => {
        if (formData.theme) {
            document.documentElement.setAttribute('data-theme', formData.theme);
        }
    }, [formData.theme]);

    // Cleanup on unmount only
    useEffect(() => {
        return () => {
            // Revert to the actual saved setting (source of truth) when leaving the page
            const finalTheme = settingsRef.current?.theme || 'dark';
            document.documentElement.setAttribute('data-theme', finalTheme);
        };
    }, []);

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingLogo(true);
        try {
            const storageRef = ref(storage, `brand/logo_${Date.now()}`);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);

            await updateSettings({ ...settings, logoUrl: url });
            addToast("Logo atualizada com sucesso!", 'success');
        } catch (error) {
            console.error("Erro ao fazer upload da logo:", error);
            addToast("Erro ao enviar a imagem. Tente novamente.", 'error');
        } finally {
            setUploadingLogo(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateSettings({
                ...settings,
                gymName: formData.gymName,
                whatsapp: formData.whatsapp,
                theme: formData.theme
            });
            addToast("Configurações salvas!", 'success');
        } catch (error) {
            console.error("Erro ao salvar:", error);
            addToast("Erro ao salvar configurações.", 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '4rem' }}>
            <h1 style={{ marginBottom: '2rem' }}>Configurações</h1>

            <div className="glass-panel" style={{ padding: '2rem' }}>
                <h2 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>Personalização</h2>

                {/* Gym Name */}
                <div style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Nome da Academia / Personal</label>
                    <input
                        value={formData.gymName}
                        onChange={(e) => setFormData({ ...formData, gymName: e.target.value })}
                        placeholder="Ex: Iron Gym"
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            background: 'var(--card-bg)',
                            border: '1px solid var(--border-glass)',
                            borderRadius: '8px',
                            color: 'var(--text-main)',
                            fontSize: '1.1rem'
                        }}
                    />
                </div>

                <div style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>WhatsApp / Celular</label>
                    <input
                        value={formData.whatsapp}
                        onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                        placeholder="Ex: 11999999999"
                        type="tel"
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            background: 'var(--card-bg)',
                            border: '1px solid var(--border-glass)',
                            borderRadius: '8px',
                            color: 'var(--text-main)',
                            fontSize: '1.1rem'
                        }}
                    />
                    <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Este número ficará salvo para fins de contato.
                    </p>
                </div>

                {/* Logo Upload */}
                <div style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Logo da Marca</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{
                            width: '80px', height: '80px',
                            borderRadius: '12px',
                            background: settings?.logoUrl ? `url(${settings.logoUrl}) center/cover no-repeat` : 'rgba(255,255,255,0.05)',
                            border: '1px dashed var(--border-glass)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            {!settings?.logoUrl && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Sem Logo</span>}
                        </div>

                        <div>
                            <label style={{
                                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                                padding: '0.5rem 1rem', background: 'var(--input-bg)',
                                border: '1px solid var(--border-glass)', borderRadius: '8px',
                                cursor: 'pointer', fontSize: '0.9rem'
                            }}>
                                <Upload size={16} />
                                {uploadingLogo ? 'Enviando...' : 'Alterar Logo'}
                                <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
                            </label>
                            <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                Recomendado: Imagem quadrada (PNG/JPG)
                            </p>
                        </div>
                    </div>
                </div>

                {/* Theme Toggle */}
                <div style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Tema</label>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            onClick={() => setFormData({ ...formData, theme: 'dark' })}
                            style={{
                                flex: 1, padding: '1rem',
                                background: formData.theme === 'dark' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                border: formData.theme === 'dark' ? '1px solid #3b82f6' : '1px solid var(--border-glass)',
                                borderRadius: '8px', cursor: 'pointer',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem'
                            }}
                        >
                            <Moon size={24} color={formData.theme === 'dark' ? '#3b82f6' : 'var(--text-muted)'} />
                            <span style={{ color: formData.theme === 'dark' ? '#3b82f6' : 'var(--text-muted)' }}>Escuro</span>
                        </button>
                        <button
                            onClick={() => setFormData({ ...formData, theme: 'light' })}
                            style={{
                                flex: 1, padding: '1rem',
                                background: formData.theme === 'light' ? 'rgba(251, 191, 36, 0.1)' : 'transparent',
                                border: formData.theme === 'light' ? '1px solid #f59e0b' : '1px solid var(--border-glass)',
                                borderRadius: '8px', cursor: 'pointer',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem'
                            }}
                        >
                            <Sun size={24} color={formData.theme === 'light' ? '#f59e0b' : 'var(--text-muted)'} />
                            <span style={{ color: formData.theme === 'light' ? '#f59e0b' : 'var(--text-muted)' }}>Claro</span>
                        </button>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '3rem' }}>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        style={{
                            background: 'var(--primary)', color: 'white',
                            padding: '0.75rem 2rem', borderRadius: '8px', border: 'none',
                            fontWeight: '600', cursor: isSaving ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            opacity: isSaving ? 0.7 : 1
                        }}
                    >
                        {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                        Salvar Alterações
                    </button>

                    {successMessage && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981' }}>
                            <CheckCircle size={20} /> {successMessage}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

