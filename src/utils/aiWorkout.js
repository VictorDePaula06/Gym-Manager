import { askGemini, isGeminiConfigured } from '../services/gemini';

// ── O "cérebro" do personal: regras de especialista por tipo de aluno ─────────
const SYSTEM_INSTRUCTION = `Você é um personal trainer experiente, especialista em prescrição de treino de musculação. Monte fichas seguras, coerentes e personalizadas para CADA tipo de aluno, raciocinando como um profissional.

DIVISÃO (split) conforme a frequência semanal:
- 1 a 2x: Full Body (corpo inteiro por treino).
- 3x: ABC (ex.: A Empurrar, B Puxar, C Pernas) ou ABC por grupos.
- 4x: ABCD (ex.: A Costas/Bíceps, B Peito/Tríceps, C Pernas, D Ombros/Core) ou Superiores/Inferiores 2x.
- 5x: ABCDE. 6x: PPL repetido 2x. NUNCA crie mais divisões do que a frequência semanal permite.
EXCEÇÕES com PRIORIDADE sobre o mapa acima — para idosos (60+), iniciantes absolutos, obesidade acentuada (IMC ≥ 35) ou objetivo de saúde/qualidade de vida/reabilitação: prefira Full Body ou Superiores/Inferiores (AB), MESMO que treine 4x ou mais. NÃO use splits de isolamento/fisiculturismo (Empurrar/Puxar, ABCD por grupo), que concentram volume demais e não servem a esse perfil. Distribua o corpo de forma equilibrada entre as sessões, com volume conservador.

VOLUME, REPETIÇÕES e DESCANSO conforme o objetivo:
- Força: 3-5 séries, 3-6 reps, descanso 120-240s, foco em compostos.
- Hipertrofia: 3-4 séries, 8-12 reps, descanso 60-90s.
- Emagrecimento/Resistência: 2-4 séries, 12-20 reps, descanso 30-45s, incluir circuito e/ou cardio (HIIT ou contínuo).
- Condicionamento geral: 3 séries, 10-15 reps, descanso 60s.
Ordene sempre os exercícios compostos (multiarticulares) ANTES dos isoladores.

NÍVEL:
- Iniciante: priorize máquinas e exercícios básicos (aprendizado motor), menos volume.
- Intermediário: livres + máquinas, execução já consolidada.
- Avançado: maior volume e técnicas avançadas (bi-set, drop-set, pausa) quando fizer sentido.

IDADE:
- Menor de 16 anos: peso corporal e cargas leves, foco técnico, sem cargas máximas.
- 60+ (melhor idade): SEMPRE baixo impacto, máquinas e amplitude controlada; volume conservador (2-3 séries), longe da falha; INCLUA em cada treino exercícios de mobilidade, equilíbrio e core funcional; priorize função e segurança sobre estética. Quanto maior a idade, mais conservador.
- Obesidade acentuada (IMC ≥ 35): priorize máquinas e movimentos de baixo impacto articular, evite exercícios no chão de difícil transição e alto impacto; cardio de baixo impacto (bike/elíptico).

SEXO: respeite SEMPRE o objetivo declarado. Não estereotipe — só ajuste ênfase se o objetivo pedir.

LOCAL DE TREINO / EQUIPAMENTOS (restrição rígida — só prescreva o que o aluno tem acesso):
- "Academia completa": pode usar pesos livres, máquinas, cabos, halteres.
- "Casa (halteres/elásticos)": APENAS halteres, elásticos/faixas e peso do corpo. NÃO use máquinas, cabos, barras olímpicas, leg press, etc.
- "Apenas peso do corpo": somente calistenia/peso corporal, sem nenhum equipamento.
- "Ar livre": peso do corpo + o que costuma haver em praças/parques (barras fixas, paralelas) + corrida/caminhada.
NUNCA prescreva um exercício impossível de executar no local informado.

TEMPO POR SESSÃO (ajuste o volume total ao tempo disponível): ~30 min → 4-5 exercícios; ~45 min → 5-6; ~60 min → 6-7; ~90 min → 7-9; 90+ min → pode passar disso e sobra tempo para um bloco aeróbico mais longo. Se não informado, use volume padrão do objetivo/nível.

AERÓBICO / CARDIO: inclua trabalho aeróbico conforme o objetivo e o tempo disponível.
- Emagrecimento, condicionamento físico e saúde/qualidade de vida: o aeróbico é parte central — inclua em vários treinos (HIIT ou contínuo).
- Hipertrofia, força e ganho de massa: inclua aeróbico leve a moderado pela saúde cardiovascular, principalmente quando o tempo da sessão permitir (60 min ou mais) — geralmente ao final do treino, sem prejudicar a recuperação.
- Quanto MAIS tempo de sessão, mais espaço para aeróbico; em sessões curtas (30 min) priorize a musculação e use cardio curto/HIIT só se couber.
- Modalidade conforme as limitações: sem restrição → esteira/corrida, bike, elíptico, remo, pular corda; com limitação de joelho/tornozelo/quadril, obesidade acentuada ou idoso → baixo impacto (bike, elíptico, caminhada).
- Formato do cardio como exercício: "sets": 1, "reps" com a duração (ex.: "20 min" ou "20 min HIIT (1:1)"), "restTime": 0, e use "notes" para ritmo/intensidade (ex.: "Ritmo moderado, FC controlada"). Não ultrapasse o tempo total da sessão.

GESTANTE / PÓS-PARTO (segurança máxima): evite exercícios deitada de barriga para cima após o 1º trimestre, manobra de Valsalva, alta intensidade, impacto e risco de queda/equilíbrio; foque em fortalecimento leve, assoalho pélvico, postura e mobilidade. SEMPRE marque needsProfessionalReview=true exigindo liberação médica/obstétrica.

LIMITAÇÕES e HISTÓRICO MÉDICO (prioridade de segurança): evite exercícios que possam agravar. Ex.: dor no joelho → evitar agachamento profundo/impacto, preferir leg press com amplitude controlada e cadeira extensora leve; dor no ombro → evitar desenvolvimento e supino pesados acima da cabeça; problema lombar/hérnia → evitar levantamento terra e agachamento livre pesado, preferir variações apoiadas. Nesses casos, marque needsProfessionalReview=true e explique em reviewReason.

PROGRESSÃO (quando houver ficha anterior): a nova ficha deve ser uma EVOLUÇÃO da anterior, nunca uma cópia. Aplique sobrecarga progressiva de forma coerente com o nível e o tempo de treino:
- Aumente o estímulo: mais séries, faixas de repetição um pouco mais desafiadoras, menos descanso OU variações mais difíceis dos mesmos padrões de movimento.
- Troque PARTE dos exercícios para evitar acomodação, mantendo a lógica da divisão e os grupos musculares.
- Introduza progressivamente técnicas avançadas (bi-set, drop-set, rest-pause, cadência/tempo controlado, pausa) à medida que o aluno avança — com parcimônia para iniciantes, mais presença para intermediários/avançados.
- Quanto mais fichas o aluno já fez, mais "treinado" ele é: pode subir o volume e a complexidade. Nunca regrida intensidade sem motivo (lesão/limitação).
- Sinalize as técnicas/avanços no campo "notes" do exercício (ex.: "Drop-set na última série", "Cadência 3s na descida").

ADERÊNCIA (quando informada — quantos treinos o aluno realmente registrou): treino consistente e frequente justifica progredir com mais volume/intensidade. Baixa frequência ou ausência longa desde o último treino → progrida com cautela, retome com volume moderado e priorize reconstruir a consistência.

As INSTRUÇÕES DO PROFESSOR têm prioridade máxima sobre as regras gerais (desde que sejam seguras).
Use nomes reais de exercícios em português. Responda SOMENTE com JSON válido, sem texto fora dele.`;

// Resume a ficha mais recente do aluno (base para progressão). Retorna null se não houver.
const summarizePreviousSheet = (student) => {
    const sheets = student.workoutSheets ? Object.values(student.workoutSheets) : [];
    const valid = sheets.filter(s => s && s.workouts && Object.keys(s.workouts).length > 0);
    if (valid.length === 0) return null;
    const latest = [...valid].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0];
    const lines = Object.entries(latest.workouts).map(([key, div]) => {
        const exs = (div.exercises || []).map(e => {
            const rest = e.restTime ? ` ${e.restTime}s` : '';
            return `${e.name} ${e.sets}x${e.reps}${rest}${e.notes ? ` (${e.notes})` : ''}`;
        }).join('; ');
        return `${div.name || key}: ${exs}`;
    });
    return { name: latest.name || 'Ficha anterior', count: valid.length, text: lines.join('\n') };
};

// Resume a aderência ao treino a partir dos registros (training_logs).
const summarizeAdherence = (logs) => {
    if (!Array.isArray(logs) || logs.length === 0) return null;
    const now = Date.now();
    const last30 = logs.filter(l => l.timestamp && (now - new Date(l.timestamp).getTime()) <= 30 * 24 * 60 * 60 * 1000).length;
    const lastDate = logs[0]?.timestamp ? new Date(logs[0].timestamp).toLocaleDateString('pt-BR') : null;
    return { total: logs.length, last30, lastDate };
};

// Monta o prompt com o perfil do aluno + instrução livre do gestor.
const buildPrompt = (student, instruction, prev, adherence) => {
    const age = student.age || (student.birthDate
        ? Math.floor((Date.now() - new Date(student.birthDate)) / (1000 * 60 * 60 * 24 * 365.25))
        : '');
    // IMC (mesma lógica do app: altura > 3 assume cm)
    let imcLabel = 'não informado';
    const w = parseFloat((student.weight || '').toString().replace(',', '.'));
    let h = parseFloat((student.height || '').toString().replace(',', '.'));
    if (w && h) {
        if (h > 3) h = h / 100;
        const imc = w / (h * h);
        const faixa = imc < 18.5 ? 'abaixo do peso' : imc < 25 ? 'normal' : imc < 30 ? 'sobrepeso' : imc < 35 ? 'obesidade grau I' : imc < 40 ? 'obesidade grau II' : 'obesidade grau III';
        imcLabel = `${imc.toFixed(1)} (${faixa})`;
    }

    const perfil = [
        `Nome: ${student.name || '-'}`,
        `Sexo: ${student.sex || student.gender || 'não informado'}`,
        `Idade: ${age || 'não informada'}`,
        `IMC: ${imcLabel}`,
        `Objetivo: ${student.objective || 'condicionamento geral'}`,
        `Nível: ${student.level || 'iniciante'}`,
        `Frequência semanal: ${student.trainingFrequency || 'não informada'}`,
        `Local de treino / equipamentos: ${student.trainingLocation || 'academia completa'}`,
        `Tempo por sessão: ${student.sessionTime || 'não informado'}`,
        `Rotina: ${student.routine || 'não informada'}`,
        `Limitações físicas: ${student.limitations || 'nenhuma'}`,
        `Histórico médico: ${student.diseases || 'nenhum'}`,
    ].join('\n');

    return `Monte uma ficha de treino de musculação para o aluno abaixo, aplicando as regras de prescrição por tipo de aluno.

PERFIL DO ALUNO:
${perfil}

${prev ? `FICHA ANTERIOR (o aluno já fez ${prev.count} ficha(s) — use como base para PROGREDIR, NÃO repita igual):\n${prev.text}\n` : 'O aluno ainda não tem ficha anterior (primeira ficha).'}
${adherence ? `ADERÊNCIA: ${adherence.total} treinos registrados no total, ${adherence.last30} nos últimos 30 dias${adherence.lastDate ? `, último em ${adherence.lastDate}` : ''}.` : ''}

${instruction ? `INSTRUÇÕES DO PROFESSOR (PRIORIDADE MÁXIMA):\n${instruction}\n` : ''}
Cada exercício deve ter: nome real, séries (number), repetições (string, ex "10-12"), descanso em segundos (number) e, quando útil, uma observação curta de execução em "notes".

Responda no formato exato:
{
  "name": "string (nome da ficha, ex: Hipertrofia ABCD)",
  "divisions": [
    { "key": "A", "name": "A - Grupo Muscular", "exercises": [
        { "name": "string", "sets": 4, "reps": "10-12", "weight": "", "restTime": 60, "notes": "" }
    ] }
  ],
  "needsProfessionalReview": false,
  "reviewReason": ""
}`;
};

// Extrai e parseia o JSON da resposta (tolerante a cercas de código).
const parseJson = (text) => {
    let t = (text || '').trim();
    if (t.startsWith('```')) t = t.replace(/^```(json)?/i, '').replace(/```$/, '').trim();
    const start = t.indexOf('{');
    const end = t.lastIndexOf('}');
    if (start !== -1 && end !== -1) t = t.slice(start, end + 1);
    return JSON.parse(t);
};

// Gera uma ficha via IA, retornando o MESMO contrato de generateWorkout:
// { name, workouts, needsProfessionalReview, reviewReason }
export const generateWorkoutAI = async (student, instruction = '', trainingLogs = []) => {
    if (!isGeminiConfigured()) throw new Error('IA não configurada.');

    const prev = summarizePreviousSheet(student);
    const adherence = summarizeAdherence(trainingLogs);
    const raw = await askGemini(buildPrompt(student, instruction, prev, adherence), { json: true, systemInstruction: SYSTEM_INSTRUCTION });
    const data = parseJson(raw);

    if (!Array.isArray(data.divisions) || data.divisions.length === 0) {
        throw new Error('A IA não retornou divisões válidas.');
    }

    // Converte divisions[] -> objeto workouts keyed por A/B/C..., gerando ids no cliente.
    const workouts = {};
    data.divisions.forEach((div, i) => {
        const key = (div.key || String.fromCharCode(65 + i)).toUpperCase();
        const exercises = Array.isArray(div.exercises) ? div.exercises.map(ex => ({
            id: crypto.randomUUID(),
            name: ex.name || 'Exercício',
            sets: typeof ex.sets === 'number' ? ex.sets : (parseInt(ex.sets) || 3),
            reps: (ex.reps ?? '12').toString(),
            weight: ex.weight || '',
            restTime: typeof ex.restTime === 'number' ? ex.restTime : (parseInt(ex.restTime) || 60),
            ...(ex.notes ? { notes: ex.notes } : {})
        })) : [];
        workouts[key] = { name: div.name || `Treino ${key}`, exercises };
    });

    return {
        name: data.name || 'Ficha Personalizada (IA)',
        workouts,
        needsProfessionalReview: !!data.needsProfessionalReview,
        reviewReason: data.reviewReason || '',
        generatedByAI: true
    };
};
