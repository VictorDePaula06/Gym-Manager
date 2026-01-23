import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate, Link } from 'react-router-dom';
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
    const { user, loading: authLoading, accessDenied } = useAuth(); // Get accessDenied

    useEffect(() => {
        if (user) {
            navigate('/app');
        } else if (accessDenied) {
            navigate('/access-denied');
        }
    }, [user, accessDenied, navigate]);

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
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: '#020617', // slate-950 fallback
            fontFamily: "'Outfit', sans-serif"
        }}>
            {/* Background Image with Overlay */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundImage: 'url(/img/login-bg.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                zIndex: 1
            }}></div>

            {/* Gradient Overlay for better readability */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'linear-gradient(to bottom right, rgba(2, 6, 23, 0.85), rgba(2, 6, 23, 0.7))',
                zIndex: 2,
                backdropFilter: 'blur(3px)' // Subtle blur on BG
            }}></div>

            <style>
                {`
                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .glass-input::placeholder {
                    color: #94a3b8 !important;
                    opacity: 0.7;
                }
                `}
            </style>

            <div style={{
                maxWidth: '26rem', // Somewhat narrower for elegance
                width: '100%',
                backgroundColor: 'rgba(15, 23, 42, 0.65)', // More transparent
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                borderRadius: '1.5rem',
                border: '1px solid rgba(255, 255, 255, 0.1)', // Light border
                padding: '2.5rem',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.05)',
                position: 'relative',
                zIndex: 10,
                animation: 'slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        width: '4rem',
                        height: '4rem',
                        borderRadius: '1rem',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem auto',
                        boxShadow: '0 10px 20px -5px rgba(16, 185, 129, 0.4)'
                    }}>
                        <Dumbbell color="white" size={32} />
                    </div>
                    <h1 style={{
                        fontSize: '1.875rem',
                        fontWeight: '700',
                        color: 'white',
                        marginBottom: '0.5rem',
                        letterSpacing: '-0.025em',
                        textShadow: '0 2px 10px rgba(0,0,0,0.3)'
                    }}>
                        Gym Manager
                    </h1>
                    <p style={{ color: '#cbd5e1', fontSize: '0.95rem', fontWeight: '300' }}>Gerencie sua academia com excelência</p>
                </div>

                {error && (
                    <div style={{
                        backgroundColor: 'rgba(239, 68, 68, 0.15)',
                        color: '#fca5a5',
                        padding: '0.75rem',
                        borderRadius: '0.75rem',
                        marginBottom: '1.5rem',
                        fontSize: '0.85rem',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        textAlign: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        animation: 'fadeIn 0.3s ease'
                    }}>
                        <span>⚠️</span> {error}
                    </div>
                )}

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                    <div style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', transition: 'color 0.2s', zIndex: 20 }}>
                            <Mail size={18} />
                        </div>
                        <input
                            type="email"
                            className="glass-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '1rem 1rem 1rem 3rem',
                                backgroundColor: 'rgba(2, 6, 23, 0.4)',
                                border: '1px solid rgba(148, 163, 184, 0.2)',
                                borderRadius: '0.75rem',
                                outline: 'none',
                                color: 'white',
                                boxSizing: 'border-box',
                                fontSize: '0.95rem',
                                transition: 'all 0.2s',
                                fontFamily: 'inherit'
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = '#10b981';
                                e.target.style.backgroundColor = 'rgba(2, 6, 23, 0.6)';
                                e.target.style.boxShadow = '0 0 0 4px rgba(16, 185, 129, 0.1)';
                                e.target.previousSibling.style.color = '#10b981';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = 'rgba(148, 163, 184, 0.2)';
                                e.target.style.backgroundColor = 'rgba(2, 6, 23, 0.4)';
                                e.target.style.boxShadow = 'none';
                                e.target.previousSibling.style.color = '#94a3b8';
                            }}
                            placeholder="Seu e-mail de acesso"
                        />
                    </div>

                    <div>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', transition: 'color 0.2s', zIndex: 20 }}>
                                <Lock size={18} />
                            </div>
                            <input
                                type="password"
                                className="glass-input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                style={{
                                    width: '100%',
                                    padding: '1rem 1rem 1rem 3rem',
                                    backgroundColor: 'rgba(2, 6, 23, 0.4)',
                                    border: '1px solid rgba(148, 163, 184, 0.2)',
                                    borderRadius: '0.75rem',
                                    outline: 'none',
                                    color: 'white',
                                    boxSizing: 'border-box',
                                    fontSize: '0.95rem',
                                    transition: 'all 0.2s',
                                    fontFamily: 'inherit'
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = '#10b981';
                                    e.target.style.backgroundColor = 'rgba(2, 6, 23, 0.6)';
                                    e.target.style.boxShadow = '0 0 0 4px rgba(16, 185, 129, 0.1)';
                                    e.target.previousSibling.style.color = '#10b981';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = 'rgba(148, 163, 184, 0.2)';
                                    e.target.style.backgroundColor = 'rgba(2, 6, 23, 0.4)';
                                    e.target.style.boxShadow = 'none';
                                    e.target.previousSibling.style.color = '#94a3b8';
                                }}
                                placeholder="Sua senha secreta"
                            />
                        </div>
                        <div style={{ textAlign: 'right', marginTop: '0.75rem' }}>
                            <button
                                type="button"
                                onClick={handleResetPassword}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#94a3b8',
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    transition: 'color 0.2s'
                                }}
                                onMouseOver={(e) => e.target.style.color = '#10b981'}
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
                            backgroundColor: '#10b981',
                            backgroundImage: 'linear-gradient(to right, #10b981, #059669)',
                            color: 'white',
                            padding: '1rem',
                            borderRadius: '0.75rem',
                            border: 'none',
                            fontWeight: '600',
                            fontSize: '1rem',
                            cursor: loadingLocal ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '0.5rem',
                            marginTop: '0.5rem',
                            opacity: loadingLocal ? 0.8 : 1,
                            transition: 'all 0.2s',
                            boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255,255,255,0.2)'
                        }}
                        onMouseOver={(e) => !loadingLocal && (e.target.style.transform = 'translateY(-1px)')}
                        onMouseOut={(e) => !loadingLocal && (e.target.style.transform = 'translateY(0)')}
                    >
                        {loadingLocal ? <Loader2 size={20} className="animate-spin" /> : 'Acessar Plataforma'}
                    </button>

                    <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                        <Link to="/register" style={{ color: '#94a3b8', fontSize: '0.9rem', textDecoration: 'none' }}>
                            Novo funcionário? <span style={{ color: '#10b981' }}>Cadastre-se aqui</span>
                        </Link>
                    </div>


                </form>
            </div>

            {/* Version or footer text subtle */}
            <div style={{
                position: 'absolute',
                bottom: '1rem',
                color: 'rgba(255,255,255,0.2)',
                fontSize: '0.75rem',
                zIndex: 20
            }}>
                v1.0.0
            </div>
        </div>
    );
};

export default Login;
