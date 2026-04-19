import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Plus, User, Calendar, CreditCard, Filter, Trash2, MessageCircle, LayoutGrid, List, MoreVertical, ExternalLink } from 'lucide-react';
import { useGym } from '../context/GymContext';
import { useToast } from '../context/ToastContext';
import { useDialog } from '../context/DialogContext';
import StudentCard from '../components/StudentCard';

export default function Students() {
    const { students, deleteStudent, settings } = useGym();
    const { addToast } = useToast();
    const { confirm } = useDialog();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('Active'); // All, Active, Pending, Inactive
    const [filterPlan, setFilterPlan] = useState('All'); // All, Mensal, Trimestral, Semestral, Anual
    const [sortBy, setSortBy] = useState('name'); // 'name' or 'recent'
    const [viewType, setViewType] = useState(() => {
        return localStorage.getItem('student_view_type') || 'grid';
    });

    // Helpers
    const getPlanType = (planName) => {
        const lowerPlan = (planName || '').toLowerCase();
        if (lowerPlan.includes('semiannual') || lowerPlan.includes('semestral')) return 'Semestral';
        if (lowerPlan.includes('annual') || lowerPlan.includes('anual')) return 'Anual';
        if (lowerPlan.includes('quarterly') || lowerPlan.includes('trimestral')) return 'Trimestral';
        return 'Mensal'; // Default
    };

    const filteredStudents = students.filter(student => {
        const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.email?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = filterStatus === 'All'
            ? true
            : student.status === filterStatus;

        const matchesPlan = filterPlan === 'All'
            ? true
            : getPlanType(student.plan) === filterPlan;

        return matchesSearch && matchesStatus && matchesPlan;
    }).sort((a, b) => {
        if (sortBy === 'name') {
            return a.name.localeCompare(b.name);
        } else {
            // Sort by createdAt or startDate (newest first).
            const dateA = a.createdAt || a.startDate || '';
            const dateB = b.createdAt || b.startDate || '';

            if (!dateA && !dateB) return a.name.localeCompare(b.name);
            if (!dateA) return 1;
            if (!dateB) return -1;

            // Reverse order for "Most Recent"
            return dateB.localeCompare(dateA);
        }
    });

    const statusMap = {
        'All': 'Todos',
        'Active': 'Ativos',
        'Pending': 'Pendentes',
        'Inactive': 'Inativos'
    };

    const planMap = {
        'All': 'Todos os Planos',
        'Mensal': 'Mensal',
        'Trimestral': 'Trimestral',
        'Semestral': 'Semestral',
        'Anual': 'Anual'
    };

    const handleDelete = async (e, id, name) => {
        e.preventDefault(); // Prevent navigation
        const confirmed = await confirm({
            title: 'Excluir Aluno',
            message: `Tem certeza que deseja excluir o aluno ${name}? Todos os dados serão perdidos.`,
            confirmText: 'Excluir',
            type: 'danger'
        });

        if (confirmed) {
            try {
                await deleteStudent(id);
                addToast('Aluno excluído com sucesso.', 'success');
            } catch (error) {
                addToast('Erro ao excluir aluno.', 'error');
            }
        }
    };

    const navigate = useNavigate();

    const handleWhatsAppClick = async (e, phone) => {
        e.preventDefault();
        e.stopPropagation();

        if (!settings?.whatsapp) {
            const confirmed = await confirm({
                title: 'WhatsApp não configurado',
                message: 'Para entrar em contato com alunos, você precisa primeiro cadastrar o seu número de WhatsApp nas configurações.',
                confirmText: 'Ir para Configurações',
                cancelText: 'Cancelar',
                type: 'info'
            });

            if (confirmed) {
                navigate('/app/settings');
            }
            return;
        }

        window.open(`https://wa.me/55${phone.replace(/\D/g, '')}`, '_blank');
    };

    const handleToggleView = (type) => {
        setViewType(type);
        localStorage.setItem('student_view_type', type);
    };

    return (
        <div style={{ paddingBottom: '4rem' }}>
            <style>{`
                .students-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                }

                @media (max-width: 768px) {
                    .students-header {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 1rem;
                    }
                    .students-header > a {
                        width: 100%;
                        justify-content: center;
                    }
                    .show-mobile-only {
                        display: flex !important;
                    }
                    .hide-mobile {
                        display: none !important;
                    }
                }

                .student-table {
                    width: 100%;
                    border-collapse: separate;
                    border-spacing: 0 0.5rem;
                }
                .student-table th {
                    padding: 1rem;
                    text-align: left;
                    color: var(--text-muted);
                    font-weight: 500;
                    font-size: 0.9rem;
                    border-bottom: 1px solid var(--border-glass);
                }
                .student-table td {
                    padding: 1rem;
                    background: var(--card-bg);
                    border-top: 1px solid var(--border-glass);
                    border-bottom: 1px solid var(--border-glass);
                }
                .student-table tr td:first-child {
                    border-left: 1px solid var(--border-glass);
                    border-top-left-radius: 12px;
                    border-bottom-left-radius: 12px;
                }
                .student-table tr td:last-child {
                    border-right: 1px solid var(--border-glass);
                    border-top-right-radius: 12px;
                    border-bottom-right-radius: 12px;
                }
                .student-table tr:hover td {
                    background: rgba(255, 255, 255, 0.03);
                    border-color: var(--primary-glow);
                }
                
                @media (max-width: 1024px) {
                    .hide-tablet { display: none; }
                }

                @media (max-width: 768px) {
                    .student-table td {
                        padding: 0.75rem 0.5rem !important;
                    }
                    .student-table th:first-child, .student-table td:first-child {
                        width: 75% !important;
                    }
                    .student-table th:last-child, .student-table td:last-child {
                        width: 25% !important;
                    }
                    
                    /* Hide scrollbars but keep functionality */
                    .hide-scrollbar {
                        scrollbar-width: none;
                        -ms-overflow-style: none;
                    }
                    .hide-scrollbar::-webkit-scrollbar {
                        display: none;
                    }
                }
            `}</style>

            <div className="students-header">
                <div>
                    <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Alunos</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Gerencie os membros da sua academia</p>
                </div>
                <Link to="/app/students/new" style={{
                    background: 'var(--primary)',
                    color: 'white',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontWeight: '600',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
                    textDecoration: 'none'
                }}>
                    <Plus size={20} />
                    Novo Aluno
                </Link>
            </div>

            <div className="glass-panel" style={{ padding: '1rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', width: '100%' }}>
                <Search size={20} style={{ color: 'var(--text-muted)' }} />
                <input
                    type="text"
                    placeholder="Buscar aluno por nome ou e-mail..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-main)',
                        fontSize: '1rem',
                        width: '100%',
                        outline: 'none'
                    }}
                />
            </div>

            {/* Filters Row */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>

                {/* Status Filters */}
                <div className="hide-scrollbar" style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                    {['All', 'Active', 'Pending', 'Inactive'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            style={{
                                background: filterStatus === status ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                color: filterStatus === status ? 'white' : 'var(--text-muted)',
                                border: `1px solid ${filterStatus === status ? 'var(--primary)' : 'var(--border-glass)'}`,
                                padding: '0.5rem 1.25rem',
                                borderRadius: '20px',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                fontWeight: '500',
                                transition: 'all 0.2s',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {statusMap[status]}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>

                    {/* Plan Filters */}
                    <div className="hide-scrollbar" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', overflowX: 'auto' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>Plano:</span>
                        {['All', 'Mensal', 'Trimestral', 'Semestral', 'Anual'].map(plan => (
                            <button
                                key={plan}
                                onClick={() => setFilterPlan(plan)}
                                style={{
                                    background: filterPlan === plan ? 'var(--input-bg)' : 'transparent',
                                    color: filterPlan === plan ? 'var(--primary)' : 'var(--text-muted)',
                                    border: `1px solid ${filterPlan === plan ? 'var(--primary)' : 'var(--border-glass)'}`,
                                    padding: '0.4rem 1rem',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    fontWeight: filterPlan === plan ? '600' : '500',
                                    transition: 'all 0.2s',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {planMap[plan]}
                            </button>
                        ))}
                    </div>

                    {/* Sort & View Toggle */}
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        
                        {/* View Toggle */}
                        <div style={{ 
                            display: 'flex', 
                            background: 'var(--input-bg)', 
                            padding: '0.25rem', 
                            borderRadius: '10px',
                            border: '1px solid var(--border-glass)'
                        }}>
                            <button 
                                onClick={() => handleToggleView('grid')}
                                style={{
                                    padding: '0.5rem',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: viewType === 'grid' ? 'var(--primary)' : 'transparent',
                                    color: viewType === 'grid' ? 'white' : 'var(--text-muted)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <LayoutGrid size={18} />
                            </button>
                            <button 
                                onClick={() => handleToggleView('list')}
                                style={{
                                    padding: '0.5rem',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: viewType === 'list' ? 'var(--primary)' : 'transparent',
                                    color: viewType === 'list' ? 'white' : 'var(--text-muted)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <List size={18} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }} className="hide-tablet">Ordenar:</span>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                style={{
                                    background: 'var(--input-bg)',
                                    color: 'var(--text-main)',
                                    border: '1px solid var(--border-glass)',
                                    padding: '0.4rem 0.8rem',
                                    borderRadius: '8px',
                                    outline: 'none',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem'
                                }}
                            >
                                <option value="name">A-Z</option>
                                <option value="recent">Mais Recentes</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {filteredStudents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                    <div style={{
                        background: 'rgba(255,255,255,0.05)',
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem auto'
                    }}>
                        <User size={32} style={{ opacity: 0.5 }} />
                    </div>
                    <p style={{ fontSize: '1.1rem' }}>Nenhum aluno encontrado nesta categoria.</p>
                </div>
            ) : (
                viewType === 'grid' ? (
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                        gap: '1.5rem',
                        width: '100%'
                    }}>
                        {filteredStudents.map(student => (
                            <Link 
                                key={student.id} 
                                to={`/app/students/${student.id}`} 
                                style={{ textDecoration: 'none', display: 'flex', justifyContent: 'center' }}
                            >
                                <StudentCard student={student} settings={settings} />
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div style={{ width: '100%', overflowX: 'auto' }}>
                        <table className="student-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '30%' }}>Aluno</th>
                                    <th className="hide-tablet" style={{ width: '20%' }}>Email</th>
                                    <th className="hide-mobile" style={{ width: '10%' }}>Status</th>
                                    <th className="hide-tablet" style={{ width: '10%' }}>Plano</th>
                                    <th className="hide-tablet" style={{ width: '10%' }}>Vencimento</th>
                                    <th className="hide-tablet" style={{ width: '10%' }}>Último Peso</th>
                                    <th className="hide-mobile" style={{ textAlign: 'right', width: '10%' }}>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStudents.map(student => (
                                    <tr key={student.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/app/students/${student.id}`)}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '10px',
                                                    background: 'var(--input-bg)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    overflow: 'hidden',
                                                    border: '1px solid var(--border-glass)'
                                                }}>
                                                    {student.profilePictureUrl ? (
                                                        <img src={student.profilePictureUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <User size={20} color="var(--text-muted)" />
                                                    )}
                                                </div>
                                                <span style={{ 
                                                    fontWeight: '600', 
                                                    fontSize: '0.9rem',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                }}>
                                                    {student.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="hide-tablet" style={{ color: 'var(--text-muted)' }}>{student.email || '-'}</td>
                                        <td className="hide-mobile">
                                            <span style={{
                                                padding: '4px 12px',
                                                borderRadius: '20px',
                                                fontSize: '0.75rem',
                                                fontWeight: 'bold',
                                                background: student.status === 'Active' ? 'rgba(16, 185, 129, 0.1)' : student.status === 'Pending' ? 'rgba(234, 179, 8, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                color: student.status === 'Active' ? '#10b981' : student.status === 'Pending' ? '#eab308' : '#ef4444',
                                                border: '1px solid currentColor'
                                            }}>
                                                {statusMap[student.status] || student.status}
                                            </span>
                                        </td>
                                        <td className="hide-tablet">
                                            <span style={{ color: 'var(--text-muted)' }}>
                                                {getPlanType(student.plan)}
                                            </span>
                                        </td>
                                        <td className="hide-tablet">
                                            <span style={{ 
                                                color: student.status === 'Pending' ? '#ef4444' : 'var(--text-muted)',
                                                fontWeight: student.status === 'Pending' ? 'bold' : 'normal'
                                            }}>
                                                {(() => {
                                                    if (!student.nextPaymentDate) return '-';
                                                    const date = student.nextPaymentDate.seconds 
                                                        ? new Date(student.nextPaymentDate.seconds * 1000) 
                                                        : new Date(student.nextPaymentDate);
                                                    return date.toLocaleDateString('pt-BR');
                                                })()}
                                            </span>
                                        </td>
                                        <td className="hide-tablet">
                                            <span style={{ color: 'var(--text-muted)' }}>
                                                {student.weight ? `${student.weight} kg` : '-'}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }} onClick={e => e.stopPropagation()}>
                                                {student.phone && (
                                                    <button 
                                                        onClick={(e) => handleWhatsAppClick(e, student.phone)}
                                                        style={{ background: 'transparent', border: 'none', color: '#25D366', cursor: 'pointer', padding: '0.5rem', display: 'flex' }}
                                                    >
                                                        <MessageCircle size={22} />
                                                    </button>
                                                )}
                                                
                                                <button 
                                                    className="hide-mobile"
                                                    onClick={(e) => handleDelete(e, student.id, student.name)}
                                                    style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem', display: 'flex' }}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                                
                                                <Link 
                                                    to={`/app/students/${student.id}`}
                                                    className="hide-mobile"
                                                    style={{ color: 'var(--text-muted)', padding: '0.5rem', display: 'flex' }}
                                                >
                                                    <ExternalLink size={18} />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )
            )}
        </div>
    )
}
