import { useState, useEffect } from 'react';
import { useGym } from '../context/GymContext';
import { useToast } from '../context/ToastContext';
import { useDialog } from '../context/DialogContext';
import { DollarSign, CheckCircle, XCircle, AlertCircle, TrendingUp, TrendingDown, Plus, Trash2, Calendar, Clock, Info } from 'lucide-react';

export default function Financial() {
    const { students, expenses, addExpense, deleteExpense } = useGym();
    const { addToast } = useToast();
    const { confirm } = useDialog();
    const [filter, setFilter] = useState('all'); // all, paid, overdue
    const [activeTab, setActiveTab] = useState('income'); // income, expenses
    const [showExpenseForm, setShowExpenseForm] = useState(false);

    // Expense Form State
    const [newExpense, setNewExpense] = useState({
        description: '',
        category: 'Fixo',
        value: '',
        date: new Date().toISOString().split('T')[0]
    });

    const currentDate = new Date();
    const todayStr = new Date().toISOString().split('T')[0];
    const currentMonthIdx = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const currentMonthName = currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

    // --- Income Logic ---
    const safeStudents = Array.isArray(students) ? students : [];
    const studentsWithStatus = safeStudents.map(s => {
        try {
            if (!s) return null;

            const history = Array.isArray(s.paymentHistory) ? s.paymentHistory : [];
            let foundPaymentDate = null;
            const hasPaymentThisMonth = history.some(payment => {
                if (!payment) return false;
                let pDate = payment.date;
                if (!pDate) return false;

                try {
                    const parts = String(pDate).split('-');
                    if (parts.length !== 3) return false;
                    const [pYear, pMonth] = parts.map(Number);
                    const isMatch = pYear === currentYear && (pMonth - 1) === currentMonthIdx;
                    if (isMatch) foundPaymentDate = pDate;
                    return isMatch;
                } catch (err) {
                    return false;
                }
            });

            // Status is valid if paid this month OR if due date is in future
            const isUpToDate = hasPaymentThisMonth || (s.nextPaymentDate && new Date(s.nextPaymentDate) >= new Date().setHours(0, 0, 0, 0));

            return {
                ...s,
                currentMonthStatus: isUpToDate ? 'Paid' : 'Pending',
                lastPaymentDate: foundPaymentDate,
                displayPrice: parseFloat(s.price) || (s.plan === 'Premium' ? 120 : s.plan === 'Gold' ? 150 : 80),
                nextPaymentDate: s.nextPaymentDate,
                daysRemaining: s.nextPaymentDate ? Math.ceil((new Date(s.nextPaymentDate) - new Date()) / (1000 * 60 * 60 * 24)) : null
            };
        } catch (e) {
            return null;
        }
    }).filter(Boolean).filter(s => s.status !== 'Inactive');

    const totalIncome = studentsWithStatus.reduce((total, student) => {
        const history = Array.isArray(student.paymentHistory) ? student.paymentHistory : [];
        const monthlyTotal = history.reduce((sum, payment) => {
            try {
                if (!payment || !payment.date) return sum;
                const parts = String(payment.date).split('-');
                if (parts.length !== 3) return sum;
                const [pYear, pMonth] = parts.map(Number);

                if (pYear === currentYear && (pMonth - 1) === currentMonthIdx) {
                    const val = parseFloat(payment.value);
                    return sum + (isNaN(val) ? 0 : val);
                }
                return sum;
            } catch (e) { return sum; }
        }, 0);
        return total + monthlyTotal;
    }, 0);

    const projectedRevenue = studentsWithStatus.reduce((acc, s) => acc + (s.displayPrice || 0), 0);

    // --- Expenses Logic ---
    const safeExpenses = Array.isArray(expenses) ? expenses : [];
    const currentMonthExpenses = safeExpenses.filter(exp => {
        if (!exp.date) return false;
        const [y, m] = exp.date.split('-').map(Number);
        return y === currentYear && (m - 1) === currentMonthIdx;
    }).map(exp => ({
        ...exp,
        status: exp.date <= todayStr ? 'Paid' : 'Scheduled' // Auto-status based on date
    }));

    // Calculate totals
    const totalPaidExpenses = currentMonthExpenses
        .filter(e => e.status === 'Paid')
        .reduce((acc, exp) => acc + (parseFloat(exp.value) || 0), 0);

    const totalFutureExpenses = currentMonthExpenses
        .filter(e => e.status === 'Scheduled')
        .reduce((acc, exp) => acc + (parseFloat(exp.value) || 0), 0);

    const balance = totalIncome - totalPaidExpenses; // Only subtract PAID expenses

    const handleAddExpense = async (e) => {
        e.preventDefault();
        if (!newExpense.description || !newExpense.value) return;

        try {
            await addExpense({
                ...newExpense,
                createdAt: new Date().toISOString()
            });
            setNewExpense({ description: '', category: 'Fixo', value: '', date: new Date().toISOString().split('T')[0] });
            setShowExpenseForm(false);
            addToast("Despesa adicionada com sucesso!", 'success');
        } catch (error) {
            addToast("Erro ao adicionar despesa.", 'error');
        }
    };

    const handleDeleteExpense = async (id) => {
        const confirmed = await confirm({
            title: 'Excluir Despesa',
            message: 'Tem certeza que deseja excluir esta despesa?',
            confirmText: 'Excluir',
            type: 'danger'
        });

        if (confirmed) {
            await deleteExpense(id);
            addToast("Despesa excluída com sucesso!", 'success');
        }
    };

    const buttonStyle = (isActive) => ({
        padding: '0.5rem 1rem',
        borderRadius: '8px',
        border: 'none',
        background: isActive ? 'var(--primary)' : 'rgba(255, 255, 255, 0.05)',
        color: isActive ? '#fff' : 'var(--text-muted)',
        cursor: 'pointer',
        transition: 'all 0.2s',
        fontWeight: isActive ? '600' : 'normal',
        display: 'flex', alignItems: 'center', gap: '0.5rem'
    });

    const categoryDescriptions = {
        'Fixo': 'Custos recorrentes todo mês (Ex: Aluguel, Internet, Sistema).',
        'Variavel': 'Custos pontuais ou que mudam (Ex: Manutenção, Limpeza).',
        'Pessoal': 'Pagamentos de pessoas (Ex: Salário Professor, Recepção).'
    };

    return (
        <div style={{ paddingBottom: '4rem' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1>Controle Financeiro</h1>
                <p style={{ color: 'var(--text-muted)' }}>Mês Referência: {currentMonthName}</p>
            </div>

            {/* Summary Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2rem'
            }}>
                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', color: '#10b981' }}>
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Receita Total</p>
                        <h3>{totalIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Projetado: {projectedRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', color: '#ef4444' }}>
                        <TrendingDown size={24} />
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Despesas (Realizadas)</p>
                        <h3>{totalPaidExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3>
                        {totalFutureExpenses > 0 && (
                            <div style={{ fontSize: '0.8rem', color: '#eab308', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.2rem' }}>
                                <Clock size={12} />
                                A vencer: {totalFutureExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </div>
                        )}
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '1rem', background: balance >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', color: balance >= 0 ? '#10b981' : '#ef4444' }}>
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Saldo Líquido</p>
                        <h3 style={{ color: balance >= 0 ? '#10b981' : '#ef4444' }}>
                            {balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </h3>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <button onClick={() => setActiveTab('income')} style={buttonStyle(activeTab === 'income')}>
                    <TrendingUp size={18} /> Receitas
                </button>
                <button onClick={() => setActiveTab('expenses')} style={buttonStyle(activeTab === 'expenses')}>
                    <TrendingDown size={18} /> Despesas
                </button>
            </div>

            <style>{`
                .financial-table-responsive {
                    width: 100%;
                    border-collapse: collapse;
                }

                @media (max-width: 768px) {
                    .financial-table-responsive thead {
                        display: none;
                    }

                    .financial-table-responsive, 
                    .financial-table-responsive tbody, 
                    .financial-table-responsive tr, 
                    .financial-table-responsive td {
                        display: block;
                        width: 100%;
                    }

                    .financial-table-responsive tr {
                        margin-bottom: 1rem;
                        background: var(--card-bg);
                        border: 1px solid var(--border-glass);
                        border-radius: 12px;
                        padding: 1rem;
                        position: relative;
                    }

                    .financial-table-responsive td {
                        text-align: left;
                        padding: 0.5rem 0;
                        border: none;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }

                    .financial-table-responsive td::before {
                        content: attr(data-label);
                        font-weight: 600;
                        color: var(--text-muted);
                        font-size: 0.85rem;
                        margin-right: 1rem;
                    }

                    /* Specific Styling for Income Table */
                    .income-row td:first-child { /* Name */
                        font-weight: bold;
                        font-size: 1.1rem;
                        color: var(--text-main);
                        padding-bottom: 0.25rem;
                    }
                    .income-row td:first-child::before { content: none; }

                    .income-row td:nth-child(3) { /* Value */
                        color: var(--primary);
                        font-weight: bold;
                        font-size: 1.1rem;
                    }
                    
                    /* Specific Styling for Expenses Table */
                    .expense-row td:nth-child(2) { /* Description */
                        font-weight: bold;
                        color: var(--text-main);
                        font-size: 1.1rem;
                        padding-bottom: 0.25rem;
                    }
                    .expense-row td:nth-child(2)::before { content: none; }
                    
                    .expense-row td:nth-child(4) { /* Value */
                         font-weight: bold;
                         font-size: 1.1rem;
                    }

                    /* Hide empty headers or unwanted content */
                   .hide-label-mobile::before {
                       display: none;
                   }
                }
            `}</style>

            <style>{`
                .financial-table-responsive {
                    width: 100%;
                    border-collapse: collapse;
                }

                .expense-form-grid {
                    display: grid;
                    grid-template-columns: 2fr 1.5fr 1fr 1fr auto;
                    gap: 1.5rem;
                    align-items: start;
                }

                @media (max-width: 768px) {
                    .expense-form-grid {
                        grid-template-columns: 1fr;
                        gap: 1rem;
                    }
                    .expense-form-grid button[type="submit"] {
                        width: 100%;
                        margin-top: 1rem;
                    }

                    .financial-table-responsive thead {
                        display: none;
                    }

                    .financial-table-responsive, 
                    .financial-table-responsive tbody, 
                    .financial-table-responsive tr, 
                    .financial-table-responsive td {
                        display: block;
                        width: 100%;
                    }

                    .financial-table-responsive tr {
                        margin-bottom: 1rem;
                        background: var(--card-bg);
                        border: 1px solid var(--border-glass);
                        border-radius: 12px;
                        padding: 1rem;
                        position: relative;
                        display: flex !important; /* Enable flex for ordering */
                        flex-direction: column;
                    }

                    .financial-table-responsive td {
                        text-align: left;
                        padding: 0.25rem 0; /* Tighter padding */
                        border: none;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        width: 100%;
                    }

                    .financial-table-responsive td::before {
                        content: attr(data-label);
                        font-weight: 600;
                        color: var(--text-muted);
                        font-size: 0.85rem;
                        margin-right: 1rem;
                    }

                    /* Specific Styling for Income Table */
                    .income-row td:first-child { /* Name */
                        font-weight: bold;
                        font-size: 1.1rem;
                        color: var(--text-main);
                        padding-bottom: 0.5rem;
                        order: -2;
                    }
                    .income-row td:first-child::before { content: none; }

                    .income-row td:nth-child(3) { /* Value */
                        color: var(--primary);
                        font-weight: bold;
                        font-size: 1.1rem;
                    }
                    
                    /* Specific Styling for Expenses Table */
                    .expense-row td:nth-child(2) { /* Description */
                        font-weight: bold;
                        color: var(--text-main);
                        font-size: 1.1rem;
                        padding-bottom: 0.25rem;
                        order: -2; /* Move to top */
                    }
                    .expense-row td:nth-child(2)::before { content: none; }
                    
                    .expense-row td:nth-child(4) { /* Value */
                         font-weight: bold;
                         font-size: 1.1rem;
                         order: -1; /* Move below description */
                         margin-bottom: 0.5rem;
                         justify-content: flex-start;
                    }
                    .expense-row td:nth-child(4)::before {
                        /* Keep label for value or maybe hide it? Let's keep it for clarity but style it */
                        margin-right: 0.5rem;
                    }

                    /* Date slightly smaller */
                    .expense-row td:first-child {
                        font-size: 0.85rem;
                        color: var(--text-muted);
                        order: 0;
                    }

                    /* Hide empty headers or unwanted content */
                   .hide-label-mobile::before {
                       display: none;
                   }
                   
                   /* Action button absolute positioning */
                   .financial-table-responsive tr {
                       position: relative;
                   }
                   .expense-row td:last-child {
                       position: absolute;
                       top: 1rem;
                       right: 1rem;
                       width: auto;
                       justify-content: flex-end;
                   }
                }
            `}</style>

            {/* INCOME TAB */}
            {activeTab === 'income' && (
                <div className="glass-panel fade-in" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1rem', overflowX: 'auto' }}>
                        <button onClick={() => setFilter('all')} style={{ ...buttonStyle(filter === 'all'), padding: '0.4rem 0.8rem', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>Todos</button>
                        <button onClick={() => setFilter('paid')} style={{ ...buttonStyle(filter === 'paid'), padding: '0.4rem 0.8rem', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>Pagos</button>
                        <button onClick={() => setFilter('overdue')} style={{ ...buttonStyle(filter === 'overdue'), padding: '0.4rem 0.8rem', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>Pendentes</button>
                    </div>

                    <table className="financial-table-responsive">
                        <thead>
                            <tr style={{ textAlign: 'left', color: 'var(--text-muted)' }}>
                                <th style={{ padding: '1rem 0' }}>Aluno</th>
                                <th>Plano</th>
                                <th>Valor</th>
                                <th>Data Pagamento</th>
                                <th>Vencimento</th>
                                <th>Dias Restantes</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {studentsWithStatus.filter(s => {
                                if (filter === 'paid') return s.currentMonthStatus === 'Paid';
                                if (filter === 'overdue') return s.currentMonthStatus !== 'Paid';
                                return true;
                            }).map(student => (
                                <tr key={student.id} className="income-row" style={{ borderBottom: '1px solid var(--border-glass)' }}>
                                    <td data-label="Aluno" style={{ padding: '1rem 0' }}>{student.name}</td>
                                    <td data-label="Plano" style={{ textTransform: 'capitalize' }}>{{ 'Monthly': 'Mensal', 'Quarterly': 'Trimestral', 'Semiannual': 'Semestral', 'Annual': 'Anual' }[student.plan] || student.plan}</td>
                                    <td data-label="Valor">R$ {(student.displayPrice || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                    <td data-label="Data Pagamento" style={{ color: 'var(--text-muted)' }}>{student.currentMonthStatus === 'Paid' && student.lastPaymentDate ? new Date(student.lastPaymentDate).toLocaleDateString('pt-BR') : '-'}</td>
                                    <td data-label="Vencimento">{student.nextPaymentDate ? new Date(student.nextPaymentDate).toLocaleDateString('pt-BR') : '-'}</td>
                                    <td data-label="Dias Restantes">
                                        {student.daysRemaining !== null ? (
                                            <span style={{ color: student.daysRemaining < 0 ? '#ef4444' : student.daysRemaining <= 7 ? '#eab308' : '#10b981', fontWeight: 'bold' }}>
                                                {student.daysRemaining} dias
                                            </span>
                                        ) : '-'}
                                    </td>
                                    <td data-label="Status">
                                        <span style={{
                                            padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.85rem',
                                            background: student.currentMonthStatus === 'Paid' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                            color: student.currentMonthStatus === 'Paid' ? '#10b981' : '#ef4444',
                                            display: 'inline-flex', alignItems: 'center', gap: '0.25rem'
                                        }}>
                                            {student.currentMonthStatus === 'Paid' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                                            {student.currentMonthStatus === 'Paid' ? 'Em dia' : 'Pendente'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* EXPENSES TAB */}
            {activeTab === 'expenses' && (
                <div className="glass-panel fade-in" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <h3 style={{ margin: 0 }}>Despesas do Mês</h3>

                        {!showExpenseForm && (
                            <button
                                onClick={() => setShowExpenseForm(true)}
                                className="btn-primary"
                                style={{
                                    display: 'flex',
                                    gap: '0.75rem',
                                    alignItems: 'center',
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '12px',
                                    // background: handled by btn-primary class
                                    boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                                    fontWeight: '600',
                                    fontSize: '1rem',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    transition: 'transform 0.2s',
                                    cursor: 'pointer',
                                    color: '#fff'
                                }}
                                onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <Plus size={22} strokeWidth={3} />
                                <span className="hide-mobile">NOVA DESPESA</span>
                                <span className="show-mobile-only" style={{ display: 'none' }}>+</span>
                            </button>
                        )}
                    </div>

                    {showExpenseForm && (
                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '16px', marginBottom: '2rem', border: '1px solid var(--border-glass)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Plus size={20} className="text-secondary" /> Registrar Saída</h4>
                                <button onClick={() => setShowExpenseForm(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><XCircle size={24} /></button>
                            </div>

                            <form onSubmit={handleAddExpense} className="expense-form-grid">
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Descrição</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Ex: Aluguel"
                                        value={newExpense.description}
                                        onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}
                                        style={{ width: '100%', padding: '0.85rem', borderRadius: '10px', border: '1px solid var(--border-glass)', background: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '0.95rem' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Categoria</label>
                                    <select
                                        value={newExpense.category}
                                        onChange={e => setNewExpense({ ...newExpense, category: e.target.value })}
                                        style={{ width: '100%', padding: '0.85rem', borderRadius: '10px', border: '1px solid var(--border-glass)', background: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '0.95rem' }}
                                    >
                                        <option value="Fixo">Fixo</option>
                                        <option value="Variavel">Variável</option>
                                        <option value="Pessoal">Pessoal</option>
                                    </select>
                                    {/* Tooltip/Helper Text */}
                                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                                        <Info size={12} />
                                        <span>{categoryDescriptions[newExpense.category]}</span>
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Data</label>
                                    <input
                                        type="date"
                                        required
                                        value={newExpense.date}
                                        onChange={e => setNewExpense({ ...newExpense, date: e.target.value })}
                                        style={{ width: '100%', padding: '0.85rem', borderRadius: '10px', border: '1px solid var(--border-glass)', background: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '0.95rem' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Valor (R$)</label>
                                    <input
                                        required
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={newExpense.value}
                                        onChange={e => setNewExpense({ ...newExpense, value: e.target.value })}
                                        style={{ width: '100%', padding: '0.85rem', borderRadius: '10px', border: '1px solid var(--border-glass)', background: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '0.95rem' }}
                                    />
                                </div>
                                <div style={{ paddingTop: '1.7rem' }}>
                                    <button type="submit" className="btn-primary" style={{ height: '48px', padding: '0 2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px' }}>Salvar</button>
                                </div>
                            </form>
                        </div>
                    )}

                    <table className="financial-table-responsive" style={{ marginTop: showExpenseForm ? '0' : '1rem' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', color: 'var(--text-muted)' }}>
                                <th style={{ padding: '1rem 0' }}>Data</th>
                                <th>Descrição</th>
                                <th>Categoria</th>
                                <th>Valor</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentMonthExpenses.length > 0 ? (
                                currentMonthExpenses.map(expense => (
                                    <tr key={expense.id} className="expense-row" style={{ borderBottom: '1px solid var(--border-glass)' }}>
                                        <td data-label="Data" style={{ padding: '1rem 0' }}>{new Date(expense.date).toLocaleDateString('pt-BR')}</td>
                                        <td data-label="Descrição">{expense.description}</td>
                                        <td data-label="Categoria">
                                            <span style={{
                                                padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.8rem',
                                                background: expense.category === 'Pessoal' ? 'rgba(168, 85, 247, 0.2)' : expense.category === 'Fixo' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                                                color: expense.category === 'Pessoal' ? '#a855f7' : expense.category === 'Fixo' ? '#3b82f6' : '#eab308'
                                            }}>
                                                {expense.category}
                                            </span>
                                        </td>
                                        <td data-label="Valor" style={{ fontWeight: 'bold', color: expense.status === 'Paid' ? '#ef4444' : 'var(--text-muted)' }}>
                                            - R$ {parseFloat(expense.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td data-label="Status">
                                            <span style={{
                                                padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.8rem',
                                                background: expense.status === 'Paid' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                                                color: expense.status === 'Paid' ? '#ef4444' : '#eab308',
                                                display: 'inline-flex', alignItems: 'center', gap: '0.3rem'
                                            }}>
                                                {expense.status === 'Paid' ? <CheckCircle size={12} /> : <Calendar size={12} />}
                                                {expense.status === 'Paid' ? 'Pago' : 'Agendado'}
                                            </span>
                                        </td>
                                        <td data-label="Ações" className="hide-label-mobile" style={{ textAlign: 'right' }}>
                                            <button onClick={() => handleDeleteExpense(expense.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Nenhuma despesa registrada neste mês.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
