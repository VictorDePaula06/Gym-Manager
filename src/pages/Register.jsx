import { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '../firebase';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, Loader2, Dumbbell, User, ShieldCheck } from 'lucide-react';
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
            // 1. Create Authentication User FIRST (AUTHENTICATED)
            // This is key: we authenticate FIRST so we can read the database rules safely
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            createdUser = userCredential.user;

            // 2. SECURITY CHECK: Verify if email is invited
            const emailKey = email.replace(/\./g, '_');
            const staffRef = doc(db, 'staff_access', emailKey);
            const staffSnap = await getDoc(staffRef);

            if (!staffSnap.exists()) {
                // Not invited? Rollback immediately!
                await createdUser.delete();
                throw new Error("Este e-mail não possui convite autorizado.");
            }

            // 3. Update Profile Name
            await updateProfile(createdUser, {
                displayName: name
            });

            // 4. Mark Invite as Accepted
            await setDoc(staffRef, { accepted: true, acceptedAt: new Date().toISOString() }, { merge: true });

            addToast('Conta criada com sucesso! Bem-vindo.', 'success');
            navigate('/app');

        } catch (err) {
            console.error("Register Error:", err);

            // Cleanup: Delete the user if verification failed
            if (createdUser && auth.currentUser) {
                try { await createdUser.delete(); } catch (ignore) { }
            }

            setLoading(false);
            if (err.code === 'auth/email-already-in-use') {
                setError('Este e-mail já está cadastrado.');
            } else if (err.code === 'auth/requires-recent-login') {
                setError('Erro de segurança. Tente novamente.');
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

            {/* Gradient Overlay */}
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
                maxWidth: '28rem',
                width: '100%',
                backgroundColor: 'rgba(15, 23, 42, 0.65)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                borderRadius: '1.5rem',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '2.5rem',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.05)',
                position: 'relative',
                zIndex: 10
            }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        width: '4rem',
                        height: '4rem',
                        borderRadius: '1rem',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', // Blue logic for register
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem auto',
                        boxShadow: '0 10px 20px -5px rgba(59, 130, 246, 0.4)'
                    }}>
                        <ShieldCheck color="white" size={32} />
                    </div>
                    <h1 style={{
                        fontSize: '1.8rem',
                        fontWeight: '700',
                        color: 'white',
                        marginBottom: '0.5rem'
                    }}>
                        Cadastro Seguro
                    </h1>
                    <p style={{ color: '#cbd5e1', fontSize: '0.95rem' }}>
                        Crie sua senha de acesso exclusivo.
                    </p>
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
                        gap: '0.5rem'
                    }}>
                        <span>⚠️</span> {error}
                    </div>
                )}

                <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                    {/* Name Input */}
                    <div style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', zIndex: 20 }}>
                            <User size={18} />
                        </div>
                        <input
                            type="text"
                            required
                            placeholder="Seu Nome Completo"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '1rem 1rem 1rem 3rem',
                                backgroundColor: 'rgba(2, 6, 23, 0.4)',
                                border: '1px solid rgba(148, 163, 184, 0.2)',
                                borderRadius: '0.75rem',
                                outline: 'none',
                                color: 'white',
                                fontSize: '0.95rem'
                            }}
                        />
                    </div>

                    {/* Email Input */}
                    <div style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', zIndex: 20 }}>
                            <Mail size={18} />
                        </div>
                        <input
                            type="email"
                            required
                            placeholder="Email (o mesmo do convite)"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '1rem 1rem 1rem 3rem',
                                backgroundColor: 'rgba(2, 6, 23, 0.4)',
                                border: '1px solid rgba(148, 163, 184, 0.2)',
                                borderRadius: '0.75rem',
                                outline: 'none',
                                color: 'white',
                                fontSize: '0.95rem'
                            }}
                        />
                    </div>

                    {/* Password Input */}
                    <div style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', zIndex: 20 }}>
                            <Lock size={18} />
                        </div>
                        <input
                            type="password"
                            required
                            placeholder="Crie uma Senha"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '1rem 1rem 1rem 3rem',
                                backgroundColor: 'rgba(2, 6, 23, 0.4)',
                                border: '1px solid rgba(148, 163, 184, 0.2)',
                                borderRadius: '0.75rem',
                                outline: 'none',
                                color: 'white',
                                fontSize: '0.95rem'
                            }}
                        />
                    </div>

                    {/* Confirm Password Input */}
                    <div style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', zIndex: 20 }}>
                            <Lock size={18} />
                        </div>
                        <input
                            type="password"
                            required
                            placeholder="Confirme a Senha"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '1rem 1rem 1rem 3rem',
                                backgroundColor: 'rgba(2, 6, 23, 0.4)',
                                border: '1px solid rgba(148, 163, 184, 0.2)',
                                borderRadius: '0.75rem',
                                outline: 'none',
                                color: 'white',
                                fontSize: '0.95rem'
                            }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            backgroundColor: '#3b82f6',
                            backgroundImage: 'linear-gradient(to right, #3b82f6, #2563eb)',
                            color: 'white',
                            padding: '1rem',
                            borderRadius: '0.75rem',
                            border: 'none',
                            fontWeight: '600',
                            fontSize: '1rem',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '0.5rem',
                            marginTop: '0.5rem',
                            opacity: loading ? 0.8 : 1,
                            boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)'
                        }}
                    >
                        {loading ? <Loader2 size={20} className="animate-spin" /> : 'Finalizar Cadastro'}
                    </button>

                    <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                        <Link to="/login" style={{ color: '#94a3b8', fontSize: '0.9rem', textDecoration: 'none' }}>
                            Já tem conta? <span style={{ color: '#3b82f6' }}>Faça Login</span>
                        </Link>
                    </div>
                </form>
            </div>

            <div style={{
                position: 'absolute',
                bottom: '1rem',
                color: 'rgba(255,255,255,0.2)',
                fontSize: '0.75rem',
                zIndex: 20
            }}>
                Registro Restrito a Convidados
            </div>
        </div>
    );
};

export default Register;
