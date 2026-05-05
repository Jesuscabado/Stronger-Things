import mongoose from "mongoose";

/**
 * Sub-esquema embebido: cada elemento es UNA instancia
 * concreta del objeto que el personaje posee.
 */
const inventoryItemSchema = new mongoose.Schema(
    {
        baseObject: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "BaseObject",
            required: true
        },
        customName: { type: String, trim: true },
        quantity: { type: Number, default: 1, min: 0 },
        durability: { type: Number, min: 0, default: 100 },
        equipped: { type: Boolean, default: false },
        notes: { type: String }
    },
    { timestamps: true }
);

/**
 * Sub-esquema para la hoja de personaje en PDF (Cloudinary).
 */
const characterSheetSchema = new mongoose.Schema(
    {
        filename: { type: String },
        mimeType: { type: String },
        size: { type: Number },
        uploadedAt: { type: Date },
        cloudinaryPublicId: { type: String },
        cloudinaryUrl: { type: String }
    },
    { _id: false }
);

/**
 * Sub-esquema para el avatar del personaje (Cloudinary).
 */
const avatarSchema = new mongoose.Schema(
    {
        cloudinaryPublicId: { type: String },
        cloudinaryUrl: { type: String },
        uploadedAt: { type: Date }
    },
    { _id: false }
);

// Clases oficiales de D&D 5e
const DND_CLASSES = [
    "Barbarian", "Bard", "Cleric", "Druid", "Fighter", "Monk",
    "Paladin", "Ranger", "Rogue", "Sorcerer", "Warlock", "Wizard", "Artificer"
];

// Razas más comunes
const DND_RACES = [
    "Human", "Elf", "Dwarf", "Halfling", "Gnome", "Half-Elf",
    "Half-Orc", "Tiefling", "Dragonborn", "Aasimar", "Goliath"
];

// Alineamientos D&D 5e
const ALIGNMENTS = [
    "Lawful Good", "Neutral Good", "Chaotic Good",
    "Lawful Neutral", "True Neutral", "Chaotic Neutral",
    "Lawful Evil", "Neutral Evil", "Chaotic Evil",
    "Unaligned"
];

// Trasfondos típicos del Player's Handbook
const BACKGROUNDS = [
    "Acolyte", "Charlatan", "Criminal", "Entertainer", "Folk Hero",
    "Guild Artisan", "Hermit", "Noble", "Outlander", "Sage",
    "Sailor", "Soldier", "Urchin", "Custom"
];

const characterSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        // ───── Identidad básica ─────
        name: { type: String, required: true, trim: true },
        charClass: { type: String, required: true, enum: DND_CLASSES },
        race: { type: String, enum: DND_RACES, default: "Human" },
        level: { type: Number, default: 1, min: 1, max: 20 },

        // ───── Identidad extendida (NUEVO en Fase 1) ─────
        alignment: { type: String, enum: ALIGNMENTS, default: "True Neutral" },
        background: { type: String, default: "Custom" },
        experiencePoints: { type: Number, default: 0, min: 0 },
        inspiration: { type: Boolean, default: false },

        // ───── Recursos ─────
        gold: { type: Number, default: 0, min: 0 },

        // ───── Atributos ─────
        abilityScores: {
            strength:     { type: Number, default: 10, min: 1, max: 30 },
            dexterity:    { type: Number, default: 10, min: 1, max: 30 },
            constitution: { type: Number, default: 10, min: 1, max: 30 },
            intelligence: { type: Number, default: 10, min: 1, max: 30 },
            wisdom:       { type: Number, default: 10, min: 1, max: 30 },
            charisma:     { type: Number, default: 10, min: 1, max: 30 }
        },

        // ───── PG ─────
        hitPoints: {
            current: { type: Number, default: 10 },
            max: { type: Number, default: 10 },
            temporary: { type: Number, default: 0 }
        },

        // ───── Inventario y archivos ─────
        inventory: [inventoryItemSchema],
        characterSheet: characterSheetSchema,
        avatar: avatarSchema
    },
    { timestamps: true }
);

export default mongoose.model("Character", characterSchema);
