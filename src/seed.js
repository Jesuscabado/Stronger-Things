/**
 * Script de seed con rate limiting y retry automático.
 *
 * - Pausa de 800ms entre items (la API D&D limita a ~100 req/min).
 * - Reintenta automáticamente si una petición falla, con backoff progresivo.
 * - Usa caché persistente de traducciones en src/data/translations.json.
 */

import {
    translateItem,
    translateDamageType,
    translateProperties,
    getCacheStats
} from "./services/translationService.js";

const PORT = process.env.APP_PORT || 3001;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const DND_API = "https://www.dnd5eapi.co/api/2014";

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/**
 * Hace un fetch con reintentos automáticos y backoff progresivo.
 */
const fetchWithRetry = async (url, options = {}, retries = 5, baseDelay = 2000) => {
    let lastError;
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const res = await fetch(url, options);
            if (res.ok) return res;
            // 429 (rate limit) o 5xx → reintentamos
            if (res.status === 429 || res.status >= 500) {
                if (attempt < retries) {
                    const wait = baseDelay * attempt;
                    process.stdout.write(`\n   ⏳ ${res.status} en ${url.split("/").pop()}, esperando ${wait}ms...`);
                    await sleep(wait);
                    continue;
                }
            }
            // Otros 4xx → no reintentar, devolver tal cual
            return res;
        } catch (err) {
            lastError = err;
            if (attempt < retries) {
                const wait = baseDelay * attempt;
                process.stdout.write(`\n   ⏳ ${err.message} en ${url.split("/").pop()}, reintentando en ${wait}ms...`);
                await sleep(wait);
                continue;
            }
        }
    }
    throw lastError || new Error("Retries exhausted");
};

const post = async (path, body, token) => {
    try {
        const res = await fetchWithRetry(`${BASE_URL}${path}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(token && { Authorization: `Bearer ${token}` })
            },
            body: JSON.stringify(body)
        });
        const json = await res.json().catch(() => ({}));
        return { res, json };
    } catch (err) {
        return { res: { ok: false, status: 0 }, json: { message: err.message } };
    }
};

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
    console.log("\n📥 Descargando catálogo de la API D&D 5e...");
    const listRes = await fetchWithRetry(`${DND_API}/equipment`);
    const { results } = await listRes.json();
    console.log(`   ${results.length} items disponibles`);

    const statsBefore = await getCacheStats();
    console.log(`   📚 Caché actual: ${statsBefore.items} items ya traducidos\n`);

    let inserted = 0, skipped = 0, failed = 0, newlyTranslated = 0;

    for (let i = 0; i < results.length; i++) {
        const item = results[i];

        try {
            // Pausa entre items: respeta rate limit ~100/min de la API
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

const findObjectIdByName = async (name, token) => {
    try {
        const res = await fetchWithRetry(`${BASE_URL}/api/objects`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const list = await res.json();
        const found = list.find(o => o.name === name);
        return found?._id || null;
    } catch {
        return null;
    }
};

const main = async () => {
    console.log("🌱 Seeding StrongerThings...");

    if (!process.env.ANTHROPIC_API_KEY) {
        console.warn("⚠  ANTHROPIC_API_KEY no está definida en .env. Las traducciones nuevas fallarán.");
    }

    let token, userId;
    const credentials = { email: "dm@dnd.io", password: "secret123" };

    let r = await post("/api/auth/register", { username: "DungeonMaster", ...credentials });
    if (r.res.ok) {
        token = r.json.token;
        userId = r.json.user._id;
        console.log("✅ Usuario DM registrado");
    } else {
        r = await post("/api/auth/login", credentials);
        if (!r.res.ok) throw new Error("No se pudo registrar ni hacer login con dm@dnd.io");
        token = r.json.token;
        userId = r.json.user._id;
        console.log("✅ Login con DM existente");
    }

    await importCatalogFromAPI(token);

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
            const baseObjectId = await findObjectIdByName(item.name, token);
            if (!baseObjectId) {
                console.log(`     ⚠ "${item.name}" no encontrado en el catálogo, salto`);
                continue;
            }
            const { name, ...rest } = item;
            const r = await post(
                `/api/characters/${json._id}/inventory`,
                { baseObject: baseObjectId, ...rest },
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