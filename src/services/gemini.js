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

// Cadeia de fallback: se o primeiro modelo estiver sobrecarregado (503),
// troca pro próximo (que costuma estar mais disponível no free tier).
const MODELS = ["gemini-2.5-flash", "gemini-2.0-flash"];

const isOverloaded = (error) => {
    const msg = error?.message || '';
    return msg.includes('503') || msg.includes('overload') || msg.includes('high demand') ||
        msg.includes('429') || msg.includes('quota') || error?.status === 503 || error?.status === 429;
};

// Valida a chave com uma chamada barata (countTokens) antes de salvar.
export const validateApiKey = async (apiKey) => {
    if (!apiKey || !apiKey.trim()) return false;
    try {
        const genAI = new GoogleGenerativeAI(apiKey.trim());
        const model = genAI.getGenerativeModel({ model: MODELS[0] });
        await model.countTokens("Teste");
        return true;
    } catch (error) {
        console.error("Falha na validação da chave Gemini:", error);
        return false;
    }
};

// Poucas tentativas curtas por modelo (o fallback de modelo cobre o resto).
const withRetry = async (fn, retries = 2, delay = 1200) => {
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
            if (!isOverloaded(error)) throw error;
            console.log(`Modelo ${modelName} sobrecarregado. Tentando o próximo...`);
        }
    }
    throw lastError;
};
