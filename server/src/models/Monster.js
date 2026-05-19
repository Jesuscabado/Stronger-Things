import mongoose from "mongoose";

/**
 * Acción de un monstruo (ataque, conjuro, habilidad especial, etc).
 *
 * Cada monstruo puede tener varias acciones agrupadas por tipo:
 *   - "trait":      Rasgos pasivos (Visión en la oscuridad, Resistencia mágica...)
 *   - "action":     Acciones que el monstruo puede usar en su turno
 *   - "bonus":      Acciones bonus
 *   - "reaction":   Reacciones (Oportunidad, Parada...)
 *   - "legendary":  Acciones legendarias (jefes finales)
 *   - "lair":       Acciones de guarida (en su territorio)
 */
const monsterActionSchema = new mongoose.Schema(
    {
        kind: {
            type: String,
            enum: ["trait", "action", "bonus", "reaction", "legendary", "lair"],
            default: "action"
        },
        name: { type: String, required: true, trim: true },
        description: { type: String, default: "" },

        // Campos opcionales para ataques mecánicos rápidos.
        // Si los rellenas, la UI los muestra como "Bono +5, 1d8+3 cortante".
        // Si no, se considera una acción descriptiva sólo (con `description`).
        attackBonus: { type: Number },
        reach: { type: String },      // "5 ft", "10 ft / 30 ft alcance largo"
        damage: { type: String },     // "1d8+3"
        damageType: { type: String }  // "cortante", "fuego", "psíquico"...
    },
    { _id: true }
);

/**
 * Monstruo del bestiario.
 *
 * Privado por usuario: cada DM tiene su propio bestiario. Las queries del
 * controlador siempre filtran por `user`.
 *
 * El modelo intenta cubrir todos los campos que aparecen en un stat block
 * típico de D&D 5e. La mayoría son opcionales para que el DM pueda crear
 * monstruos rápidos con sólo el mínimo y rellenarlos a poco a poco.
 */
const monsterSchema = new mongoose.Schema(
    {
        // ─── Ownership ───
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false,
            index: true
        },
         isPublic: {
            type: Boolean,
            default: false,
            index: true
        },
        srdIndex: {
            type: String,
            index: true,
            sparse: true,    // sparse = el índice ignora los documentos sin este campo
            unique: true     // unicidad global (solo afecta a los que sí lo tienen)
        },

        // ─── Identidad ───
        name: { type: String, required: true, trim: true },
        // Tamaño en la nomenclatura de D&D
        size: {
            type: String,
            enum: ["Diminuto", "Pequeño", "Mediano", "Grande", "Enorme", "Gargantuesco"],
            default: "Mediano"
        },
        // Tipo de criatura
        type: {
            type: String,
            enum: [
                "Aberración", "Bestia", "Celestial", "Constructo", "Dragón",
                "Elemental", "Hada", "Gigante", "Humanoide", "Monstruosidad",
                "Cieno", "Planta", "Muerto viviente"
            ],
            default: "Humanoide"
        },
        subtype: { type: String, trim: true, default: "" },   // "elfo", "demonio", etc.
        alignment: { type: String, trim: true, default: "Sin alineamiento" },

        // ─── Estadísticas defensivas ───
        armorClass: { type: Number, default: 10 },
        armorClassNote: { type: String, default: "" },        // "armadura natural", "escudo + cota"

        hitPoints: {
            average: { type: Number, default: 10 },
            // Fórmula para tirar a mano si el DM quiere: "2d8+2"
            roll: { type: String, default: "" }
        },

        // Velocidad: array de strings para soportar terreno (vuelo, nadar, etc.)
        // Ejemplos: ["30 ft", "vuelo 60 ft"] o ["20 ft", "nadar 40 ft"]
        speed: [{ type: String }],

        // ─── Atributos ───
        abilityScores: {
            strength:     { type: Number, default: 10 },
            dexterity:    { type: Number, default: 10 },
            constitution: { type: Number, default: 10 },
            intelligence: { type: Number, default: 10 },
            wisdom:       { type: Number, default: 10 },
            charisma:     { type: Number, default: 10 }
        },

        // ─── Competencias adicionales ───
        // Salvaciones competentes (con el bono de competencia ya aplicado).
        // El DM las indica explícitamente; no se calculan automáticas.
        savingThrows: {
            strength:     { type: Number },
            dexterity:    { type: Number },
            constitution: { type: Number },
            intelligence: { type: Number },
            wisdom:       { type: Number },
            charisma:     { type: Number }
        },

        // Habilidades competentes con su bonificador final.
        // Ejemplo: { sigilo: 5, percepción: 4 }
        skills: { type: Map, of: Number, default: {} },

        // ─── Defensas especiales ───
        damageVulnerabilities: [{ type: String }],
        damageResistances:     [{ type: String }],
        damageImmunities:      [{ type: String }],
        conditionImmunities:   [{ type: String }],

        // ─── Percepción e idiomas ───
        // Lista de sentidos en formato libre.
        // Ejemplos: "visión en la oscuridad 60 ft", "percepción ciega 30 ft"
        senses: [{ type: String }],
        passivePerception: { type: Number, default: 10 },
        languages: [{ type: String }],

        // ─── Nivel de desafío ───
        // CR (Challenge Rating). String porque va de "0", "1/8", "1/4", "1/2"
        // hasta "30". No es un número limpio.
        challengeRating: { type: String, default: "0" },
        experiencePoints: { type: Number, default: 0 },

        // ─── Acciones, rasgos, reacciones, leyendarias ───
        actions: [monsterActionSchema],

        // ─── Lanzamiento de conjuros ───
        // Si el monstruo lanza hechizos, lo describes en texto libre con
        // la lista típica de stat block. Se puede mejorar más adelante con
        // un sistema de slots como en Character, pero para empezar texto basta.
        spellcastingNote: { type: String, default: "" },

        // ─── Narrativa / lore ───
        description: { type: String, default: "" },
        // Notas privadas que sólo ve el DM (no se imprimirían en una hoja
        // pública del monstruo si en el futuro se comparte con jugadores).
        dmNotes: { type: String, default: "" },

        // ─── Imagen opcional ───
        // Se puede subir vía Cloudinary igual que los avatares de personajes.
        // De momento sólo el campo, sin endpoint dedicado.
        image: {
            cloudinaryUrl: { type: String },
            cloudinaryPublicId: { type: String }
        }
    },
    { timestamps: true }
);

export default mongoose.model("Monster", monsterSchema);