import React, { useState, useMemo } from "react";
import { useGym } from "../context/GymContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Calendar, Users, DollarSign, TrendingUp, TrendingDown, Filter, FileText, Download, AlertCircle, Briefcase } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Helper to format currency
const formatCurrency = (value) => {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);
};

const translateStatus = (status) => {
    if (!status) return 'Ativo';
    const s = String(status).toLowerCase();
    return (s === 'active' || s === 'ativo') ? 'Ativo' : 'Inativo';
};

const translatePlan = (plan) => {
    if (!plan) return 'Mensal';
    const map = {
        'Monthly': 'Mensal', 'monthly': 'Mensal',
        'Quarterly': 'Trimestral', 'quarterly': 'Trimestral',
        'Semiannual': 'Semestral', 'semiannual': 'Semestral',
        'Annual': 'Anual', 'annual': 'Anual'
    };
    return map[plan] || plan;
};

const getBase64FromUrl = async (url) => {
    const data = await fetch(url);
    const blob = await data.blob();
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
            const base64data = reader.result;
            resolve(base64data);
        }
    });
}

const Reports = () => {
    const { user } = useAuth(); // Get user
    const { students, expenses, settings, teachers } = useGym();
    const { addToast } = useToast();

    // Default to 'students' if not owner or admin
    const [activeTab, setActiveTab] = useState((user?.role === 'owner' || user?.role === 'admin') ? "financial" : "students");
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            .toISOString()
            .split("T")[0],
        end: new Date().toISOString().split("T")[0],
    });

    // --- Financial Data Construction ---
    const financialData = useMemo(() => {
        let totalIncome = 0;
        let totalExpenses = 0; // New
        let paymentCount = 0;
        let expenseCount = 0; // New
        const detailedPayments = [];
        const detailedExpenses = []; // New

        const activeStartDateStr = dateRange.start;
        const activeEndDateStr = dateRange.end;
        const todayStr = new Date().toISOString().split("T")[0];

        // 1. Process Income (Students)
        students.forEach((student) => {
            if (student.paymentHistory && Array.isArray(student.paymentHistory)) {
                student.paymentHistory.forEach((payment) => {
                    if (!payment.date) return;
                    const pDateYMD = payment.date.split('T')[0];

                    if (pDateYMD >= activeStartDateStr && pDateYMD <= activeEndDateStr) {
                        const val = parseFloat(payment.value || payment.amount || 0);
                        totalIncome += val;
                        paymentCount++;

                        const [y, m, d] = pDateYMD.split('-');
                        const displayDate = `${d}/${m}/${y}`;

                        detailedPayments.push({
                            date: displayDate,
                            student: student.name,
                            amount: val,
                            method: payment.method || 'Não inf.',
                            rawDate: pDateYMD
                        });
                    }
                });
            }
        });

        // 2. Process Expenses (New)
        if (Array.isArray(expenses)) {
            expenses.forEach(exp => {
                if (!exp.date) return;
                const eDateYMD = exp.date; // stored as YYYY-MM-DD

                // Filter by Range (Future expenses allowed for projection)
                if (eDateYMD >= activeStartDateStr && eDateYMD <= activeEndDateStr) {
                    const val = parseFloat(exp.value || 0);
                    totalExpenses += val;
                    expenseCount++;

                    const [y, m, d] = eDateYMD.split('-');
                    const displayDate = `${d}/${m}/${y}`;

                    detailedExpenses.push({
                        date: displayDate,
                        description: exp.description,
                        category: exp.category,
                        amount: val,
                        rawDate: eDateYMD
                    });
                }
            });
        }

        // Sort by date descending
        const dateSorter = (a, b) => new Date(b.rawDate) - new Date(a.rawDate);
        detailedPayments.sort(dateSorter);
        detailedExpenses.sort(dateSorter);

        const netProfit = totalIncome - totalExpenses;

        return {
            totalIncome,
            totalExpenses,
            netProfit,
            paymentCount,
            expenseCount,
            detailedPayments,
            detailedExpenses
        };
    }, [students, expenses, dateRange]);

    // --- Student Data Construction ---
    const studentData = useMemo(() => {
        const list = students.map(s => {
            const status = s.status ? s.status.toLowerCase() : 'active';
            let nextPayment = 'N/A';
            if (s.paymentHistory && s.paymentHistory.length > 0) {
                const lastPayment = s.paymentHistory[s.paymentHistory.length - 1];
                if (lastPayment.date) {
                    const payDate = new Date(lastPayment.date);
                    payDate.setMonth(payDate.getMonth() + 1);
                    nextPayment = payDate.toLocaleDateString('pt-BR');
                }
            }

            return {
                name: s.name,
                status: status === 'active' ? 'Ativo' : 'Inativo',
                plan: s.plan || 'Mensal',
                nextPayment
            };
        });

        const total = list.length;
        const active = list.filter(s => s.status === 'Ativo').length;
        const inactive = list.filter(s => s.status !== 'Ativo').length; // Fix logic

        return { list, total, active, inactive };
    }, [students]);

    // --- Teacher Data Construction ---
    const teacherData = useMemo(() => {
        if (!teachers) return { list: [], totalRevenue: 0 };

        const list = teachers.map(t => {
            const assignedStudents = students.filter(s => s.teacherId === t.id);
            const studentCount = assignedStudents.length;
            const activeStudents = assignedStudents.filter(s => s.status === 'Active' || s.status === 'active').length;

            // Calculate total value from students
            const totalValue = assignedStudents.reduce((acc, s) => {
                const price = parseFloat(s.price || 0);
                return acc + (isNaN(price) ? 0 : price);
            }, 0);

            // Calculate commission (Projected)
            let estimatedCommission = 0;
            if (t.commissionType === 'Fixed') {
                estimatedCommission = activeStudents * (parseFloat(t.commissionValue) || 0);
            } else {
                // Percentage
                estimatedCommission = totalValue * ((parseFloat(t.commissionValue) || 0) / 100);
            }

            return {
                ...t,
                studentList: assignedStudents,
                studentCount,
                activeCount: activeStudents,
                totalRevenue: totalValue,
                estimatedCommission
            };
        });

        // Calculate Global Totals for the report
        const totalRevenue = list.reduce((acc, t) => acc + t.totalRevenue, 0);

        return { list, totalRevenue };
    }, [teachers, students]);


    // --- PDF Generators ---
    const exportFinancialPDF = async () => {
        try {
            const doc = new jsPDF();
            const gymName = settings?.gymName || "GymManager";
            const periodStr = `${new Date(dateRange.start).toLocaleDateString('pt-BR')} a ${new Date(dateRange.end).toLocaleDateString('pt-BR')}`;

            // Header Layer (Professional Dark Theme)
            doc.setFillColor(15, 23, 42); // Dark Slate/Blue
            doc.rect(0, 0, 210, 40, 'F');

            // Logo
            if (settings?.logoUrl) {
                try {
                    const logoBase64 = await getBase64FromUrl(settings.logoUrl);
                    doc.addImage(logoBase64, 'PNG', 14, 5, 30, 30);
                } catch (e) {
                    console.error("Failed to load logo", e);
                }
            }

            // Header Text
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.text(gymName, 105, 18, { align: "center" });

            doc.setFontSize(14);
            doc.text("Relatório Financeiro", 105, 30, { align: "center" });

            // Reset for Content
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(10);
            doc.text(`Período: ${periodStr}`, 14, 50);

            // Stats Box (Shifted down)
            doc.setFillColor(245, 245, 245);
            doc.rect(14, 55, 182, 25, 'F');

            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text("Resumo do Período", 20, 62);

            doc.setFontSize(11);
            doc.setTextColor(0);
            doc.text(`Receitas: ${formatCurrency(financialData.totalIncome)}`, 20, 72);
            doc.text(`Despesas: ${formatCurrency(financialData.totalExpenses)}`, 80, 72);

            // Profit Color
            if (financialData.netProfit >= 0) doc.setTextColor(0, 150, 0);
            else doc.setTextColor(200, 0, 0);
            doc.text(`Lucro Líquido: ${formatCurrency(financialData.netProfit)}`, 140, 72);
            doc.setTextColor(0);

            let currentY = 80;

            // Income Table
            doc.setFontSize(12);
            doc.text("Detalhamento de Receitas", 14, currentY);
            currentY += 5;

            const incomeRows = financialData.detailedPayments.map(p => [
                p.date,
                p.student,
                p.method,
                formatCurrency(p.amount)
            ]);

            if (incomeRows.length > 0) {
                autoTable(doc, {
                    head: [["Data", "Aluno", "Forma Pagto", "Valor"]],
                    body: incomeRows,
                    startY: currentY,
                    theme: 'grid',
                    headStyles: { fillColor: [16, 185, 129] }, // Green
                });
                currentY = doc.lastAutoTable.finalY + 20;
            } else {
                doc.setFontSize(10);
                doc.text("Nenhuma receita encontrada.", 14, currentY + 10);
                currentY += 25;
            }

            // Expenses Table
            doc.setFontSize(12);
            doc.text("Detalhamento de Despesas", 14, currentY);
            currentY += 5;

            const expenseRows = financialData.detailedExpenses.map(e => [
                e.date,
                e.description,
                e.category,
                formatCurrency(e.amount)
            ]);

            if (expenseRows.length > 0) {
                autoTable(doc, {
                    head: [["Data", "Descrição", "Categoria", "Valor"]],
                    body: expenseRows,
                    startY: currentY,
                    theme: 'grid',
                    headStyles: { fillColor: [239, 68, 68] }, // Red
                });
            } else {
                doc.setFontSize(10);
                doc.text("Nenhuma despesa encontrada.", 14, currentY + 10);
            }

            doc.save(`financeiro_${dateRange.start}.pdf`);
            addToast("Relatório baixado com sucesso!", 'success');
        } catch (error) {
            console.error("PDF Error:", error);
            addToast("Erro ao gerar PDF. Verifique o console.", 'error');
        }
    };

    const exportStudentsPDF = async () => {
        try {
            const doc = new jsPDF();
            const gymName = settings?.gymName || "GymManager";

            // Header Layer (Professional Dark Theme)
            doc.setFillColor(15, 23, 42); // Dark Slate/Blue
            doc.rect(0, 0, 210, 40, 'F');

            // Logo
            if (settings?.logoUrl) {
                try {
                    const logoBase64 = await getBase64FromUrl(settings.logoUrl);
                    doc.addImage(logoBase64, 'PNG', 14, 5, 30, 30);
                } catch (e) {
                    console.error("Failed to load logo", e);
                }
            }

            // Header Text
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.text(gymName, 105, 18, { align: "center" });

            doc.setFontSize(14);
            doc.text("Relatório de Alunos", 105, 30, { align: "center" });

            // Reset for Content
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(10);
            doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 50);

            doc.setFontSize(11);
            doc.text(`Total: ${studentData.total} | Ativos: ${studentData.active} | Inativos: ${studentData.inactive}`, 14, 58); // Adjusted Y

            const tableColumn = ["Nome", "Status", "Plano", "Próx. Vencimento"];
            const tableRows = studentData.list.map(s => [
                s.name,
                translateStatus(s.status),
                translatePlan(s.plan),
                s.nextPayment
            ]);

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 70,
                theme: 'grid',
                headStyles: { fillColor: [59, 130, 246] },
            });

            doc.save("lista_alunos.pdf");
            addToast("Lista de alunos baixada com sucesso!", 'success');
        } catch (error) {
            console.error("PDF Error:", error);
            addToast("Erro ao gerar PDF.", 'error');
        }
    };

    const exportTeachersPDF = async () => {
        try {
            const doc = new jsPDF();
            const gymName = settings?.gymName || "GymManager";

            // Header
            doc.setFillColor(15, 23, 42);
            doc.rect(0, 0, 210, 40, 'F');

            if (settings?.logoUrl) {
                try {
                    const logoBase64 = await getBase64FromUrl(settings.logoUrl);
                    doc.addImage(logoBase64, 'PNG', 14, 5, 30, 30);
                } catch (e) {
                    console.error("Failed to load logo", e);
                }
            }

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.text(gymName, 105, 18, { align: "center" });

            doc.setFontSize(14);
            doc.text("Relatório de Professores", 105, 30, { align: "center" });

            // Stats
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(10);
            doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 50);

            let currentY = 60;

            teacherData.list.forEach(teacher => {
                // Check page break
                if (currentY > 250) {
                    doc.addPage();
                    currentY = 20;
                }

                // Teacher Header
                doc.setFillColor(240, 240, 240);
                doc.rect(14, currentY, 182, 10, 'F');
                doc.setFontSize(11);
                doc.setTextColor(0);
                doc.setFont("helvetica", "bold");
                doc.text(`${teacher.name} - ${teacher.specialty || 'Geral'}`, 20, currentY + 7);
                doc.setFont("helvetica", "normal");

                // Payment Day Info
                if (teacher.paymentDay) {
                    doc.setFontSize(9);
                    doc.text(`Dia de Pagamento: ${teacher.paymentDay}`, 150, currentY + 7);
                }

                currentY += 15;

                // Students Table
                const studentRows = teacher.studentList.map(s => [
                    s.name,
                    translatePlan(s.plan),
                    translateStatus(s.status),
                    formatCurrency(parseFloat(s.price || 0))
                ]);

                if (studentRows.length > 0) {
                    autoTable(doc, {
                        head: [["Aluno", "Plano", "Status", "Valor"]],
                        body: studentRows,
                        startY: currentY,
                        theme: 'grid',
                        headStyles: { fillColor: [100, 100, 100] },
                        margin: { left: 14 }
                    });
                    currentY = doc.lastAutoTable.finalY + 10;

                    // Totals for this teacher
                    doc.setFontSize(10);
                    doc.text(`Total Alunos: ${teacher.studentCount} (${teacher.activeCount} ativos)`, 14, currentY);
                    doc.text(`Receita Total: ${formatCurrency(teacher.totalRevenue)}`, 120, currentY);
                    currentY += 15;
                } else {
                    doc.setFontSize(9);
                    doc.text("Nenhum aluno vinculado.", 14, currentY);
                    currentY += 15;
                }
            });

            doc.save("relatorio_professores.pdf");
            addToast("Relatório de professores baixado!", 'success');
        } catch (error) {
            console.error(error);
            addToast("Erro ao gerar PDF.", 'error');
        }
    };

    return (
        <div style={{ paddingBottom: "2rem", position: 'relative', zIndex: 1 }}>
            <div style={{ marginBottom: "2rem" }}>
                <h1 style={{ margin: 0, fontSize: "1.8rem" }}>Emissão de Documentos</h1>
                <p style={{ color: "var(--text-muted)" }}>
                    Gere relatórios detalhados para controle administrativo.
                </p>
            </div>

            <style>{`
                .reports-table-responsive {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 0.9rem;
                }

                @media (max-width: 768px) {
                    .reports-table-responsive thead {
                        display: none;
                    }

                    .reports-table-responsive, 
                    .reports-table-responsive tbody, 
                    .reports-table-responsive tr, 
                    .reports-table-responsive td {
                        display: block;
                        width: 100%;
                    }

                    .reports-table-responsive tr {
                        margin-bottom: 1rem;
                        background: var(--card-bg);
                        border: 1px solid var(--border-glass);
                        borderRadius: 12px;
                        padding: 1rem;
                        position: relative;
                    }

                    .reports-table-responsive td {
                        text-align: left;
                        padding: 0.5rem 0;
                        border: none;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }

                    .reports-table-responsive td::before {
                        content: attr(data-label);
                        font-weight: 600;
                        color: var(--text-muted);
                        font-size: 0.85rem;
                        margin-right: 1rem;
                    }
                    
                    /* Special styling for amounts to pop */
                    .reports-table-responsive td[data-label="Valor"] {
                        font-weight: bold;
                        font-size: 1rem;
                        justify-content: flex-end; /* Align right on mobile too for emphasis, or standard */
                    }
                }
            `}</style>

            <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem" }}>
                {(user?.role === 'owner' || user?.role === 'admin') && (
                    <button
                        onClick={() => setActiveTab("financial")}
                        style={{
                            display: "flex", alignItems: "center", gap: "0.5rem",
                            padding: '0.75rem 1.5rem', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s', fontWeight: '600',
                            background: activeTab === "financial" ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                            color: activeTab === "financial" ? 'white' : 'var(--text-muted)',
                            border: activeTab === "financial" ? 'none' : '1px solid var(--border-glass)',
                            outline: 'none'
                        }}
                    >
                        <DollarSign size={18} /> Financeiro
                    </button>
                )}
                <button
                    onClick={() => setActiveTab("students")}
                    style={{
                        display: "flex", alignItems: "center", gap: "0.5rem",
                        padding: '0.75rem 1.5rem', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s', fontWeight: '600',
                        background: activeTab === "students" ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                        color: activeTab === "students" ? 'white' : 'var(--text-muted)',
                        border: activeTab === "students" ? 'none' : '1px solid var(--border-glass)',
                        outline: 'none'
                    }}
                >
                    <Users size={18} /> Lista de Alunos
                </button>
                <button
                    onClick={() => setActiveTab("teachers")}
                    style={{
                        display: "flex", alignItems: "center", gap: "0.5rem",
                        padding: '0.75rem 1.5rem', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s', fontWeight: '600',
                        background: activeTab === "teachers" ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                        color: activeTab === "teachers" ? 'white' : 'var(--text-muted)',
                        border: activeTab === "teachers" ? 'none' : '1px solid var(--border-glass)',
                        outline: 'none'
                    }}
                >
                    <Briefcase size={18} /> Professores
                </button>
            </div>

            {activeTab === "financial" && (
                <div className="fade-in">
                    {/* Actions Bar */}
                    <div className="glass-panel" style={{ padding: "1.5rem", marginBottom: "2rem", display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', marginRight: '1rem' }}>
                                <Filter size={20} />
                                <span style={{ fontWeight: 'bold' }}>Período</span>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>De</label>
                                    <input
                                        type="date"
                                        value={dateRange.start}
                                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                        style={{ background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.5rem', borderRadius: '8px' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Até</label>
                                    <input
                                        type="date"
                                        value={dateRange.end}
                                        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                        style={{ background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.5rem', borderRadius: '8px' }}
                                    />
                                </div>
                            </div>
                        </div>

                        <button onClick={exportFinancialPDF} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Download size={18} /> Baixar PDF
                        </button>
                    </div>

                    {/* Quick Stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                        <div className="glass-panel" style={{ padding: '1rem', textAlign: 'center' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Faturamento (Receitas)</span>
                            <div style={{ fontSize: '1.5rem', color: '#10b981', fontWeight: 'bold' }}>{formatCurrency(financialData.totalIncome)}</div>
                        </div>
                        <div className="glass-panel" style={{ padding: '1rem', textAlign: 'center' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Despesas</span>
                            <div style={{ fontSize: '1.5rem', color: '#ef4444', fontWeight: 'bold' }}>{formatCurrency(financialData.totalExpenses)}</div>
                        </div>
                        <div className="glass-panel" style={{ padding: '1rem', textAlign: 'center', border: financialData.netProfit < 0 ? '1px solid #ef4444' : '1px solid #10b981' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Lucro Líquido</span>
                            <div style={{ fontSize: '1.5rem', color: financialData.netProfit < 0 ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>{formatCurrency(financialData.netProfit)}</div>
                        </div>
                    </div>



                    {/* Data Preview Tables */}
                    <div style={{ display: 'grid', gap: '2rem' }}>

                        {/* Income Table */}
                        <div className="glass-panel" style={{ padding: '0' }}>
                            <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <TrendingUp size={18} color="#10b981" />
                                <h3 style={{ margin: 0, fontSize: '1rem' }}>Receitas</h3>
                            </div>
                            <div style={{ overflowX: 'auto', maxHeight: '300px', overflowY: 'auto' }}>
                                <table className="reports-table-responsive">
                                    <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-glass)', backdropFilter: 'blur(10px)' }}>
                                        <tr style={{ textAlign: 'left', color: 'var(--text-muted)' }}>
                                            <th style={{ padding: '1rem' }}>Data</th>
                                            <th style={{ padding: '1rem' }}>Aluno</th>
                                            <th style={{ padding: '1rem' }}>Forma</th>
                                            <th style={{ padding: '1rem', textAlign: 'right' }}>Valor</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {financialData.detailedPayments.length > 0 ? (
                                            financialData.detailedPayments.map((p, idx) => (
                                                <tr key={idx} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                                                    <td data-label="Data" style={{ padding: '1rem' }}>{p.date}</td>
                                                    <td data-label="Aluno" style={{ padding: '1rem' }}>{p.student}</td>
                                                    <td data-label="Forma" style={{ padding: '1rem' }}>{p.method}</td>
                                                    <td data-label="Valor" style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold', color: '#10b981' }}>+ {formatCurrency(p.amount)}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Nenhuma receita neste período.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Expenses Table */}
                        <div className="glass-panel" style={{ padding: '0' }}>
                            <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <TrendingDown size={18} color="#ef4444" />
                                <h3 style={{ margin: 0, fontSize: '1rem' }}>Despesas</h3>
                            </div>
                            <div style={{ overflowX: 'auto', maxHeight: '300px', overflowY: 'auto' }}>
                                <table className="reports-table-responsive">
                                    <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-glass)', backdropFilter: 'blur(10px)' }}>
                                        <tr style={{ textAlign: 'left', color: 'var(--text-muted)' }}>
                                            <th style={{ padding: '1rem' }}>Data</th>
                                            <th style={{ padding: '1rem' }}>Descrição</th>
                                            <th style={{ padding: '1rem' }}>Categoria</th>
                                            <th style={{ padding: '1rem', textAlign: 'right' }}>Valor</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {financialData.detailedExpenses.length > 0 ? (
                                            financialData.detailedExpenses.map((p, idx) => (
                                                <tr key={idx} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                                                    <td data-label="Data" style={{ padding: '1rem' }}>{p.date}</td>
                                                    <td data-label="Descrição" style={{ padding: '1rem' }}>{p.description}</td>
                                                    <td data-label="Categoria" style={{ padding: '1rem' }}>
                                                        <span style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-glass)' }}>
                                                            {p.category}
                                                        </span>
                                                    </td>
                                                    <td data-label="Valor" style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold', color: '#ef4444' }}>- {formatCurrency(p.amount)}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Nenhuma despesa neste período.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === "students" && (
                <div className="fade-in">
                    <div className="glass-panel" style={{ padding: "1.5rem", marginBottom: "2rem", display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Lista Completa de Alunos</h3>
                            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                {studentData.active} Ativos • {studentData.inactive} Inativos
                            </p>
                        </div>
                        <button onClick={exportStudentsPDF} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Download size={18} /> Baixar Lista (PDF)
                        </button>
                    </div>

                    <div className="glass-panel" style={{ padding: '0' }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="reports-table-responsive">
                                <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-glass)', backdropFilter: 'blur(10px)' }}>
                                    <tr style={{ background: 'rgba(255,255,255,0.03)', textAlign: 'left', color: 'var(--text-muted)' }}>
                                        <th style={{ padding: '1rem' }}>Nome</th>
                                        <th style={{ padding: '1rem' }}>Plano</th>
                                        <th style={{ padding: '1rem' }}>Status</th>
                                        <th style={{ padding: '1rem' }}>Próx. Vencimento</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {studentData.list.map((s, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                                            <td data-label="Nome" style={{ padding: '1rem', fontWeight: '500' }}>{s.name}</td>
                                            <td data-label="Plano" style={{ padding: '1rem' }}>
                                                {translatePlan(s.plan)}
                                            </td>
                                            <td data-label="Status" style={{ padding: '1rem' }}>
                                                <span style={{
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '20px',
                                                    fontSize: '0.85rem',
                                                    background: (translateStatus(s.status) === 'Ativo') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                    color: (translateStatus(s.status) === 'Ativo') ? '#10b981' : '#ef4444'
                                                }}>
                                                    {translateStatus(s.status)}
                                                </span>
                                            </td>
                                            <td data-label="Próx. Vencimento" style={{ padding: '1rem', color: 'var(--text-muted)' }}>{s.nextPayment}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === "teachers" && (
                <div className="fade-in">
                    <div className="glass-panel" style={{ padding: "1.5rem", marginBottom: "2rem", display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Relatório de Professores</h3>
                            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                Alunos por professor e projeção de receita.
                            </p>
                        </div>
                        <button onClick={exportTeachersPDF} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Download size={18} /> Baixar PDF
                        </button>
                    </div>

                    <div style={{ display: 'grid', gap: '2rem' }}>
                        {teacherData.list.map(teacher => (
                            <div key={teacher.id} className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                                {/* Teacher Header */}
                                <div style={{
                                    padding: '1.5rem',
                                    borderBottom: '1px solid var(--border-glass)',
                                    background: 'rgba(255,255,255,0.02)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    flexWrap: 'wrap',
                                    gap: '1rem'
                                }}>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Briefcase size={18} color="var(--primary)" />
                                            {teacher.name}
                                        </h3>
                                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                            <span>{teacher.specialty || 'Sem especialidade'}</span>
                                            {teacher.paymentDay && (
                                                <span style={{ color: '#fbbf24' }}>• Dia Pagto: {teacher.paymentDay}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Receita Gerada</div>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#10b981' }}>{formatCurrency(teacher.totalRevenue)}</div>
                                    </div>
                                </div>

                                {/* Student List for this Teacher */}
                                <div style={{ overflowX: 'auto' }}>
                                    <table className="reports-table-responsive">
                                        <thead>
                                            <tr style={{ background: 'var(--bg-glass)', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                                <th style={{ padding: '0.75rem 1.5rem' }}>Aluno(a) vinculados</th>
                                                <th style={{ padding: '0.75rem 1.5rem' }}>Status</th>
                                                <th style={{ padding: '0.75rem 1.5rem', textAlign: 'right' }}>Mensalidade</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {teacher.studentList.length > 0 ? (
                                                teacher.studentList.map(s => (
                                                    <tr key={s.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                                                        <td style={{ padding: '0.75rem 1.5rem' }}>{s.name}</td>
                                                        <td style={{ padding: '0.75rem 1.5rem' }}>
                                                            <span style={{
                                                                fontSize: '0.75rem',
                                                                padding: '0.1rem 0.5rem',
                                                                borderRadius: '10px',
                                                                background: (translateStatus(s.status) === 'Ativo') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                                color: (translateStatus(s.status) === 'Ativo') ? '#10b981' : '#ef4444'
                                                            }}>
                                                                {translateStatus(s.status)}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: '0.75rem 1.5rem', textAlign: 'right' }}>{formatCurrency(s.price || 0)}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="3" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                                        Nenhum aluno vinculado a este professor.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                        {teacher.studentList.length > 0 && (
                                            <tfoot style={{ background: 'rgba(255,255,255,0.02)' }}>
                                                <tr>
                                                    <td colSpan="2" style={{ padding: '0.75rem 1.5rem', textAlign: 'right', fontWeight: '600', color: 'var(--text-muted)' }}>
                                                        Total ({teacher.activeCount} ativos):
                                                    </td>
                                                    <td style={{ padding: '0.75rem 1.5rem', textAlign: 'right', fontWeight: 'bold' }}>
                                                        {formatCurrency(teacher.totalRevenue)}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        )}
                                    </table>
                                </div>
                            </div>
                        ))}

                        {teacherData.list.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                                Nenhum professor cadastrado.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reports;
