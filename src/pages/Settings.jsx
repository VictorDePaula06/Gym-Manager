import { useState, useEffect, useRef } from 'react';
import { useGym } from '../context/GymContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Save, Upload, Sun, Moon, Check, Loader2, CheckCircle, Database, AlertCircle, User } from 'lucide-react';
import { storage, db } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, getDocs, getDoc, doc, setDoc, deleteDoc } from 'firebase/firestore';

export default function Settings() {
    const { settings, updateSettings } = useGym();
    const { user } = useAuth();
    const { addToast } = useToast();
    const [formData, setFormData] = useState({
        gymName: '',
        whatsapp: '',
        theme: 'dark'
    });
    const [isSaving, setIsSaving] = useState(false);
    const [isMigrating, setIsMigrating] = useState(false);
    const [isDeletingInactive, setIsDeletingInactive] = useState(false);
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

    // ... (handleMigrateData remains unchanged)

    const handleDeleteInactive = async () => {
        if (!confirm("Tem certeza que deseja EXCLUIR TODOS os alunos marcados como 'Inativo'? Essa ação não pode ser desfeita.")) return;

        setIsDeletingInactive(true);
        try {
            // 1. Fetch All Students for User
            const studentsRef = collection(db, `users/${user.uid}/students`);
            const snapshot = await getDocs(studentsRef);

            if (snapshot.empty) {
                addToast("Nenhum aluno encontrado.", 'info');
                return;
            }

            let deletedCount = 0;
            const batchPromises = [];

            // 2. Iterate and Filter
            for (const studentDoc of snapshot.docs) {
                const data = studentDoc.data();

                // Check if Inactive (Case insensitive safety or just property check)
                // Assuming status is stored as 'Inactive' (English) or 'Inativo' (Portuguese) - covering both just in case
                if (data.status === 'Inactive' || data.status === 'Inativo') {

                    // deleteDoc wrapper
                    const p = (async () => {
                        // Delete Assessments Subcollection docs first
                        const assessmentsRef = collection(db, `users/${user.uid}/students/${studentDoc.id}/assessments`);
                        const assessSnapshot = await getDocs(assessmentsRef);
                        const assessDeletes = assessSnapshot.docs.map(adoc => deleteDoc(doc(db, `users/${user.uid}/students/${studentDoc.id}/assessments`, adoc.id)));
                        await Promise.all(assessDeletes);

                        // Delete Student Doc
                        await deleteDoc(doc(db, `users/${user.uid}/students`, studentDoc.id));
                    })();

                    batchPromises.push(p);
                    deletedCount++;
                }
            }

            await Promise.all(batchPromises);

            if (deletedCount > 0) {
                addToast(`${deletedCount} alunos inativos removidos!`, 'success');
                // Force a reload or wait for listener to update UI (UI should update automatically via GymContext listener)
            } else {
                addToast("Nenhum aluno inativo encontrado para excluir.", 'info');
            }

        } catch (error) {
            console.error("Erro ao excluir inativos:", error);
            addToast("Erro na limpeza de dados.", 'error');
        } finally {
            setIsDeletingInactive(false);
        }
    };

    const handleMigrateData = async () => {
        if (!confirm("Isso irá buscar buscar dados antigos e salvá-los na sua conta segura. Deseja continuar?")) return;

        setIsMigrating(true);
        try {
            // 1. Fetch Legacy Data (Root 'students' collection)
            const legacyRef = collection(db, 'students');
            const snapshot = await getDocs(legacyRef);

            if (snapshot.empty) {
                addToast("Nenhum dado antigo encontrado para recuperar.", 'info');
                return;
            }

            let migratedCount = 0;

            // 2. Migrate each student
            for (const studentDoc of snapshot.docs) {
                const studentData = studentDoc.data();
                const newStudentRef = doc(db, `users/${user.uid}/students`, studentDoc.id);

                // Copy Student Data
                await setDoc(newStudentRef, studentData, { merge: true });

                // 3. Migrate Assessments (Subcollection)
                const legacyAssessmentsRef = collection(db, `students/${studentDoc.id}/assessments`);
                const assessmentsSnapshot = await getDocs(legacyAssessmentsRef);

                for (const assessDoc of assessmentsSnapshot.docs) {
                    const newAssessRef = doc(db, `users/${user.uid}/students/${studentDoc.id}/assessments`, assessDoc.id);
                    await setDoc(newAssessRef, assessDoc.data(), { merge: true });
                }

                migratedCount++;
            }

            addToast(`${migratedCount} alunos recuperados com sucesso!`, 'success');
        } catch (error) {
            console.error("Erro na migração:", error);
            addToast("Erro ao recuperar dados.", 'error');
        } finally {
            setIsMigrating(false);
        }
    };

    const [activeTab, setActiveTab] = useState('general'); // general, team

    // ... imports and previous code ...

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '4rem' }}>
            <h1 style={{ marginBottom: '2rem' }}>Configurações</h1>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1px' }}>
                <button
                    onClick={() => setActiveTab('general')}
                    style={{
                        padding: '0.75rem 1.5rem',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'general' ? '2px solid var(--primary)' : '2px solid transparent',
                        color: activeTab === 'general' ? 'var(--primary)' : 'var(--text-muted)',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '1rem'
                    }}
                >
                    Geral
                </button>
                <button
                    onClick={() => setActiveTab('team')}
                    style={{
                        padding: '0.75rem 1.5rem',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'team' ? '2px solid var(--primary)' : '2px solid transparent',
                        color: activeTab === 'team' ? 'var(--primary)' : 'var(--text-muted)',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '1rem'
                    }}
                >
                    Equipe
                </button>
            </div>

            {activeTab === 'general' && (
                <>
                    {/* General Settings Content (Existing) */}
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

                    {/* Advanced / Maintenance Section */}
                    <div className="glass-panel" style={{ padding: '2rem', marginTop: '2rem', border: '1px dashed var(--border-glass)' }}>
                        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.2rem', color: 'var(--text-muted)' }}>Manutenção e Dados</h2>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h4 style={{ margin: 0, marginBottom: '0.5rem' }}>Recuperação de Dados Antigos</h4>
                                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                    Use esta opção se notar que alguns alunos ou dados sumiram após a atualização de segurança.
                                </p>
                            </div>
                            <button
                                onClick={handleMigrateData}
                                disabled={isMigrating}
                                style={{
                                    background: 'rgba(234, 179, 8, 0.1)',
                                    color: '#fbbf24',
                                    border: '1px solid rgba(234, 179, 8, 0.3)',
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    fontWeight: '600'
                                }}
                            >
                                {isMigrating ? <Loader2 className="animate-spin" size={18} /> : <Database size={18} />}
                                {isMigrating ? 'Recuperando...' : 'Resgatar Dados'}
                            </button>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px dashed var(--border-glass)' }}>
                            <div>
                                <h4 style={{ margin: 0, marginBottom: '0.5rem' }}>Limpeza de Banco de Dados</h4>
                                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                    Excluir permanentemente todos os alunos com status "Inativo" para liberar espaço.
                                </p>
                            </div>
                            <button
                                onClick={handleDeleteInactive}
                                disabled={isDeletingInactive}
                                style={{
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    color: '#ef4444',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    fontWeight: '600'
                                }}
                            >
                                {isDeletingInactive ? <Loader2 className="animate-spin" size={18} /> : <AlertCircle size={18} />}
                                {isDeletingInactive ? 'Limpando...' : 'Excluir Inativos'}
                            </button>
                        </div>
                    </div>
                </>
            )}

            {activeTab === 'team' && (
                user?.role === 'owner' ? (
                    <TeamSettings />
                ) : (
                    <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <AlertCircle size={48} style={{ marginBottom: '1rem', color: '#ef4444' }} />
                        <h3>Acesso Restrito</h3>
                        <p>Somente o usuário <strong>Master</strong> pode gerenciar a equipe.</p>
                    </div>
                )
            )}
        </div>
    );
}

function TeamSettings() {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('staff'); // 'staff' or 'admin'
    const [inviting, setInviting] = useState(false);

    const handleInvite = async (e) => {
        e.preventDefault();
        if (!inviteEmail) return;

        setInviting(true);
        try {
            // Create entry in global 'staff_access' collection
            const emailKey = inviteEmail.replace(/\./g, '_');
            const staffRef = doc(db, 'staff_access', emailKey);

            // SECURITY CHECK: Prevent Hijacking
            const staffSnap = await getDoc(staffRef);
            if (staffSnap.exists()) {
                const data = staffSnap.data();
                if (data.gymOwnerId !== user.uid) {
                    addToast("Este usuário já pertence a outra equipe!", 'error');
                    setInviting(false);
                    return;
                }
            }

            await setDoc(staffRef, {
                gymOwnerId: user.uid,
                role: inviteRole, // Use selected role
                invitedAt: new Date().toISOString(),
                inviterEmail: user.email,
                targetEmail: inviteEmail
            });

            addToast(`Convite enviado para ${inviteEmail} como ${inviteRole === 'admin' ? 'Administrador' : 'Equipe'}`, 'success');
            setInviteEmail('');
            setInviteRole('staff'); // Reset to default
        } catch (error) {
            console.error("Erro ao convidar:", error);
            addToast("Erro ao convidar. Verifique permissões.", 'error');
        } finally {
            setInviting(false);
        }
    };

    return (
        <div className="glass-panel" style={{ padding: '2rem' }}>
            {/* ... Header ... */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{ padding: '0.75rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', color: '#3b82f6' }}>
                    <User size={24} />
                </div>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Gerenciar Equipe</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
                        Convide membros para colaborar na academia.
                    </p>
                </div>
            </div>

            <style>{`
                .invite-grid {
                    display: grid;
                    grid-template-columns: 2fr 1fr auto;
                    gap: 1rem;
                    align-items: end;
                }
                @media (max-width: 768px) {
                    .invite-grid {
                        grid-template-columns: 1fr;
                    }
                    .invite-btn {
                        width: 100%;
                    }
                }
            `}</style>

            <form onSubmit={handleInvite} style={{ marginBottom: '2rem' }}>
                <div className="invite-grid">
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Email do novo membro</label>
                        <input
                            type="email"
                            required
                            placeholder="exemplo@email.com"
                            value={inviteEmail}
                            onChange={e => setInviteEmail(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.85rem',
                                borderRadius: '10px',
                                border: '1px solid var(--border-glass)',
                                background: 'var(--input-bg)',
                                color: 'var(--text-main)',
                                fontSize: '1rem'
                            }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Função</label>
                        <select
                            value={inviteRole}
                            onChange={e => setInviteRole(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.85rem',
                                borderRadius: '10px',
                                border: '1px solid var(--border-glass)',
                                background: 'var(--input-bg)',
                                color: 'var(--text-main)',
                                fontSize: '1rem',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="staff">Equipe (Comum)</option>
                            <option value="admin">Administrador</option>
                        </select>
                    </div>
                    <button
                        type="submit"
                        disabled={inviting}
                        className="btn-primary invite-btn"
                        style={{
                            padding: '0.85rem 1.5rem',
                            borderRadius: '10px',
                            fontWeight: '600',
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            color: '#fff',
                            cursor: inviting ? 'wait' : 'pointer',
                            whiteSpace: 'nowrap',
                            height: '46px' // align with input
                        }}
                    >
                        {inviting ? <Loader2 className="animate-spin" size={20} /> : <User size={20} />}
                        Enviar
                    </button>
                </div>
                <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 'bold', color: '#60a5fa' }}>Equipe:</span> Acesso a Alunos, Treinos e Visão Geral básica.
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        <span style={{ fontWeight: 'bold', color: '#10b981' }}>Admin:</span> Acesso TOTAL, incluindo Financeiro, Relatórios e Configurações de Equipe.
                    </div>
                </div>
            </form>

            <div style={{ paddingTop: '2rem', borderTop: '1px solid var(--border-glass)' }}>
                {/* ... list ... */}
                <h4 style={{ marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Convites Enviados</h4>
                <div style={{ padding: '1.5rem', textAlign: 'center', background: 'var(--card-bg)', borderRadius: '12px', border: '1px dashed var(--border-glass)', color: 'var(--text-muted)' }}>
                    A lista de membros aparecerá aqui futuramente.
                </div>
            </div>
        </div>
    );
}
