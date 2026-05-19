/**
 * Crea un personaje completo de demo: Eldrin Vespertano, Mago Elfo nivel 8.
 * Todos los campos de las 7 fases rellenos: identidad, stats, competencias,
 * combate, personalidad, físico, idiomas, inventario y hechizos.
 *
 * Lánzalo desde la raíz del backend con:
 *   node --env-file=.env seed-demo.js
 *
 * O si usas Docker:
 *   sudo docker compose exec app node seed-demo.js
 */

import { post, get, fetchWithRetry, BASE_URL } from "./seed-helpers.js";

const main = async () => {
    console.log("🌱 Creando personaje completo de demo...\n");

    // 1. Login
    const credentials = { email: "dm@dnd.io", password: "secret123" };
    const loginRes = await post("/api/auth/login", credentials);
    if (!loginRes.res.ok) {
        throw new Error("No se pudo hacer login con dm@dnd.io. ¿Lanzaste el seed principal antes?");
    }
    const token = loginRes.json.token;
    console.log("✅ Login con DM");

    // 2. Crear personaje base con todos los campos
    console.log("📜 Creando a Eldrin Vespertano...");

    const characterPayload = {
        name: "Eldrin Vespertano",
        charClass: "Wizard",
        race: "Elf",
        level: 8,
        alignment: "Neutral Good",
        background: "Sage",
        experiencePoints: 48000,
        inspiration: true,
        gold: 1250,
        abilityScores: {
            strength: 10,
            dexterity: 16,
            constitution: 14,
            intelligence: 18,
            wisdom: 13,
            charisma: 12
        },
        hitPoints: {
            current: 52,
            max: 56,
            temporary: 0
        },
        combatStats: {
            armorClass: 13,
            initiative: 0,
            speed: 30,
            hitDice: { total: 8, type: "d6", used: 2 },
            deathSaves: { successes: 0, failures: 0 }
        },
        proficiencies: {
            savingThrows: {
                strength: false,
                dexterity: false,
                constitution: false,
                intelligence: true,
                wisdom: true,
                charisma: false
            },
            skills: {
                acrobatics: false,
                animalHandling: false,
                arcana: true,
                athletics: false,
                deception: false,
                history: true,
                insight: true,
                intimidation: false,
                investigation: true,
                medicine: false,
                nature: false,
                perception: true,
                performance: false,
                persuasion: false,
                religion: false,
                sleightOfHand: false,
                stealth: false,
                survival: false
            },
            languages: ["Común", "Élfico", "Dracónico", "Silvano", "Abisal", "Celestial"],
            other: [
                "Dagas",
                "Dardos",
                "Hondas",
                "Bastones",
                "Ballestas ligeras",
                "Suministros de calígrafo",
                "Kit de herborista"
            ]
        },
        personality: {
            traits: "Uso palabras largas y rebuscadas para parecer culto. Estudio cualquier nuevo lugar como si fuera un texto sagrado. Hablo en voz baja, casi un susurro, salvo cuando me apasiono.",
            ideals: "Conocimiento. El camino hacia el poder y la mejora personal pasa por el saber. Cada misterio resuelto es una piedra más en el muro de la civilización contra la oscuridad.",
            bonds: "He pasado años traduciendo un grimorio antiguo encontrado en las ruinas de Mythardir. Daría mi vida por proteger ese conocimiento. Mi mentora, la archimaga Lyralei, sigue prisionera en el plano astral. Algún día la liberaré.",
            flaws: "No soporto a los ignorantes. Me cuesta admitir que estoy equivocado, incluso cuando es evidente. Tiendo a hablar más de lo que escucho cuando un tema me apasiona, y los temas que me apasionan son muchos.",
            backstory: "Nacido en los bosques élficos de Cormanthor bajo una luna nueva, Eldrin mostró desde joven una curiosidad insaciable por las artes arcanas. A los cincuenta años -aún un niño para los elfos- abandonó el bosque para estudiar en la Academia Mística de Aglarond.\n\nDurante décadas se sumergió en los archivos prohibidos, descifrando lenguas muertas y catalogando hechizos olvidados. Su tesis sobre las puertas planares le valió el reconocimiento del Círculo de Magos, pero también enemigos: una facción de cultistas del Velo Negro vio en sus investigaciones una amenaza.\n\nEl día en que su mentora Lyralei fue arrastrada al plano astral por un señor demonio convocado por estos cultistas, Eldrin juró que dedicaría su vida a recuperarla. Ahora viaja por Faerûn buscando los siete fragmentos del Atlas Esmeralda, la única llave conocida para abrir un portal estable al plano astral.",
            appearance: "Eldrin es alto incluso para un elfo, con una constitución delgada que esconde resistencia. Su piel es del color del hueso pulido, casi luminiscente bajo la luna. Lleva siempre robas color crepúsculo bordadas con runas plateadas, atadas en la cintura con un cordel de seda dorada. En su frente, una pequeña gema de obsidiana incrustada -un regalo de Lyralei- parece pulsar suavemente cuando lanza hechizos.",
            allies: "El Círculo de Magos de Aglarond - sigue siendo miembro honorario y recibe recursos para sus investigaciones.\n\nThelandra Crinplata, sacerdotisa de Mystra - amiga de la infancia, le proporciona refugio y curaciones cuando Eldrin pasa por el Templo del Saber.\n\nLa Cofradía del Pergamino Roto - un grupo secreto de eruditos dedicados a recuperar conocimiento perdido. Eldrin es uno de sus contactos exteriores más activos.",
            featuresAndTraits: "Visión en la Oscuridad (60 ft, ventaja heredada de la raza élfica).\nAscendencia Feérica - ventaja en salvaciones contra ser encantado, inmune a dormir mágico.\nTrance - medita 4h en lugar de dormir 8h.\nRecuperación arcana (1 vez por descanso corto, recupera espacios de conjuro hasta nivel 4 totales).\nEspecialización: Adivinación. Portento (2 dados de presagio por descanso largo, con resultados predeterminados).\nMaestro experto: bonificación de competencia duplicada en Investigación e Historia.",
            treasure: "Un grimorio personal con 96 hechizos transcritos en élfico antiguo (~250 po de valor base por los componentes).\n\n3 gemas de cuarzo rosa (50 po cada una) que usa como componentes para Escudo Arcano.\n\nUn anillo de plata con el sello de su academia, regalo de graduación.\n\nUn medallón de jade tallado con runas dracónicas, comprado en un bazar de Calimshan. Función desconocida; pulsa débilmente cerca de portales planares."
        },
        physical: {
            age: "237 años",
            height: "1,92 m",
            weight: "68 kg",
            eyes: "Plateados con destellos violeta",
            skin: "Pálida, casi luminiscente",
            hair: "Negro azabache, largo, recogido en una trenza"
        },
        spellcasting: {
            ability: "intelligence",
            saveDC: 15,
            attackBonus: 7,
            spellSlots: {
                level1: { total: 4, used: 1 },
                level2: { total: 3, used: 0 },
                level3: { total: 3, used: 1 },
                level4: { total: 2, used: 0 },
                level5: { total: 1, used: 0 },
                level6: { total: 0, used: 0 },
                level7: { total: 0, used: 0 },
                level8: { total: 0, used: 0 },
                level9: { total: 0, used: 0 }
            }
        }
    };

    // Borrar si existe ya un Eldrin previo de demo
    const existing = await get("/api/characters", token);
    const oldEldrin = existing.find(c => c.name === "Eldrin Vespertano");
    if (oldEldrin) {
        console.log("   ↺ Personaje previo encontrado, lo borro y recreo");
        await fetchWithRetry(`${BASE_URL}/api/characters/${oldEldrin._id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
        });
    }

    const charRes = await post("/api/characters", characterPayload, token);
    if (!charRes.res.ok) {
        console.error("Error al crear personaje:", charRes.json);
        throw new Error("Falló la creación");
    }
    const character = charRes.json;
    console.log(`✅ Personaje creado: ${character.name} (id: ${character._id})`);

    // 3. Inventario
    console.log("🎒 Añadiendo objetos al inventario...");

    const wantedItems = [
        { name: "Bastón", customName: "Bastón del Saber Antiguo", equipped: true, durability: 100, notes: "Regalo de Lyralei. Tiene runas talladas que brillan al lanzar hechizos." },
        { name: "Daga", equipped: true, durability: 95, notes: "Para componentes mágicos y, si todo falla, para defenderse." },
        { name: "Bolsa de componentes", quantity: 1 },
        { name: "Pergamino", quantity: 12, notes: "Hojas en blanco para anotar hechizos y cartas." },
        { name: "Tinta (frasco de 1 oz)", quantity: 3 },
        { name: "Pluma de tinta", quantity: 5 },
        { name: "Mochila", equipped: true, quantity: 1 },
        { name: "Saco de dormir", quantity: 1 },
        { name: "Linterna con capucha", quantity: 1 },
        { name: "Aceite (frasco)", quantity: 4 },
        { name: "Raciones (1 día)", quantity: 7 },
        { name: "Odre de agua", quantity: 1 },
        { name: "Cuerda de cáñamo (50 pies)", quantity: 1 }
    ];

    const allObjects = await get("/api/objects", token);
    let itemsAdded = 0;
    for (const item of wantedItems) {
        const baseObject = allObjects.find(o => o.name === item.name);
        if (!baseObject) {
            console.log(`   ⚠ "${item.name}" no encontrado en el catálogo, salto`);
            continue;
        }
        const { name, ...rest } = item;
        const r = await post(
            `/api/characters/${character._id}/inventory`,
            { baseObject: baseObject._id, ...rest },
            token
        );
        if (r.res.ok) itemsAdded++;
    }
    console.log(`   ${itemsAdded}/${wantedItems.length} objetos añadidos`);

    // 4. Hechizos
    console.log("✨ Añadiendo hechizos...");

    const wantedSpells = [
        // Trucos
        { name: "Mage Hand", prepared: false },
        { name: "Prestidigitation", prepared: false },
        { name: "Fire Bolt", prepared: false },
        { name: "Light", prepared: false },
        { name: "Minor Illusion", prepared: false },
        // Nivel 1
        { name: "Magic Missile", prepared: true },
        { name: "Shield", prepared: true },
        { name: "Detect Magic", prepared: true, notes: "Ritual" },
        { name: "Identify", prepared: false, notes: "Ritual" },
        { name: "Mage Armor", prepared: true },
        // Nivel 2
        { name: "Misty Step", prepared: true },
        { name: "Invisibility", prepared: true },
        { name: "Mirror Image", prepared: false },
        { name: "Web", prepared: false },
        // Nivel 3
        { name: "Fireball", prepared: true },
        { name: "Counterspell", prepared: true },
        { name: "Fly", prepared: false },
        { name: "Dispel Magic", prepared: false },
        // Nivel 4
        { name: "Greater Invisibility", prepared: true },
        { name: "Polymorph", prepared: false },
        // Nivel 5
        { name: "Wall of Force", prepared: true }
    ];

    const allSpells = await get("/api/spells", token);
    let spellsAdded = 0;
    for (const want of wantedSpells) {
        const spell = allSpells.find(s =>
            s.nameOriginal === want.name ||
            s.name?.toLowerCase().includes(want.name.toLowerCase())
        );
        if (!spell) {
            console.log(`   ⚠ "${want.name}" no encontrado en el catálogo de hechizos, salto`);
            continue;
        }
        const r = await post(
            `/api/characters/${character._id}/spells`,
            { spell: spell._id, prepared: want.prepared, notes: want.notes || "" },
            token
        );
        if (r.res.ok) spellsAdded++;
        else console.log(`   ⚠ "${want.name}": ${r.json.message}`);
    }
    console.log(`   ${spellsAdded}/${wantedSpells.length} hechizos añadidos`);

    // 5. Resumen final
    console.log("\n🎉 ¡Eldrin Vespertano está listo!\n");
    console.log("📋 Para verlo:");
    console.log(`   1. Login en el front: dm@dnd.io / secret123`);
    console.log(`   2. Ve a "Personajes" y abre "Eldrin Vespertano"`);
    console.log(`   3. Pulsa "🖨 Imprimir hoja" arriba a la derecha`);
    console.log(`   4. La pestaña nueva mostrará la hoja con las 3 páginas A4 listas para PDF\n`);
};

main().catch(err => {
    console.error("\n💥 Error:", err.message);
    process.exit(1);
});
