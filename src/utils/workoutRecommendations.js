
// --- EXERCISE BANK ---
const EXERCISE_BANK = {
    // CHEST
    'supino_reto': [
        { name: 'Supino Reto (Barra)' }, { name: 'Supino Reto (Halteres)' }, { name: 'Supino Máquina (Sentado)' }
    ],
    'supino_inclinado': [
        { name: 'Supino Inclinado (Halteres)' }, { name: 'Supino Inclinado (Barra)' }, { name: 'Supino Inclinado (Máquina)' }
    ],
    'peck_deck': [
        { name: 'Crucifixo (Peck Deck)' }, { name: 'Crucifixo (Halteres)' }, { name: 'Crossover (Polia Alta)' }
    ],
    // BACK
    'puxada': [
        { name: 'Puxada Frontal (Aberta)' }, { name: 'Puxada Triângulo (Fechada)' }, { name: 'Puxada Articulada' }
    ],
    'remada': [
        { name: 'Remada Curvada (Barra)' }, { name: 'Remada Baixa (Triângulo)' }, { name: 'Remada Cavalinho' }, { name: 'Remada Unilateral (Serrote)' }
    ],
    // LEGS
    'agachamento': [
        { name: 'Agachamento Livre' }, { name: 'Agachamento Smith' }, { name: 'Agachamento Hack' }
    ],
    'leg_press': [
        { name: 'Leg Press 45º' }, { name: 'Leg Press Horizontal' }
    ],
    // SHOULDERS
    'desenvolvimento': [
        { name: 'Desenvolvimento Militar (Barra)' }, { name: 'Desenvolvimento (Halteres)' }, { name: 'Desenvolvimento Máquina' }
    ],
    'lateral': [
        { name: 'Elevação Lateral (Halteres)' }, { name: 'Elevação Lateral (Polia)' }, { name: 'Elevação Lateral (Máquina)' }
    ],
    // ARMS
    'biceps_curls': [
        { name: 'Rosca Direta (Barra)' }, { name: 'Rosca Direta (Halteres)' }, { name: 'Rosca Scott' }, { name: 'Rosca Polia' }
    ],
    'triceps_ext': [
        { name: 'Tríceps Corda' }, { name: 'Tríceps Testa' }, { name: 'Tríceps Pulley (Barra)' }, { name: 'Tríceps Francês' }
    ]
};

const getRandomExercise = (key, defaultEx) => {
    const options = EXERCISE_BANK[key];
    if (!options) return defaultEx;
    const choice = options[Math.floor(Math.random() * options.length)];
    return { id: crypto.randomUUID(), ...choice, sets: defaultEx.sets, reps: defaultEx.reps, weight: '' };
};

export const generateWorkout = (student, overrideLevel) => {
    const age = parseInt(student.age) || 30;
    const goal = (student.objective || '').toLowerCase();

    let level = (overrideLevel || student.level || 'iniciante').toLowerCase();
    const gender = (student.sex || student.gender || '').toLowerCase();

    // Parse Frequency
    let frequency = 3;
    if (student.trainingFrequency) {
        const parsed = parseInt(student.trainingFrequency.replace(/\D/g, ''));
        if (!isNaN(parsed) && parsed > 0) frequency = parsed;
    }

    // Parse Limitations & Diseases
    const invalidTerms = ['nenhuma', 'nenhum', 'não se aplica', 'nao se aplica', 'n/a', ''];

    let limitations = [];
    if (student.limitations) {
        limitations = student.limitations.split(',').map(l => l.trim().toLowerCase()).filter(l => !invalidTerms.includes(l));
    }

    let diseases = [];
    if (student.diseases) {
        diseases = student.diseases.split(',').map(d => d.trim().toLowerCase()).filter(d => !invalidTerms.includes(d));
    }

    let recommendation = {};
    let sheetName = "Treino Personalizado";

    // --- CARDIO LOGIC ---
    const getCardio = () => {
        if (goal.includes('emagreci') || goal.includes('perda')) {
            return { id: crypto.randomUUID(), name: 'Esteira (HIIT: 1min Forte / 1min Leve)', sets: 1, reps: '20 min', weight: '' };
        }
        if (age > 60) {
            return { id: crypto.randomUUID(), name: 'Caminhada Moderada ou Bike', sets: 1, reps: '15-20 min', weight: '' };
        }
        return { id: crypto.randomUUID(), name: 'Cardio Livre (Esteira/Bike/Elíptico)', sets: 1, reps: '15 min', weight: '' };
    };

    // --- STRATEGY SELECTION ---
    if (age > 60) {
        recommendation = getElderlyTemplate(student.diseases || '');
        sheetName = "Melhor Idade / Adaptação";
    } else if (age < 18) {
        recommendation = getTeenTemplate();
        sheetName = "Iniciante / Teen (Aprendizado Motor)";
    } else if (goal.includes('emagreci') || goal.includes('perda')) {
        recommendation = getWeightLossTemplate(level, frequency);
        sheetName = "Emagrecimento & Metabólico";
    } else if (level === 'iniciante') {
        // Beginner Logic
        if (frequency >= 4) {
            recommendation = getAdaptationABCTemplate(gender);
            sheetName = "Adaptação ABC (Intro à Divisão)";
        } else {
            recommendation = getAdaptationTemplate(frequency, gender);
            sheetName = gender === 'feminino' || gender === 'female' ? "Adaptação (Feminino)" : "Adaptação / Iniciante";
        }
    } else {
        // Hypertrophy / Strength Logic
        if (frequency <= 2) {
            recommendation = getFullBodyTemplate();
            sheetName = "Fullbody (2x Semana)";
        } else if (frequency === 3) {
            recommendation = getHypertrophyABC(gender);
            sheetName = gender === 'feminino' || gender === 'female' ? "Hipertrofia (Foco Inferiores)" : "Hipertrofia PPL (Push/Pull/Legs)";
        } else if (frequency === 4) {
            recommendation = getHypertrophyABCD(gender);
            sheetName = "Hipertrofia ABCD";
        } else {
            recommendation = getHypertrophyABCDE(gender);
            sheetName = "Hipertrofia ABCDE (Intenso)";
        }
    }

    // --- ADVANCED LEVEL LOGIC ---
    if (level === 'avançado' || level === 'avancado') {
        recommendation = applyAdvancedTechniques(recommendation);
        sheetName += " (Advanced)";
    }

    // Append Cardio if not already present in circuit
    if (!sheetName.includes('Emagrecimento')) {
        Object.keys(recommendation).forEach(key => {
            recommendation[key].exercises.push(getCardio());
        });
    }

    // --- LIMITATION & DISEASE FILTERING ---
    if (limitations.length > 0 || diseases.length > 0) {
        recommendation = applyHealthRestrictions(recommendation, limitations, diseases);
        sheetName += " (Adaptado)";
    }

    const needsReview = limitations.length > 0 || diseases.length > 0;
    const reviewReason = [
        ...limitations.map(l => l.charAt(0).toUpperCase() + l.slice(1)),
        ...diseases.map(d => d.charAt(0).toUpperCase() + d.slice(1))
    ].join(', ');

    // --- FINAL CLEANUP (Deduplication) ---
    recommendation = removeDuplicates(recommendation);

    return {
        name: sheetName,
        workouts: recommendation,
        needsProfessionalReview: needsReview,
        reviewReason: reviewReason
    };
};

// --- ADVANCED TECHNIQUE LOGIC ---
const applyAdvancedTechniques = (workouts) => {
    const newWorkouts = JSON.parse(JSON.stringify(workouts));

    // Exercises to swap for advanced versions
    const replacements = {
        'supino máquina': 'Supino c/ Halteres (Amplitude Max)',
        'supino reto': 'Supino c/ Halteres (Amplitude Max)',
        'puxada frontal': 'Barra Fixa (ou Graviton)',
        'leg press': 'Agachamento Búlgaro (Halteres)',
        'leg press 45': 'Agachamento Búlgaro (Halteres)',
        'rosca direta': 'Rosca 21 (Técnica Avançada)',
        'tríceps corda': 'Tríceps Testa + Supinado (Bi-set)',
        'elevação lateral': 'Elevação Lateral (Drop-set mecânico)',
        'cadeira extensora': 'Cadeira Extensora (Pico de Contração 2s)',
        'mesa flexora': 'Mesa Flexora (Negativa Lenta 3s)',
        'agachamento livre': 'Agachamento (Pausa 2s embaixo)'
    };

    Object.keys(newWorkouts).forEach(key => {
        const division = newWorkouts[key];

        // 1. Apply Advanced Variations (Substitutions)
        division.exercises = division.exercises.map(ex => {
            const lowerName = ex.name.toLowerCase();
            const match = Object.keys(replacements).find(k => lowerName.includes(k));

            if (match) {
                return {
                    ...ex,
                    name: replacements[match],
                    notes: (ex.notes ? ex.notes + '. ' : '') + 'Variação Avançada'
                };
            }
            return ex;
        });

        // 2. Increase Volume (Sets) for first 2 exercises
        division.exercises.slice(0, 2).forEach(ex => {
            if (ex.sets === 3) ex.sets = 4;
            if (typeof ex.sets === 'string' && ex.sets.includes('3')) ex.sets = 4;
            // If already 4, add a technique note
            if (ex.sets === 4) {
                ex.notes = (ex.notes ? ex.notes + '. ' : '') + 'Falha Concêntrica';
            }
        });

        // 3. Add Drop-sets to the last isolation exercise before cardio
        const exercisesInOrder = division.exercises;
        for (let i = exercisesInOrder.length - 2; i >= 0; i--) {
            const ex = exercisesInOrder[i];
            const name = ex.name.toLowerCase();
            // Apply drop to safe isolation movements
            // Expanded list to catch more exercises (Abdutora, Glúteo, etc)
            if (name.includes('extensora') || name.includes('flexora') || name.includes('lateral') || name.includes('corda') || name.includes('rosca') || name.includes('abdutora') || name.includes('adutora') || name.includes('glúteo') || name.includes('gluteo') || name.includes('panturrilha') || name.includes('peck') || name.includes('crucifixo')) {
                ex.reps = '10 + 10 + 10 (Drop-set)';
                ex.notes = (ex.notes ? ex.notes + '. ' : '') + 'Reduzir 20% carga a cada falha';
                break; // Apply only once per workout
            }
        }
    });

    return newWorkouts;
};

// --- RESTRICTION LOGIC ---
const applyHealthRestrictions = (workouts, limitations, diseases) => {
    const newWorkouts = JSON.parse(JSON.stringify(workouts)); // Deep copy

    const hasKneeIssue = limitations.some(l => l.includes('joelho') || l.includes('condromalácia') || l.includes('condromalacia'));
    const hasAnkleIssue = limitations.some(l => l.includes('tornozelo') || l.includes('pé'));
    const hasHipIssue = limitations.some(l => l.includes('quadril'));
    const hasShoulderIssue = limitations.some(l => l.includes('ombro'));
    const hasSpineIssue = limitations.some(l => l.includes('coluna') || l.includes('lombar') || l.includes('hernia') || l.includes('h\u00e9rnia') || l.includes('costas'));

    const hasHypertension = diseases.some(d => d.includes('hipertensão') || d.includes('pressão'));
    const hasHeartCondition = diseases.some(d => d.includes('cardio') || d.includes('coração'));
    const hasLabrynthitis = diseases.some(d => d.includes('labirintite'));
    const hasDiabetes = diseases.some(d => d.includes('diabetes') || d.includes('diabético'));
    const hasAsthma = diseases.some(d => d.includes('asma') || d.includes('bronquite'));

    const avoidImpact = hasKneeIssue || hasAnkleIssue || hasHipIssue || hasLabrynthitis || hasSpineIssue;

    Object.keys(newWorkouts).forEach(key => {
        const division = newWorkouts[key];
        division.exercises = division.exercises.map(ex => {
            const exName = ex.name.toLowerCase();
            let newEx = { ...ex };

            // --- HIGH IMPACT CARDIO REPLACEMENT ---
            if (avoidImpact) {
                if (exName.includes('polichinelo') || exName.includes('corrida') || exName.includes('burpee') || exName.includes('saltos') || exName.includes('esteira (hiit')) {
                    if (hasLabrynthitis && exName.includes('burpee')) {
                        return { ...newEx, name: 'Agachamento com Elevação de Panturrilha' };
                    }
                    if (exName.includes('burpee')) return { ...newEx, name: 'Sprawl (Sem salto)' };
                    if (exName.includes('polichinelo')) return { ...newEx, name: 'Deslocamento Lateral (Passo)', notes: 'Sem saltar' };
                    if (exName.includes('corrida') || exName.includes('esteira')) return { ...newEx, name: 'Elíptico / Bike', notes: 'Baixo impacto' };
                }
            }

            // --- DIABETES ---
            if (hasDiabetes) {
                // Precaution note
                newEx.notes = (newEx.notes ? newEx.notes + '. ' : '') + 'Monitorar glicemia / Intensidade Moderada';
            }

            // --- ASMA / BRONQUITE ---
            if (hasAsthma) {
                if (exName.includes('hiit') || exName.includes('coração')) {
                    return { ...newEx, name: 'Caminhada (Ritmo Constante)', notes: 'Evitar picos extenuantes' };
                }
                newEx.notes = (newEx.notes ? newEx.notes + '. ' : '') + 'Descanso aumentado se necessário';
            }

            // --- HIPERTENSÃO / CARDIO ---
            if (hasHypertension || hasHeartCondition) {
                // Avoid head below heart or intense isometrics
                if (exName.includes('burpee') || exName.includes('sprawl')) {
                    return { ...newEx, name: 'Polichinelo Adaptado (Sem salto)', notes: 'Ritmo moderado' };
                }
                if (exName.includes('prancha')) {
                    return { ...newEx, name: 'Abdominal Supra (Curto)', notes: 'Não segurar o ar' };
                }
                // Warning note on Leg Press (often raises blood pressure significantly)
                if (exName.includes('leg press')) {
                    newEx.notes = (newEx.notes ? newEx.notes + '. ' : '') + 'Não prender a respiração';
                }
                // HIIT precaution
                if (exName.includes('hiit')) {
                    return { ...newEx, name: 'Caminhada Moderada (Contínua)', notes: 'Frequência Cardíaca Controlada' };
                }
            }

            // --- LABIRINTITE ---
            if (hasLabrynthitis) {
                if (exName.includes('abdominal') && !exName.includes('máquina')) {
                    return { ...newEx, name: 'Abdominal Máquina (Sentado)', notes: 'Evitar deitar/levantar rápido' };
                }
                if (exName.includes('burpee') || exName.includes('sprawl')) {
                    return { ...newEx, name: 'Agachamento Isométrico (Parede)' };
                }
            }

            // --- JOINTS SPECIFIC ---

            // JOELHO & CONDROMALÁCIA
            if (hasKneeIssue) {
                // Specific substitutions first
                if (exName.includes('sumô') || exName.includes('sumo')) {
                    return { ...newEx, name: 'Elevação Pélvica (No Chão ou Banco)', notes: 'Foco Glúteo / Baixo Impacto' };
                }

                if (exName.includes('agachamento') && !exName.includes('bola')) {
                    return { ...newEx, name: 'Agachamento na Bola (Parede)', weight: 'Leve', notes: 'Amplitude sem dor' };
                }
                if (exName.includes('afundo') || exName.includes('passada') || exName.includes('stiff')) {
                    return { ...newEx, name: 'Mesa Flexora', reps: '15' };
                }
                if (exName.includes('extensora')) {
                    // Condromalacia precaution: Avoid full extension often
                    return { ...newEx, name: 'Cadeira Extensora (Isometria)', reps: '30 seg', notes: 'Ângulo de conforto (não estender tudo)' };
                }
                if (exName.includes('leg press')) {
                    newEx.notes = (newEx.notes ? newEx.notes + '. ' : '') + 'Não estender joelho totalmente';
                }
            }

            // QUADRIL
            if (hasHipIssue) {
                if (exName.includes('agachamento profundo') || exName.includes('leg press')) {
                    return { ...newEx, name: 'Agachamento com Bola (Amplitude reduzida)' };
                }
                if (exName.includes('abdutora')) {
                    return { ...newEx, name: 'Abdução de Quadril (Pé)', notes: 'Com caneleira leve' };
                }
            }

            // TORNOZELO
            if (hasAnkleIssue) {
                if (exName.includes('panturrilha em pé')) {
                    return { ...newEx, name: 'Panturrilha Sentado', notes: 'Menor carga no tornozelo' };
                }
                if (exName.includes('agachamento')) {
                    return { ...newEx, name: 'Leg Press Alto', notes: 'Pés mais altos na plataforma' };
                }
            }

            // OMBRO
            if (hasShoulderIssue) {
                if (exName.includes('desenvolvimento') || exName.includes('elevação lateral') || exName.includes('supino inclinado')) {
                    if (exName.includes('desenvolvimento')) return { ...newEx, name: 'Elevação Frontal', weight: 'Halteres' };
                    if (exName.includes('supino')) return { ...newEx, name: 'Supino Máquina (Pegada Neutra)' };
                    if (exName.includes('elevação lateral')) return { ...newEx, name: 'Elástico (Manguito Externo)', reps: '15' };
                    if (exName.includes('puxada') || exName.includes('pulley')) return { ...newEx, name: 'Puxada Triângulo (Fechada)' };
                }
                if (exName.includes('flexão de braços')) {
                    return { ...newEx, name: 'Supino Vertical (Máquina)', notes: 'Pegada neutra se possível' };
                }
            }

            // COLUNA & HÉRNIA
            if (hasSpineIssue) {
                if (exName.includes('agachamento livre') || exName.includes('terra') || exName.includes('remada curvada') || exName.includes('stiff')) {
                    if (exName.includes('remada')) return { ...newEx, name: 'Remada Máquina (Peito Apoiado)' };
                    if (exName.includes('agachamento') || exName.includes('terra')) return { ...newEx, name: 'Leg Press 45', notes: 'Apoiar bem a cabeça e lombar' };
                    if (exName.includes('stiff')) return { ...newEx, name: 'Mesa Flexora' };
                }
                if (exName.includes('desenvolvimento')) {
                    return { ...newEx, name: 'Elevação Frontal (Sentado)', notes: 'Costas apoiadas' };
                }
                if (exName.includes('abdominal') && !exName.includes('prancha')) {
                    return { ...newEx, name: 'Prancha Isométrica', notes: 'Estabilidade Core' };
                }
            }

            return newEx;
        });
    });

    return newWorkouts;
};

// --- DEDUPLICATION LOGIC ---
const removeDuplicates = (workouts) => {
    Object.keys(workouts).forEach(key => {
        const division = workouts[key];
        const seenNames = new Set();

        division.exercises = division.exercises.filter(ex => {
            if (!ex.name) return false;
            const cleanName = ex.name.trim().toLowerCase();

            // Check for duplicate names (exact match)
            if (seenNames.has(cleanName)) {
                return false;
            }

            seenNames.add(cleanName);
            return true;
        });
    });
    return workouts;
};



// --- TEMPLATES ---

const getTeenTemplate = () => ({
    'A': {
        name: 'A - Corpo Todo (Aprendizado)',
        exercises: [
            { id: crypto.randomUUID(), name: 'Agachamento (Peso do Corpo)', sets: 3, reps: '12-15', weight: 'Corporal' },
            { id: crypto.randomUUID(), name: 'Flexão de Braços (Apoio)', sets: 3, reps: '10-12', weight: 'Corporal' },
            { id: crypto.randomUUID(), name: 'Puxada Frontal', sets: 3, reps: '15', weight: '' },
            { id: crypto.randomUUID(), name: 'Elevação Lateral', sets: 3, reps: '15', weight: '' },
            { id: crypto.randomUUID(), name: 'Prancha Abdominal', sets: 3, reps: '20-30 seg', weight: '' }
        ]
    },
    'B': {
        name: 'B - Cardio e Core',
        exercises: [
            { id: crypto.randomUUID(), name: 'Polichinelo', sets: 3, reps: '1 min', weight: '' },
            { id: crypto.randomUUID(), name: 'Abdominal Supra (Chão)', sets: 3, reps: '15', weight: '' },
            { id: crypto.randomUUID(), name: 'Agachamento Isométrico (Parede)', sets: 3, reps: '30 seg', weight: '' },
            { id: crypto.randomUUID(), name: 'Corrida Estacionária', sets: 3, reps: '1 min', weight: '' }
        ]
    }
});

const getAdaptationABCTemplate = (gender) => {
    const isFemale = gender === 'feminino' || gender === 'female';

    return {
        'A': {
            name: 'A - Inferiores e Costas',
            exercises: [
                getRandomExercise('agachamento', { name: 'Agachamento Globet', sets: 3, reps: '15' }),
                getRandomExercise('leg_press', { name: 'Leg Press 45', sets: 3, reps: '15' }),
                getRandomExercise('puxada', { name: 'Puxada Frontal', sets: 3, reps: '15' }),
                getRandomExercise('remada', { name: 'Remada Sentada', sets: 3, reps: '15' }),
                { id: crypto.randomUUID(), name: 'Lombar (Extensão)', sets: 3, reps: '12', weight: '' }
            ]
        },
        'B': {
            name: 'B - Empurrar e Glúteo',
            exercises: [
                getRandomExercise('supino_reto', { name: 'Supino Máquina', sets: 3, reps: '15' }),
                getRandomExercise('desenvolvimento', { name: 'Desenvolvimento Máquina', sets: 3, reps: '15' }),
                { id: crypto.randomUUID(), name: 'Tríceps Corda', sets: 3, reps: '15', weight: '' },
                { id: crypto.randomUUID(), name: 'Elevação Pélvica', sets: 4, reps: '15', weight: '' },
                isFemale ? { id: crypto.randomUUID(), name: 'Glúteo Caneleira', sets: 3, reps: '15', weight: '' } : { id: crypto.randomUUID(), name: 'Elevação Lateral', sets: 3, reps: '15', weight: '' }
            ]
        },
        'C': {
            name: 'C - Cardio, Core e Funcional',
            exercises: [
                { id: crypto.randomUUID(), name: 'Caminhada Rápida', sets: 1, reps: '10 min', weight: '' },
                { id: crypto.randomUUID(), name: 'Prancha Frontal', sets: 3, reps: '30 seg', weight: '' },
                { id: crypto.randomUUID(), name: 'Abdominal Supra', sets: 3, reps: '20', weight: '' },
                { id: crypto.randomUUID(), name: 'Polichinelo', sets: 3, reps: '40 seg', weight: '' },
                { id: crypto.randomUUID(), name: 'Alongamento Geral', sets: 1, reps: '5 min', weight: '' }
            ]
        }
    };
};

const getAdaptationTemplate = (frequency, gender) => {
    const isFemale = gender === 'feminino' || gender === 'female';

    if (isFemale) {
        return {
            'A': {
                name: 'Adaptação A (Foco Inferiores/Costas)',
                exercises: [
                    getRandomExercise('agachamento', { name: 'Agachamento Globet (Halter)', sets: 3, reps: '15' }),
                    getRandomExercise('leg_press', { name: 'Leg Press 45º', sets: 3, reps: '15' }),
                    getRandomExercise('puxada', { name: 'Puxada Frontal', sets: 3, reps: '15' }),
                    { id: crypto.randomUUID(), name: 'Glúteo na Polia (ou Caneleira)', sets: 3, reps: '15', weight: '' },
                    { id: crypto.randomUUID(), name: 'Abdominal Supra', sets: 3, reps: '20', weight: '' }
                ]
            },
            'B': {
                name: 'Adaptação B (Foco Post/Ombros)',
                exercises: [
                    { id: crypto.randomUUID(), name: 'Stiff (Halteres)', sets: 3, reps: '15', weight: '' },
                    { id: crypto.randomUUID(), name: 'Elevação Pélvica (Chão ou Banco)', sets: 3, reps: '15', weight: '' },
                    { id: crypto.randomUUID(), name: 'Mesa Flexora', sets: 3, reps: '15', weight: '' },
                    getRandomExercise('desenvolvimento', { name: 'Desenvolvimento Máquina', sets: 3, reps: '15' }),
                    getRandomExercise('lateral', { name: 'Elevação Lateral', sets: 3, reps: '15' }),
                    { id: crypto.randomUUID(), name: 'Tríceps Corda', sets: 3, reps: '15', weight: '' }
                ]
            }
        };
    }

    // Male / Generic Adaptation
    return {
        'A': {
            name: 'Adaptação A',
            exercises: [
                getRandomExercise('leg_press', { name: 'Leg Press 45º', sets: 3, reps: '15' }),
                getRandomExercise('supino_reto', { name: 'Supino Máquina', sets: 3, reps: '15' }),
                getRandomExercise('puxada', { name: 'Puxada Frontal', sets: 3, reps: '15' }),
                getRandomExercise('desenvolvimento', { name: 'Desenvolvimento Máquina', sets: 3, reps: '15' }),
                { id: crypto.randomUUID(), name: 'Abdominal Supra', sets: 3, reps: '20', weight: '' }
            ]
        },
        'B': {
            name: 'Adaptação B',
            exercises: [
                getRandomExercise('agachamento', { name: 'Agachamento Globet', sets: 3, reps: '15' }),
                getRandomExercise('remada', { name: 'Remada Sentada', sets: 3, reps: '15' }),
                { id: crypto.randomUUID(), name: 'Flexão de Braços (ou Joelho)', sets: 3, reps: '12', weight: '' },
                getRandomExercise('lateral', { name: 'Elevação Lateral', sets: 3, reps: '15' }),
                { id: crypto.randomUUID(), name: 'Prancha', sets: 3, reps: '30 seg', weight: '' }
            ]
        }
    };
};

const getElderlyTemplate = () => ({
    'A': {
        name: 'Fortalecimento Geral',
        exercises: [
            { id: crypto.randomUUID(), name: 'Sentar e Levantar (Banco)', sets: 3, reps: '12', weight: '' },
            { id: crypto.randomUUID(), name: 'Supino Vertical (Máquina)', sets: 3, reps: '12', weight: '' },
            { id: crypto.randomUUID(), name: 'Remada Sentada', sets: 3, reps: '12', weight: '' },
            { id: crypto.randomUUID(), name: 'Tríceps Polia', sets: 3, reps: '12', weight: '' },
            { id: crypto.randomUUID(), name: 'Panturrilha Sentado', sets: 3, reps: '15', weight: '' }
        ]
    }
});

const getWeightLossTemplate = (level, frequency) => {
    const lvl = (level || '').toLowerCase();

    // ADVANCED: High Volume (4 sets), Bi-sets, High Intensity
    if (lvl === 'avançado' || lvl === 'avancado' || lvl === 'advanced') {
        return {
            'A': {
                name: 'A - Inferiores High Intensity',
                exercises: [
                    { id: crypto.randomUUID(), name: 'Agachamento Livre', sets: 4, reps: '15', weight: '' },
                    { id: crypto.randomUUID(), name: 'Leg Press 45', sets: 4, reps: '15+15 (Drop)', weight: '' },
                    { id: crypto.randomUUID(), name: 'Afundo (Halteres)', sets: 3, reps: '12 cada', weight: '' },
                    { id: crypto.randomUUID(), name: 'Cadeira Extensora', sets: 4, reps: 'Falha', weight: '' },
                    { id: crypto.randomUUID(), name: 'Panturrilha em Pé', sets: 4, reps: '20', weight: '' },
                    { id: crypto.randomUUID(), name: 'HIIT (Esteira)', sets: 1, reps: '20 min', weight: '' }
                ]
            },
            'B': {
                name: 'B - Superiores e Core',
                exercises: [
                    { id: crypto.randomUUID(), name: 'Supino Reto + Flexão (Bi-set)', sets: 4, reps: '12+Falha', weight: '' },
                    { id: crypto.randomUUID(), name: 'Remada Curvada', sets: 4, reps: '12', weight: '' },
                    { id: crypto.randomUUID(), name: 'Desenvolvimento Arnold', sets: 4, reps: '12', weight: '' },
                    { id: crypto.randomUUID(), name: 'Puxada Frontal', sets: 3, reps: '15', weight: '' },
                    { id: crypto.randomUUID(), name: 'Elevação Lateral', sets: 4, reps: '15', weight: '' },
                    { id: crypto.randomUUID(), name: 'Abdominal Supra + Infra', sets: 4, reps: '20+20', weight: '' }
                ]
            },
            'C': {
                name: 'C - Fullbody Metabólico',
                exercises: [
                    { id: crypto.randomUUID(), name: 'Burpee', sets: 4, reps: '12', weight: '' },
                    { id: crypto.randomUUID(), name: 'Kettlebell Swing', sets: 4, reps: '20', weight: '' },
                    { id: crypto.randomUUID(), name: 'Man Maker (Completo)', sets: 3, reps: '10', weight: '' },
                    { id: crypto.randomUUID(), name: 'Thruster', sets: 3, reps: '12', weight: '' },
                    { id: crypto.randomUUID(), name: 'Prancha Dinâmica', sets: 3, reps: '1 min', weight: '' }
                ]
            }
        };
    }

    // INTERMEDIATE: Standard Volume (3 sets), ABC Split
    if (lvl === 'intermediário' || lvl === 'intermediario' || lvl === 'intermediate') {
        return {
            'A': {
                name: 'A - Inferiores e Cardio',
                exercises: [
                    { id: crypto.randomUUID(), name: 'Agachamento Globet', sets: 3, reps: '15', weight: '' },
                    { id: crypto.randomUUID(), name: 'Leg Press Horizontal', sets: 3, reps: '15', weight: '' },
                    { id: crypto.randomUUID(), name: 'Afundo Estático', sets: 3, reps: '12 cada', weight: '' },
                    { id: crypto.randomUUID(), name: 'Mesa Flexora', sets: 3, reps: '15', weight: '' },
                    { id: crypto.randomUUID(), name: 'Panturrilha Sentado', sets: 3, reps: '15', weight: '' },
                    { id: crypto.randomUUID(), name: 'Corrida Moderada', sets: 1, reps: '15 min', weight: '' }
                ]
            },
            'B': {
                name: 'B - Superiores',
                exercises: [
                    { id: crypto.randomUUID(), name: 'Supino Máquina', sets: 3, reps: '15', weight: '' },
                    { id: crypto.randomUUID(), name: 'Puxada Frontal', sets: 3, reps: '15', weight: '' },
                    { id: crypto.randomUUID(), name: 'Desenvolvimento Halteres', sets: 3, reps: '12', weight: '' },
                    { id: crypto.randomUUID(), name: 'Remada Baixa', sets: 3, reps: '15', weight: '' },
                    { id: crypto.randomUUID(), name: 'Rosca Direta', sets: 3, reps: '15', weight: '' },
                    { id: crypto.randomUUID(), name: 'Tríceps Polia', sets: 3, reps: '15', weight: '' }
                ]
            },
            'C': {
                name: 'C - Cardio e Funcional',
                exercises: [
                    { id: crypto.randomUUID(), name: 'Polichinelo', sets: 3, reps: '1 min', weight: '' },
                    { id: crypto.randomUUID(), name: 'Agachamento com Salto (ou Peso)', sets: 3, reps: '15', weight: '' },
                    { id: crypto.randomUUID(), name: 'Flexão de Braços (Joelhos)', sets: 3, reps: '12', weight: '' },
                    { id: crypto.randomUUID(), name: 'Abdominal Remador', sets: 3, reps: '20', weight: '' },
                    { id: crypto.randomUUID(), name: 'Prancha', sets: 3, reps: '45 seg', weight: '' }
                ]
            }
        };
    }

    // BEGINNER: AB Standard
    return {
        'A': {
            name: 'Circuito A - Inferiores/Cardio',
            exercises: [
                getRandomExercise('agachamento', { name: 'Agachamento Livre/Halter', sets: 3, reps: '15' }),
                { id: crypto.randomUUID(), name: 'Polichinelo', sets: 3, reps: '1 min', weight: '' },
                getRandomExercise('leg_press', { name: 'Leg Press', sets: 3, reps: '15' }),
                { id: crypto.randomUUID(), name: 'Corrida Estacionária', sets: 3, reps: '1 min', weight: '' },
                { id: crypto.randomUUID(), name: 'Cadeira Extensora', sets: 3, reps: '15', weight: '' }
            ]
        },
        'B': {
            name: 'Circuito B - Superiores/Core',
            exercises: [
                { id: crypto.randomUUID(), name: 'Flexão de Braços (Apoio)', sets: 3, reps: '12-15', weight: '' },
                getRandomExercise('puxada', { name: 'Puxada Alta', sets: 3, reps: '15' }),
                getRandomExercise('desenvolvimento', { name: 'Desenvolvimento Máquina', sets: 3, reps: '15' }),
                { id: crypto.randomUUID(), name: 'Mountain Climbers', sets: 3, reps: '40 seg', weight: '' },
                { id: crypto.randomUUID(), name: 'Burpee Adaptado', sets: 3, reps: '10', weight: '' }
            ]
        }
    };
};

const getFullBodyTemplate = () => ({
    'A': {
        name: 'Fullbody Geral',
        exercises: [
            getRandomExercise('agachamento', { name: 'Agachamento Livre', sets: 3, reps: '10' }),
            getRandomExercise('supino_reto', { name: 'Supino Reto', sets: 3, reps: '10' }),
            getRandomExercise('remada', { name: 'Remada Curvada', sets: 3, reps: '10' }),
            getRandomExercise('desenvolvimento', { name: 'Desenvolvimento Militar', sets: 3, reps: '10' }),
            { id: crypto.randomUUID(), name: 'Stiff', sets: 3, reps: '10', weight: '' }
        ]
    }
});

const getHypertrophyABC = (gender) => {
    const isFemale = gender === 'feminino' || gender === 'female';

    if (isFemale) {
        // Female Specific: Lower / Upper / Lower
        return {
            'A': {
                name: 'A - Inferiores (Foco Quadríceps)',
                exercises: [
                    getRandomExercise('agachamento', { name: 'Agachamento Livre', sets: 4, reps: '10' }),
                    { id: crypto.randomUUID(), name: 'Leg Press 45', sets: 4, reps: '12', weight: '' },
                    { id: crypto.randomUUID(), name: 'Cadeira Extensora', sets: 3, reps: '12+12 (Drop)', weight: '' },
                    { id: crypto.randomUUID(), name: 'Afundo com Halteres', sets: 3, reps: '12 cada', weight: '' },
                    { id: crypto.randomUUID(), name: 'Panturrilha em Pé', sets: 4, reps: '15', weight: '' }
                ]
            },
            'B': {
                name: 'B - Superiores e Abdomen',
                exercises: [
                    getRandomExercise('puxada', { name: 'Puxada Frontal', sets: 3, reps: '12' }),
                    getRandomExercise('supino_reto', { name: 'Supino Máquina', sets: 3, reps: '15' }),
                    getRandomExercise('desenvolvimento', { name: 'Desenvolvimento Máquina', sets: 3, reps: '12' }),
                    getRandomExercise('remada', { name: 'Remada Baixa', sets: 3, reps: '12' }),
                    { id: crypto.randomUUID(), name: 'Tríceps Corda', sets: 3, reps: '15', weight: '' },
                    { id: crypto.randomUUID(), name: 'Abdominal Supra', sets: 3, reps: '20', weight: '' }
                ]
            },
            'C': {
                name: 'C - Inferiores (Foco Glúteo/Posterior)',
                exercises: [
                    { id: crypto.randomUUID(), name: 'Elevação Pélvica', sets: 4, reps: '10-12', weight: '' },
                    { id: crypto.randomUUID(), name: 'Stiff c/ Barra', sets: 4, reps: '12', weight: '' },
                    { id: crypto.randomUUID(), name: 'Mesa Flexora', sets: 4, reps: '12', weight: '' },
                    { id: crypto.randomUUID(), name: 'Cadeira Abdutora', sets: 4, reps: '15-20', weight: '' },
                    { id: crypto.randomUUID(), name: 'Glúteo Caneleira (Coice)', sets: 3, reps: '15', weight: '' }
                ]
            }
        };
    }

    // Male Standard
    return {
        'A': {
            name: 'A - Empurrar (Peito/Ombro/Tríceps)',
            exercises: [
                getRandomExercise('supino_reto', { name: 'Supino Reto', sets: 4, reps: '8-12' }),
                getRandomExercise('supino_inclinado', { name: 'Supino Inclinado', sets: 3, reps: '10-12' }),
                getRandomExercise('desenvolvimento', { name: 'Desenvolvimento c/ Halteres', sets: 3, reps: '10' }),
                getRandomExercise('lateral', { name: 'Elevação Lateral', sets: 3, reps: '12-15' }),
                getRandomExercise('triceps_ext', { name: 'Tríceps Corda', sets: 3, reps: '12' })
            ]
        },
        'B': {
            name: 'B - Puxar (Costas/Bíceps)',
            exercises: [
                getRandomExercise('puxada', { name: 'Puxada Frontal', sets: 4, reps: '10-12' }),
                getRandomExercise('remada', { name: 'Remada Curvada', sets: 3, reps: '10' }),
                getRandomExercise('peck_deck', { name: 'Crucifixo Inverso', sets: 3, reps: '12' }),
                getRandomExercise('biceps_curls', { name: 'Rosca Direta', sets: 3, reps: '10-12' }),
                { id: crypto.randomUUID(), name: 'Rosca Martelo', sets: 3, reps: '12', weight: '' }
            ]
        },
        'C': {
            name: 'C - Inferiores Completo',
            exercises: [
                getRandomExercise('agachamento', { name: 'Agachamento Livre', sets: 4, reps: '8-10' }),
                getRandomExercise('leg_press', { name: 'Leg Press 45', sets: 4, reps: '12' }),
                { id: crypto.randomUUID(), name: 'Cadeira Extensora', sets: 3, reps: '15', weight: '' },
                { id: crypto.randomUUID(), name: 'Mesa Flexora', sets: 3, reps: '12', weight: '' },
                { id: crypto.randomUUID(), name: 'Panturrilha em Pé', sets: 4, reps: '15', weight: '' }
            ]
        }
    };
};

const getHypertrophyABCD = (gender) => {
    const isFemale = gender === 'feminino' || gender === 'female';

    if (isFemale) {
        // Female Specific: Lower / Upper / Lower / Full or Upper
        // A: Quadríceps e Panturrilha
        // B: Superiores Completo
        // C: Glúteos e Posteriores
        // D: Fullbody / Core / Cardio
        return {
            'A': {
                name: 'A - Inferiores (Foco Quadríceps)',
                exercises: [
                    getRandomExercise('agachamento', { name: 'Agachamento Livre', sets: 4, reps: '10' }),
                    { id: crypto.randomUUID(), name: 'Leg Press 45', sets: 4, reps: '12', weight: '' },
                    { id: crypto.randomUUID(), name: 'Cadeira Extensora', sets: 3, reps: '15', weight: '' },
                    { id: crypto.randomUUID(), name: 'Afundo com Halteres', sets: 3, reps: '12 cada', weight: '' },
                    { id: crypto.randomUUID(), name: 'Panturrilha em Pé', sets: 4, reps: '15', weight: '' }
                ]
            },
            'B': {
                name: 'B - Superiores Completo',
                exercises: [
                    getRandomExercise('puxada', { name: 'Puxada Frontal', sets: 3, reps: '12' }),
                    getRandomExercise('remada', { name: 'Remada Baixa', sets: 3, reps: '12' }),
                    getRandomExercise('desenvolvimento', { name: 'Desenvolvimento Máquina', sets: 3, reps: '12' }),
                    getRandomExercise('lateral', { name: 'Elevação Lateral', sets: 3, reps: '15' }),
                    { id: crypto.randomUUID(), name: 'Tríceps Corda', sets: 3, reps: '12', weight: '' }
                ]
            },
            'C': {
                name: 'C - Inferiores (Foco Glúteo/Post)',
                exercises: [
                    { id: crypto.randomUUID(), name: 'Elevação Pélvica', sets: 4, reps: '10-12', weight: '' },
                    { id: crypto.randomUUID(), name: 'Stiff c/ Barra', sets: 4, reps: '12', weight: '' },
                    { id: crypto.randomUUID(), name: 'Mesa Flexora', sets: 4, reps: '12', weight: '' },
                    { id: crypto.randomUUID(), name: 'Cadeira Abdutora', sets: 4, reps: '15-20', weight: '' },
                    { id: crypto.randomUUID(), name: 'Glúteo Caneleira (Coice)', sets: 3, reps: '15', weight: '' }
                ]
            },
            'D': {
                name: 'D - Cardio e Abdomen',
                exercises: [
                    { id: crypto.randomUUID(), name: 'Abdominal Supra', sets: 3, reps: '20', weight: '' },
                    { id: crypto.randomUUID(), name: 'Prancha', sets: 3, reps: '45 seg', weight: '' },
                    { id: crypto.randomUUID(), name: 'Abdominal Infra', sets: 3, reps: '15', weight: '' },
                    { id: crypto.randomUUID(), name: 'HIIT (Esteira)', sets: 1, reps: '20 min', weight: '' }
                ]
            }
        };
    }

    return {
        'A': {
            name: 'A - Costas e Trapézio',
            exercises: [
                { id: crypto.randomUUID(), name: 'Levantamento Terra', sets: 3, reps: '8', weight: '' },
                getRandomExercise('puxada', { name: 'Puxada Frontal', sets: 4, reps: '10' }),
                getRandomExercise('remada', { name: 'Remada Baixa', sets: 3, reps: '12' }),
                { id: crypto.randomUUID(), name: 'Serrote (Halter)', sets: 3, reps: '10', weight: '' },
                { id: crypto.randomUUID(), name: 'Encolhimento', sets: 3, reps: '15', weight: '' }
            ]
        },
        'B': {
            name: 'B - Peito e Ombros',
            exercises: [
                getRandomExercise('supino_reto', { name: 'Supino Reto', sets: 4, reps: '8-10' }),
                getRandomExercise('supino_inclinado', { name: 'Supino Inclinado', sets: 3, reps: '10' }),
                getRandomExercise('peck_deck', { name: 'Crucifixo', sets: 3, reps: '12' }),
                getRandomExercise('desenvolvimento', { name: 'Desenvolvimento Militar', sets: 3, reps: '10' }),
                getRandomExercise('lateral', { name: 'Elevação Lateral', sets: 4, reps: '12' })
            ]
        },
        'C': {
            name: 'C - Pernas Completas',
            exercises: [
                getRandomExercise('agachamento', { name: 'Agachamento Livre', sets: 4, reps: '10' }),
                getRandomExercise('leg_press', { name: 'Leg Press 45', sets: 4, reps: '12' }),
                { id: crypto.randomUUID(), name: 'Agachamento Sumô', sets: 3, reps: '12', weight: '' },
                { id: crypto.randomUUID(), name: 'Mesa Flexora', sets: 4, reps: '12', weight: '' },
                { id: crypto.randomUUID(), name: 'Panturrilha Sentado', sets: 4, reps: '15', weight: '' }
            ]
        },
        'D': {
            name: 'D - Braços (Bíceps e Tríceps)',
            exercises: [
                getRandomExercise('biceps_curls', { name: 'Rosca Direta', sets: 3, reps: '10' }),
                { id: crypto.randomUUID(), name: 'Rosca Scott', sets: 3, reps: '12', weight: '' },
                getRandomExercise('triceps_ext', { name: 'Tríceps Testa', sets: 3, reps: '10' }),
                { id: crypto.randomUUID(), name: 'Tríceps Polia', sets: 3, reps: '12', weight: '' },
                { id: crypto.randomUUID(), name: 'Rosca Martelo', sets: 3, reps: '12', weight: '' },
                { id: crypto.randomUUID(), name: 'Mergulho', sets: 3, reps: 'MAX', weight: '' }
            ]
        }
    };
};

const getHypertrophyABCDE = (gender) => {
    const isFemale = gender === 'feminino' || gender === 'female';

    if (isFemale) {
        // Female Split: 3 Leg days, 2 Upper days
        // A: Glúteos
        // B: Costas/Ombros
        // C: Quadríceps
        // D: Peito/Braços (Leve)
        // E: Posterior/Glúteos
        return {
            'A': {
                name: 'A - Glúteos (Foco Total)', exercises: [
                    { id: crypto.randomUUID(), name: 'Elevação Pélvica (Barra)', sets: 4, reps: '10', weight: '' },
                    { id: crypto.randomUUID(), name: 'Agachamento Sumô', sets: 4, reps: '12', weight: '' },
                    { id: crypto.randomUUID(), name: 'Cadeira Abdutora (Tronco inclinado)', sets: 4, reps: '15', weight: '' },
                    { id: crypto.randomUUID(), name: 'Glúteo Polia (Cabo)', sets: 3, reps: '15', weight: '' }
                ]
            },
            'B': {
                name: 'B - Costas e Ombros', exercises: [
                    getRandomExercise('puxada', { name: 'Puxada Frontal', sets: 4, reps: '12' }),
                    getRandomExercise('remada', { name: 'Remada Sentada', sets: 3, reps: '12' }),
                    getRandomExercise('desenvolvimento', { name: 'Desenvolvimento Máquina', sets: 3, reps: '12' }),
                    getRandomExercise('lateral', { name: 'Elevação Lateral', sets: 4, reps: '15' })
                ]
            },
            'C': {
                name: 'C - Quadríceps', exercises: [
                    getRandomExercise('agachamento', { name: 'Agachamento Livre', sets: 4, reps: '10' }),
                    getRandomExercise('leg_press', { name: 'Leg Press 45', sets: 4, reps: '12' }),
                    { id: crypto.randomUUID(), name: 'Cadeira Extensora', sets: 4, reps: '12+12 (Drop)', weight: '' },
                    { id: crypto.randomUUID(), name: 'Passada', sets: 3, reps: '12 cada', weight: '' }
                ]
            },
            'D': {
                name: 'D - Superiores (Geral)', exercises: [
                    getRandomExercise('supino_reto', { name: 'Supino Máquina', sets: 3, reps: '15' }),
                    { id: crypto.randomUUID(), name: 'Tríceps Corda', sets: 3, reps: '15', weight: '' },
                    { id: crypto.randomUUID(), name: 'Rosca Direta', sets: 3, reps: '15', weight: '' },
                    { id: crypto.randomUUID(), name: 'Abdominal Supra', sets: 4, reps: '20', weight: '' }
                ]
            },
            'E': {
                name: 'E - Posterior e Glúteo', exercises: [
                    { id: crypto.randomUUID(), name: 'Stiff', sets: 4, reps: '12', weight: '' },
                    { id: crypto.randomUUID(), name: 'Mesa Flexora', sets: 4, reps: '12', weight: '' },
                    { id: crypto.randomUUID(), name: 'Cadeira Flexora', sets: 3, reps: '15', weight: '' },
                    { id: crypto.randomUUID(), name: 'Panturrilha Sentado', sets: 4, reps: '15', weight: '' }
                ]
            }
        };
    }

    return {
        'A': {
            name: 'A - Peito', exercises: [
                getRandomExercise('supino_reto', { name: 'Supino Reto', sets: 4, reps: '8-10' }),
                getRandomExercise('supino_inclinado', { name: 'Supino Inclinado', sets: 3, reps: '10' }),
                getRandomExercise('peck_deck', { name: 'Crucifixo', sets: 3, reps: '12' }),
                { id: crypto.randomUUID(), name: 'Crossover', sets: 3, reps: '15', weight: '' }
            ]
        },
        'B': {
            name: 'B - Costas', exercises: [
                { id: crypto.randomUUID(), name: 'Levantamento Terra', sets: 3, reps: '8', weight: '' },
                getRandomExercise('puxada', { name: 'Puxada Frontal', sets: 4, reps: '10' }),
                getRandomExercise('remada', { name: 'Remada Curvada', sets: 3, reps: '10' }),
                { id: crypto.randomUUID(), name: 'Pulldown', sets: 3, reps: '15', weight: '' }
            ]
        },
        'C': {
            name: 'C - Pernas', exercises: [
                getRandomExercise('agachamento', { name: 'Agachamento Livre', sets: 4, reps: '10' }),
                getRandomExercise('leg_press', { name: 'Leg Press', sets: 4, reps: '12' }),
                { id: crypto.randomUUID(), name: 'Extensora', sets: 3, reps: '15', weight: '' },
                { id: crypto.randomUUID(), name: 'Flexora', sets: 3, reps: '12', weight: '' }
            ]
        },
        'D': {
            name: 'D - Ombros e Trapézio', exercises: [
                getRandomExercise('desenvolvimento', { name: 'Desenvolvimento', sets: 4, reps: '10' }),
                getRandomExercise('lateral', { name: 'Elevação Lateral', sets: 4, reps: '12' }),
                { id: crypto.randomUUID(), name: 'Elevação Frontal', sets: 3, reps: '12', weight: '' },
                { id: crypto.randomUUID(), name: 'Encolhimento', sets: 4, reps: '15', weight: '' }
            ]
        },
        'E': {
            name: 'E - Braços', exercises: [
                getRandomExercise('biceps_curls', { name: 'Rosca Direta', sets: 3, reps: '10' }),
                getRandomExercise('triceps_ext', { name: 'Tríceps Testa', sets: 3, reps: '10' }),
                { id: crypto.randomUUID(), name: 'Rosca Alternada', sets: 3, reps: '12', weight: '' },
                { id: crypto.randomUUID(), name: 'Tríceps Corda', sets: 3, reps: '12', weight: '' }
            ]
        }
    };
};
