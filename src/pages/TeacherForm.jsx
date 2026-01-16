import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGym } from '../context/GymContext';
import { useToast } from '../context/ToastContext';
import { Save, ChevronLeft, User, Briefcase, Mail, Phone, Calendar, DollarSign } from 'lucide-react';

export default function TeacherForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { teachers, addTeacher, updateTeacher } = useGym();
    const { addToast } = useToast();

    const [formData, setFormData] = useState({
        name: '',
        cpf: '',
        specialty: '',
        phone: '',
        email: '',
        admissionDate: new Date().toISOString().split('T')[0],
        status: 'Active',
        commissionType: 'Percentage', // 'Percentage' or 'Fixed'
        commissionValue: ''
    });

    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (id) {
            const teacher = teachers.find(t => t.id === id);
            if (teacher) {
                setFormData(teacher);
            }
        }
    }, [id, teachers]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (id) {
                await updateTeacher(id, formData);
                addToast('Professor atualizado com sucesso!', 'success');
            } else {
                await addTeacher({ ...formData, createdAt: new Date().toISOString() });
                addToast('Professor cadastrado com sucesso!', 'success');
            }
            navigate('/app/teachers');
        } catch (error) {
            addToast('Erro ao salvar professor. Tente novamente.', 'error');
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    const sectionTitleStyle = {
        fontSize: '1.1rem',
        fontWeight: '600',
        marginBottom: '1rem',
        marginTop: '2rem',
        color: 'var(--primary)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
    };

    const inputStyle = {
        width: '100%',
        padding: '0.75rem',
        background: 'var(--input-bg)',
        border: '1px solid var(--border-glass)',
        borderRadius: '8px',
        color: 'var(--text-main)',
        marginTop: '0.4rem',
        outline: 'none',
        fontSize: '0.95rem'
    };

    const labelStyle = {
        display: 'block',
        fontSize: '0.85rem',
        color: 'var(--text-muted)',
        fontWeight: '500'
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '4rem' }}>
            <button onClick={() => navigate(-1)} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: 'var(--text-muted)',
                marginBottom: '2rem',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer'
            }}>
                <ChevronLeft size={20} /> Voltar
            </button>

            <div className="glass-panel" style={{ padding: '2.5rem' }}>
                <div style={{ marginBottom: '2rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1rem' }}>
                    <h1 style={{ fontSize: '1.8rem' }}>{id ? 'Editar Professor' : 'Cadastrar Professor'}</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Preencha as informações do instrutor.</p>
                </div>

                <form onSubmit={handleSubmit}>

                    {/* Personal Information */}
                    <div style={sectionTitleStyle}>
                        <User size={18} /> Informações Pessoais
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                        <div>
                            <label style={labelStyle}>Nome Completo</label>
                            <input
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                style={inputStyle}
                                placeholder="ex: Carlos Silva"
                            />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div>
                                <label style={labelStyle}>CPF</label>
                                <input
                                    name="cpf"
                                    value={formData.cpf}
                                    onChange={handleChange}
                                    style={inputStyle}
                                    placeholder="000.000.000-00"
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Data de Admissão</label>
                                <input
                                    name="admissionDate"
                                    type="date"
                                    value={formData.admissionDate}
                                    onChange={handleChange}
                                    style={inputStyle}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Professional Info */}
                    <div style={sectionTitleStyle}>
                        <Briefcase size={18} /> Dados Profissionais
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={labelStyle}>Especialidade</label>
                            <input
                                name="specialty"
                                value={formData.specialty}
                                onChange={handleChange}
                                style={inputStyle}
                                placeholder="ex: Musculação, Pilates, CrossFit"
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Telefone</label>
                            <input
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                style={inputStyle}
                                placeholder="(11) 99999-9999"
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>E-mail</label>
                            <input
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                style={inputStyle}
                                placeholder="professor@exemplo.com"
                            />
                        </div>
                    </div>

                    {/* Commission Info */}
                    <div style={sectionTitleStyle}>
                        <DollarSign size={18} /> Comissão
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div>
                            <label style={labelStyle}>Tipo de Comissão</label>
                            <select
                                name="commissionType"
                                value={formData.commissionType || 'Percentage'}
                                onChange={handleChange}
                                style={inputStyle}
                            >
                                <option value="Percentage">Porcentagem (%)</option>
                                <option value="Fixed">Valor Fixo por Aluno (R$)</option>
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Valor da Comissão</label>
                            <input
                                name="commissionValue"
                                type="number"
                                step="0.01"
                                value={formData.commissionValue || ''}
                                onChange={handleChange}
                                style={inputStyle}
                                placeholder={formData.commissionType === 'Fixed' ? 'ex: 50.00' : 'ex: 10'}
                            />
                        </div>
                    </div>

                    <div style={{ marginTop: '1.5rem' }}>
                        <label style={labelStyle}>Status</label>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                            {['Active', 'Inactive'].map(s => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, status: s })}
                                    style={{
                                        padding: '0.5rem 1.5rem',
                                        borderRadius: '20px',
                                        border: `1px solid ${formData.status === s ? 'var(--primary)' : 'var(--border-glass)'}`,
                                        background: formData.status === s ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                                        color: formData.status === s ? 'var(--primary)' : 'var(--text-muted)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {s === 'Active' ? 'Ativo' : 'Inativo'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'flex-end' }}>
                        <button type="submit" disabled={saving} style={{
                            background: saving ? 'var(--text-muted)' : 'var(--primary)',
                            color: 'white',
                            padding: '1rem 3rem',
                            borderRadius: '12px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            border: 'none',
                            cursor: saving ? 'not-allowed' : 'pointer',
                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
                            fontSize: '1rem',
                            opacity: saving ? 0.7 : 1
                        }}>
                            <Save size={20} />
                            {saving ? 'Salvando...' : 'Salvar Professor'}
                        </button>
                    </div>
                </form>
            </div >
        </div >
    );
}
