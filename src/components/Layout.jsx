import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
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
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', position: 'relative' }}>

            {/* Mobile Header */}
            <div style={{
                display: sidebarOpen ? 'none' : 'none', /* Javascript toggle will handle this via class or separate logic, but let's stick to CSS media query control mainly. Actually, let's use the state */
                /* WAIT, inline style 'display' is overridden by the !important in the style tag below. I need to change that style tag first. */
            }} className="mobile-header">
                {/* ... content ... */}
            </div>

            {/* Let's REWRITE the whole block to be clean */}

            {/* Mobile Header - only visible when sidebar is CLOSED */}
            {!sidebarOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0,
                    height: '60px',
                    background: 'var(--background)',
                    zIndex: 40,
                    alignItems: 'center',
                    padding: '0 1rem',
                    borderBottom: '1px solid var(--border-glass)',
                    display: 'none' // Default hidden on desktop
                }} className="mobile-header">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="3" y1="12" x2="21" y2="12"></line>
                            <line x1="3" y1="6" x2="21" y2="6"></line>
                            <line x1="3" y1="18" x2="21" y2="18"></line>
                        </svg>
                    </button>
                    <span style={{ marginLeft: '1rem', fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--primary)' }}>
                        {settings?.gymName || 'GymManager'}
                    </span>
                </div>
            )}

            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="mobile-overlay"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`glass-panel desktop-sidebar ${sidebarOpen ? 'open' : ''}`}
                style={{
                    width: '280px',
                    height: '96vh',
                    margin: '2vh 0 2vh 2vh',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: '24px',
                    position: 'relative' // Ensure absolute children are reliable
                }}
            >
                {/* Close Button Mobile - Moved to top level */}
                <button
                    onClick={() => setSidebarOpen(false)}
                    className="mobile-close-btn"
                    style={{
                        position: 'absolute',
                        top: '15px',
                        right: '15px',
                        background: 'rgba(0,0,0,0.2)', // Slight background to indicate clickable area
                        border: '1px solid var(--border-glass)',
                        borderRadius: '50%',
                        color: 'var(--text-main)',
                        display: 'none', // Controlled by CSS class now
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        width: '40px',
                        height: '40px',
                        zIndex: 100,
                        backdropFilter: 'blur(4px)'
                    }}
                >
                    ✕
                </button>

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
                    <Link to="/" style={linkStyle('/')} onClick={() => setSidebarOpen(false)}>
                        <LayoutDashboard size={20} />
                        <span>Visão Geral</span>
                    </Link>
                    <Link to="/students" style={linkStyle('/students')} onClick={() => setSidebarOpen(false)}>
                        <Users size={20} />
                        <span>Alunos</span>
                    </Link>
                    <Link to="/teachers" style={linkStyle('/teachers')} onClick={() => setSidebarOpen(false)}>
                        <Briefcase size={20} />
                        <span>Professores</span>
                    </Link>
                    <Link to="/financial" style={linkStyle('/financial')} onClick={() => setSidebarOpen(false)}>
                        <CreditCard size={20} />
                        <span>Financeiro</span>
                    </Link>
                    <Link to="/workouts" style={linkStyle('/workouts')} onClick={() => setSidebarOpen(false)}>
                        <Dumbbell size={20} />
                        <span>Treinos</span>
                    </Link>
                    <Link to="/reports" style={linkStyle('/reports')} onClick={() => setSidebarOpen(false)}>
                        <PieChart size={20} />
                        <span>Relatórios</span>
                    </Link>
                </nav>

                <div style={{ padding: '1rem' }}>
                    <Link to="/settings" style={linkStyle('/settings')} onClick={() => setSidebarOpen(false)}>
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
            <main className="main-content" style={{ flex: 1, padding: '2vh', overflow: 'auto', width: '100%' }}>
                <style>{`
                    .mobile-close-btn { display: none; }
                    
                    @media (max-width: 768px) {
                        .mobile-header { display: flex !important; }
                        
                        .desktop-sidebar { 
                            position: fixed !important;
                            top: 0 !important;
                            left: -100%;
                            width: 100% !important; 
                            height: 100vh !important;
                            margin: 0 !important;
                            border-radius: 0 !important;
                            background: var(--background) !important;
                            z-index: 50;
                            overflow-y: auto; /* Allow scrolling if content is too tall */
                            padding-bottom: calc(20px + env(safe-area-inset-bottom)); /* Safe area for iOS */
                        }
                        
                        .desktop-sidebar.open {
                            left: 0 !important;
                        }

                        .mobile-close-btn {
                            display: flex !important;
                        }
                        
                        .main-content {
                            padding-top: 80px !important; /* Push content below header */
                        }
                    }
                `}</style>
                <Outlet />
            </main>
        </div>
    );
}
