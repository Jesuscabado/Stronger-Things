/**
 * Seed de monstruos del SRD oficial (dnd5eapi.co).
 *
 * A diferencia de seed.js (que va por HTTP porque items/hechizos/personajes
 * pertenecen a un usuario), los monstruos del SRD son PÚBLICOS y de sistema
 * (isPublic: true, user: null). No tienen dueño, así que se insertan
 * directamente en Mongo igual que haría una migración.
 *
 * - Idempotente: si un monstruo ya existe (por srdIndex), no se re-importa.
 * - Cacheado: las traducciones se guardan en data/translations.json.
 * - Concurrencia controlada para no saturar la API de Anthropic.
 * - Confirmación interactiva con coste estimado antes de empezar.
 *
 * UBICACIÓN: este archivo va en server/src/seed-monsters.js
 *            (misma carpeta que seed.js).
 *
 * USO:  npm run seed:monsters
 * =========================================================================
 */

// Cargar variables de entorno explícitamente. Robusto independientemente
// de cómo se lance el script. dotenv ya es dependencia del proyecto.
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { connectMongo } from "./config/db.js";
import Monster from "./models/Monster.js";
import {
    translateSize,
    translateType,
    translateAlignment,
    translateDamageList,
    translateConditionList,
    translateLanguageList,
    translateSense
} from "./services/translationService.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR  = path.resolve(__dirname, "data");
const CONCURRENCY = 3;

const loadJson = async (filename) => {
    const text = await fs.readFile(path.join(DATA_DIR, filename), "utf8");
    return JSON.parse(text);
};

/* ─── Mapeo del SRD a nuestro modelo Monster ─── */

const mapMonsterFromSrd = (srd) => {
    // Velocidad: el SRD da { walk: "30 ft.", fly: "60 ft." }
    const speed = [];
    if (srd.speed) {
        const labels = { walk: "", fly: "vuelo ", swim: "nadar ", climb: "trepar ", burrow: "excavar " };
        for (const [mode, value] of Object.entries(srd.speed)) {
            if (typeof value !== "string") continue;
            const cleanValue = value.replace(/\bft\.?/g, "ft");
            speed.push((labels[mode] || `${mode} `) + cleanValue);
        }
    }

    // Sentidos
    const senses = [];
    let passivePerception = 10;
    if (srd.senses) {
        for (const [key, value] of Object.entries(srd.senses)) {
            if (key === "passive_perception") {
                passivePerception = Number(value) || 10;
            } else if (typeof value === "string") {
                senses.push(translateSense(`${key} ${value}`));
            }
        }
    }

    // Salvaciones y habilidades competentes
    const savingThrows = {};
    const skills = {};
    if (Array.isArray(srd.proficiencies)) {
        for (const p of srd.proficiencies) {
            const name = p.proficiency?.index || "";
            const value = p.value;
            if (name.startsWith("saving-throw-")) {
                const abil = name.replace("saving-throw-", "");
                const map = { str: "strength", dex: "dexterity", con: "constitution",
                              int: "intelligence", wis: "wisdom", cha: "charisma" };
                if (map[abil]) savingThrows[map[abil]] = value;
            } else if (name.startsWith("skill-")) {
                skills[name.replace("skill-", "")] = value;
            }
        }
    }

    // Acciones unificadas con kind
    const actions = [];
    const pushActions = (arr, kind) => {
        for (const a of arr || []) {
            const action = { kind, name: a.name || "", description: a.desc || "" };
            if (Array.isArray(a.attack_bonus) && a.attack_bonus.length) {
                action.attackBonus = a.attack_bonus[0];
            } else if (typeof a.attack_bonus === "number") {
                action.attackBonus = a.attack_bonus;
            }
            if (Array.isArray(a.damage) && a.damage[0]) {
                const d = a.damage[0];
                if (d.damage_dice) action.damage = d.damage_dice;
                if (d.damage_type?.index) {
                    action.damageType = translateDamageList([d.damage_type.index])[0];
                }
            }
            actions.push(action);
        }
    };
    pushActions(srd.special_abilities, "trait");
    pushActions(srd.actions, "action");
    pushActions(srd.reactions, "reaction");
    pushActions(srd.legendary_actions, "legendary");

    // CR a string
    const crMap = { 0: "0", 0.125: "1/8", 0.25: "1/4", 0.5: "1/2" };
    const cr = crMap[srd.challenge_rating] ?? String(srd.challenge_rating);

    return {
        srdIndex: srd.index,
        isPublic: true,
        user: null,

        name: srd.name,
        size: translateSize(srd.size),
        type: translateType(srd.type),
        subtype: srd.subtype || "",
        alignment: translateAlignment(srd.alignment),

        armorClass: srd.armor_class?.[0]?.value || 10,
        armorClassNote: srd.armor_class?.[0]?.type || "",

        hitPoints: {
            average: srd.hit_points || 1,
            roll: srd.hit_points_roll || srd.hit_dice || ""
        },

        speed,

        abilityScores: {
            strength:     srd.strength     || 10,
            dexterity:    srd.dexterity    || 10,
            constitution: srd.constitution || 10,
            intelligence: srd.intelligence || 10,
            wisdom:       srd.wisdom       || 10,
            charisma:     srd.charisma     || 10
        },

        savingThrows,
        skills,

        damageVulnerabilities: translateDamageList(srd.damage_vulnerabilities),
        damageResistances:     translateDamageList(srd.damage_resistances),
        damageImmunities:      translateDamageList(srd.damage_immunities),
        conditionImmunities:   translateConditionList((srd.condition_immunities || []).map(x => x.index)),

        senses,
        passivePerception,
        languages: translateLanguageList(srd.languages),

        challengeRating: cr,
        experiencePoints: srd.xp || 0,

        actions,
        spellcastingNote: "",
        description: "",
        dmNotes: ""
    };
};

/* ─── Aplicar traducción desde translations.json ─── */

const applyTranslation = (mapped, translations) => {
    const t = translations.monsters[mapped.srdIndex];
    if (!t) return mapped;

    mapped.name = t.name || mapped.name;
    if (t.description) mapped.description = t.description;

    if (Array.isArray(t.actions)) {
        for (let i = 0; i < mapped.actions.length; i++) {
            const tr = t.actions[i];
            if (!tr) continue;
            mapped.actions[i].name        = tr.name        || mapped.actions[i].name;
            mapped.actions[i].description = tr.description || mapped.actions[i].description;
        }
    }
    return mapped;
};

/* ─── Pool de concurrencia ─── */

const processInPool = async (items, worker, concurrency) => {
    const results = [];
    let i = 0;
    let done = 0;
    const total = items.length;

    const runOne = async () => {
        while (i < items.length) {
            const idx = i++;
            try {
                results[idx] = await worker(items[idx]);
            } catch (err) {
                results[idx] = { error: err.message, srdIndex: items[idx]?.index || items[idx]?.srdIndex };
            }
            done++;
            process.stdout.write(`\r📦 Procesando ${done}/${total}...`);
        }
    };

    await Promise.all(Array.from({ length: concurrency }, runOne));
    console.log("");
    return results;
};

/* ─── Main ─── */

const main = async () => {
    console.log(" SEED DE MONSTRUOS DEL SRD OFICIAL (modo local, sin APIs externas)\n");

    await connectMongo();

    // Cargar datos locales
    let srdMonsters, translations;
    try {
        [srdMonsters, translations] = await Promise.all([
            loadJson("srd-monsters.json"),
            loadJson("translations.json")
        ]);
        console.log(`✅ Datos cargados: ${srdMonsters.length} monstruos, ${Object.keys(translations.monsters).length} traducciones`);
    } catch (err) {
        console.error("❌ Faltan archivos de datos locales. Ejecuta primero: npm run seed:download");
        await mongoose.disconnect();
        process.exit(1);
    }

    // Excluir los ya importados (idempotencia por srdIndex)
    const existing = await Monster.find({ srdIndex: { $exists: true } }, "srdIndex").lean();
    const existingIndices = new Set(existing.map(m => m.srdIndex));
    const pending = srdMonsters.filter(m => !existingIndices.has(m.index));

    console.log(`✓ Ya importados: ${existingIndices.size}`);
    console.log(`→ Por importar:  ${pending.length}\n`);

    if (pending.length === 0) {
        console.log("✨ Todo al día. Nada que hacer.");
        await mongoose.disconnect();
        return;
    }

    // Mapear y aplicar traducciones locales
    console.log("🗺️  Mapeando y aplicando traducciones...");
    const mapped = await processInPool(
        pending,
        async (srd) => applyTranslation(mapMonsterFromSrd(srd), translations),
        CONCURRENCY
    );

    const ok     = mapped.filter(m => m && !m.error);
    const errors = mapped.filter(m => m && m.error);

    if (errors.length) {
        console.warn(`\n⚠️  ${errors.length} monstruos fallaron al mapear:`);
        for (const e of errors) console.warn(`   - ${e.srdIndex}: ${e.error}`);
    }

    // Insertar en Mongo
    console.log(`\n💾 Guardando ${ok.length} monstruos en BD...`);
    let inserted = 0;
    for (const m of ok) {
        try {
            await Monster.create(m);
            inserted++;
        } catch (err) {
            if (err.code !== 11000) {
                console.error(`   ❌ ${m.srdIndex}: ${err.message}`);
            }
        }
    }

    console.log(`\n✅ ${inserted} monstruos insertados correctamente.`);
    await mongoose.disconnect();
    console.log("\n🎉 Seed de monstruos completado.\n");
};

main().catch(async (err) => {
    console.error("❌ Error fatal:", err);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
});