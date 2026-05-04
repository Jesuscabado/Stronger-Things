/**
 * Servicio de traducción inglés → español de items D&D 5e.
 *
 * Estrategia: caché persistente en src/data/translations.json
 *   - Si el item ya está traducido en el archivo, lo devuelve al instante.
 *   - Si no, llama a Claude API, lo traduce, lo guarda y lo devuelve.
 *
 * Esto significa que la primera ejecución del seed traduce todos los items,
 * y las siguientes son instantáneas (no usan la API).
 */

import fs from "node:fs/promises";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";

const TRANSLATIONS_PATH = path.resolve("src/data/translations.json");
const MODEL = "claude-haiku-4-5";

const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
});

let cache = null;

const loadCache = async () => {
    if (cache) return cache;
    try {
        const raw = await fs.readFile(TRANSLATIONS_PATH, "utf-8");
        cache = JSON.parse(raw);
    } catch (err) {
        cache = { items: {}, categories: {}, damageTypes: {}, properties: {} };
    }
    return cache;
};

const saveCache = async () => {
    if (!cache) return;
    await fs.mkdir(path.dirname(TRANSLATIONS_PATH), { recursive: true });
    await fs.writeFile(TRANSLATIONS_PATH, JSON.stringify(cache, null, 2), "utf-8");
};

const translateWithClaude = async (englishName, englishDescription) => {
    const systemPrompt = `Eres un traductor especializado en Dungeons & Dragons 5ª edición. Traduces términos del manual oficial al español usando la terminología establecida por la comunidad de habla hispana de D&D.

Reglas:
- Conserva nombres propios de criaturas, lugares y personajes.
- Las unidades de medida en español: feet → pies, pounds → libras.
- Mantén la formalidad y el tono propio del manual.
- Las descripciones deben ser fluidas en español, no traducciones literales.
- Si el nombre tiene una traducción establecida en el manual oficial español de Wizards of the Coast, úsala (ej. "Longsword" → "Espada larga", "Battleaxe" → "Hacha de batalla", "Crossbow, light" → "Ballesta ligera").

Responde ÚNICAMENTE con un objeto JSON válido con dos claves: "name" y "description". Sin texto adicional, sin markdown, sin explicaciones.`;

    const userPrompt = `Traduce este item de D&D 5e al español:

name: "${englishName}"
description: "${englishDescription || "(sin descripción)"}"

Responde con JSON: { "name": "...", "description": "..." }`;

    const response = await client.messages.create({
        model: MODEL,
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }]
    });

    const text = response.content[0].text.trim();
    const cleaned = text.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();

    try {
        return JSON.parse(cleaned);
    } catch (err) {
        throw new Error(`No se pudo parsear la respuesta de Claude: ${text}`);
    }
};

export const translateItem = async (englishName, englishDescription) => {
    await loadCache();

    if (cache.items[englishName]) {
        return cache.items[englishName];
    }

    const translated = await translateWithClaude(englishName, englishDescription);
    cache.items[englishName] = translated;
    await saveCache();
    return translated;
};

export const translateCategory = async (englishCategory) => {
    await loadCache();
    return cache.categories[englishCategory] || englishCategory;
};

export const translateDamageType = async (englishType) => {
    if (!englishType) return englishType;
    await loadCache();
    return cache.damageTypes[englishType.toLowerCase()] || englishType;
};

export const translateProperties = async (englishProperties) => {
    if (!Array.isArray(englishProperties)) return englishProperties;
    await loadCache();
    return englishProperties.map(p => cache.properties[p] || p);
};

export const getCacheStats = async () => {
    await loadCache();
    return {
        items: Object.keys(cache.items).length,
        categories: Object.keys(cache.categories).length,
        damageTypes: Object.keys(cache.damageTypes).length,
        properties: Object.keys(cache.properties).length
    };
};
