import mongoose from "mongoose";

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

const avatarSchema = new mongoose.Schema(
    {
        cloudinaryPublicId: { type: String },
        cloudinaryUrl: { type: String },
        uploadedAt: { type: Date }
    },
    { _id: false }
);

const diaryEntrySchema = new mongoose.Schema(
    {
        title: { type: String, trim: true, default: "" },
        // Fecha real de la entrada. Por defecto el momento de creación.
        date: { type: Date, default: Date.now },
        // El contenido es el cuerpo del diario; sin límite estricto.
        content: { type: String, default: "", required: true }
    },
    {
        // _id: true → cada entrada tiene su propio ObjectId, que usamos
        // para identificarla en las rutas PUT/DELETE.
        _id: true,
        // timestamps: crea automáticamente createdAt y updatedAt en cada
        // entrada. Útil para ordenar y mostrar "editado el X" si en
        // algún momento quieres distinguir creación y última edición.
        timestamps: true
    }
);
const combatStatsSchema = new mongoose.Schema(
    {
        armorClass: { type: Number, default: 10 },
        initiative: { type: Number, default: 0 },
        speed: { type: Number, default: 30 },
        hitDice: {
            total: { type: Number, default: 1 },
            type: { type: String, default: "d8" },
            used: { type: Number, default: 0 }
        },
        deathSaves: {
            successes: { type: Number, default: 0, min: 0, max: 3 },
            failures: { type: Number, default: 0, min: 0, max: 3 }
        },

        // Overrides manuales (si null, se calcula automáticamente)
        proficiencyBonusOverride: { type: Number, default: null },
        passivePerceptionOverride: { type: Number, default: null },
        passivePerceptionBonus: { type: Number, default: 0 }
    },
    { _id: false }
);

const proficienciesSchema = new mongoose.Schema(
    {
        savingThrows: {
            strength:     { type: Boolean, default: false },
            dexterity:    { type: Boolean, default: false },
            constitution: { type: Boolean, default: false },
            intelligence: { type: Boolean, default: false },
            wisdom:       { type: Boolean, default: false },
            charisma:     { type: Boolean, default: false }
        },
        skills: {
            acrobatics:       { type: Boolean, default: false },
            animalHandling:   { type: Boolean, default: false },
            arcana:           { type: Boolean, default: false },
            athletics:        { type: Boolean, default: false },
            deception:        { type: Boolean, default: false },
            history:          { type: Boolean, default: false },
            insight:          { type: Boolean, default: false },
            intimidation:     { type: Boolean, default: false },
            investigation:    { type: Boolean, default: false },
            medicine:         { type: Boolean, default: false },
            nature:           { type: Boolean, default: false },
            perception:       { type: Boolean, default: false },
            performance:      { type: Boolean, default: false },
            persuasion:       { type: Boolean, default: false },
            religion:         { type: Boolean, default: false },
            sleightOfHand:    { type: Boolean, default: false },
            stealth:          { type: Boolean, default: false },
            survival:         { type: Boolean, default: false }
        },
        languages: { type: [String], default: [] },
        other: { type: [String], default: [] }
    },
    { _id: false }
);

const personalitySchema = new mongoose.Schema(
    {
        traits: { type: String, default: "" },
        ideals: { type: String, default: "" },
        bonds: { type: String, default: "" },
        flaws: { type: String, default: "" },
        backstory: { type: String, default: "" },
        appearance: { type: String, default: "" },
        allies: { type: String, default: "" },
        treasure: { type: String, default: "" },
        featuresAndTraits: { type: String, default: "" }
    },
    { _id: false }
);

const physicalSchema = new mongoose.Schema(
    {
        age: { type: String, default: "" },
        height: { type: String, default: "" },
        weight: { type: String, default: "" },
        eyes: { type: String, default: "" },
        skin: { type: String, default: "" },
        hair: { type: String, default: "" }
    },
    { _id: false }
);

const knownSpellSchema = new mongoose.Schema(
    {
        spell: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Spell",
            required: true
        },
        prepared: { type: Boolean, default: false },
        notes: { type: String, default: "" }
    },
    { _id: true, timestamps: false }
);

const spellSlotsSchema = new mongoose.Schema(
    {
        level1: { total: { type: Number, default: 0 }, used: { type: Number, default: 0 } },
        level2: { total: { type: Number, default: 0 }, used: { type: Number, default: 0 } },
        level3: { total: { type: Number, default: 0 }, used: { type: Number, default: 0 } },
        level4: { total: { type: Number, default: 0 }, used: { type: Number, default: 0 } },
        level5: { total: { type: Number, default: 0 }, used: { type: Number, default: 0 } },
        level6: { total: { type: Number, default: 0 }, used: { type: Number, default: 0 } },
        level7: { total: { type: Number, default: 0 }, used: { type: Number, default: 0 } },
        level8: { total: { type: Number, default: 0 }, used: { type: Number, default: 0 } },
        level9: { total: { type: Number, default: 0 }, used: { type: Number, default: 0 } }
    },
    { _id: false }
);

const spellcastingSchema = new mongoose.Schema(
    {
        ability: {
            type: String,
            enum: ["", "intelligence", "wisdom", "charisma"],
            default: ""
        },
        attackBonus: { type: Number, default: 0 },
        saveDC: { type: Number, default: 8 },
        spellSlots: { type: spellSlotsSchema, default: () => ({}) },
        spellsKnown: { type: [knownSpellSchema], default: [] }
    },
    { _id: false }
);

const DND_CLASSES = [
    "Barbarian", "Bard", "Cleric", "Druid", "Fighter", "Monk",
    "Paladin", "Ranger", "Rogue", "Sorcerer", "Warlock", "Wizard", "Artificer"
];

const DND_RACES = [
    "Human", "Elf", "Dwarf", "Halfling", "Gnome", "Half-Elf",
    "Half-Orc", "Tiefling", "Dragonborn", "Aasimar", "Goliath"
];

const ALIGNMENTS = [
    "Lawful Good", "Neutral Good", "Chaotic Good",
    "Lawful Neutral", "True Neutral", "Chaotic Neutral",
    "Lawful Evil", "Neutral Evil", "Chaotic Evil",
    "Unaligned"
];

const characterSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        name: { type: String, required: true, trim: true },
        charClass: { type: String, required: true, enum: DND_CLASSES },
        race: { type: String, enum: DND_RACES, default: "Human" },
        level: { type: Number, default: 1, min: 1, max: 20 },

        alignment: { type: String, enum: ALIGNMENTS, default: "True Neutral" },
        background: { type: String, default: "Custom" },
        experiencePoints: { type: Number, default: 0, min: 0 },
        inspiration: { type: Boolean, default: false },

        gold: { type: Number, default: 0, min: 0 },

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
            max: { type: Number, default: 10 },
            temporary: { type: Number, default: 0 }
        },

        combatStats: { type: combatStatsSchema, default: () => ({}) },
        proficiencies: { type: proficienciesSchema, default: () => ({}) },
        personality: { type: personalitySchema, default: () => ({}) },
        physical: { type: physicalSchema, default: () => ({}) },
        spellcasting: { type: spellcastingSchema, default: () => ({}) },

        inventory: [inventoryItemSchema],
        diary: { type: [diaryEntrySchema], default: [] },
        characterSheet: characterSheetSchema,
        avatar: avatarSchema
    },
    { timestamps: true }
);

export default mongoose.model("Character", characterSchema);
