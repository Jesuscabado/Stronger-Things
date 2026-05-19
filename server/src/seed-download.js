/**
 * Descarga todos los datos del SRD de la API D&D 5e y los guarda en data/.
 *
 * Ejecutar UNA SOLA VEZ antes de usar los seeds:
 *   npm run seed:download
 *
 * Genera:
 *   data/srd-equipment.json  — array con el detalle completo de cada item
 *   data/srd-spells.json     — array con el detalle completo de cada hechizo
 *   data/srd-monsters.json   — array con el detalle completo de cada monstruo
 *
 * A partir de ahí, seed.js y seed-monsters.js funcionan sin conexión a ninguna API.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sleep, fetchWithRetry } from "./seed-helpers.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR  = path.resolve(__dirname, "data");
const DND_API   = "https://www.dnd5eapi.co/api/2014";

const downloadCollection = async (endpoint, label) => {
    console.log(`\n📥 Descargando ${label}...`);

    const listRes = await fetchWithRetry(`${DND_API}/${endpoint}`);
    const { results } = await listRes.json();
    console.log(`   ${results.length} ${label} encontrados`);

    const details = [];
    for (let i = 0; i < results.length; i++) {
        if (i > 0) await sleep(300);
        const res = await fetchWithRetry(`https://www.dnd5eapi.co${results[i].url}`);
        const detail = await res.json();
        details.push(detail);
        process.stdout.write(`\r   📦 ${i + 1}/${results.length} — ${detail.name}`.padEnd(80));
    }
    console.log("");
    return details;
};

const main = async () => {
    console.log("📡 Descargando datos SRD del D&D 5e API — solo necesitas hacer esto una vez.\n");

    await fs.mkdir(DATA_DIR, { recursive: true });

    const equipment = await downloadCollection("equipment", "objetos");
    await fs.writeFile(
        path.join(DATA_DIR, "srd-equipment.json"),
        JSON.stringify(equipment, null, 2)
    );
    console.log(`✅ data/srd-equipment.json — ${equipment.length} objetos`);

    const spells = await downloadCollection("spells", "hechizos");
    await fs.writeFile(
        path.join(DATA_DIR, "srd-spells.json"),
        JSON.stringify(spells, null, 2)
    );
    console.log(`✅ data/srd-spells.json — ${spells.length} hechizos`);

    const monsters = await downloadCollection("monsters", "monstruos");
    await fs.writeFile(
        path.join(DATA_DIR, "srd-monsters.json"),
        JSON.stringify(monsters, null, 2)
    );
    console.log(`✅ data/srd-monsters.json — ${monsters.length} monstruos`);

    console.log("\n🎉 Listo. Ahora puedes usar npm run seed y npm run seed:monsters sin conexión a la API D&D.\n");
};

main().catch(err => {
    console.error("💥 Error:", err.message);
    process.exit(1);
});
