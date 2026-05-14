import mongoose from "mongoose";

/**
 * Sub-esquema con stats típicos de D&D 5e.
 * Se deja un campo `extra` mixto para propiedades libres
 * (encantamientos, requisitos, etc.) sin romper validación.
 */
const statsSchema = new mongoose.Schema(
    {
        damage: { type: String },                          // ej. "1d8"
        damageType: { type: String },                      // slashing, piercing, fire...
        attackBonus: { type: Number, default: 0 },
        armorClass: { type: Number },                      // para armaduras/escudos
        weight: { type: Number, default: 0 },              // en libras
        properties: [{ type: String }],                    // versatile, finesse, two-handed...
        rarity: {
            type: String,
            enum: ["common", "uncommon", "rare", "very rare", "legendary", "artifact"],
            default: "common"
        },
        requiresAttunement: { type: Boolean, default: false },
        maxDurability: { type: Number, default: 100 },
        extra: { type: mongoose.Schema.Types.Mixed }
    },
    { _id: false }
);

const baseObjectSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        description: { type: String },
        category: {
            type: String,
            enum: ["weapon", "armor", "shield", "potion", "scroll", "wondrous", "tool", "gear", "ammunition"],
            default: "gear"
        },
        cost: { type: Number, default: 0 },                // precio base en piezas de oro
        stats: { type: statsSchema, default: () => ({}) }
    },
    { timestamps: true }
);

export default mongoose.model("BaseObject", baseObjectSchema);
