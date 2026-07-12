import { useState, useEffect } from 'react';
import { GoogleAuthProvider, signInWithPopup, signInWithRedirect } from 'firebase/auth';
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
    const { user, loading: authLoading, accessDenied, loginAsStudent } = useAuth(); // Get accessDenied
    const [loginType, setLoginType] = useState('personal'); // 'personal' or 'aluno'

    useEffect(() => {
        if (user) {
            if (user.role === 'student') {
                navigate('/student');
            } else {
                navigate('/app');
            }
        } else if (accessDenied) {
            navigate('/access-denied');
        }
    }, [user, accessDenied, navigate]);

    // Login do ALUNO (email/senha custom). O personal entra só com Google.
    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoadingLocal(true);

        try {
            await loginAsStudent(email, password);
        } catch (err) {
            console.error("Login Error:", err);
            setLoadingLocal(false);
            if (err.message === 'Conta não encontrada.' || err.message === 'Senha incorreta.') {
                setError('E-mail ou senha incorretos.');
            } else {
                setError(err.message || 'Falha ao fazer login.');
            }
        }
    };

    // Login do GESTOR (personal) via Google. O tenant é criado no 1º acesso
    // (AuthContext) já em teste de 7 dias.
    const handleGoogleLogin = async () => {
        setError('');
        setLoadingLocal(true);
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        try {
            await signInWithPopup(auth, provider);
            // onAuthStateChanged cuida do redirect
        } catch (err) {
            console.error("Google Login Error:", err);
            if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
                setLoadingLocal(false);
                setError('');
                return;
            }
            if (err.code === 'auth/user-disabled') {
                setLoadingLocal(false);
                setError('Sua conta foi suspensa.');
                return;
            }
            // Popup bloqueado/COOP/ambiente sem popup → cai pro redirect (mobile inclusive)
            try {
                await signInWithRedirect(auth, provider);
            } catch (err2) {
                console.error("Google Redirect Error:", err2);
                setLoadingLocal(false);
                setError('Não foi possível entrar com o Google. Tente novamente.');
            }
        }
    };

    // Login do ALUNO via Google. Marca a intenção pra o AuthContext saber que,
    // se a conta ainda não estiver vinculada, deve pedir o código de acesso.
    const handleStudentGoogle = async () => {
        setError('');
        setLoadingLocal(true);
        sessionStorage.setItem('student_login_intent', '1');
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        try {
            await signInWithPopup(auth, provider);
        } catch (err) {
            console.error("Student Google Error:", err);
            if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
                sessionStorage.removeItem('student_login_intent');
                setLoadingLocal(false);
                setError('');
                return;
            }
            try {
                await signInWithRedirect(auth, provider);
            } catch (err2) {
                console.error("Student Google Redirect Error:", err2);
                sessionStorage.removeItem('student_login_intent');
                setLoadingLocal(false);
                setError('Não foi possível entrar com o Google. Tente novamente.');
            }
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
            backgroundColor: '#0a0a0c', // slate-950 fallback
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
                background: 'linear-gradient(to bottom right, rgba(12, 12, 14, 0.9), rgba(12, 12, 14, 0.8))',
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
                backgroundColor: 'rgba(24, 24, 27, 0.72)', // More transparent
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
                        width: '6rem',
                        height: '6rem',
                        borderRadius: '1rem',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem auto',
                        boxShadow: '0 10px 20px -5px rgba(16, 185, 129, 0.4)',
                        overflow: 'hidden'
                    }}>
                        <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <h1 style={{
                        fontSize: '1.875rem',
                        fontWeight: '700',
                        color: 'white',
                        marginBottom: '0.5rem',
                        letterSpacing: '-0.025em',
                        textShadow: '0 2px 10px rgba(0,0,0,0.3)'
                    }}>
                        Vector GymHub
                    </h1>
                    <p style={{ color: '#cbd5e1', fontSize: '0.95rem', fontWeight: '300' }}>Gerencie sua academia com excelência</p>
                </div>

                <div style={{
                    display: 'flex',
                    background: 'rgba(12, 12, 14, 0.5)',
                    padding: '4px',
                    borderRadius: '0.75rem',
                    marginBottom: '2rem',
                    border: '1px solid rgba(148, 163, 184, 0.1)'
                }}>
                    <button
                        onClick={() => setLoginType('personal')}
                        style={{
                            flex: 1,
                            padding: '0.75rem',
                            border: 'none',
                            borderRadius: '0.5rem',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            backgroundColor: loginType === 'personal' ? '#10b981' : 'transparent',
                            color: loginType === 'personal' ? 'white' : '#94a3b8'
                        }}
                    >
                        Sou Personal
                    </button>
                    <button
                        onClick={() => setLoginType('aluno')}
                        style={{
                            flex: 1,
                            padding: '0.75rem',
                            border: 'none',
                            borderRadius: '0.5rem',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            backgroundColor: loginType === 'aluno' ? '#10b981' : 'transparent',
                            color: loginType === 'aluno' ? 'white' : '#94a3b8'
                        }}
                    >
                        Sou Aluno
                    </button>
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

                    {loginType === 'personal' && (
                        <>
                            <button
                                type="button"
                                onClick={handleGoogleLogin}
                                disabled={loadingLocal}
                                style={{
                                    width: '100%',
                                    backgroundColor: 'rgba(12, 12, 14, 0.5)',
                                    color: 'white',
                                    padding: '1rem',
                                    borderRadius: '0.75rem',
                                    border: '1px solid rgba(148, 163, 184, 0.2)',
                                    fontWeight: '600',
                                    fontSize: '1rem',
                                    cursor: loadingLocal ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    opacity: loadingLocal ? 0.8 : 1,
                                    transition: 'all 0.2s',
                                    fontFamily: 'inherit'
                                }}
                                onMouseOver={(e) => {
                                    if (loadingLocal) return;
                                    e.currentTarget.style.borderColor = '#10b981';
                                    e.currentTarget.style.backgroundColor = 'rgba(12, 12, 14, 0.65)';
                                    e.currentTarget.style.boxShadow = '0 0 0 4px rgba(16, 185, 129, 0.1)';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.2)';
                                    e.currentTarget.style.backgroundColor = 'rgba(12, 12, 14, 0.5)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                {loadingLocal ? <Loader2 size={20} className="animate-spin" /> : (
                                    <>
                                        <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
                                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                                            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                                        </svg>
                                        Entrar com Google
                                    </>
                                )}
                            </button>
                            <p style={{ color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center', lineHeight: 1.5 }}>
                                Personais entram com a conta Google. Novo por aqui? Seu acesso é criado na hora, com <strong style={{ color: '#cbd5e1' }}>7 dias grátis</strong>.
                            </p>
                        </>
                    )}

                    {loginType === 'aluno' && (
                    <>
                    <button
                        type="button"
                        onClick={handleStudentGoogle}
                        disabled={loadingLocal}
                        style={{
                            width: '100%', backgroundColor: 'rgba(12, 12, 14, 0.5)', color: 'white',
                            padding: '1rem', borderRadius: '0.75rem', border: '1px solid rgba(148, 163, 184, 0.2)',
                            fontWeight: '600', fontSize: '1rem', cursor: loadingLocal ? 'not-allowed' : 'pointer',
                            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem',
                            opacity: loadingLocal ? 0.8 : 1, transition: 'all 0.2s', fontFamily: 'inherit'
                        }}
                    >
                        {loadingLocal ? <Loader2 size={20} className="animate-spin" /> : (
                            <>
                                <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
                                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                                </svg>
                                Entrar com Google
                            </>
                        )}
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0.25rem 0' }}>
                        <div style={{ flex: 1, height: '1px', background: 'rgba(148,163,184,0.2)' }} />
                        <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>ou com e-mail e senha</span>
                        <div style={{ flex: 1, height: '1px', background: 'rgba(148,163,184,0.2)' }} />
                    </div>

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
                                backgroundColor: 'rgba(12, 12, 14, 0.5)',
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
                                e.target.style.backgroundColor = 'rgba(12, 12, 14, 0.65)';
                                e.target.style.boxShadow = '0 0 0 4px rgba(16, 185, 129, 0.1)';
                                e.target.previousSibling.style.color = '#10b981';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = 'rgba(148, 163, 184, 0.2)';
                                e.target.style.backgroundColor = 'rgba(12, 12, 14, 0.5)';
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
                                    backgroundColor: 'rgba(12, 12, 14, 0.5)',
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
                                    e.target.style.backgroundColor = 'rgba(12, 12, 14, 0.65)';
                                    e.target.style.boxShadow = '0 0 0 4px rgba(16, 185, 129, 0.1)';
                                    e.target.previousSibling.style.color = '#10b981';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = 'rgba(148, 163, 184, 0.2)';
                                    e.target.style.backgroundColor = 'rgba(12, 12, 14, 0.5)';
                                    e.target.style.boxShadow = 'none';
                                    e.target.previousSibling.style.color = '#94a3b8';
                                }}
                                placeholder="Sua senha secreta"
                            />
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
                    </>
                    )}

                    <div style={{ textAlign: 'center', marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <Link to="/" style={{ color: '#64748b', fontSize: '0.85rem', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                            <span>←</span> Voltar para o site
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
