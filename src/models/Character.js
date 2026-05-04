import mongoose from "mongoose";

/**
 * Sub-esquema embebido: cada elemento es UNA instancia
 * concreta del objeto que el personaje posee.
 * `baseObject` apunta al catálogo (BaseObject) para evitar duplicar datos.
 */
const inventoryItemSchema = new mongoose.Schema(
    {
        baseObject: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "BaseObject",
            required: true
        },
        customName: { type: String, trim: true },          // ej. "Dardo, mi espada larga"
        quantity: { type: Number, default: 1, min: 0 },
        durability: { type: Number, min: 0, default: 100 },
        equipped: { type: Boolean, default: false },
        notes: { type: String }
    },
    { timestamps: true }
);

/**
 * Sub-esquema para la hoja de personaje en PDF.
 * almacenamiento en la nube.
 */
const characterSheetSchema = new mongoose.Schema(
    {
        filename: { type: String },
        mimeType: { type: String },
        size: { type: Number },
        uploadedAt: { type: Date },

        // Cloudinary
        cloudinaryPublicId: { type: String },
        cloudinaryUrl: { type: String }
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

const characterSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        name: {
            type: String,
            required: true,
            trim: true
        },
        charClass: {
            type: String,
            required: true,
            enum: DND_CLASSES
        },
        race: {
            type: String,
            enum: DND_RACES,
            default: "Human"
        },
        level: {
            type: Number,
            default: 1,
            min: 1,
            max: 20                                         // tope oficial D&D 5e
        },
        gold: {
            type: Number,
            default: 0,
            min: 0
        },
        // Stats clásicas D&D 5e
        abilityScores: {
            strength:     { type: Number, default: 10, min: 1, max: 30 },
            dexterity:    { type: Number, default: 10, min: 1, max: 30 },
            constitution: { type: Number, default: 10, min: 1, max: 30 },
            intelligence: { type: Number, default: 10, min: 1, max: 30 },
            wisdom:       { type: Number, default: 10, min: 1, max: 30 },
            charisma:     { type: Number, default: 10, min: 1, max: 30 }
        },
        hitPoints: {
            current: { type: Number, default: 10 },
            max: { type: Number, default: 10 }
        },
        inventory: [inventoryItemSchema],

        // Hoja de personaje (PDF) — opcional
        characterSheet: characterSheetSchema
    },
    { timestamps: true }
);

export default mongoose.model("Character", characterSchema);