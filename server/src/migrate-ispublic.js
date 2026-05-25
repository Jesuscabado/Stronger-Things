/**
 * Migración puntual: marca como isPublic: true todos los objetos y hechizos
 * que no tengan ese campo establecido (los sembrados antes de añadir el campo).
 *
 * Ejecutar UNA SOLA VEZ:
 *   node src/migrate-ispublic.js
 *
 * Es idempotente: solo toca los documentos que aún no tienen isPublic: true.
 */
import dotenv from "dotenv";
dotenv.config();

import { connectMongo } from "./config/db.js";
import BaseObject from "./models/BaseObject.js";
import Spell from "./models/Spell.js";
import mongoose from "mongoose";

const migrate = async () => {
    await connectMongo();
    console.log("🔧 Migración isPublic\n");

    const objResult = await BaseObject.updateMany(
        { isPublic: { $ne: true } },
        { $set: { isPublic: true } }
    );
    console.log(`✅ BaseObjects marcados como isPublic:true — ${objResult.modifiedCount} actualizados`);

    const spellResult = await Spell.updateMany(
        { isPublic: { $ne: true } },
        { $set: { isPublic: true } }
    );
    console.log(`✅ Spells marcados como isPublic:true    — ${spellResult.modifiedCount} actualizados`);

    console.log("\n🎉 Migración completada. Los nuevos documentos creados manualmente tendrán isPublic:false.\n");
    await mongoose.disconnect();
};

migrate().catch(err => {
    console.error("💥 Error en la migración:", err.message);
    process.exit(1);
});
