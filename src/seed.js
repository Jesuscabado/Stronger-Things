/**
 * Script de seed: pobla la base llamando a la API real.
 * Ejecuta:  node src/seed.js
 *
 * Requisito: la app debe estar corriendo (npm run dev o docker compose up).
 */

const PORT = process.env.APP_PORT || 3001;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

const post = async (path, body, token) => {
    const res = await fetch(`${BASE_URL}${path}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify(body)
    });
    const json = await res.json();
    if (!res.ok) {
        console.warn(`⚠️  ${path} → ${res.status}:`, json.message || json);
    }   
    return { res, json };
};

const main = async () => { 
    console.log("🌱 Seeding StrongerThings...\n");

    // 1. Registrar usuario (o login si ya existe)
    let token, userId;
    const credentials = { email: "dm@dnd.io", password: "secret123" };

    let r = await post("/api/auth/register", {
        username: "DungeonMaster",
        ...credentials
    });

    if (r.res.ok) {
        token = r.json.token;
        userId = r.json.user._id;
        console.log("✅ Usuario registrado");
    } else {
        // Ya existe, hacemos login
        r = await post("/api/auth/login", credentials);
        token = r.json.token;
        userId = r.json.user._id;
        console.log("✅ Login (usuario ya existía)");
    }
    console.log(`   userId: ${userId}\n`);

    // 2. Catálogo de objetos
    const catalog = [
        {
            name: "Longsword",
            description: "Espada larga estándar",
            category: "weapon",
            cost: 15,
            stats: { damage: "1d8", damageType: "slashing", weight: 3, properties: ["versatile"], rarity: "common", maxDurability: 100 }
        },
        {
            name: "Shortbow",
            description: "Arco corto de madera",
            category: "weapon",
            cost: 25,
            stats: { damage: "1d6", damageType: "piercing", weight: 2, properties: ["ranged", "two-handed"], rarity: "common", maxDurability: 100 }
        },
        {
            name: "Plate Armor",
            description: "Armadura completa de placas",
            category: "armor",
            cost: 1500,
            stats: { armorClass: 18, weight: 65, rarity: "common", maxDurability: 100 }
        },
        {
            name: "Leather Armor",
            description: "Armadura ligera de cuero",
            category: "armor",
            cost: 10,
            stats: { armorClass: 11, weight: 10, rarity: "common", maxDurability: 100 }
        },
        {
            name: "Potion of Healing",
            description: "Restaura 2d4+2 PG",
            category: "potion",
            cost: 50,
            stats: { weight: 0.5, rarity: "common", extra: { healing: "2d4+2" } }
        },
        {
            name: "Wizard Staff",
            description: "Bastón mágico de roble",
            category: "weapon",
            cost: 200,
            stats: { damage: "1d6", damageType: "bludgeoning", attackBonus: 1, weight: 4, rarity: "uncommon", maxDurability: 100 }
        },
        {
            name: "Vorpal Sword",
            description: "Espada legendaria que decapita en crítico",
            category: "weapon",
            cost: 50000,
            stats: { damage: "1d8", damageType: "slashing", attackBonus: 3, weight: 3, properties: ["versatile", "vorpal"], rarity: "legendary", requiresAttunement: true, maxDurability: 100 }
        }
    ];

    const objectsByName = {};
    for (const item of catalog) {
        const { res, json } = await post("/api/objects", item, token);
        if (res.ok) {
            objectsByName[item.name] = json._id;
            console.log(`✅ Objeto creado: ${item.name}`);
        } else if (json.message?.includes("Ya existe")) {
            console.log(`⏭️  ${item.name} ya existía, salto`);
        }
    }
    console.log("");

    // 3. Personajes
    const characters = [
        {
            name: "Aragorn", charClass: "Ranger", race: "Human", level: 5, gold: 250,
            abilityScores: { strength: 16, dexterity: 18, constitution: 14, intelligence: 12, wisdom: 16, charisma: 14 },
            hitPoints: { current: 44, max: 44 },
            loadout: [
                { name: "Longsword", customName: "Andúril, Llama del Oeste", equipped: true, durability: 95 },
                { name: "Leather Armor", equipped: true },
                { name: "Potion of Healing", quantity: 3 }
            ]
        },
        {
            name: "Gandalf", charClass: "Wizard", race: "Human", level: 20, gold: 9999,
            abilityScores: { strength: 10, dexterity: 12, constitution: 14, intelligence: 20, wisdom: 18, charisma: 16 },
            hitPoints: { current: 120, max: 120 },
            loadout: [
                { name: "Wizard Staff", customName: "Vara de Saruman", equipped: true },
                { name: "Potion of Healing", quantity: 5 }
            ]
        },
        {
            name: "Legolas", charClass: "Ranger", race: "Elf", level: 8, gold: 180,
            abilityScores: { strength: 12, dexterity: 20, constitution: 13, intelligence: 14, wisdom: 16, charisma: 12 },
            hitPoints: { current: 62, max: 62 },
            loadout: [
                { name: "Shortbow", customName: "Arco de Galadriel", equipped: true },
                { name: "Leather Armor", equipped: true }
            ]
        },
        {
            name: "Gimli", charClass: "Fighter", race: "Dwarf", level: 6, gold: 320,
            abilityScores: { strength: 18, dexterity: 12, constitution: 17, intelligence: 10, wisdom: 13, charisma: 11 },
            hitPoints: { current: 58, max: 58 },
            loadout: [
                { name: "Plate Armor", equipped: true },
                { name: "Vorpal Sword", customName: "Hacha de los Enanos (reskin)", equipped: true, durability: 100 }
            ]
        }
    ];

    for (const char of characters) {
        const { loadout, ...payload } = char;
        const { res, json } = await post("/api/characters", { ...payload, user: userId }, token);
        if (!res.ok) continue;

        console.log(`✅ Personaje creado: ${char.name} (${char.charClass} nivel ${char.level})`);

        // Inventario
        for (const item of loadout) {
            const baseObject = objectsByName[item.name];
            if (!baseObject) continue;
            const { name, ...rest } = item;
            await post(`/api/characters/${json._id}/inventory`, { baseObject, ...rest }, token);
            console.log(`   📦 +${item.name}${item.customName ? ` ("${item.customName}")` : ""}`);
        }
    }

    console.log("\n🎉 Seed completado.");
    console.log(`\n👉 Prueba: GET ${BASE_URL}/api/characters`);
    console.log(`👉 Token de DM: ${token}`);
};

main().catch((err) => {
    console.error("💥 Error en seed:", err.message);
    process.exit(1);
});
