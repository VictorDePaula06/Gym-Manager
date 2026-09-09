import { GoogleGenerativeAI } from "@google/generative-ai";

// ── Chave Gemini (BYOK) ───────────────────────────────────────────────────────
// Padrão espelhado do projeto Finance: a chave do personal NÃO fica no
// localStorage (texto plano em repouso, exposto a XSS). Fica só em memória
// durante a sessão; a fonte de verdade persistida é o Firestore
// (users/{tenantId}/settings/ai_config.geminiApiKey, carregado só p/ dono/equipe).
let sessionApiKey = null;

export const setGeminiKey = (key) => { sessionApiKey = (key || '').trim() || null; };
export const getGeminiKey = () => sessionApiKey;
export const clearGeminiKey = () => { sessionApiKey = null; };
export const isGeminiConfigured = () => !!sessionApiKey;

// Cadeia de fallback: se o primeiro modelo estiver sobrecarregado (503) ou
// não existir mais pra essa chave (404 — Google vai descontinuando versões
// pra chaves novas de tempos em tempos), troca pro próximo.
const MODELS = ["gemini-3.6-flash", "gemini-2.5-flash", "gemini-2.0-flash"];

// Transitório: vale tentar de novo NO MESMO modelo antes de desistir dele.
const isOverloaded = (error) => {
    const msg = error?.message || '';
    return msg.includes('503') || msg.includes('overload') || msg.includes('high demand') ||
        msg.includes('429') || msg.includes('quota') || error?.status === 503 || error?.status === 429;
};

// Modelo indisponível pra essa chave (Google descontinuou/renomeou) — tentar
// de novo com o mesmo nome nunca vai funcionar, então pula direto pro próximo.
const isModelUnavailable = (error) => {
    const msg = error?.message || '';
    return msg.includes('404') || msg.includes('not found') || msg.includes('no longer available') || error?.status === 404;
};

const isSwitchable = (error) => isOverloaded(error) || isModelUnavailable(error);

// Valida a chave com uma chamada barata (countTokens) antes de salvar.
// Testa cada modelo da cadeia — um 404 (modelo indisponível) não significa
// chave inválida, só que aquele modelo específico não existe mais pra ela.
export const validateApiKey = async (apiKey) => {
    if (!apiKey || !apiKey.trim()) return false;
    const genAI = new GoogleGenerativeAI(apiKey.trim());
    let lastError;
    for (const modelName of MODELS) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            await model.countTokens("Teste");
            return true;
        } catch (error) {
            lastError = error;
            if (!isModelUnavailable(error)) {
                console.error("Falha na validação da chave Gemini:", error);
                return false;
            }
        }
    }
    console.error("Falha na validação da chave Gemini:", lastError);
    return false;
};

// Poucas tentativas curtas por modelo (o fallback de modelo — e depois o
// gerador padrão baseado em regras — cobrem o resto). Mantido enxuto pra
// não deixar o personal esperando muito antes de cair no fallback.
const withRetry = async (fn, retries = 1, delay = 800) => {
    try {
        return await fn();
    } catch (error) {
        if (isOverloaded(error) && retries > 0) {
            console.log(`Gemini ocupado. Tentando de novo em ${delay / 1000}s... (${retries} restantes)`);
            await new Promise(r => setTimeout(r, delay));
            return withRetry(fn, retries - 1, delay * 2);
        }
        throw error;
    }
};

// Gera texto a partir de um prompt usando a chave da sessão.
// Tenta cada modelo da cadeia; troca de modelo se o atual estiver sobrecarregado.
// `options.json` força saída JSON (responseMimeType).
export const askGemini = async (prompt, options = {}) => {
    if (!sessionApiKey) throw new Error("Chave de IA não configurada.");

    const genAI = new GoogleGenerativeAI(sessionApiKey);
    let lastError;

    for (const modelName of MODELS) {
        const model = genAI.getGenerativeModel({
            model: modelName,
            ...(options.systemInstruction ? { systemInstruction: options.systemInstruction } : {}),
            ...(options.json ? { generationConfig: { responseMimeType: "application/json" } } : {}),
        });
        try {
            const result = await withRetry(() => model.generateContent(prompt));
            return result.response.text();
        } catch (error) {
            lastError = error;
            // Só vale trocar de modelo se for sobrecarga; outros erros não melhoram trocando.
            if (!isSwitchable(error)) throw error;
            console.log(`Modelo ${modelName} sobrecarregado. Tentando o próximo...`);
        }
    }
    throw lastError;
};
