/**
 * Cliente Anthropic compartido. Un único singleton para toda la app.
 * Importa desde aquí en cualquier servicio que necesite llamar a Claude.
 */
import Anthropic from "@anthropic-ai/sdk";

let client = null;

export const ensureClient = () => {
    if (!client) {
        if (!process.env.ANTHROPIC_API_KEY) {
            throw new Error("ANTHROPIC_API_KEY no está definida en .env");
        }
        client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    }
    return client;
};

/** Elimina bloques markdown ```json … ``` que Claude a veces añade */
export const cleanJSON = (text) =>
    text.replace(/```json\s*|```/g, "").trim();

/**
 * Llamada genérica de una sola vuelta a Claude Haiku.
 * Para llamadas que necesiten system prompt o más control, usa
 * ensureClient().messages.create() directamente.
 */
export const askClaude = async (prompt, maxTokens = 1024) => {
    const res = await ensureClient().messages.create({
        model: "claude-haiku-4-5",
        max_tokens: maxTokens,
        messages: [{ role: "user", content: prompt }]
    });
    return (res.content[0]?.type === "text" ? res.content[0].text : "").trim();
};
