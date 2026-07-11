import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Dumbbell, Activity, LogOut, Users, Lock, MessageCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGym } from '../context/GymContext';
import { getPaymentStatus } from '../utils/payments';

export default function StudentLayout() {
    const location = useLocation();
    const { logout, user } = useAuth();
    const { students, settings, isTrainingMode } = useGym();
    const navigate = useNavigate();

    // Bloqueio por inadimplência: aluno pendente é bloqueado AUTOMATICAMENTE.
    // O personal pode liberar um aluno específico (accessException) — ex: quando
    // o aluno entra em contato negociando. Se ele pagar, desbloqueia sozinho.
    const studentData = students.find(s => s.id === user?.studentId);
    const studentActive = studentData?.status?.toLowerCase() === 'active';
    const isOverdue = studentData ? (studentActive && getPaymentStatus(studentData).isOverdue) : false;
    const isBlocked = isOverdue && !studentData?.accessException;
    const onHome = location.pathname === '/student' || location.pathname === '/student/';

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const isActive = (path) => location.pathname === path;

    const navItemStyle = (path) => ({
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        color: isActive(path) ? 'var(--primary)' : 'var(--text-muted)',
        textDecoration: 'none',
        flex: 1,
        transition: 'all 0.2s',
        fontSize: '0.75rem',
        fontWeight: isActive(path) ? '600' : '400'
    });

    return (
        <div style={{ 
            minHeight: '100vh', 
            backgroundColor: 'var(--background)', 
            display: 'flex', 
            flexDirection: 'column',
            fontFamily: "'Outfit', sans-serif"
        }}>
            {/* Student Top Header */}
            <header style={{
                padding: '1.25rem 1.5rem',
                display: isTrainingMode ? 'none' : 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(18, 18, 20, 0.6)',
                backdropFilter: 'blur(10px)',
                borderBottom: '1px solid var(--border-glass)',
                position: 'sticky',
                top: 0,
                zIndex: 50
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {settings?.logoUrl ? (
                        <img src={settings.logoUrl} alt="Logo" style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />
                    ) : (
                        <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Dumbbell color="white" size={20} />
                        </div>
                    )}
                    <div>
                        <h1 style={{ fontSize: '1rem', fontWeight: 'bold', margin: 0 }}>{settings?.gymName || 'GymManager'}</h1>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Portal do Aluno</p>
                    </div>
                </div>
                <button 
                    onClick={handleLogout}
                    style={{ 
                        background: 'rgba(239, 68, 68, 0.1)', 
                        border: 'none', 
                        padding: '0.5rem', 
                        borderRadius: '8px', 
                        color: '#ef4444',
                        cursor: 'pointer'
                    }}
                >
                    <LogOut size={20} />
                </button>
            </header>

            {/* Main Content Area */}
            <main className="student-main" style={{
                flex: 1,
                padding: isTrainingMode ? '0' : '1.5rem',
                paddingBottom: isTrainingMode ? '0' : 'calc(80px + env(safe-area-inset-bottom))'
            }}>
                {isBlocked && !onHome ? (
                    <div style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        textAlign: 'center', minHeight: '60vh', gap: '1.25rem', padding: '1rem'
                    }}>
                        <div style={{
                            width: '72px', height: '72px', borderRadius: '50%',
                            background: 'rgba(239, 68, 68, 0.12)', display: 'flex',
                            alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Lock size={34} color="#ef4444" />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.25rem', margin: '0 0 0.5rem' }}>Acesso bloqueado</h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '320px', lineHeight: 1.5, margin: 0 }}>
                                Sua mensalidade está pendente. Regularize com seu personal para liberar os treinos, a comunidade e a evolução.
                            </p>
                        </div>
                        {settings?.whatsapp && (
                            <a
                                href={`https://wa.me/${settings.whatsapp.replace(/\D/g, '')}?text=Olá,%20gostaria%20de%20regularizar%20minha%20mensalidade.`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                    padding: '0.85rem 1.5rem', background: '#25d366', color: '#fff',
                                    borderRadius: '12px', fontWeight: 'bold', fontSize: '0.9rem',
                                    textDecoration: 'none', boxShadow: '0 4px 12px rgba(37, 211, 102, 0.25)'
                                }}
                            >
                                <MessageCircle size={18} /> Falar com o personal
                            </a>
                        )}
                        <button
                            onClick={() => navigate('/student')}
                            style={{
                                background: 'none', border: 'none', color: 'var(--text-muted)',
                                fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline'
                            }}
                        >
                            Voltar ao início
                        </button>
                    </div>
                ) : (
                    <Outlet />
                )}
            </main>

            {/* Bottom Navigation (Mobile Native Feel) */}
            <nav style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                height: 'calc(70px + env(safe-area-inset-bottom))',
                background: 'rgba(18, 18, 20, 0.92)',
                backdropFilter: 'blur(16px)',
                borderTop: '1px solid var(--border-glass)',
                display: isTrainingMode ? 'none' : 'flex',
                alignItems: 'center',
                padding: '0 1rem env(safe-area-inset-bottom) 1rem',
                zIndex: 100
            }}>
                <Link to="/student" style={navItemStyle('/student')}>
                    <LayoutDashboard size={24} />
                    <span>Início</span>
                </Link>
                <Link to="/student/workouts" style={navItemStyle('/student/workouts')}>
                    <Dumbbell size={24} />
                    <span>Treinos</span>
                </Link>
                <Link to="/student/community" style={navItemStyle('/student/community')}>
                    <Users size={24} />
                    <span>Comunidade</span>
                </Link>
                <Link to="/student/assessments" style={navItemStyle('/student/assessments')}>
                    <Activity size={24} />
                    <span>Evolução</span>
                </Link>
            </nav>
        </div>
    );
}
