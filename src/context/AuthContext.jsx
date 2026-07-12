import { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut, signInAnonymously } from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { resolvePlan, DEFAULT_PLAN } from '../config/plans';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [accessDenied, setAccessDenied] = useState(false);
    const [trialExpired, setTrialExpired] = useState(false);
    const [paymentOverdue, setPaymentOverdue] = useState(false);
    const [gracePeriodDaysRemaining, setGracePeriodDaysRemaining] = useState(null); // New State
    const [trialInfo, setTrialInfo] = useState({ isTrial: false, daysRemaining: 0, totalDays: 0 });
    const [requiresPasswordChange, setRequiresPasswordChange] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(true); // Default true to avoid flash, but check logic below
    const [plan, setPlan] = useState(DEFAULT_PLAN); // Plano efetivo do personal (bronze/prata/ouro)
    const [pendingStudentLink, setPendingStudentLink] = useState(null); // Aluno logou com Google mas ainda não vinculou (pede código)

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser && !currentUser.isAnonymous) {
                try {
                    // 1. Determine Role & Tenant
                    const SUPER_ADMINS = ['j.17jvictor@gmail.com'];


                    if (SUPER_ADMINS.some(admin => admin.toLowerCase() === currentUser.email?.toLowerCase())) {
                        console.log('User is Super Admin!');
                        currentUser.isSuperAdmin = true;
                    } else {
                        console.log('User is NOT Super Admin');
                    }

                    // Este login com Google é de um ALUNO? (superadmin nunca é aluno)
                    if (!currentUser.isSuperAdmin && currentUser.email) {
                        const emailKey = currentUser.email.toLowerCase().replace(/\./g, '_');
                        const linkSnap = await getDoc(doc(db, 'student_access', emailKey));
                        const link = linkSnap.exists() ? linkSnap.data() : null;

                        if (link && link.studentId && link.tenantId) {
                            // Aluno já vinculado → entra direto como aluno
                            sessionStorage.removeItem('student_login_intent');
                            currentUser.role = 'student';
                            currentUser.tenantId = link.tenantId;
                            currentUser.studentId = link.studentId;
                            currentUser.name = link.name || currentUser.displayName || 'Aluno';
                            setPendingStudentLink(null);
                            setUser(currentUser);
                            setLoading(false);
                            return;
                        }

                        // Não vinculado, mas veio da intenção "Sou Aluno" → pede o código
                        if (sessionStorage.getItem('student_login_intent')) {
                            setPendingStudentLink({ uid: currentUser.uid, email: currentUser.email, name: currentUser.displayName || '', emailKey });
                            setLoading(false);
                            return;
                        }
                    }

                    // Chegou aqui = é personal (dono). Limpa qualquer intenção de aluno sobrando.
                    sessionStorage.removeItem('student_login_intent');

                    let tenantId = currentUser.uid;
                    let role = 'owner';
                    let resolvedPlan = DEFAULT_PLAN; // recalculado abaixo com base no tenant

                    // 1. Check if this user IS an Owner (has a tenant doc)
                    // This takes precedence over being a staff member elsewhere.
                    const ownTenantRef = doc(db, 'tenants', currentUser.uid);
                    const ownTenantSnap = await getDoc(ownTenantRef);

                    // Modelo atual: TODO login com Google é DONO da própria conta.
                    // O roteamento de "Equipe" (staff/admin de outra academia via
                    // staff_access) foi DESATIVADO — era pro cenário futuro de vender
                    // pra academias (separar dono de administradores). Enquanto isso,
                    // ninguém é sequestrado como Equipe: role = 'owner', tenantId = uid.
                    if (ownTenantSnap.exists()) {
                        console.log('Owner (tenant encontrado).');
                    }

                    // 2. Load Tenant Data (using tenantId)
                    const tenantRef = doc(db, 'tenants', tenantId);
                    const tenantSnap = await getDoc(tenantRef);

                    // If I am staff, I need to check if the OWNER's account is active
                    // But I also might have my own user status? 
                    // For simplicity: If owner is inactive, staff is locked out too.

                    if (tenantSnap.exists()) {
                        const data = tenantSnap.data();

                        // Check Access (Banned/Inactive) for the GYM
                        // Manual Block takes precedence over everything
                        if (data.active === false) {
                            setAccessDenied(true);
                            // Ensure we reset other states
                            setTrialExpired(false);
                        } else {
                            // Check Trial Status of the GYM
                            const subscriptionStatus = data.subscriptionStatus;
                            let isSubscriber = false;
                            let trialIsActive = false;

                            // 1. LIFETIME ACCESS CHECK (Prioridade Máxima)
                            // Se tiver acesso vitalício, ignora status do stripe, atrasos, etc.
                            if (data.lifetimeAccess === true) {
                                isSubscriber = true;
                                console.log('Access granted via Lifetime Access');
                            } else {
                                // Active, Trialing or missing status (legacy/free) grants access
                                isSubscriber = subscriptionStatus === 'active' || subscriptionStatus === 'trialing' || subscriptionStatus === undefined;
                            }

                            // Check for Past Due with Grace Period (Only if not already valid via lifetime)
                            if (!data.lifetimeAccess && subscriptionStatus === 'past_due') {
                                const currentPeriodEnd = data.current_period_end; // Timestamp from Firestore
                                if (currentPeriodEnd) {
                                    const endDate = currentPeriodEnd.toDate ? currentPeriodEnd.toDate() : new Date(currentPeriodEnd.seconds * 1000);
                                    const GRACE_PERIOD_DAYS = 5;

                                    const gracePeriodEnd = new Date(endDate);
                                    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + GRACE_PERIOD_DAYS);

                                    const now = new Date();

                                    if (now <= gracePeriodEnd) {
                                        // Still within grace period
                                        isSubscriber = true;

                                        const timeRem = gracePeriodEnd - now;
                                        const daysRem = Math.ceil(timeRem / (1000 * 60 * 60 * 24));
                                        setGracePeriodDaysRemaining(daysRem);

                                        console.log('Access granted via Grace Period. Ends:', gracePeriodEnd);
                                    } else {
                                        // Grace period expired
                                        isSubscriber = false;
                                        setPaymentOverdue(true);
                                        setGracePeriodDaysRemaining(0);
                                        console.log('Grace Period Expired on:', gracePeriodEnd);
                                    }
                                } else {
                                    isSubscriber = false;
                                    setPaymentOverdue(true);
                                }
                            } else {
                                setPaymentOverdue(false);
                                setGracePeriodDaysRemaining(null);
                            }

                            if (!isSubscriber && !paymentOverdue) {
                                // Calculate days since creation of the GYM
                                const createdDate = new Date(data.createdAt);
                                const now = new Date();
                                const TRIAL_DAYS = 7;

                                const trialEndDate = new Date(createdDate);
                                trialEndDate.setDate(trialEndDate.getDate() + TRIAL_DAYS);

                                const timeRemaining = trialEndDate - now;
                                const daysLeft = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24));

                                setTrialInfo({
                                    isTrial: true,
                                    daysRemaining: daysLeft,
                                    totalDays: TRIAL_DAYS
                                });

                                if (daysLeft <= 0) {
                                    setAccessDenied(false); // Explicitly ensure false so PrivateRoute allows /app/subscription
                                    setTrialExpired(true);
                                } else {
                                    setTrialExpired(false);
                                    setAccessDenied(false);
                                    trialIsActive = true;
                                }
                            } else if (isSubscriber) {
                                // If subscriber, clear all blocks
                                setTrialInfo({ isTrial: false, daysRemaining: 0, totalDays: 0 });
                                setTrialExpired(false);
                                setAccessDenied(false);
                                setPaymentOverdue(false);
                                setGracePeriodDaysRemaining(null);
                            }

                            // Resolve o plano efetivo (bronze/prata/ouro)
                            resolvedPlan = resolvePlan({
                                tier: data.tier,
                                lifetimeAccess: data.lifetimeAccess === true,
                                paidSubscriber: isSubscriber && !trialIsActive,
                                trialActive: trialIsActive,
                            });
                            setPlan(resolvedPlan);

                            // Check Password Change Requirement
                            if (data.requiresPasswordChange) {
                                setRequiresPasswordChange(true);
                            } else {
                                setRequiresPasswordChange(false);
                            }

                            // Check Terms Acceptance
                            if (data.termsAccepted) {
                                setTermsAccepted(true);
                            } else {
                                setTermsAccepted(false);
                            }

                        }
                    } else {
                        // Tenant não existe. Dois casos caem aqui:
                        //  - conta nova (role já era 'owner')
                        //  - staff de uma academia que foi apagada (staff órfão)
                        // Em ambos, a pessoa vira DONA de uma conta nova — nunca
                        // fica presa como "Equipe" de um gym inexistente.
                        tenantId = currentUser.uid;
                        role = 'owner';
                        await setDoc(doc(db, 'tenants', currentUser.uid), {
                            active: true,
                            email: currentUser.email,
                            createdAt: new Date().toISOString(),
                            subscriptionStatus: 'trial',
                            termsAccepted: false // New owners must accept terms
                        });
                        setTrialInfo({ isTrial: true, daysRemaining: 7, totalDays: 7 }); // Corrected initial trial
                        setAccessDenied(false);
                        setTrialExpired(false);
                        setTermsAccepted(false);
                        resolvedPlan = 'ouro'; // teste de 7 dias começa com tudo liberado
                        setPlan('ouro');
                    }

                    // Attach role and tenantId to user object for easy access
                    currentUser.role = role;
                    currentUser.tenantId = tenantId;
                    currentUser.plan = resolvedPlan;

                } catch (error) {
                    console.error("Error checking tenant status:", error);
                    setAccessDenied(false);
                }
                setUser(currentUser);
                setLoading(false);
            } else {
                // If no Firebase user (OR is Anonymous), check for Student Session
                const studentSession = localStorage.getItem('gym_student_session');
                if (studentSession) {
                    try {
                        const sessionData = JSON.parse(studentSession);
                        console.log('Logged in as Student:', sessionData.email);
                        
                        // We set the user state immediately for UI responsiveness
                        setUser({
                            ...sessionData,
                            role: 'student',
                            uid: `student_${sessionData.studentId}` // Synthetic UID
                        });

                        // Ensure Firebase session is active for Firestore permissions
                        if (!auth.currentUser) {
                            console.log('Establishing anonymous Firebase session for student...');
                            signInAnonymously(auth).catch(e => console.error("Anonymous sign-in error:", e));
                        }
                    } catch (e) {
                        console.error("Error parsing student session:", e);
                        localStorage.removeItem('gym_student_session');
                        setUser(null);
                    }
                } else {
                    setUser(null);
                }
                
                setAccessDenied(false);
                setTrialExpired(false);
                setRequiresPasswordChange(false);
                setTermsAccepted(true);
                setPlan(DEFAULT_PLAN);
                setLoading(false);
            }
        });

        return unsubscribe;
    }, []);

    const loginAsStudent = async (email, password) => {
        try {
            const emailKey = email.toLowerCase().trim().replace(/\./g, '_');
            const studentAccessRef = doc(db, 'student_access', emailKey);
            const studentAccessSnap = await getDoc(studentAccessRef);

            if (!studentAccessSnap.exists()) {
                throw new Error('Conta não encontrada.');
            }

            const accessData = studentAccessSnap.data();

            if (accessData.password !== password) {
                throw new Error('Senha incorreta.');
            }

            // Valid - Create Session
            const session = {
                email: accessData.email,
                name: accessData.name || 'Aluno',
                studentId: accessData.studentId,
                tenantId: accessData.tenantId,
                role: 'student'
            };

            // Sign-in anonymously to get Firestore permissions before finishing
            await signInAnonymously(auth);

            localStorage.setItem('gym_student_session', JSON.stringify(session));
            setUser({
                ...session,
                uid: `student_${accessData.studentId}`
            });

            return session;
        } catch (error) {
            console.error("Student Login Error:", error);
            throw error;
        }
    };

    // Vincula a conta Google logada a um aluno, usando o código de acesso.
    const linkStudentByCode = async (code) => {
        const norm = (code || '').trim().toUpperCase();
        if (!norm) throw new Error('Digite o código.');
        if (!pendingStudentLink) throw new Error('Sessão expirada. Entre de novo.');

        const codeSnap = await getDoc(doc(db, 'student_codes', norm));
        if (!codeSnap.exists()) throw new Error('Código inválido ou já utilizado.');
        const { tenantId, studentId } = codeSnap.data();

        // Pega o nome do aluno (leitura pública do doc do aluno)
        let name = pendingStudentLink.name || 'Aluno';
        try {
            const stSnap = await getDoc(doc(db, `users/${tenantId}/students`, studentId));
            if (stSnap.exists() && stSnap.data().name) name = stSnap.data().name;
        } catch (e) { /* ignora */ }

        // Grava o vínculo (sem senha — login é via Google)
        await setDoc(doc(db, 'student_access', pendingStudentLink.emailKey), {
            email: pendingStudentLink.email,
            name, tenantId, studentId, viaGoogle: true,
        });
        // Consome o código (uso único)
        await deleteDoc(doc(db, 'student_codes', norm)).catch(() => {});

        sessionStorage.removeItem('student_login_intent');
        const u = auth.currentUser;
        if (u) {
            u.role = 'student';
            u.tenantId = tenantId;
            u.studentId = studentId;
            u.name = name;
            setUser(u);
        }
        setPendingStudentLink(null);
    };

    // Cancela a vinculação (aluno desiste de digitar o código)
    const cancelStudentLink = async () => {
        sessionStorage.removeItem('student_login_intent');
        setPendingStudentLink(null);
        try { await signOut(auth); } catch (e) { /* ignora */ }
        setUser(null);
    };

    const logout = async () => {
        try {
            await signOut(auth);
            localStorage.removeItem('gym_student_session');
            sessionStorage.removeItem('student_login_intent');
            setUser(null);
            setPendingStudentLink(null);
            setAccessDenied(false);
        } catch (error) {
            console.error("Error logging out:", error);
        }
    };

    const value = {
        user,
        loading,
        accessDenied,
        trialExpired,
        paymentOverdue,
        gracePeriodDaysRemaining, // Exported
        trialInfo,
        requiresPasswordChange,
        termsAccepted,
        plan,
        loginAsStudent,
        pendingStudentLink,
        linkStudentByCode,
        cancelStudentLink,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {loading ? (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    backgroundColor: 'var(--bg-app)',
                    color: 'white'
                }}>
                    <Loader2 size={48} className="animate-spin" color="#10b981" />
                </div>
            ) : pendingStudentLink ? (
                <StudentCodeScreen
                    email={pendingStudentLink.email}
                    onSubmit={linkStudentByCode}
                    onCancel={cancelStudentLink}
                />
            ) : (
                children
            )}
        </AuthContext.Provider>
    );
};

// Tela pedida no 1º login do aluno com Google: digitar o código de acesso.
function StudentCodeScreen({ email, onSubmit, onCancel }) {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handle = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await onSubmit(code);
        } catch (err) {
            setError(err.message || 'Não foi possível vincular.');
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', background: 'var(--bg-app)' }}>
            <div style={{ width: '100%', maxWidth: '380px', background: 'rgba(24,24,27,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1.25rem', padding: '2rem' }}>
                <h1 style={{ fontSize: '1.4rem', margin: '0 0 0.5rem', color: 'white' }}>Quase lá! 🔑</h1>
                <p style={{ color: '#cbd5e1', fontSize: '0.9rem', margin: '0 0 1.5rem', lineHeight: 1.5 }}>
                    Digite o <strong>código de acesso</strong> que seu personal te passou para vincular a conta <strong>{email}</strong>.
                </p>
                {error && (
                    <div style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5', padding: '0.7rem', borderRadius: '0.6rem', marginBottom: '1rem', fontSize: '0.85rem', textAlign: 'center' }}>{error}</div>
                )}
                <form onSubmit={handle}>
                    <input
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        placeholder="Ex: 4F9K2A"
                        autoFocus
                        maxLength={8}
                        style={{ width: '100%', padding: '1rem', textAlign: 'center', fontSize: '1.4rem', fontFamily: 'monospace', letterSpacing: '0.25em', textTransform: 'uppercase', background: 'rgba(12,12,14,0.6)', border: '1px solid rgba(148,163,184,0.3)', borderRadius: '0.75rem', color: 'white', outline: 'none', boxSizing: 'border-box', marginBottom: '1rem' }}
                    />
                    <button type="submit" disabled={loading || !code.trim()} style={{ width: '100%', padding: '1rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '0.75rem', fontWeight: 700, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: (loading || !code.trim()) ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        {loading ? <Loader2 size={20} className="animate-spin" /> : 'Vincular e entrar'}
                    </button>
                </form>
                <button onClick={onCancel} style={{ width: '100%', marginTop: '0.75rem', background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.85rem', cursor: 'pointer' }}>
                    Cancelar / usar outra conta
                </button>
            </div>
        </div>
    );
}
