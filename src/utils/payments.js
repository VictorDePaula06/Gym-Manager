// Lógica financeira centralizada — fonte única de verdade para status de pagamento.
// Evita as cópias divergentes que existiam em Financial, Dashboard e portal do aluno.

// Quantos meses cada plano cobre.
export const planCycleMonths = (plan) => {
    const p = (plan || '').toLowerCase();
    if (p.includes('trimestral') || p.includes('quarterly')) return 3;
    if (p.includes('semestral') || p.includes('semiannual')) return 6;
    if (p.includes('anual') || p.includes('annual')) return 12;
    return 1; // mensal (padrão)
};

const toDate = (value) => {
    if (!value) return null;
    const d = value.seconds ? new Date(value.seconds * 1000) : new Date(value);
    return isNaN(d.getTime()) ? null : d;
};

// Próxima data de vencimento. Usa o valor salvo; se não houver, calcula a primeira
// ocorrência do dia de pagamento a partir do último pagamento ou da data de início.
export const getNextPaymentDate = (student) => {
    const saved = toDate(student?.nextPaymentDate);
    if (saved) return saved;

    const day = parseInt(student?.paymentDay);
    if (isNaN(day)) return null;

    const base = toDate(student?.lastPaymentDate) || toDate(student?.startDate);
    if (!base) return null;

    const due = new Date(base.getFullYear(), base.getMonth(), day, 12, 0, 0);
    if (due < base) due.setMonth(due.getMonth() + 1);
    return due;
};

// Primeira data de vencimento para um aluno recém-cadastrado (usada no cadastro).
export const computeFirstDueDate = (startDate, paymentDay) => {
    const day = parseInt(paymentDay);
    if (isNaN(day)) return null;
    const base = toDate(startDate) || new Date();
    const due = new Date(base.getFullYear(), base.getMonth(), day, 12, 0, 0);
    if (due < base) due.setMonth(due.getMonth() + 1);
    return due;
};

// Dias de "período de início" para o aluno que ainda não fez o 1º pagamento.
export const FIRST_PAYMENT_GRACE_DAYS = 5;

// Status completo: vencimento, se está atrasado, quantos dias e QUANTAS mensalidades em aberto.
export const getPaymentStatus = (student) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Aluno que ainda NÃO tem NENHUM pagamento registrado: período de início
    // (X dias) e depois vira pendente. Pega tanto quem foi marcado no cadastro
    // (awaitingFirstPayment) quanto quem simplesmente nunca pagou.
    const neverPaid = !toDate(student?.lastPaymentDate)
        && !(Array.isArray(student?.paymentHistory) && student.paymentHistory.some(p => p?.status === 'Paid'));
    if (student?.awaitingFirstPayment || neverPaid) {
        const start = toDate(student.startDate) || today;
        const graceEnd = new Date(start);
        graceEnd.setHours(0, 0, 0, 0);
        graceEnd.setDate(graceEnd.getDate() + FIRST_PAYMENT_GRACE_DAYS);
        const daysRemaining = Math.ceil((graceEnd - today) / (1000 * 60 * 60 * 24));
        const withinGrace = today <= graceEnd;
        return {
            next: graceEnd,
            isOverdue: !withinGrace,
            daysRemaining,
            cyclesOverdue: withinGrace ? 0 : 1,
            awaitingFirst: withinGrace,
            neverPaid: true,
        };
    }

    const next = getNextPaymentDate(student);

    if (!next) {
        return { next: null, isOverdue: false, daysRemaining: null, cyclesOverdue: 0, awaitingFirst: false, neverPaid: false };
    }

    const n = new Date(next);
    n.setHours(0, 0, 0, 0);
    const daysRemaining = Math.ceil((n - today) / (1000 * 60 * 60 * 24));
    const isOverdue = n < today;

    // Conta quantos vencimentos já passaram (não pagos) desde a próxima data devida.
    let cyclesOverdue = 0;
    if (isOverdue) {
        const months = planCycleMonths(student?.plan);
        const cursor = new Date(n);
        while (cursor <= today && cyclesOverdue < 60) {
            cyclesOverdue++;
            cursor.setMonth(cursor.getMonth() + months);
        }
    }

    return { next, isOverdue, daysRemaining, cyclesOverdue, awaitingFirst: false, neverPaid: false };
};
