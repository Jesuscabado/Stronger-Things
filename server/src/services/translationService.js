/**
 * Traduce nombres y descripciones de items y hechizos del inglés al español
 * usando Anthropic Claude. Mantiene caché persistente en disco para
 * evitar pagar por traducciones repetidas.
 */
import Anthropic from "@anthropic-ai/sdk";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_FILE = path.resolve(__dirname, "..", "data", "translations.json");

let client = null;
let cache = null;
let saving = false;

const ensureClient = () => {
    if (!client) {
        if (!process.env.ANTHROPIC_API_KEY) {
            throw new Error("ANTHROPIC_API_KEY no está definida en .env");
        }
        client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    }
    return client;
};

const loadCache = async () => {
    if (cache !== null) return cache;
    try {
        const text = await fs.readFile(CACHE_FILE, "utf8");
        cache = JSON.parse(text);
    } catch {
        cache = { items: {}, damageTypes: {}, properties: {}, spells: {} };
    }
    // Backfill por si la caché es vieja y no tiene la sección de spells
    if (!cache.spells) cache.spells = {};
    if (!cache.items) cache.items = {};
    if (!cache.damageTypes) cache.damageTypes = {};
    if (!cache.properties) cache.properties = {};
    return cache;
};

const persistCache = async () => {
    if (saving) return;
    saving = true;
    try {
        await fs.mkdir(path.dirname(CACHE_FILE), { recursive: true });
        await fs.writeFile(CACHE_FILE, JSON.stringify(cache, null, 2), "utf8");
    } finally {
        saving = false;
    }
};

const askClaude = async (prompt) => {
    const res = await ensureClient().messages.create({
        model: "claude-haiku-4-5",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }]
    });
    const text = res.content[0]?.type === "text" ? res.content[0].text : "";
    return text.trim();
};

const cleanJSON = (text) => {
    // Algunas respuestas vienen entre ```json ... ```
    return text.replace(/```json\s*|```/g, "").trim();
};

/* ─────────────── ITEMS (existente) ─────────────── */

export const translateItem = async (englishName, englishDescription) => {
    const c = await loadCache();
    const cacheKey = englishName;
    if (c.items[cacheKey]) {
        return c.items[cacheKey];
    }

    const prompt = `Traduce el siguiente equipo de D&D 5e del inglés al español. Responde SOLO en JSON sin texto extra ni markdown:

Nombre: ${englishName}
Descripción: ${englishDescription || "(sin descripción)"}

Formato de respuesta:
{"name": "...", "description": "..."}`;

    try {
        const raw = await askClaude(prompt);
        const parsed = JSON.parse(cleanJSON(raw));
        c.items[cacheKey] = {
            name: parsed.name || englishName,
            description: parsed.description || ""
        };
        await persistCache();
        return c.items[cacheKey];
    } catch (err) {
        console.warn(`Traducción fallida para "${englishName}": ${err.message}`);
        return { name: englishName, description: englishDescription || "" };
    }
};

export const translateDamageType = async (englishType) => {
    if (!englishType) return "";
    const c = await loadCache();
    if (c.damageTypes[englishType]) return c.damageTypes[englishType];

    const prompt = `Traduce este tipo de daño de D&D 5e del inglés al español.
Responde SOLO con la palabra traducida, sin comillas ni explicaciones.

Tipo: ${englishType}`;

    try {
        const translated = await askClaude(prompt);
        c.damageTypes[englishType] = translated;
        await persistCache();
        return translated;
    } catch {
        return englishType;
    }
};

export const translateProperties = async (englishProps) => {
    if (!englishProps || englishProps.length === 0) return [];
    const c = await loadCache();

    const result = [];
    const toTranslate = [];

    for (const p of englishProps) {
        if (c.properties[p]) {
            result.push({ original: p, translation: c.properties[p] });
        } else {
            toTranslate.push(p);
        }
    }

    if (toTranslate.length > 0) {
        const prompt = `Traduce estas propiedades de armas/equipo D&D 5e del inglés al español.
Responde SOLO con un objeto JSON sin markdown:

Propiedades: ${JSON.stringify(toTranslate)}

Formato: {"PropiedadOriginal": "Traducción", ...}`;

        try {
            const raw = await askClaude(prompt);
            const parsed = JSON.parse(cleanJSON(raw));
            for (const p of toTranslate) {
                const tr = parsed[p] || p;
                c.properties[p] = tr;
                result.push({ original: p, translation: tr });
            }
            await persistCache();
        } catch {
            for (const p of toTranslate) {
                result.push({ original: p, translation: p });
            }
        }
    }

    // Ordenar según el orden original
    return englishProps.map(p =>
        result.find(r => r.original === p)?.translation || p
    );
};

/* ─────────────── HECHIZOS (NUEVO Fase 6a) ─────────────── */

const SCHOOL_MAP = {
    "Abjuration": "Abjuración",
    "Conjuration": "Conjuración",
    "Divination": "Adivinación",
    "Enchantment": "Encantamiento",
    "Evocation": "Evocación",
    "Illusion": "Ilusión",
    "Necromancy": "Nigromancia",
    "Transmutation": "Transmutación"
};

/**
 * Traduce el nombre, descripción y "at higher levels" de un hechizo.
 * La escuela se mapea con una tabla local (más rápido y consistente).
 */
export const translateSpell = async (englishName, englishDescription, englishAtHigher) => {
    const c = await loadCache();
    const cacheKey = englishName;
    if (c.spells[cacheKey]) {
        return c.spells[cacheKey];
    }

    const desc = englishDescription || "(sin descripción)";
    const higher = englishAtHigher || "";

    const prompt = `Traduce el siguiente hechizo de D&D 5e del inglés al español. Mantén términos del juego coherentes (ej: "spell" -> "conjuro", "saving throw" -> "tirada de salvación", "spell attack" -> "ataque de conjuro"). Responde SOLO en JSON sin texto extra ni markdown:

Nombre: ${englishName}
Descripción: ${desc}
A niveles superiores: ${higher || "(no aplica)"}

Formato:
{"name": "...", "description": "...", "atHigherLevels": "..."}

Si "atHigherLevels" no aplica, devuélvelo como string vacío "".`;

    try {
        const raw = await askClaude(prompt);
        const parsed = JSON.parse(cleanJSON(raw));
        c.spells[cacheKey] = {
            name: parsed.name || englishName,
            description: parsed.description || "",
            atHigherLevels: parsed.atHigherLevels || ""
        };
        await persistCache();
        return c.spells[cacheKey];
    } catch (err) {
        console.warn(`Traducción de hechizo fallida para "${englishName}": ${err.message}`);
        return { name: englishName, description: desc, atHigherLevels: higher };
    }
};

export const translateSchool = (englishSchool) => SCHOOL_MAP[englishSchool] || englishSchool;

/* ─────────────── Stats ─────────────── */

export const getCacheStats = async () => {
    const c = await loadCache();
    return {
        items: Object.keys(c.items || {}).length,
        damageTypes: Object.keys(c.damageTypes || {}).length,
        properties: Object.keys(c.properties || {}).length,
        spells: Object.keys(c.spells || {}).length
    };
};
