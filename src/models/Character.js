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
        }
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
        // ───── NUEVO en Fase 5 ─────
        languages: { type: [String], default: [] },        // ["Common", "Elvish", "Draconic"]
        other: { type: [String], default: [] }              // ["Espadas largas", "Útiles de ladrón", "Caballos"]
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

        inventory: [inventoryItemSchema],
        characterSheet: characterSheetSchema,
        avatar: avatarSchema
    },
    { timestamps: true }
);

export default mongoose.model("Character", characterSchema);
