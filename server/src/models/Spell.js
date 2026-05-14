import mongoose from "mongoose";

/**
 * Catálogo maestro de hechizos. Equivalente a BaseObject pero para conjuros.
 * Cada personaje hace referencia a estos hechizos en su `spellcasting.spellsKnown`.
 */
const spellSchema = new mongoose.Schema(
    {
        // Identificación
        name: { type: String, required: true, unique: true, trim: true },
        nameOriginal: { type: String },          // nombre en inglés (para referencia)
        description: { type: String, default: "" },
        atHigherLevels: { type: String, default: "" },   // "A niveles superiores: ..."

        // Mecánica básica
        level: { type: Number, required: true, min: 0, max: 9 },  // 0 = truco
        school: {
            type: String,
            enum: [
                "Abjuración", "Conjuración", "Adivinación", "Encantamiento",
                "Evocación", "Ilusión", "Nigromancia", "Transmutación"
            ],
            required: true
        },

        // Lanzamiento
        castingTime: { type: String, default: "1 acción" },        // "1 acción", "1 acción adicional", "1 reacción", "10 minutos"
        range: { type: String, default: "30 pies" },               // "Toque", "60 pies", "Personal"
        duration: { type: String, default: "Instantáneo" },        // "Instantáneo", "1 minuto", "Concentración, hasta 1 hora"
        concentration: { type: Boolean, default: false },
        ritual: { type: Boolean, default: false },

        // Componentes V/S/M
        components: {
            verbal: { type: Boolean, default: false },
            somatic: { type: Boolean, default: false },
            material: { type: Boolean, default: false },
            materialDesc: { type: String, default: "" }            // "una pizca de azufre"
        },

        // Daño / efecto (opcional)
        damageType: { type: String, default: "" },                  // "fuego", "psíquico"...
        damageAtSlot: { type: Map, of: String, default: {} },       // { "1": "1d8", "2": "2d8", ... }

        // Clases que pueden lanzarlo (claves en inglés del modelo Character.charClass)
        classes: { type: [String], default: [] }                    // ["Wizard", "Sorcerer"]
    },
    { timestamps: true }
);

// Índices útiles para búsquedas rápidas
spellSchema.index({ level: 1, name: 1 });
spellSchema.index({ classes: 1 });

export default mongoose.model("Spell", spellSchema);
