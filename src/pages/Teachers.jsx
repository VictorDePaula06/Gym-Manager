import { useState } from 'react';
import { useGym } from '../context/GymContext';
import { Users, Plus, Edit2, Trash2, Search, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useDialog } from '../context/DialogContext';
import TeacherCard from '../components/TeacherCard';

export default function Teachers() {
    const { teachers, deleteTeacher } = useGym();
    const { addToast } = useToast();
    const { confirm } = useDialog();
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    const filteredTeachers = (teachers || []).filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.specialty && t.specialty.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleEdit = (teacher) => {
        navigate(`/app/teachers/edit/${teacher.id}`);
    };

    const handleDelete = async (id) => {
        const confirmed = await confirm({
            title: 'Excluir Professor',
            message: 'Tem certeza que deseja excluir este professor?',
            confirmText: 'Excluir',
            type: 'danger'
        });

        if (confirmed) {
            await deleteTeacher(id);
            addToast('Professor excluído com sucesso.', 'success');
        }
    };

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1>Professores</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Gerencie a equipe da academia</p>
                </div>
                <Link to="/app/teachers/new" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                    <Plus size={20} /> Novo Professor
                </Link>
            </div>

            {/* Search Bar */}
            <div className="glass-panel" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', maxWidth: '500px' }}>
                <Search size={20} className="text-muted" />
                <input
                    type="text"
                    placeholder="Buscar por nome ou especialidade..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', width: '100%', outline: 'none' }}
                />
            </div>

            {/* Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
                {filteredTeachers.map(teacher => (
                    <TeacherCard
                        key={teacher.id}
                        teacher={teacher}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                ))}
            </div>

            {filteredTeachers.length === 0 && (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                    Nenhum professor encontrado.
                </div>
            )}
        </div>
    );
}
