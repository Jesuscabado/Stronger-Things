import Spell from "../models/Spell.js";

/**
 * Devuelve el catálogo de hechizos.
 * Soporta filtros opcionales: ?class=Wizard, ?level=3, ?search=fuego
 */
export const listSpells = async ({ charClass, level, search } = {}) => {
    const query = {};
    if (charClass) query.classes = charClass;
    if (level !== undefined && level !== "" && level !== null) {
        query.level = Number(level);
    }
    if (search) {
        query.name = { $regex: search, $options: "i" };
    }
    return Spell.find(query).sort({ level: 1, name: 1 });
};

export const getSpellById = (id) => Spell.findById(id);

export const checkNameExists = async (name, excludeId = null) => {
    const escaped = name.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const query = { name: new RegExp(`^${escaped}$`, "i") };
    if (excludeId) query._id = { $ne: excludeId };
    return !!(await Spell.findOne(query).lean());
};

export const createSpell = async (data) => {
    const escaped = data.name.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const existing = await Spell.findOne({ name: new RegExp(`^${escaped}$`, "i") });
    if (existing) {
        const err = new Error(`Ya existe un hechizo llamado "${data.name}"`);
        err.status = 409;
        throw err;
    }
    return Spell.create(data);
};

export const upsertSpellByName = async (data) => {
    return Spell.findOneAndUpdate(
        { name: data.name },
        data,
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );
};

export const deleteSpell = (id) => Spell.findByIdAndDelete(id);

export const countSpells = () => Spell.countDocuments();
