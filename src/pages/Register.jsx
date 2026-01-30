import { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '../firebase';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, Loader2, User, ShieldCheck, Building2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { addToast } = useToast();

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }

        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        setLoading(true);
        let createdUser = null;

        try {
            // 1. Create Authentication User
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            createdUser = userCredential.user;

            // --- INVITE FLOW ONLY ---
            const emailKey = email.replace(/\./g, '_');
            const staffRef = doc(db, 'staff_access', emailKey);
            const staffSnap = await getDoc(staffRef);

            if (!staffSnap.exists()) {
                await createdUser.delete();
                throw new Error("Este e-mail não possui convite autorizado.");
            }

            await updateProfile(createdUser, { displayName: name });
            await setDoc(staffRef, { accepted: true, acceptedAt: new Date().toISOString() }, { merge: true });

            addToast('Conta criada com sucesso! Bem-vindo.', 'success');
            navigate('/app');

        } catch (err) {
            console.error("Register Error:", err);
            if (createdUser && auth.currentUser) {
                try { await createdUser.delete(); } catch (ignore) { }
            }

            setLoading(false);
            if (err.code === 'auth/email-already-in-use') {
                setError('Este e-mail já está cadastrado.');
            } else if (err.message) {
                setError(err.message);
            } else {
                setError('Erro ao criar conta. Tente novamente.');
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
            backgroundColor: '#020617',
            fontFamily: "'Outfit', sans-serif"
        }}>
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

            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'linear-gradient(to bottom right, rgba(2, 6, 23, 0.85), rgba(2, 6, 23, 0.7))',
                zIndex: 2,
                backdropFilter: 'blur(3px)'
            }}></div>

            <div style={{
                maxWidth: '32rem',
                width: '100%',
                backgroundColor: 'rgba(15, 23, 42, 0.65)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                borderRadius: '1.5rem',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '2rem',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                position: 'relative',
                zIndex: 10
            }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem' }}>
                        Aceitar Convite
                    </h1>
                    <p style={{ color: '#94a3b8' }}>Cadastre-se para acessar o sistema da sua academia.</p>
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
                        textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                    {/* Common Fields */}
                    <div className="input-group">
                        <div style={{ position: 'relative' }}>
                            <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                type="text"
                                required
                                placeholder="Seu Nome Completo"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', borderRadius: '12px', background: 'rgba(2, 6, 23, 0.4)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                type="email"
                                required
                                placeholder="Seu E-mail"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', borderRadius: '12px', background: 'rgba(2, 6, 23, 0.4)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                type="password"
                                required
                                placeholder="Crie uma Senha"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', borderRadius: '12px', background: 'rgba(2, 6, 23, 0.4)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                type="password"
                                required
                                placeholder="Confirme a Senha"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', borderRadius: '12px', background: 'rgba(2, 6, 23, 0.4)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                            />
                        </div>
                    </div>


                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary"
                        style={{
                            width: '100%',
                            padding: '1rem',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '0.5rem',
                            marginTop: '1rem',
                            fontSize: '1rem'
                        }}
                    >
                        {loading ? <Loader2 size={20} className="animate-spin" /> : 'Aceitar Convite'}
                    </button>

                    <div style={{ textAlign: 'center', marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
                        <Link to="/login" style={{ color: '#94a3b8', textDecoration: 'none' }}>
                            Já tem conta? <span style={{ color: 'var(--primary)' }}>Fazer Login</span>
                        </Link>
                    </div>

                </form>
            </div>

            <style>{`
                ::placeholder { color: #64748b; }
            `}</style>
        </div>
    );
};

export default Register;
