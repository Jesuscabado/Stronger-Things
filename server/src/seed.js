/**
 * Seed con rate limiting, retry y caché de traducciones.
 * Importa items y hechizos de la API D&D 5e.
 */

import {
    translateItem,
    translateDamageType,
    translateProperties,
    translateSpell,
    translateSchool,
    getCacheStats
} from "./services/translationService.js";

import { sleep, fetchWithRetry, post, get } from "./seed-helpers.js";

const DND_API = "https://www.dnd5eapi.co/api/2014";

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

const mapAndTranslateItem = async (apiItem) => {
    const englishDescription = Array.isArray(apiItem.desc) && apiItem.desc.length > 0
        ? apiItem.desc.join(" ")
        : (Array.isArray(apiItem.special) ? apiItem.special.join(" ") : "");

    const translated = await translateItem(apiItem.name, englishDescription);

    const stats = {
        rarity: "common",
        requiresAttunement: false,
        maxDurability: 100
    };

    if (apiItem.damage) {
        stats.damage = apiItem.damage.damage_dice;
        stats.damageType = await translateDamageType(apiItem.damage.damage_type?.name);
    }
    if (apiItem.armor_class) {
        stats.armorClass = apiItem.armor_class.base;
    }
    if (apiItem.weight !== undefined && apiItem.weight !== null) {
        stats.weight = apiItem.weight;
    }
    if (Array.isArray(apiItem.properties) && apiItem.properties.length > 0) {
        const propNames = apiItem.properties.map(p => p.name);
        stats.properties = await translateProperties(propNames);
    }

    return {
        name: translated.name,
        description: translated.description,
        category: normalizeCategory(apiItem),
        cost: costToGold(apiItem.cost),
        stats
    };
};

const importCatalogFromAPI = async (token) => {
    console.log("\n📥 Descargando catálogo de items de la API D&D 5e...");
    const listRes = await fetchWithRetry(`${DND_API}/equipment`);
    const { results } = await listRes.json();
    console.log(`   ${results.length} items disponibles`);

    const statsBefore = await getCacheStats();
    console.log(`   📚 Caché actual: ${statsBefore.items} items ya traducidos\n`);

    let inserted = 0, skipped = 0, failed = 0, newlyTranslated = 0;

    for (let i = 0; i < results.length; i++) {
        const item = results[i];
        try {
            if (i > 0) await sleep(800);
            const detailRes = await fetchWithRetry(`https://www.dnd5eapi.co${item.url}`);
            const detail = await detailRes.json();

            const cacheBefore = await getCacheStats();
            const mapped = await mapAndTranslateItem(detail);
            const cacheAfter = await getCacheStats();

            if (cacheAfter.items > cacheBefore.items) newlyTranslated++;

            const { res, json } = await post("/api/objects", mapped, token);
            if (res.ok) {
                inserted++;
                process.stdout.write(`\r   ✓ ${i + 1}/${results.length} - ${mapped.name}`.padEnd(80) + " ");
            } else if (
                res.status === 409 ||
                (json.message || "").toLowerCase().includes("ya existe") ||
                (json.message || "").toLowerCase().includes("duplicate")
            ) {
                skipped++;
                process.stdout.write(`\r   · ${i + 1}/${results.length} - ${mapped.name} (ya en BD)`.padEnd(80) + " ");
            } else {
                failed++;
                console.warn(`\n   ✗ ${item.name}: ${json.message || "error desconocido"}`);
            }
        } catch (err) {
            failed++;
            console.warn(`\n   ✗ ${item.name}: ${err.message}`);
        }
    }

    console.log(`\n\n   📊 ${inserted} insertados | ${skipped} ya estaban en BD | ${failed} fallidos`);
    console.log(`   🌐 ${newlyTranslated} traducciones nuevas | ${results.length - newlyTranslated} desde caché\n`);
};

/* ─────────────── HECHIZOS ─────────────── */

const mapAndTranslateSpell = async (apiSpell) => {
    const englishDescription = Array.isArray(apiSpell.desc)
        ? apiSpell.desc.join("\n\n")
        : (apiSpell.desc || "");

    const englishAtHigher = Array.isArray(apiSpell.higher_level)
        ? apiSpell.higher_level.join("\n\n")
        : (apiSpell.higher_level || "");

    const translated = await translateSpell(
        apiSpell.name,
        englishDescription,
        englishAtHigher
    );

    const components = {
        verbal: false,
        somatic: false,
        material: false,
        materialDesc: ""
    };
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
        if (apiSpell.damage.damage_type?.name) {
            damageType = await translateDamageType(apiSpell.damage.damage_type.name);
        }
        if (apiSpell.damage.damage_at_slot_level) {
            for (const [k, v] of Object.entries(apiSpell.damage.damage_at_slot_level)) {
                damageAtSlot[k] = v;
            }
        }
        if (apiSpell.damage.damage_at_character_level) {
            for (const [k, v] of Object.entries(apiSpell.damage.damage_at_character_level)) {
                damageAtSlot[`char${k}`] = v;
            }
        }
    }

    const classes = Array.isArray(apiSpell.classes)
        ? apiSpell.classes.map(c => c.name)
        : [];

    return {
        name: translated.name,
        nameOriginal: apiSpell.name,
        description: translated.description,
        atHigherLevels: translated.atHigherLevels,
        level: apiSpell.level ?? 0,
        school: translateSchool(apiSpell.school?.name),
        castingTime: apiSpell.casting_time || "1 acción",
        range: apiSpell.range || "30 pies",
        duration: apiSpell.duration || "Instantáneo",
        concentration: !!apiSpell.concentration,
        ritual: !!apiSpell.ritual,
        components,
        damageType,
        damageAtSlot,
        classes
    };
};

const importSpellsFromAPI = async (token) => {
    console.log("\n📥 Descargando catálogo de hechizos de la API D&D 5e...");
    const listRes = await fetchWithRetry(`${DND_API}/spells`);
    const { results } = await listRes.json();
    console.log(`   ${results.length} hechizos disponibles`);

    const statsBefore = await getCacheStats();
    console.log(`   📚 Caché actual: ${statsBefore.spells} hechizos ya traducidos\n`);

    let inserted = 0, skipped = 0, failed = 0, newlyTranslated = 0;

    for (let i = 0; i < results.length; i++) {
        const item = results[i];
        try {
            if (i > 0) await sleep(800);
            const detailRes = await fetchWithRetry(`https://www.dnd5eapi.co${item.url}`);
            const detail = await detailRes.json();

            const cacheBefore = await getCacheStats();
            const mapped = await mapAndTranslateSpell(detail);
            const cacheAfter = await getCacheStats();

            if (cacheAfter.spells > cacheBefore.spells) newlyTranslated++;

            const { res, json } = await post("/api/spells", mapped, token);
            if (res.ok) {
                inserted++;
                process.stdout.write(`\r   ✓ ${i + 1}/${results.length} - ${mapped.name} (Nv ${mapped.level})`.padEnd(80) + " ");
            } else if (
                res.status === 409 ||
                (json.message || "").toLowerCase().includes("ya existe") ||
                (json.message || "").toLowerCase().includes("duplicate")
            ) {
                skipped++;
                process.stdout.write(`\r   · ${i + 1}/${results.length} - ${mapped.name} (ya en BD)`.padEnd(80) + " ");
            } else {
                failed++;
                console.warn(`\n   ✗ ${item.name}: ${json.message || "error desconocido"}`);
            }
        } catch (err) {
            failed++;
            console.warn(`\n   ✗ ${item.name}: ${err.message}`);
        }
    }

    console.log(`\n\n   📊 ${inserted} insertados | ${skipped} ya estaban en BD | ${failed} fallidos`);
    console.log(`   🌐 ${newlyTranslated} traducciones nuevas | ${results.length - newlyTranslated} desde caché\n`);
};

/* ─────────────── MAIN ─────────────── */

const main = async () => {
    console.log("🌱 Seeding StrongerThings...");

    if (!process.env.ANTHROPIC_API_KEY) {
        console.warn("⚠  ANTHROPIC_API_KEY no está definida en .env. Las traducciones nuevas fallarán.");
    }

    let token;
    const credentials = { email: "dm@dnd.io", password: "secret123" };

    let r = await post("/api/auth/register", { username: "DungeonMaster", ...credentials });
    if (r.res.ok) {
        token = r.json.token;
        console.log("✅ Usuario DM registrado");
    } else {
        r = await post("/api/auth/login", credentials);
        if (!r.res.ok) throw new Error("No se pudo registrar ni hacer login con dm@dnd.io");
        token = r.json.token;
        console.log("✅ Login con DM existente");
    }

    await importCatalogFromAPI(token);
    await importSpellsFromAPI(token);

    // Cargamos el catálogo una sola vez para el inventario de personajes
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
    console.log(`👉 Login en el front: dm@dnd.io / secret123\n`);
};

main().catch((err) => {
    console.error("\n💥 Error en seed:", err.message);
    process.exit(1);
});
