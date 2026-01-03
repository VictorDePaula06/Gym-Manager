import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, Dumbbell, Settings, LogOut, PieChart, Briefcase } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGym } from '../context/GymContext';

export default function Layout() {
    const location = useLocation();
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const isActive = (path) => location.pathname === path;

    const linkStyle = (path) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.75rem 1rem',
        borderRadius: '12px',
        marginBottom: '0.5rem',
        color: isActive(path) ? 'var(--primary)' : 'var(--text-muted)',
        background: isActive(path) ? 'var(--input-bg)' : 'transparent',
        border: isActive(path) ? '1px solid var(--primary)' : '1px solid transparent',
        transition: 'all 0.2s ease',
        textDecoration: 'none',
        cursor: 'pointer',
        userSelect: 'none',
        outline: 'none'
    });

    const { settings } = useGym();

    return (
        <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
            {/* Sidebar */}
            <aside className="glass-panel" style={{
                width: '280px',
                height: '96vh',
                margin: '2vh 0 2vh 2vh',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '24px'
            }}>
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                    {settings?.logoUrl && (
                        <img
                            src={settings.logoUrl}
                            alt="Logo"
                            style={{
                                width: '60px',
                                height: '60px',
                                borderRadius: '12px',
                                objectFit: 'cover',
                                marginBottom: '1rem',
                                boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
                            }}
                        />
                    )}
                    <h1 style={{
                        fontSize: '1.5rem',
                        background: 'linear-gradient(to right, #10b981, #3b82f6)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        margin: 0
                    }}>
                        {settings?.gymName || 'GymManager'}
                    </h1>
                </div>

                <nav style={{ flex: 1, padding: '0 1rem' }}>
                    <Link to="/" style={linkStyle('/')}>
                        <LayoutDashboard size={20} />
                        <span>Visão Geral</span>
                    </Link>
                    <Link to="/students" style={linkStyle('/students')}>
                        <Users size={20} />
                        <span>Alunos</span>
                    </Link>
                    <Link to="/teachers" style={linkStyle('/teachers')}>
                        <Briefcase size={20} />
                        <span>Professores</span>
                    </Link>
                    <Link to="/financial" style={linkStyle('/financial')}>
                        <CreditCard size={20} />
                        <span>Financeiro</span>
                    </Link>
                    <Link to="/workouts" style={linkStyle('/workouts')}>
                        <Dumbbell size={20} />
                        <span>Treinos</span>
                    </Link>
                    <Link to="/reports" style={linkStyle('/reports')}>
                        <PieChart size={20} />
                        <span>Relatórios</span>
                    </Link>
                </nav>

                <div style={{ padding: '1rem' }}>
                    <Link to="/settings" style={linkStyle('/settings')}>
                        <Settings size={20} />
                        <span>Configurações</span>
                    </Link>
                    <button onClick={handleLogout} style={{
                        ...linkStyle('logout'),
                        width: '100%',
                        background: 'transparent',
                        border: 'none',
                        color: '#ef4444',
                        marginTop: '0.5rem'
                    }}>
                        <LogOut size={20} />
                        <span>Sair</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, padding: '2vh', overflow: 'auto' }}>
                <Outlet />
            </main>
        </div>
    );
}
