import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGym } from '../context/GymContext';
import { useToast } from '../context/ToastContext';
import { useDialog } from '../context/DialogContext';
import { ChevronLeft, User, DollarSign, Calendar, Trash2, Plus, ArrowRight } from 'lucide-react';
import StudentCard from '../components/StudentCard';

export default function TeacherDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { teachers, students, teacherPayments, addTeacherPayment, deleteTeacherPayment, addExpense, settings } = useGym();
    const { addToast } = useToast();
    const { confirm } = useDialog();

    const [teacher, setTeacher] = useState(null);
    const [linkedStudents, setLinkedStudents] = useState([]);
    const [activeTab, setActiveTab] = useState('overview'); // overview, students, payments

    // Payment Form State
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [paymentReference, setPaymentReference] = useState(''); // e.g., 'Referente a Janeiro'

    useEffect(() => {
        if (id && teachers.length > 0) {
            const foundTeacher = teachers.find(t => t.id === id);
            setTeacher(foundTeacher);

            if (foundTeacher) {
                // Find students linked to this teacher
                // Assuming student.teacherId is the link
                const linked = students.filter(s => s.teacherId === id && s.status === 'Active');
                setLinkedStudents(linked);
            }
        }
    }, [id, teachers, students]);

    const calculateEstimatedCommission = () => {
        if (!teacher || !linkedStudents.length) return 0;

        let total = 0;
        const commissionValue = parseFloat(teacher.commissionValue) || 0;

        if (teacher.commissionType === 'Fixed') {
            total = linkedStudents.length * commissionValue;
        } else {
            // Percentage
            // We need to sum up the price of all students plans
            // Note: student.price is stored as string often, need to handle that
            const totalRevenue = linkedStudents.reduce((acc, student) => {
                const price = parseFloat(student.price) || 0;
                return acc + price;
            }, 0);
            total = totalRevenue * (commissionValue / 100);
        }
        return total;
    };

    const handleRegisterPayment = async (e) => {
        e.preventDefault();
        try {
            await addTeacherPayment({
                teacherId: id,
                amount: parseFloat(paymentAmount),
                date: paymentDate,
                reference: paymentReference,
                createdAt: new Date().toISOString()
            });

            // Automatically register as Expense
            await addExpense({
                description: `Pagamento Professor - ${teacher.name} ${paymentReference ? `(${paymentReference})` : ''}`,
                category: 'Pessoal',
                value: parseFloat(paymentAmount),
                date: paymentDate,
                createdAt: new Date().toISOString()
            });

            setShowPaymentForm(false);
            setPaymentAmount('');
            setPaymentReference('');
            addToast('Pagamento registrado e despesa lançada com sucesso!', 'success');
        } catch (error) {
            addToast('Erro ao registrar pagamento.', 'error');
        }
    };

    const handleDeletePayment = async (paymentId) => {
        const confirmed = await confirm({
            title: 'Excluir Pagamento',
            message: 'Tem certeza que deseja excluir este pagamento? Esta ação não pode ser desfeita.',
            confirmText: 'Excluir',
            type: 'danger'
        });

        if (confirmed) {
            await deleteTeacherPayment(paymentId);
            addToast('Pagamento excluído com sucesso.', 'success');
        }
    };

    if (!teacher) return <div className="fade-in" style={{ padding: '2rem' }}>Carregando...</div>;

    const teacherHistory = (teacherPayments || [])
        .filter(p => p.teacherId === id)
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    return (
        <div className="fade-in" style={{ paddingBottom: '4rem' }}>
            <button onClick={() => navigate('/app/teachers')} style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                color: 'var(--text-muted)', marginBottom: '1.5rem',
                background: 'transparent', border: 'none', cursor: 'pointer'
            }}>
                <ChevronLeft size={20} /> Voltar para Professores
            </button>

            {/* Header Card */}
            <style>
                {`
                    .teacher-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        gap: 2rem;
                        flex-wrap: wrap;
                    }
                    .teacher-profile {
                        display: flex;
                        gap: 1.5rem;
                        align-items: center;
                    }
                    .teacher-stats {
                        text-align: right;
                    }
                    @media (max-width: 768px) {
                        .teacher-header {
                            flex-direction: column;
                            gap: 1.5rem;
                        }
                        .teacher-profile {
                            flex-direction: column;
                            align-items: flex-start;
                            gap: 1rem;
                        }
                        .teacher-stats {
                            text-align: left;
                            width: 100%;
                            border-top: 1px solid var(--border-glass);
                            padding-top: 1rem;
                        }
                    }
                `}
            </style>
            <div className="glass-panel teacher-header" style={{ padding: '2rem', marginBottom: '2rem' }}>
                <div className="teacher-profile">
                    <div style={{
                        width: '80px', height: '80px', borderRadius: '50%',
                        background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '2rem', fontWeight: 'bold', color: 'white', flexShrink: 0
                    }}>
                        {teacher.name.charAt(0)}
                    </div>
                    <div>
                        <h1 style={{ marginBottom: '0.5rem', lineHeight: '1.2' }}>{teacher.name}</h1>
                        <p style={{ color: 'var(--text-muted)' }}>{teacher.specialty || 'Instrutor'}</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                            <span>{teacher.phone || 'Sem telefone'}</span>
                            <span className="hide-mobile">•</span>
                            <div className="hide-desktop" style={{ width: '100%', height: '0' }}></div>
                            <span>{teacher.email || 'Sem e-mail'}</span>
                        </div>
                    </div>
                </div>

                <div className="teacher-stats">
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Comissão Configurada</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                        {teacher.commissionType === 'Fixed'
                            ? `R$ ${teacher.commissionValue} / aluno`
                            : `${teacher.commissionValue}%`}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        {linkedStudents.length} alunos ativos vinculados
                    </div>
                    {teacher.commissionValue && (
                        <div style={{ marginTop: '0.5rem', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', display: 'inline-block' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Estimativa Mensal: </span>
                            <span style={{ fontWeight: 'bold', color: '#10b981' }}>
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculateEstimatedCommission())}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>
                {['overview', 'students', 'payments'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: 'transparent',
                            border: 'none',
                            borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
                            color: activeTab === tab ? 'var(--primary)' : 'var(--text-muted)',
                            fontWeight: '600',
                            cursor: 'pointer',
                            textTransform: 'capitalize'
                        }}
                    >
                        {tab === 'overview' ? 'Visão Geral' : tab === 'students' ? 'Alunos Vinculados' : 'Pagamentos'}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
                <div className="fade-in">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                        <div className="glass-panel" style={{ padding: '1.5rem' }}>
                            <h3>Resumo Financeiro</h3>
                            <div style={{ marginTop: '1.5rem' }}>
                                <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Total Pago (Histórico)</p>
                                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                                        teacherHistory.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0)
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'students' && (
                <div className="fade-in">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3>Alunos Ativos ({linkedStudents.length})</h3>
                    </div>

                    {linkedStudents.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)' }}>Nenhum aluno ativo vinculado a este professor.</p>
                    ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'center', width: '100%' }}>
                            {linkedStudents.map(student => (
                                <div key={student.id} style={{ display: 'flex', justifyContent: 'center' }}>
                                    <StudentCard student={student} settings={settings} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'payments' && (
                <div className="fade-in">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3>Histórico de Pagamentos</h3>
                        <button
                            onClick={() => setShowPaymentForm(true)}
                            className="btn-primary"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <Plus size={18} /> Registrar Pagamento
                        </button>
                    </div>

                    {showPaymentForm && (
                        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', border: '1px solid var(--primary)' }}>
                            <h4 style={{ marginBottom: '1rem' }}>Novo Pagamento</h4>
                            <form onSubmit={handleRegisterPayment} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Valor (R$)</label>
                                    <input
                                        type="number" step="0.01" required
                                        value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)}
                                        style={{ width: '100%', padding: '0.5rem', background: 'var(--input-bg)', border: '1px solid var(--border-glass)', borderRadius: '6px', color: 'var(--text-main)' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Data</label>
                                    <input
                                        type="date" required
                                        value={paymentDate} onChange={e => setPaymentDate(e.target.value)}
                                        style={{ width: '100%', padding: '0.5rem', background: 'var(--input-bg)', border: '1px solid var(--border-glass)', borderRadius: '6px', color: 'var(--text-main)' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Referência</label>
                                    <input
                                        type="text" placeholder="ex: Comissão Janeiro"
                                        value={paymentReference} onChange={e => setPaymentReference(e.target.value)}
                                        style={{ width: '100%', padding: '0.5rem', background: 'var(--input-bg)', border: '1px solid var(--border-glass)', borderRadius: '6px', color: 'var(--text-main)' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button type="button" onClick={() => setShowPaymentForm(false)} style={{ padding: '0.6rem 1rem', background: 'transparent', border: '1px solid var(--border-glass)', color: 'var(--text-muted)', borderRadius: '6px', cursor: 'pointer' }}>Cancelar</button>
                                    <button type="submit" className="btn-primary" style={{ padding: '0.6rem 1.5rem' }}>Salvar</button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                                <thead style={{ background: 'rgba(255,255,255,0.05)' }}>
                                    <tr>
                                        <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Data</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Referência</th>
                                        <th style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Valor</th>
                                        <th style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {teacherHistory.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Nenhum pagamento registrado.</td>
                                        </tr>
                                    ) : (
                                        teacherHistory.map(payment => (
                                            <tr key={payment.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                                                <td style={{ padding: '1rem' }}>{new Date(payment.date).toLocaleDateString('pt-BR')}</td>
                                                <td style={{ padding: '1rem' }}>{payment.reference || '-'}</td>
                                                <td style={{ padding: '1rem', textAlign: 'right', color: '#10b981', fontWeight: 'bold' }}>
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payment.amount)}
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                    <button
                                                        onClick={() => handleDeletePayment(payment.id)}
                                                        style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                                        title="Excluir"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
