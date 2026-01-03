import React, { useMemo } from 'react';
import { Users, DollarSign, Activity, TrendingUp, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatsCard from '../components/StatsCard';
import { useGym } from '../context/GymContext';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from "recharts";

// Helper to format currency
const formatCurrency = (value) => {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);
};

export default function Dashboard() {
    const { students, settings } = useGym();

    // --- Stats & Charts Logic ---

    // 1. General Stats (Cards)
    const totalStudents = students.length;
    const activeStudents = students.filter(s => {
        const status = s.status ? s.status.toLowerCase() : 'active';
        return status === 'active';
    }).length;

    // Active Workouts
    const activeWorkouts = students.reduce((total, student) => {
        const legacyCount = student.workouts ? 1 : 0;
        const sheetCount = student.workoutSheets ? Object.keys(student.workoutSheets).length : 0;
        return total + legacyCount + sheetCount;
    }, 0);

    // Retention Rate
    const retentionRate = totalStudents > 0
        ? Math.round((activeStudents / totalStudents) * 100)
        : 0;


    // 2. Financial Chart Data (Current Month)
    const financialData = useMemo(() => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        // Let's show Last 6 Months trend instead of just current month daily
        // It provides better context for a dashboard
        const last6Months = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            last6Months.push({
                monthIndex: d.getMonth(),
                year: d.getFullYear(),
                name: d.toLocaleDateString('pt-BR', { month: 'short' }),
                amount: 0
            });
        }

        let currentMonthRevenue = 0;

        students.forEach((student) => {
            if (student.paymentHistory) {
                student.paymentHistory.forEach((payment) => {
                    if (!payment.date) return;

                    // Fix Timezone Issue: Parse string directly YYYY-MM-DD
                    const [pYear, pMonthVal] = payment.date.split('-').map(Number);
                    const pMonthIndex = pMonthVal - 1; // 0-11

                    // For Stats Card (Current Month)
                    if (pMonthIndex === currentMonth && pYear === currentYear) {
                        currentMonthRevenue += parseFloat(payment.value || payment.amount || 0);
                    }

                    // For Chart (Last 6 Months)
                    const monthEntry = last6Months.find(m => m.monthIndex === pMonthIndex && m.year === pYear);
                    if (monthEntry) {
                        monthEntry.amount += parseFloat(payment.value || payment.amount || 0);
                    }
                });
            }
        });

        return { currentMonthRevenue, chartData: last6Months };
    }, [students]);

    // 3. Student Distribution Data
    const studentCharts = useMemo(() => {
        let male = 0;
        let female = 0;

        students.forEach((s) => {
            const g = s.gender ? s.gender.toLowerCase() : '';
            if (g === 'male' || g === 'masculino') male++;
            else if (g === 'female' || g === 'feminino') female++;
        });

        const genderData = [
            { name: 'Masculino', value: male, color: '#3b82f6' },
            { name: 'Feminino', value: female, color: '#ec4899' },
        ];

        const remaining = totalStudents - male - female;
        if (remaining > 0) genderData.push({ name: 'N/I', value: remaining, color: '#9ca3af' });

        const statusData = [
            { name: 'Ativos', value: activeStudents, color: '#10b981' },
            { name: 'Inativos', value: totalStudents - activeStudents, color: '#ef4444' }
        ];

        return { genderData, statusData };
    }, [students, totalStudents, activeStudents]);


    const monthlyRevenueFormatted = formatCurrency(financialData.currentMonthRevenue);


    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Visão Geral</h1>
                <p style={{ color: 'var(--text-muted)' }}>Bem-vindo de volta, gerencie sua academia com eficiência.</p>
            </div>

            {/* Onboarding Alert */}
            {(!students.length && (!settings?.gymName || settings.gymName === 'GymManager' || !settings?.whatsapp)) && (
                <div style={{
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid #f59e0b',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    marginBottom: '2rem',
                    display: 'flex',
                    alignItems: 'start',
                    gap: '1rem'
                }}>
                    <div style={{
                        background: '#f59e0b',
                        padding: '0.5rem',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <AlertTriangle size={24} color="white" />
                    </div>
                    <div>
                        <h3 style={{ color: '#f59e0b', marginBottom: '0.5rem' }}>Complete o perfil da sua academia</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: '1.5' }}>
                            Parece que faltam algumas informações importantes. Cadastre o <strong>WhatsApp</strong> e o <strong>Nome da Academia</strong> para deixar tudo pronto.
                        </p>
                        <Link to="/settings" style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            background: '#f59e0b',
                            color: 'white',
                            padding: '0.5rem 1rem',
                            borderRadius: '6px',
                            textDecoration: 'none',
                            fontWeight: '600',
                            fontSize: '0.9rem'
                        }}>
                            Ir para Configurações
                        </Link>
                    </div>
                </div>
            )}

            {/* Stats Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2rem'
            }}>
                <StatsCard
                    title="Total de Alunos"
                    value={totalStudents}
                    icon={Users}
                    trend="Cadastrados"
                    color="#3b82f6"
                />
                <StatsCard
                    title="Receita (Mês Atual)"
                    value={monthlyRevenueFormatted}
                    icon={DollarSign}
                    trend="Faturamento"
                    color="#10b981"
                />
                <StatsCard
                    title="Treinos Ativos"
                    value={activeWorkouts}
                    icon={Activity}
                    trend="Fichas criadas"
                    color="#f59e0b"
                />
                <StatsCard
                    title="Taxa de Retenção"
                    value={`${retentionRate}%`}
                    icon={TrendingUp}
                    trend="Alunos ativos"
                    color="#8b5cf6"
                />
            </div>

            {/* Charts Section */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>

                {/* Financial Chart */}
                <div className="glass-panel" style={{ padding: "2rem", height: "400px" }}>
                    <h3 style={{ marginBottom: "1.5rem" }}>Faturamento (Últimos 6 Meses)</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={financialData.chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-glass)" vertical={false} />
                            <XAxis
                                dataKey="name"
                                stroke="var(--text-muted)"
                                tick={{ fill: 'var(--text-muted)' }}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="var(--text-muted)"
                                tick={{ fill: 'var(--text-muted)' }}
                                tickFormatter={(val) => `R$ ${val}`}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip
                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border-glass)', borderRadius: '8px' }}
                                formatter={(val) => formatCurrency(val)}
                            />
                            <Bar dataKey="amount" fill="var(--primary)" radius={[4, 4, 0, 0]} name="Receita" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Gender Distribution */}
                <div className="glass-panel" style={{ padding: '2rem', height: '400px' }}>
                    <h3 style={{ marginBottom: "1rem", textAlign: 'center' }}>Distribuição por Gênero</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={studentCharts.genderData}
                                cx="50%"
                                cy="50%"
                                innerRadius={80}
                                outerRadius={100}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {studentCharts.genderData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border-glass)', borderRadius: '8px' }} />
                            <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Status Distribution (Optional, or maybe simpler representation) */}
                {/* We already have retention rate in cards, but a visual pie is nice too if space permits.
                    Let's put it in a 3rd column or row if needed, but 2 columns is balanced. 
                    I'll add it as a smaller section or omit since Cards cover it.
                    Actually, let's keep it clean with 2 big charts.
                */}
            </div>

            {/* Recent Activity Section */}
            <div className="glass-panel" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3>Atividade Recente</h3>
                    <button style={{
                        background: 'rgba(255,255,255,0.05)',
                        padding: '0.5rem 1rem',
                        borderRadius: '8px',
                        color: 'var(--text-muted)',
                        fontSize: '0.9rem'
                    }}>Ver Tudo</button>
                </div>

                {students.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        <p>Nenhuma atividade ainda. Comece adicionando um aluno.</p>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-glass)' }}>
                                <th style={{ padding: '1rem 0' }}>Aluno</th>
                                <th>Status</th>
                                <th>Plano</th>
                                <th>Último Pagto.</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.slice(0, 5).map(student => {
                                const lastPayment = student.paymentHistory?.length > 0
                                    ? student.paymentHistory[student.paymentHistory.length - 1]
                                    : null;

                                const planMap = {
                                    'Monthly': 'Mensal', 'monthly': 'Mensal',
                                    'Quarterly': 'Trimestral', 'quarterly': 'Trimestral',
                                    'Semiannual': 'Semestral', 'semiannual': 'Semestral',
                                    'Annual': 'Anual', 'annual': 'Anual'
                                };

                                return (
                                    <tr key={student.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                                        <td style={{ padding: '1rem 0', fontWeight: '500' }}>{student.name}</td>
                                        <td>
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '20px',
                                                fontSize: '0.85rem',
                                                background: (student.status || 'Active').toLowerCase() === 'active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                color: (student.status || 'Active').toLowerCase() === 'active' ? '#10b981' : '#ef4444'
                                            }}>
                                                {(student.status || 'Active') === 'Active' ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </td>
                                        <td style={{ color: 'var(--text-muted)' }}>{planMap[student.plan] || student.plan || 'Mensal'}</td>
                                        <td style={{ color: 'var(--text-muted)' }}>
                                            {lastPayment ? new Date(lastPayment.date).toLocaleDateString('pt-BR') : 'Nunca'}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}
