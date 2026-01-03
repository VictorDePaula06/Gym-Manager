import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGym } from '../context/GymContext';
import { useToast } from '../context/ToastContext';
import { Save, ChevronLeft, User, CreditCard, MapPin, Activity } from 'lucide-react';

export default function StudentForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { students, addStudent, updateStudent, teachers } = useGym();
    const { addToast } = useToast();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        cpf: '',
        gender: '', // New field
        birthDate: '',
        weight: '',
        height: '',
        status: 'Active',
        plan: 'Monthly',
        paymentDay: '10',
        address: '',
        startDate: new Date().toISOString().split('T')[0],
        price: '',
        // Anamnesis
        routine: '',
        limitations: '', // Will treat as comma-separated string for compatibility
        diseases: '',    // Will treat as comma-separated string for compatibility
        trainingFrequency: '',
        objective: '',
        teacherId: '' // Optional link to a teacher
    });

    const ROUTINE_OPTIONS = [
        "Sedentário (Escritório)",
        "Moderado (Em pé/Andando)",
        "Intenso (Braçal)",
        "Estudante",
        "Outro"
    ];

    const LIMITATION_OPTIONS = [
        "Joelho",
        "Ombro",
        "Coluna Lombar",
        "Coluna Cervical",
        "Punho",
        "Tornozelo",
        "Quadril",
        "Nenhuma"
    ];

    const DISEASE_OPTIONS = [
        "Hipertensão",
        "Diabetes",
        "Asma/Bronquite",
        "Cardiopatia",
        "Labirintite",
        "Hérnia de Disco",
        "Nenhuma"
    ];

    const [age, setAge] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (id) {
            const student = students.find(s => s.id === id);
            if (student) {
                setFormData(student);
                if (student.birthDate) calculateAge(student.birthDate);
            }
        }
    }, [id, students]);

    const calculateAge = (dateString) => {
        if (!dateString) {
            setAge('');
            return;
        }
        const today = new Date();
        const birthDate = new Date(dateString);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        setAge(age);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (name === 'birthDate') {
            calculateAge(value);
        }
    };

    const toggleSelection = (field, value) => {
        setFormData(prev => {
            const current = prev[field] ? prev[field].split(', ') : [];
            let updated;

            if (value === 'Nenhuma' || value === 'Nenhum') {
                updated = current.includes(value) ? [] : [value];
            } else {
                // If selecting something else, remove 'Nenhuma' if present
                const cleanCurrent = current.filter(i => i !== 'Nenhuma' && i !== 'Nenhum');

                if (cleanCurrent.includes(value)) {
                    updated = cleanCurrent.filter(item => item !== value);
                } else {
                    updated = [...cleanCurrent, value];
                }
            }

            return {
                ...prev,
                [field]: updated.join(', ')
            };
        });
    };

    const setSingleSelection = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (id) {
                await updateStudent(id, formData);
                addToast('Aluno atualizado com sucesso!', 'success');
                navigate(`/students/${id}`);
            } else {
                await addStudent({
                    ...formData,
                    createdAt: new Date().toISOString() // Store creation time for sorting
                });
                addToast('Aluno cadastrado com sucesso!', 'success');
                navigate('/students');
            }
        } catch (error) {
            addToast('Erro ao salvar aluno. Tente novamente.', 'error');
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
                    <h1 style={{ fontSize: '1.8rem' }}>{id ? 'Editar Aluno' : 'Cadastrar Aluno'}</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Preencha as informações para gerenciar o acesso e planos.</p>
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
                                placeholder="ex: João da Silva"
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
                                    maxLength="14"
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Gênero</label>
                                <select name="gender" value={formData.gender} onChange={handleChange} style={inputStyle}>
                                    <option value="">Selecione...</option>
                                    <option value="Male">Masculino</option>
                                    <option value="Female">Feminino</option>
                                </select>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                            <div>
                                <label style={labelStyle}>Data de Nascimento {age !== '' && <span style={{ color: 'var(--primary)', marginLeft: '0.5rem' }}>({age} anos)</span>}</label>
                                <input
                                    name="birthDate"
                                    type="date"
                                    value={formData.birthDate}
                                    onChange={handleChange}
                                    style={inputStyle}
                                />
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
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
                                    placeholder="joao@exemplo.com"
                                />
                            </div>
                        </div>
                        <div>
                            <label style={labelStyle}>Endereço (Rua, Número, Bairro)</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    style={{ ...inputStyle, paddingLeft: '2.5rem' }}
                                    placeholder="Rua Exemplo, 123"
                                />
                                <MapPin size={18} style={{ position: 'absolute', left: '0.75rem', top: '55%', color: 'var(--text-muted)' }} />
                            </div>
                        </div>
                    </div>

                    {/* Anamnesis Information */}
                    <div style={sectionTitleStyle}>
                        <Activity size={18} /> Anamnese & Objetivos
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                        <div>
                            <label style={labelStyle}>Objetivo Principal</label>
                            <input
                                name="objective"
                                value={formData.objective || ''}
                                onChange={handleChange}
                                style={inputStyle}
                                placeholder="ex: Hipertrofia, Emagrecimento, Condicionamento..."
                            />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                            <div>
                                <label style={labelStyle}>Rotina / Trabalho</label>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                                    {ROUTINE_OPTIONS.map(opt => (
                                        <button
                                            key={opt}
                                            type="button"
                                            onClick={() => setSingleSelection('routine', opt)}
                                            style={{
                                                padding: '0.5rem 1rem',
                                                borderRadius: '20px',
                                                border: '1px solid var(--primary)',
                                                background: formData.routine === opt ? 'var(--primary)' : 'transparent',
                                                color: formData.routine === opt ? 'white' : 'var(--text-main)',
                                                cursor: 'pointer',
                                                fontSize: '0.85rem',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div>
                                    <label style={labelStyle}>Frequência Semanal Desejada</label>
                                    <input
                                        name="trainingFrequency"
                                        value={formData.trainingFrequency || ''}
                                        onChange={handleChange}
                                        style={inputStyle}
                                        placeholder="ex: 3x na semana"
                                    />
                                </div>
                                <div>
                                    {/* Spacer or another field if needed */}
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                            <div>
                                <label style={labelStyle}>Limitações Articulares</label>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                                    {LIMITATION_OPTIONS.map(opt => {
                                        const isSelected = formData.limitations && formData.limitations.split(', ').includes(opt);
                                        return (
                                            <button
                                                key={opt}
                                                type="button"
                                                onClick={() => toggleSelection('limitations', opt)}
                                                style={{
                                                    padding: '0.4rem 0.8rem',
                                                    borderRadius: '6px',
                                                    border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-glass)',
                                                    background: isSelected ? 'rgba(16, 185, 129, 0.2)' : 'var(--input-bg)',
                                                    color: isSelected ? 'var(--primary)' : 'var(--text-muted)',
                                                    cursor: 'pointer',
                                                    fontSize: '0.85rem'
                                                }}
                                            >
                                                {opt}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            <div>
                                <label style={labelStyle}>Histórico de Doenças / Lesões</label>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                                    {DISEASE_OPTIONS.map(opt => {
                                        const isSelected = formData.diseases && formData.diseases.split(', ').includes(opt);
                                        return (
                                            <button
                                                key={opt}
                                                type="button"
                                                onClick={() => toggleSelection('diseases', opt)}
                                                style={{
                                                    padding: '0.4rem 0.8rem',
                                                    borderRadius: '6px',
                                                    border: isSelected ? '1px solid #eab308' : '1px solid var(--border-glass)',
                                                    background: isSelected ? 'rgba(234, 179, 8, 0.2)' : 'var(--input-bg)',
                                                    color: isSelected ? '#eab308' : 'var(--text-muted)',
                                                    cursor: 'pointer',
                                                    fontSize: '0.85rem'
                                                }}
                                            >
                                                {opt}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Physical Information */}
                    <div style={sectionTitleStyle}>
                        <Activity size={18} /> Dados Físicos Iniciais
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div>
                            <label style={labelStyle}>Peso (kg)</label>
                            <input
                                name="weight"
                                type="number"
                                step="0.1"
                                value={formData.weight}
                                onChange={handleChange}
                                style={inputStyle}
                                placeholder="ex: 75.5"
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Altura (m)</label>
                            <input
                                name="height"
                                type="number"
                                step="0.01"
                                value={formData.height}
                                onChange={handleChange}
                                style={inputStyle}
                                placeholder="ex: 1.80"
                            />
                        </div>
                    </div>

                    {/* Plan & Financial */}
                    <div style={sectionTitleStyle}>
                        <CreditCard size={18} /> Plano e Financeiro
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div>
                            <label style={labelStyle}>Tipo de Plano</label>
                            <select name="plan" value={formData.plan} onChange={handleChange} style={inputStyle}>
                                <option value="Monthly">Mensal</option>
                                <option value="Quarterly">Trimestral</option>
                                <option value="Semiannual">Semestral</option>
                                <option value="Annual">Anual</option>
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Dia de Pagamento</label>
                            <select name="paymentDay" value={formData.paymentDay} onChange={handleChange} style={inputStyle}>
                                <option value="5">Dia 05</option>
                                <option value="10">Dia 10</option>
                                <option value="15">Dia 15</option>
                                <option value="20">Dia 20</option>
                                <option value="25">Dia 25</option>
                                <option value="30">Dia 30</option>
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Valor (R$)</label>
                            <input
                                name="price"
                                type="number"
                                step="0.01"
                                value={formData.price}
                                onChange={handleChange}
                                style={inputStyle}
                                placeholder="ex: 89.90"
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Data de Início</label>
                            <input
                                name="startDate"
                                type="date"
                                value={formData.startDate}
                                onChange={handleChange}
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Professor Responsável (Opcional)</label>
                            <select
                                name="teacherId"
                                value={formData.teacherId || ''}
                                onChange={handleChange}
                                style={inputStyle}
                            >
                                <option value="">Sem vínculo</option>
                                {(teachers || []).map(teacher => (
                                    <option key={teacher.id} value={teacher.id}>
                                        {teacher.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div style={{ marginTop: '1.5rem' }}>
                        <label style={labelStyle}>Status</label>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                            {['Active', 'Inactive', 'Pending'].map(s => (
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
                                    {s === 'Active' ? 'Ativo' : s === 'Inactive' ? 'Inativo' : 'Pendente'}
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
                            {saving ? 'Salvando...' : 'Salvar Informações'}
                        </button>
                    </div>
                </form>
            </div >
        </div >
    )
}
