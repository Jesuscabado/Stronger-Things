/**
 * Seed de objetos, hechizos y personajes de prueba.
 *
 * Lee los datos mecánicos desde data/srd-equipment.json y data/srd-spells.json
 * y las traducciones desde data/translations.json.
 * No necesita conexión a ninguna API externa.
 *
 * Requisitos:
 *   - El servidor debe estar arrancado (npm run dev)
 *   - Ejecutar antes: npm run seed:download  (solo la primera vez)
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { post, get } from "./seed-helpers.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR  = path.resolve(__dirname, "data");

const SCHOOL_MAP = {
    "Abjuration":   "Abjuración",
    "Conjuration":  "Conjuración",
    "Divination":   "Adivinación",
    "Enchantment":  "Encantamiento",
    "Evocation":    "Evocación",
    "Illusion":     "Ilusión",
    "Necromancy":   "Nigromancia",
    "Transmutation":"Transmutación"
};

const loadJson = async (filename) => {
    const text = await fs.readFile(path.join(DATA_DIR, filename), "utf8");
    return JSON.parse(text);
};

/* ─────────────── ITEMS ─────────────── */

const costToGold = (apiCost) => {
    if (!apiCost) return 0;
    const conversion = { cp: 0.01, sp: 0.1, ep: 0.5, gp: 1, pp: 10 };
    const factor = conversion[apiCost.unit] ?? 1;
    return Math.round(apiCost.quantity * factor * 100) / 100;
};

const normalizeCategory = (apiItem) => {
    const catName = (apiItem.equipment_category?.name || "").toLowerCase();
    const itemName = (apiItem.name || "").toLowerCase();

    if (itemName.includes("shield")) return "shield";
    if (itemName.includes("potion")) return "potion";
    if (itemName.includes("scroll")) return "scroll";
    if (itemName.includes("arrow") || itemName.includes("bolt") ||
        itemName.includes("bullet") || itemName.includes("needle")) return "ammunition";

    if (catName.includes("weapon")) return "weapon";
    if (catName.includes("armor")) return "armor";
    if (catName.includes("potion")) return "potion";
    if (catName.includes("scroll")) return "scroll";
    if (catName.includes("wondrous")) return "wondrous";
    if (catName.includes("tool") || catName.includes("kit") ||
        catName.includes("supplies") || catName.includes("instrument")) return "tool";
    if (catName.includes("ammunition")) return "ammunition";

    return "gear";
};

const mapItem = (apiItem, translations) => {
    const t = translations.items[apiItem.name] || {};

    const stats = { rarity: "common", requiresAttunement: false, maxDurability: 100 };

    if (apiItem.damage) {
        stats.damage = apiItem.damage.damage_dice;
        const dtKey = apiItem.damage.damage_type?.name;
        stats.damageType = (dtKey && (translations.damageTypes[dtKey] || dtKey)) || "";
    }
    if (apiItem.armor_class) stats.armorClass = apiItem.armor_class.base;
    if (apiItem.weight !== undefined && apiItem.weight !== null) stats.weight = apiItem.weight;
    if (Array.isArray(apiItem.properties) && apiItem.properties.length > 0) {
        stats.properties = apiItem.properties.map(p =>
            translations.properties[p.name] || p.name
        );
    }

    return {
        name: t.name || apiItem.name,
        description: t.description || (Array.isArray(apiItem.desc) ? apiItem.desc.join(" ") : (Array.isArray(apiItem.special) ? apiItem.special.join(" ") : "")),
        category: normalizeCategory(apiItem),
        cost: costToGold(apiItem.cost),
        stats,
        isPublic: true
    };
};

const importCatalog = async (token, srdItems, translations) => {
    console.log(`\n📦 Importando ${srdItems.length} objetos...`);
    let inserted = 0, skipped = 0, failed = 0;

    for (let i = 0; i < srdItems.length; i++) {
        const apiItem = srdItems[i];
        try {
            const mapped = mapItem(apiItem, translations);
            const { res, json } = await post("/api/objects", mapped, token);
            if (res.ok) {
                inserted++;
                process.stdout.write(`\r   ✓ ${i + 1}/${srdItems.length} - ${mapped.name}`.padEnd(80) + " ");
            } else if (
                res.status === 409 ||
                (json.message || "").toLowerCase().includes("ya existe") ||
                (json.message || "").toLowerCase().includes("duplicate")
            ) {
                skipped++;
                process.stdout.write(`\r   · ${i + 1}/${srdItems.length} - ${mapped.name} (ya en BD)`.padEnd(80) + " ");
            } else {
                failed++;
                console.warn(`\n   ✗ ${apiItem.name}: ${json.message || "error desconocido"}`);
            }
        } catch (err) {
            failed++;
            console.warn(`\n   ✗ ${apiItem.name}: ${err.message}`);
        }
    }
    console.log(`\n\n   📊 ${inserted} insertados | ${skipped} ya estaban en BD | ${failed} fallidos\n`);
};

/* ─────────────── HECHIZOS ─────────────── */

const mapSpell = (apiSpell, translations) => {
    const t = translations.spells[apiSpell.name] || {};

    const components = { verbal: false, somatic: false, material: false, materialDesc: "" };
    if (Array.isArray(apiSpell.components)) {
        for (const c of apiSpell.components) {
            if (c === "V") components.verbal = true;
            if (c === "S") components.somatic = true;
            if (c === "M") components.material = true;
        }
    }
    if (apiSpell.material) components.materialDesc = apiSpell.material;

    const damageAtSlot = {};
    let damageType = "";
    if (apiSpell.damage) {
        const dtName = apiSpell.damage.damage_type?.name;
        if (dtName) damageType = translations.damageTypes[dtName] || dtName;
        for (const [k, v] of Object.entries(apiSpell.damage.damage_at_slot_level || {})) {
            damageAtSlot[k] = v;
        }
        for (const [k, v] of Object.entries(apiSpell.damage.damage_at_character_level || {})) {
            damageAtSlot[`char${k}`] = v;
        }
    }

    return {
        name:           t.name || apiSpell.name,
        nameOriginal:   apiSpell.name,
        description:    t.description || (Array.isArray(apiSpell.desc) ? apiSpell.desc.join("\n\n") : ""),
        atHigherLevels: t.atHigherLevels || (Array.isArray(apiSpell.higher_level) ? apiSpell.higher_level.join("\n\n") : ""),
        level:          apiSpell.level ?? 0,
        school:         SCHOOL_MAP[apiSpell.school?.name] || apiSpell.school?.name || "",
        castingTime:    apiSpell.casting_time || "1 acción",
        range:          apiSpell.range || "30 pies",
        duration:       apiSpell.duration || "Instantáneo",
        concentration:  !!apiSpell.concentration,
        ritual:         !!apiSpell.ritual,
        components,
        damageType,
        damageAtSlot,
        classes: Array.isArray(apiSpell.classes) ? apiSpell.classes.map(c => c.name) : [],
        isPublic: true
    };
};

const importSpells = async (token, srdSpells, translations) => {
    console.log(`\n✨ Importando ${srdSpells.length} hechizos...`);
    let inserted = 0, skipped = 0, failed = 0;

    for (let i = 0; i < srdSpells.length; i++) {
        const apiSpell = srdSpells[i];
        try {
            const mapped = mapSpell(apiSpell, translations);
            const { res, json } = await post("/api/spells", mapped, token);
            if (res.ok) {
                inserted++;
                process.stdout.write(`\r   ✓ ${i + 1}/${srdSpells.length} - ${mapped.name} (Nv ${mapped.level})`.padEnd(80) + " ");
            } else if (
                res.status === 409 ||
                (json.message || "").toLowerCase().includes("ya existe") ||
                (json.message || "").toLowerCase().includes("duplicate")
            ) {
                skipped++;
                process.stdout.write(`\r   · ${i + 1}/${srdSpells.length} - ${mapped.name} (ya en BD)`.padEnd(80) + " ");
            } else {
                failed++;
                console.warn(`\n   ✗ ${apiSpell.name}: ${json.message || "error desconocido"}`);
            }
        } catch (err) {
            failed++;
            console.warn(`\n   ✗ ${apiSpell.name}: ${err.message}`);
        }
    }
    console.log(`\n\n   📊 ${inserted} insertados | ${skipped} ya estaban en BD | ${failed} fallidos\n`);
};

/* ─────────────── MAIN ─────────────── */

const main = async () => {
    console.log("🌱 Seeding StrongerThings (modo local, sin APIs externas)...");

    let srdEquipment, srdSpells, translations;
    try {
        [srdEquipment, srdSpells, translations] = await Promise.all([
            loadJson("srd-equipment.json"),
            loadJson("srd-spells.json"),
            loadJson("translations.json")
        ]);
        console.log(`✅ Datos cargados: ${srdEquipment.length} objetos, ${srdSpells.length} hechizos`);
    } catch (err) {
        console.error("❌ Faltan archivos de datos locales. Ejecuta primero: npm run seed:download");
        process.exit(1);
    }

    let token;
    const credentials = {
        email: process.env.SEED_EMAIL || "dm@dnd.io",
        password: process.env.SEED_PASSWORD || "secret123"
    };
    const username = process.env.SEED_USERNAME || "DungeonMaster";

    let r = await post("/api/auth/register", { username, ...credentials });
    if (r.res.ok) {
        token = r.json.token;
        console.log(`✅ Usuario ${username} registrado`);
    } else {
        r = await post("/api/auth/login", credentials);
        if (!r.res.ok) throw new Error(`No se pudo registrar ni hacer login con ${credentials.email}`);
        token = r.json.token;
        console.log(`✅ Login con ${username} existente`);
    }

    await importCatalog(token, srdEquipment, translations);
    await importSpells(token, srdSpells, translations);

    const allObjects = await get("/api/objects", token).catch(() => []);

    const characters = [
        {
            name: "Aragorn", charClass: "Ranger", race: "Human", level: 5, gold: 250,
            abilityScores: { strength: 16, dexterity: 18, constitution: 14, intelligence: 12, wisdom: 16, charisma: 14 },
            hitPoints: { current: 44, max: 44 },
            loadout: [
                { name: "Espada larga", customName: "Andúril, Llama del Oeste", equipped: true, durability: 95 },
                { name: "Armadura de cuero", equipped: true }
            ]
        },
        {
            name: "Gandalf", charClass: "Wizard", race: "Human", level: 20, gold: 9999,
            abilityScores: { strength: 10, dexterity: 12, constitution: 14, intelligence: 20, wisdom: 18, charisma: 16 },
            hitPoints: { current: 120, max: 120 },
            loadout: [
                { name: "Bastón", customName: "Vara de mago", equipped: true }
            ]
        },
        {
            name: "Legolas", charClass: "Ranger", race: "Elf", level: 8, gold: 180,
            abilityScores: { strength: 12, dexterity: 20, constitution: 13, intelligence: 14, wisdom: 16, charisma: 12 },
            hitPoints: { current: 62, max: 62 },
            loadout: [
                { name: "Arco corto", customName: "Arco de Galadriel", equipped: true },
                { name: "Armadura de cuero", equipped: true }
            ]
        },
        {
            name: "Gimli", charClass: "Fighter", race: "Dwarf", level: 6, gold: 320,
            abilityScores: { strength: 18, dexterity: 12, constitution: 17, intelligence: 10, wisdom: 13, charisma: 11 },
            hitPoints: { current: 58, max: 58 },
            loadout: [
                { name: "Cota de mallas", equipped: true },
                { name: "Hacha de batalla", customName: "Hacha de los enanos", equipped: true, durability: 100 },
                { name: "Escudo", equipped: true }
            ]
        }
    ];

    console.log("🧙 Creando personajes de prueba...\n");
    for (const char of characters) {
        const { loadout, ...payload } = char;
        const { res, json } = await post("/api/characters", payload, token);
        if (!res.ok) {
            console.log(`   ⏭  ${char.name} ya existe o falló (${res.status})`);
            continue;
        }
        console.log(`✅ ${char.name} (${char.charClass} nivel ${char.level})`);

        for (const item of loadout) {
            const baseObject = allObjects.find(o => o.name === item.name);
            if (!baseObject) {
                console.log(`     ⚠ "${item.name}" no encontrado en el catálogo, salto`);
                continue;
            }
            const { name, ...rest } = item;
            const r = await post(
                `/api/characters/${json._id}/inventory`,
                { baseObject: baseObject._id, ...rest },
                token
            );
            if (r.res.ok) {
                console.log(`   📦 +${item.name}${item.customName ? ` ("${item.customName}")` : ""}`);
            }
        }
    }

    console.log("\n🎉 Seed completado.");
    console.log(`👉 Login en el front: ${credentials.email} / ${credentials.password}\n`);
};

main().catch((err) => {
    console.error("\n💥 Error en seed:", err.message);
    process.exit(1);
});
