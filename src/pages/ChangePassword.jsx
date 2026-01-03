import { useState } from 'react';
import { updatePassword } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, Loader2, CheckCircle, ShieldCheck } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function ChangePassword() {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
    const navigate = useNavigate();
    const { addToast } = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            addToast('As senhas não coincidem.', 'error');
            return;
        }

        if (newPassword.length < 6) {
            addToast('A senha deve ter pelo menos 6 caracteres.', 'error');
            return;
        }

        setLoading(true);

        try {
            // Update Auth Password
            await updatePassword(user, newPassword);

            // Update Firestore Flag
            const tenantRef = doc(db, 'tenants', user.uid);
            await updateDoc(tenantRef, {
                requiresPasswordChange: false
            });

            addToast('Senha alterada com sucesso! Bem-vindo.', 'success');

            // Force reload or navigate
            navigate('/');
            window.location.reload(); // Reload to refresh context cleanly

        } catch (error) {
            console.error("Error updating password:", error);
            addToast('Erro ao atualizar senha. Tente novamente.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            fontFamily: "'Outfit', sans-serif",
            position: 'relative',
            overflow: 'hidden',
            background: '#0f172a'
        }}>
            {/* Animated Background Elements */}
            <div style={{
                position: 'absolute',
                top: '-20%',
                left: '-10%',
                width: '60%',
                height: '60%',
                background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)',
                filter: 'blur(100px)',
                animation: 'float 12s infinite ease-in-out'
            }} />
            <div style={{
                position: 'absolute',
                bottom: '-20%',
                right: '-5%',
                width: '60%',
                height: '60%',
                background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
                filter: 'blur(100px)',
                animation: 'float 15s infinite ease-in-out reverse'
            }} />

            <style>
                {`
                @keyframes float {
                    0% { transform: translate(0, 0); }
                    50% { transform: translate(30px, 30px); }
                    100% { transform: translate(0, 0); }
                }
                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                `}
            </style>

            <div className="glass-panel" style={{
                padding: '3.5rem',
                borderRadius: '2rem',
                width: '100%',
                maxWidth: '450px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.05)',
                position: 'relative',
                zIndex: 10,
                backdropFilter: 'blur(20px)',
                backgroundColor: 'rgba(30, 41, 59, 0.6)',
                animation: 'slideUp 0.6s ease-out'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '24px',
                        background: 'linear-gradient(135deg, var(--primary) 0%, #059669 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem auto',
                        boxShadow: '0 20px 25px -5px rgba(16, 185, 129, 0.3), 0 8px 10px -6px rgba(16, 185, 129, 0.2)'
                    }}>
                        <ShieldCheck color="white" size={40} />
                    </div>

                    <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem' }}>
                        Defina sua Senha
                    </h1>
                    <p style={{ color: '#94a3b8', fontSize: '1rem' }}>
                        Para sua segurança, defina uma nova senha para acessar o sistema.
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'left' }}>
                    <div style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b', transition: 'color 0.2s' }}>
                            <Lock size={22} />
                        </div>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            placeholder="Nova senha (min. 6 caracteres)"
                            style={{
                                width: '100%',
                                padding: '1rem 1rem 1rem 3.5rem',
                                backgroundColor: 'rgba(15, 23, 42, 0.5)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '1rem',
                                outline: 'none',
                                color: 'white',
                                boxSizing: 'border-box',
                                fontSize: '1rem',
                                transition: 'all 0.2s'
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = 'var(--primary)';
                                e.target.style.backgroundColor = 'rgba(15, 23, 42, 0.8)';
                                e.target.previousSibling.style.color = 'var(--primary)';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                e.target.style.backgroundColor = 'rgba(15, 23, 42, 0.5)';
                                e.target.previousSibling.style.color = '#64748b';
                            }}
                        />
                    </div>

                    <div style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b', transition: 'color 0.2s' }}>
                            <CheckCircle size={22} />
                        </div>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            placeholder="Confirme a nova senha"
                            style={{
                                width: '100%',
                                padding: '1rem 1rem 1rem 3.5rem',
                                backgroundColor: 'rgba(15, 23, 42, 0.5)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '1rem',
                                outline: 'none',
                                color: 'white',
                                boxSizing: 'border-box',
                                fontSize: '1rem',
                                transition: 'all 0.2s'
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = 'var(--primary)';
                                e.target.style.backgroundColor = 'rgba(15, 23, 42, 0.8)';
                                e.target.previousSibling.style.color = 'var(--primary)';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                e.target.style.backgroundColor = 'rgba(15, 23, 42, 0.5)';
                                e.target.previousSibling.style.color = '#64748b';
                            }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            backgroundColor: 'var(--primary)',
                            color: 'white',
                            padding: '1.1rem',
                            borderRadius: '1rem',
                            border: 'none',
                            fontWeight: '600',
                            fontSize: '1.1rem',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '0.75rem',
                            marginTop: '0.5rem',
                            opacity: loading ? 0.7 : 1,
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: '0 10px 15px -3px var(--primary-glow), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                        }}
                        onMouseOver={(e) => !loading && (e.target.style.transform = 'translateY(-2px)', e.target.style.boxShadow = '0 20px 25px -5px var(--primary-glow), 0 10px 10px -5px rgba(0, 0, 0, 0.04)')}
                        onMouseOut={(e) => !loading && (e.target.style.transform = 'translateY(0)', e.target.style.boxShadow = '0 10px 15px -3px var(--primary-glow), 0 4px 6px -2px rgba(0, 0, 0, 0.05)')}
                    >
                        {loading ? <Loader2 size={24} className="animate-spin" /> : 'Salvar e Acessar'}
                    </button>
                </form>
            </div>
        </div>
    );
}
