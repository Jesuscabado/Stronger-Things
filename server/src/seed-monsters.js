#!/usr/bin/env node
/* =========================================================================
   server/seed-monsters.js
   -------------------------------------------------------------------------
   Importa el catálogo de monstruos del SRD oficial desde dnd5eapi.co,
   los traduce con Claude Haiku y los guarda en MongoDB como monstruos
   PÚBLICOS (isPublic: true, user: null), accesibles para todos los DMs.

   - Idempotente: si un monstruo ya existe (por srdIndex), no se re-importa.
   - Cacheado: las traducciones se guardan localmente para reintentos.
   - Concurrencia controlada: procesa N monstruos en paralelo.
   - Confirmación interactiva: avisa del coste antes de empezar.

   Uso:
     npm run seed:monsters
   ========================================================================= */

import "./src/config/loadEnv.js";
import mongoose from "mongoose";
import readline from "readline";

import Monster from "./src/models/Monster.js";
import {
    translateSize,
    translateType,
    translateAlignment,
    translateDamageList,
    translateConditionList,
    translateLanguageList,
    translateSense,
    translateMonster
} from "./src/services/translationService.js";

const SRD_API = "https://www.dnd5eapi.co";
const CONCURRENCY = 3;
const ESTIMATED_COST_EUR = "2-4";

const connectDB = async () => {
    const { MONGO_HOST, MONGO_PORT, MONGO_USER, MONGO_PASSWORD, MONGO_DB } = process.env;
    const uri = `mongodb://${MONGO_USER}:${encodeURIComponent(MONGO_PASSWORD)}@${MONGO_HOST}:${MONGO_PORT}/${MONGO_DB}?authSource=admin`;
    await mongoose.connect(uri);
    console.log(`✅ Conectado a MongoDB (${MONGO_DB}@${MONGO_HOST})`);
};

const confirm = (question) => new Promise(resolve => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
        rl.close();
        resolve(answer.trim().toLowerCase() === "s");
    });
});

const fetchSrdIndex = async () => {
    const res = await fetch(`${SRD_API}/api/2014/monsters`);
    if (!res.ok) throw new Error(`Error fetching SRD index: ${res.status}`);
    const data = await res.json();
    return data.results || [];
};

const fetchSrdMonster = async (index) => {
    const res = await fetch(`${SRD_API}/api/2014/monsters/${index}`);
    if (!res.ok) throw new Error(`Error fetching ${index}: ${res.status}`);
    return res.json();
};

/**
 * Mapea la respuesta cruda del SRD a un documento Monster usando los
 * diccionarios fijos. Los textos largos quedan en inglés; se traducen
 * después con Claude.
 */
const mapMonsterFromSrd = (srd) => {
    // Velocidad: el SRD da un objeto { walk: "30 ft.", fly: "60 ft." }
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

    // Acciones unificadas
    const actions = [];
    const pushActions = (arr, kind) => {
        for (const a of arr || []) {
            const action = {
                kind,
                name: a.name || "",
                description: a.desc || ""
            };
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

    // CR como string
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
        conditionImmunities:   translateConditionList((srd.condition_immunities || []).map(c => c.index)),

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

/**
 * Traduce el monstruo con Claude. Reemplaza los textos largos en su sitio.
 */
const translateMapped = async (mapped) => {
    const payload = {
        name: mapped.name,
        description: mapped.description,
        actions: mapped.actions.map(a => ({
            kind: a.kind,
            name: a.name,
            description: a.description
        }))
    };

    const translated = await translateMonster(mapped.srdIndex, payload);

    mapped.name = translated.name || mapped.name;
    if (translated.description) mapped.description = translated.description;

    if (Array.isArray(translated.actions)) {
        for (let i = 0; i < mapped.actions.length; i++) {
            const t = translated.actions[i];
            if (!t) continue;
            mapped.actions[i].name = t.name || mapped.actions[i].name;
            mapped.actions[i].description = t.description || mapped.actions[i].description;
        }
    }

    return mapped;
};

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

const main = async () => {
    console.log("🐉 SEED DE MONSTRUOS DEL SRD OFICIAL\n");

    if (!process.env.ANTHROPIC_API_KEY) {
        console.error("❌ Falta ANTHROPIC_API_KEY en .env");
        process.exit(1);
    }

    await connectDB();

    console.log("📡 Descargando índice del SRD...");
    const srdIndex = await fetchSrdIndex();
    console.log(`   ${srdIndex.length} monstruos disponibles.\n`);

    const existing = await Monster.find({ srdIndex: { $exists: true } }, "srdIndex").lean();
    const existingIndices = new Set(existing.map(m => m.srdIndex));
    const pending = srdIndex.filter(m => !existingIndices.has(m.index));

    console.log(`✓ Ya importados: ${existingIndices.size}`);
    console.log(`→ Por importar:  ${pending.length}\n`);

    if (pending.length === 0) {
        console.log("✨ Todo al día. Nada que hacer.");
        await mongoose.disconnect();
        return;
    }

    console.log(`⚠️  Se van a traducir ${pending.length} monstruos con Claude Haiku.`);
    console.log(`   Coste estimado: ${ESTIMATED_COST_EUR} EUR aproximadamente.`);
    console.log(`   Concurrencia: ${CONCURRENCY} en paralelo.\n`);
    const ok = await confirm("¿Continuar? [s/n] ");
    if (!ok) {
        console.log("Cancelado.");
        await mongoose.disconnect();
        return;
    }

    console.log("\n📥 Descargando datos del SRD...");
    const srdDetails = await processInPool(
        pending,
        async (m) => fetchSrdMonster(m.index),
        5
    );

    console.log("\n🗺️  Mapeando al modelo Monster...");
    const mapped = srdDetails
        .filter(d => d && !d.error)
        .map(mapMonsterFromSrd);

    console.log(`\n🤖 Traduciendo con Claude Haiku...`);
    const translated = await processInPool(mapped, translateMapped, CONCURRENCY);

    const okTranslations = translated.filter(t => t && !t.error);
    const errors = translated.filter(t => t && t.error);

    if (errors.length) {
        console.warn(`\n⚠️  ${errors.length} traducciones fallaron:`);
        for (const e of errors) console.warn(`   - ${e.srdIndex}: ${e.error}`);
    }

    console.log(`\n💾 Guardando ${okTranslations.length} monstruos en BD...`);
    let inserted = 0;
    for (const m of okTranslations) {
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
    if (errors.length) {
        console.log(`   ⚠️ ${errors.length} fallaron — relanza el script para reintentar (la caché conserva los hechos).`);
    }

    await mongoose.disconnect();
};

main().catch(err => {
    console.error("❌ Error fatal:", err);
    process.exit(1);
});
