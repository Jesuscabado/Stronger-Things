/**
 * Traduce nombres y descripciones de items, hechizos y monstruos del inglés
 * al español usando Anthropic Claude. Mantiene caché persistente en disco
 * para evitar pagar por traducciones repetidas.
 */
import { ensureClient, askClaude, cleanJSON } from "./anthropicClient.js";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_FILE = path.resolve(__dirname, "..", "data", "translations.json");

let cache = null;
let saving = false;

const loadCache = async () => {
    if (cache !== null) return cache;
    try {
        const text = await fs.readFile(CACHE_FILE, "utf8");
        cache = JSON.parse(text);
    } catch {
        cache = { items: {}, damageTypes: {}, properties: {}, spells: {}, monsters: {} };
    }
    // Backfill por si la caché es vieja y no tiene la sección de spells
    if (!cache.spells) cache.spells = {};
    if (!cache.items) cache.items = {};
    if (!cache.damageTypes) cache.damageTypes = {};
    if (!cache.properties) cache.properties = {};
    if (!cache.monsters) cache.monsters = {};
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

/* ─────────────── HECHIZOS (Fase 6a) ─────────────── */

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

/* ─────────────── MONSTRUOS (Fase 8) ─────────────── */

/* Diccionarios fijos: traducciones canónicas conocidas. No pasan por Claude. */

const SIZE_MAP = {
    "Tiny":       "Diminuto",
    "Small":      "Pequeño",
    "Medium":     "Mediano",
    "Large":      "Grande",
    "Huge":       "Enorme",
    "Gargantuan": "Gargantuesco"
};

const TYPE_MAP = {
    "aberration":  "Aberración",
    "beast":       "Bestia",
    "celestial":   "Celestial",
    "construct":   "Constructo",
    "dragon":      "Dragón",
    "elemental":   "Elemental",
    "fey":         "Hada",
    // El SRD usa "fiend" para diablos/demonios; nuestro enum no lo
    // contempla, lo encajamos en Monstruosidad.
    "fiend":       "Monstruosidad",
    "giant":       "Gigante",
    "humanoid":    "Humanoide",
    "monstrosity": "Monstruosidad",
    "ooze":        "Cieno",
    "plant":       "Planta",
    "undead":      "Muerto viviente"
};

const ALIGNMENT_MAP = {
    "lawful good":     "Legal bueno",
    "neutral good":    "Neutral bueno",
    "chaotic good":    "Caótico bueno",
    "lawful neutral":  "Legal neutral",
    "neutral":         "Neutral",
    "true neutral":    "Neutral verdadero",
    "chaotic neutral": "Caótico neutral",
    "lawful evil":     "Legal malvado",
    "neutral evil":    "Neutral malvado",
    "chaotic evil":    "Caótico malvado",
    "unaligned":       "Sin alineamiento",
    "any alignment":   "Cualquier alineamiento"
};

const DAMAGE_TYPE_MAP = {
    "acid":        "ácido",
    "bludgeoning": "contundente",
    "cold":        "frío",
    "fire":        "fuego",
    "force":       "fuerza",
    "lightning":   "rayo",
    "necrotic":    "necrótico",
    "piercing":    "perforante",
    "poison":      "veneno",
    "psychic":     "psíquico",
    "radiant":     "radiante",
    "slashing":    "cortante",
    "thunder":     "trueno"
};

const CONDITION_MAP = {
    "blinded":       "cegado",
    "charmed":       "encantado",
    "deafened":      "ensordecido",
    "exhaustion":    "agotamiento",
    "frightened":    "asustado",
    "grappled":      "agarrado",
    "incapacitated": "incapacitado",
    "invisible":     "invisible",
    "paralyzed":     "paralizado",
    "petrified":     "petrificado",
    "poisoned":      "envenenado",
    "prone":         "tumbado",
    "restrained":    "apresado",
    "stunned":       "aturdido",
    "unconscious":   "inconsciente"
};

const LANGUAGE_MAP = {
    "Common":       "Común",
    "Dwarvish":     "Enano",
    "Elvish":       "Élfico",
    "Giant":        "Gigante",
    "Gnomish":      "Gnomo",
    "Goblin":       "Goblin",
    "Halfling":     "Mediano",
    "Orc":          "Orco",
    "Abyssal":      "Abisal",
    "Celestial":    "Celestial",
    "Draconic":     "Dracónico",
    "Deep Speech":  "Habla Profunda",
    "Infernal":     "Infernal",
    "Primordial":   "Primordial",
    "Sylvan":       "Silvano",
    "Undercommon":  "Bajocomún"
};

const SENSE_MAP = {
    "darkvision":   "visión en la oscuridad",
    "blindsight":   "percepción ciega",
    "tremorsense":  "sentido de los temblores",
    "truesight":    "visión verdadera"
};

/* Helpers de traducción literal (síncronos, no usan Claude). */

export const translateSize = (en) => SIZE_MAP[en] || en;
export const translateType = (en) => TYPE_MAP[en?.toLowerCase()] || "Humanoide";
export const translateAlignment = (en) => ALIGNMENT_MAP[en?.toLowerCase()] || en || "Sin alineamiento";
export const translateMonsterDamageType = (en) => DAMAGE_TYPE_MAP[en?.toLowerCase()] || en;
export const translateCondition = (en) => CONDITION_MAP[en?.toLowerCase()] || en;
export const translateLanguage = (en) => LANGUAGE_MAP[en] || en;

/**
 * Traduce un sentido tipo "darkvision 60 ft." → "visión en la oscuridad 60 ft".
 */
export const translateSense = (en) => {
    if (!en) return en;
    let s = en.toLowerCase();
    for (const [eng, esp] of Object.entries(SENSE_MAP)) {
        s = s.replace(eng, esp);
    }
    return s.replace(/\bft\.?/g, "ft");
};

export const translateDamageList = (input) => {
    if (!input) return [];
    const list = Array.isArray(input) ? input : input.split(",");
    return list.map(d => translateMonsterDamageType(d.trim())).filter(Boolean);
};

export const translateConditionList = (input) => {
    if (!input) return [];
    const list = Array.isArray(input) ? input : input.split(",");
    return list.map(c => translateCondition(c.trim())).filter(Boolean);
};

export const translateLanguageList = (input) => {
    if (!input) return [];
    const list = Array.isArray(input) ? input : input.split(",");
    return list.map(l => translateLanguage(l.trim())).filter(Boolean);
};

/**
 * Traduce los textos largos de un monstruo del SRD usando Claude Haiku.
 *
 * Recibe solo los campos que necesitan traducción "creativa" (nombre,
 * descripción y nombres/descripciones de acciones). Los campos cortos
 * enumerables (tamaño, tipo, daño, condición, idioma...) se resuelven
 * antes con los diccionarios fijos en el script de seed.
 *
 * Usa una llamada `messages.create` con system prompt detallado y
 * max_tokens más alto que el helper genérico `askClaude`, porque los
 * monstruos pueden tener bastantes acciones y la respuesta es JSON
 * estructurado, no texto plano.
 *
 * @param {string} cacheKey - identificador único para caché (srdIndex)
 * @param {Object} payload  - { name, description, actions: [{kind, name, description}] }
 * @returns Promise<{ name, description, actions: [...] }>
 */
export const translateMonster = async (cacheKey, payload) => {
    const c = await loadCache();
    if (c.monsters[cacheKey]) {
        return c.monsters[cacheKey];
    }

    const systemPrompt = `Eres traductor profesional de Dungeons & Dragons 5e al español de España.

Reglas estrictas:
- Mantén términos técnicos canónicos: "Melee Weapon Attack" → "Ataque cuerpo a cuerpo con arma", "Ranged Weapon Attack" → "Ataque a distancia con arma", "Hit:" → "Impacto:", "reach" → "alcance", "ft." → "ft", "DC" → "CD".
- Conserva las fórmulas tal cual: "+5 to hit" → "+5 al golpe", "1d8 + 3 slashing damage" → "1d8 + 3 de daño cortante".
- Tipos de daño en minúscula: fuego, frío, cortante, perforante, contundente, ácido, veneno, psíquico, radiante, necrótico, rayo, trueno, fuerza.
- Condiciones: cegado, asustado, paralizado, envenenado, apresado, agarrado, tumbado, aturdido, inconsciente, encantado.
- Estilo natural en español, no calco palabra a palabra del inglés.
- Devuelve SOLO el JSON pedido, sin markdown ni explicaciones.`;

    const userPrompt = `Traduce al español este monstruo de D&D 5e. Devuelve un JSON con la MISMA estructura, traduciendo solo "name", "description" y los "name"/"description" de cada acción.

ENTRADA:
${JSON.stringify(payload, null, 2)}

Devuelve el JSON traducido sin envolverlo en bloques de código.`;

    try {
        const response = await ensureClient().messages.create({
            model: "claude-haiku-4-5",
            max_tokens: 4000,
            system: systemPrompt,
            messages: [{ role: "user", content: userPrompt }]
        });

        const text = response.content[0]?.type === "text" ? response.content[0].text : "";
        const clean = cleanJSON(text);

        let parsed;
        try {
            parsed = JSON.parse(clean);
        } catch {
            console.error(`[translateMonster:${cacheKey}] JSON inválido:`, clean.slice(0, 300));
            throw new Error("Claude devolvió JSON inválido");
        }

        if (!parsed.name) {
            throw new Error("Falta 'name' en respuesta de Claude");
        }

        c.monsters[cacheKey] = parsed;
        await persistCache();
        return parsed;

    } catch (err) {
        console.error(`[translateMonster:${cacheKey}] Error:`, err.message);
        throw err;
    }
};

/* ─────────────── Stats ─────────────── */

export const getCacheStats = async () => {
    const c = await loadCache();
    return {
        items: Object.keys(c.items || {}).length,
        damageTypes: Object.keys(c.damageTypes || {}).length,
        properties: Object.keys(c.properties || {}).length,
        spells: Object.keys(c.spells || {}).length,
        monsters: Object.keys(c.monsters || {}).length
    };
};