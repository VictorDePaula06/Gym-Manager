// Volume Load = Séries × Repetições × Carga, somado por exercício.
// Métrica clássica de treinamento de força pra acompanhar progressão semanal.

// Extrai um número de um campo que pode vir como "12", "10-12", "40kg", "" etc.
// Faixas (ex: "10-12") são resolvidas pela média.
const parseNumeric = (value) => {
    if (value === undefined || value === null || value === '') return 0;
    const str = String(value).replace(',', '.');
    const nums = str.match(/\d+(\.\d+)?/g);
    if (!nums || nums.length === 0) return 0;
    if (nums.length >= 2) {
        // Faixa tipo "10-12" ou "8 a 10"
        const a = parseFloat(nums[0]);
        const b = parseFloat(nums[1]);
        return (a + b) / 2;
    }
    return parseFloat(nums[0]);
};

// Volume load de UM exercício. Só conta exercícios com carga externa (kg) —
// exercícios de peso corporal (sem carga) não entram no total em kg.
export const exerciseVolumeLoad = (ex) => {
    const sets = parseNumeric(ex?.sets);
    const reps = parseNumeric(ex?.reps);
    const weight = parseNumeric(ex?.weight);
    if (!weight) return 0;
    return sets * reps * weight;
};

// Volume load total de um treino (soma de todos os exercícios da ficha).
export const workoutVolumeLoad = (exercises) => {
    if (!Array.isArray(exercises)) return 0;
    return exercises.reduce((sum, ex) => sum + exerciseVolumeLoad(ex), 0);
};

// Segunda-feira 00:00 da semana de uma data (ISO).
const startOfWeek = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay(); // 0 = domingo
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d;
};

// Agrupa os training_logs por semana (segunda a domingo) e soma o volumeLoad.
// Retorna as últimas `weeks` semanas, mais antiga primeiro, prontas pro gráfico.
export const weeklyVolumeLoad = (logs, weeks = 6) => {
    const buckets = new Map(); // key: timestamp da segunda-feira -> soma
    (logs || []).forEach((log) => {
        const vl = log.volumeLoad;
        if (!vl || !log.completedAt) return;
        const weekStart = startOfWeek(log.completedAt);
        const key = weekStart.getTime();
        buckets.set(key, (buckets.get(key) || 0) + vl);
    });

    const now = new Date();
    const thisWeekStart = startOfWeek(now).getTime();
    const result = [];
    for (let i = weeks - 1; i >= 0; i--) {
        const weekStart = new Date(thisWeekStart);
        weekStart.setDate(weekStart.getDate() - i * 7);
        const key = weekStart.getTime();
        result.push({
            weekStart: key,
            label: weekStart.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            volume: Math.round(buckets.get(key) || 0),
        });
    }
    return result;
};
