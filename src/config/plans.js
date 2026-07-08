// Definição central dos planos do personal (tenant).
// Bronze: grátis, limitado, sem IA. Prata: IA + 40 alunos. Ouro: tudo ilimitado.
export const PLANS = {
    bronze: {
        id: 'bronze',
        name: 'Bronze',
        color: '#b45309',      // amber-700
        maxStudents: 15,
        ai: false,
        price: 0,
    },
    prata: {
        id: 'prata',
        name: 'Prata',
        color: '#94a3b8',      // slate-400
        maxStudents: 40,
        ai: true,
    },
    ouro: {
        id: 'ouro',
        name: 'Ouro',
        color: '#eab308',      // yellow-500
        maxStudents: Infinity,
        ai: true,
    },
};

export const DEFAULT_PLAN = 'bronze';

// Retorna a config do plano (fallback pro Bronze se id inválido).
export function planLimits(planId) {
    return PLANS[planId] || PLANS[DEFAULT_PLAN];
}

// Resolve o plano EFETIVO do tenant a partir do estado da conta.
// - `tier` é o campo do tenant (bronze/prata/ouro) — definido pelo admin ou
//   pelo pagamento. Tem prioridade máxima (ex: admin dá Ouro de brinde).
// - Acesso vitalício ou assinante pago legado (plano único antigo) => Ouro.
// - Durante o teste de 7 dias => Ouro (sente o produto completo).
// - Teste expirado sem tier/pagamento => cai pro Bronze grátis.
// Obs: NÃO confundir com o campo `plan` do tenant, que guarda o ciclo de
// cobrança (monthly/annual/trial) usado no faturamento.
export function resolvePlan({ tier, lifetimeAccess, paidSubscriber, trialActive }) {
    if (tier && PLANS[tier]) return tier;
    if (lifetimeAccess) return 'ouro';
    if (paidSubscriber) return 'ouro';
    if (trialActive) return 'ouro';
    return DEFAULT_PLAN;
}

// true quando o limite de alunos foi atingido.
export function isStudentLimitReached(planId, currentCount) {
    const { maxStudents } = planLimits(planId);
    return currentCount >= maxStudents;
}
