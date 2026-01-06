import { useState } from 'react';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Loader2, Dumbbell } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext'; // Assuming AuthContext provides useAuth

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loadingLocal, setLoadingLocal] = useState(false); // Renamed to avoid conflict with auth loading
    const navigate = useNavigate();
    const { addToast } = useToast();
    const { user, loading: authLoading } = useAuth(); // Get user and loading from context

    useEffect(() => {
        if (user) {
            navigate('/');
        }
    }, [user, navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoadingLocal(true);

        try {
            await signInWithEmailAndPassword(auth, email, password);
            // SUCCESS: Do NOT set loadingLocal(false). 
            // The useEffect will detect the user change and redirect.
            // Keeping loadingLocal=true keeps the spinner/disabled state active preventing double-submit.
        } catch (err) {
            console.error("Login Error:", err);
            setLoadingLocal(false); // Only stop loading on error
            if (err.code === 'auth/user-disabled') {
                setError('Sua conta foi suspensa. Entre em contato com o administrador.');
            } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                setError('E-mail ou senha incorretos.');
            } else {
                setError('Falha ao fazer login. Tente novamente.');
            }
        }
    };

    const handleResetPassword = async () => {
        if (!email) {
            setError('Digite seu e-mail para redefinir a senha.');
            return;
        }
        try {
            await sendPasswordResetEmail(auth, email);
            setError('');
            addToast('E-mail de redefinição enviado! Verifique sua caixa de entrada.', 'success');
        } catch (err) {
            console.error(err);
            setError('Erro ao enviar e-mail. Verifique se o endereço está correto.');
        }
    };

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100dvh', // Modern mobile viewport fix
            fontFamily: "'Outfit', sans-serif",
            position: 'relative',
            overflow: 'hidden',
            background: '#0f172a'
        }}>
            {/* Animated Background Elements */}
            < div style={{
                position: 'absolute',
                top: '-20%',
                left: '-10%',
                width: '60%',
                height: '60%',
                background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)',
                filter: 'blur(100px)',
                animation: 'float 12s infinite ease-in-out'
            }} />
            < div style={{
                position: 'absolute',
                bottom: '-20%',
                right: '-5%',
                width: '60%',
                height: '60%',
                background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
                filter: 'blur(100px)',
                animation: 'float 15s infinite ease-in-out reverse'
            }} />
            < div style={{
                position: 'absolute',
                top: '40%',
                left: '40%',
                width: '30%',
                height: '30%',
                background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)',
                filter: 'blur(80px)',
                animation: 'pulse 8s infinite ease-in-out'
            }} />

            < style >
                {`
                @keyframes float {
                    0% { transform: translate(0, 0); }
                    50% { transform: translate(30px, 30px); }
                    100% { transform: translate(0, 0); }
                }
                @keyframes pulse {
                    0% { opacity: 0.5; transform: scale(1); }
                    50% { opacity: 0.8; transform: scale(1.1); }
                    100% { opacity: 0.5; transform: scale(1); }
                }
                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                `}
            </style >

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
                        <Dumbbell color="white" size={40} strokeWidth={2.5} />
                    </div>
                    <h1 style={{
                        fontSize: '2rem',
                        fontWeight: '700',
                        color: 'white',
                        marginBottom: '0.5rem',
                        letterSpacing: '-0.02em'
                    }}>
                        Gym Manager
                    </h1>
                    <p style={{ color: '#94a3b8', fontSize: '1.1rem' }}>Faça login para continuar</p>
                </div>

                {error && (
                    <div style={{
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        color: '#ef4444',
                        padding: '1rem',
                        borderRadius: '1rem',
                        marginBottom: '1.5rem',
                        fontSize: '0.9rem',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b', transition: 'color 0.2s' }}>
                            <Mail size={22} />
                        </div>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
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
                            placeholder="Seu e-mail"
                        />
                    </div>

                    <div>
                        {/* Wrapper for Password Input ONLY - ensuring separation */}
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b', transition: 'color 0.2s' }}>
                                <Lock size={22} />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
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
                                placeholder="Sua senha"
                            />
                        </div>
                        {/* Forgot Password Link - OUTSIDE the input wrapper */}
                        <div style={{ textAlign: 'right', marginTop: '0.75rem' }}>
                            <button
                                type="button"
                                onClick={handleResetPassword}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#94a3b8',
                                    fontSize: '0.9rem',
                                    cursor: 'pointer',
                                    padding: 0,
                                    transition: 'color 0.2s'
                                }}
                                onMouseOver={(e) => e.target.style.color = 'var(--primary)'}
                                onMouseOut={(e) => e.target.style.color = '#94a3b8'}
                            >
                                Esqueceu a senha?
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loadingLocal}
                        style={{
                            width: '100%',
                            backgroundColor: 'var(--primary)',
                            color: 'white',
                            padding: '1.1rem',
                            borderRadius: '1rem',
                            border: 'none',
                            fontWeight: '600',
                            fontSize: '1.1rem',
                            cursor: loadingLocal ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '0.75rem',
                            marginTop: '0.5rem',
                            opacity: loadingLocal ? 0.7 : 1,
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: '0 10px 15px -3px var(--primary-glow), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                        }}
                        onMouseOver={(e) => !loadingLocal && (e.target.style.transform = 'translateY(-2px)', e.target.style.boxShadow = '0 20px 25px -5px var(--primary-glow), 0 10px 10px -5px rgba(0, 0, 0, 0.04)')}
                        onMouseOut={(e) => !loadingLocal && (e.target.style.transform = 'translateY(0)', e.target.style.boxShadow = '0 10px 15px -3px var(--primary-glow), 0 4px 6px -2px rgba(0, 0, 0, 0.05)')}
                    >
                        {loadingLocal ? <Loader2 size={24} className="animate-spin" /> : 'Entrar no Sistema'}
                    </button>
                </form>
            </div>
        </div >
    );
};

export default Login;
