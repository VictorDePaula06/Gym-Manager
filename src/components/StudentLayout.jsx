import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Dumbbell, Activity, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGym } from '../context/GymContext';

export default function StudentLayout() {
    const location = useLocation();
    const { logout, user } = useAuth();
    const { settings, isTrainingMode } = useGym();
    const navigate = useNavigate();

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
                background: 'rgba(15, 23, 42, 0.4)',
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
            <main style={{ 
                flex: 1, 
                padding: isTrainingMode ? '0' : '1.5rem', 
                paddingBottom: isTrainingMode ? '0' : 'calc(80px + env(safe-area-inset-bottom))',
                maxWidth: '600px',
                margin: '0 auto',
                width: '100%',
                boxSizing: 'border-box'
            }}>
                <Outlet />
            </main>

            {/* Bottom Navigation (Mobile Native Feel) */}
            <nav style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                height: 'calc(70px + env(safe-area-inset-bottom))',
                background: 'rgba(15, 23, 42, 0.9)',
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
                <Link to="/student/assessments" style={navItemStyle('/student/assessments')}>
                    <Activity size={24} />
                    <span>Evolução</span>
                </Link>
            </nav>
        </div>
    );
}
