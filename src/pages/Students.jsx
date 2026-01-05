import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Plus, User, Calendar, CreditCard, Filter, Trash2, MessageCircle } from 'lucide-react';
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
    const [sortBy, setSortBy] = useState('name'); // 'name' or 'recent'

    const filteredStudents = students.filter(student => {
        const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.email?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = filterStatus === 'All'
            ? true
            : student.status === filterStatus;

        return matchesSearch && matchesStatus;
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
                navigate('/settings');
            }
            return;
        }

        window.open(`https://wa.me/55${phone.replace(/\D/g, '')}`, '_blank');
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
                }
            `}</style>

            <div className="students-header">
                <div>
                    <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Alunos</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Gerencie os membros da sua academia</p>
                </div>
                <Link to="/students/new" style={{
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

            <div className="glass-panel" style={{ padding: '1rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
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

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '0.5rem', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
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

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Ordenar:</span>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        style={{
                            background: 'var(--input-bg)',
                            color: 'var(--text-main)',
                            border: '1px solid var(--border-glass)',
                            padding: '0.5rem',
                            borderRadius: '8px',
                            outline: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="name">A-Z</option>
                        <option value="recent">Mais Recentes</option>
                    </select>
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
                    {filteredStudents.map(student => (
                        <div key={student.id} style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                            <Link to={`/students/${student.id}`} style={{ textDecoration: 'none', transition: 'transform 0.2s', display: 'block' }}>
                                <div style={{ transform: 'scale(0.9)', transformOrigin: 'top center' }}>
                                    <StudentCard student={student} settings={settings} />
                                </div>
                            </Link>


                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
