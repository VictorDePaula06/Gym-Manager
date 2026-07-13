// Check-in periódico do aluno (feedback semanal / a cada N treinos).
// Perguntas padrão — o personal pode editar em Configurações.
export const DEFAULT_CHECKIN = {
    enabled: true,
    cadence: 'weekly',   // 'weekly' | 'workouts'
    threshold: 5,        // usado quando cadence === 'workouts'
    questions: [
        { id: 'treino', label: 'Como foram seus treinos essa semana?', type: 'scale' },
        { id: 'alimentacao', label: 'Como está sua alimentação?', type: 'scale' },
        { id: 'energia', label: 'Nível de disposição / energia', type: 'scale' },
        { id: 'fadiga', label: 'Nível de cansaço / fadiga', type: 'scale' },
        { id: 'sono', label: 'Qualidade do sono', type: 'scale' },
        { id: 'peso', label: 'Peso atual (kg)', type: 'number' },
        { id: 'progresso', label: 'Sentiu progresso nos treinos?', type: 'choice', options: ['Sim', 'Mais ou menos', 'Não'] },
        { id: 'comentario', label: 'Quer falar algo pro seu personal?', type: 'text' },
    ],
};

// Normaliza a config vinda do banco (garante campos e perguntas válidas).
export function normalizeCheckin(cfg) {
    if (!cfg || !Array.isArray(cfg.questions) || cfg.questions.length === 0) return DEFAULT_CHECKIN;
    return {
        enabled: cfg.enabled !== false,
        cadence: cfg.cadence === 'workouts' ? 'workouts' : 'weekly',
        threshold: Number(cfg.threshold) > 0 ? Number(cfg.threshold) : 5,
        questions: cfg.questions,
    };
}

// Decide se o aluno deve ver o check-in agora.
export function isCheckinDue({ config, lastCheckinAt, workoutsSinceLast }) {
    if (!config || config.enabled === false) return false;
    if (config.cadence === 'workouts') {
        return (workoutsSinceLast || 0) >= (config.threshold || 5);
    }
    // semanal: passou 7 dias desde o último (ou nunca fez)
    if (!lastCheckinAt) return true;
    const days = (Date.now() - new Date(lastCheckinAt).getTime()) / 86400000;
    return days >= 7;
}
