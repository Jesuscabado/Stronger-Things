import * as spellService from "../services/spellService.js";

export const list = async (req, res) => {
    try {
        const spells = await spellService.listSpells({
            charClass: req.query.class,
            level: req.query.level,
            search: req.query.search
        });
        res.json(spells);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const getOne = async (req, res) => {
    try {
        const spell = await spellService.getSpellById(req.params.id);
        if (!spell) return res.status(404).json({ message: "Hechizo no encontrado" });
        res.json(spell);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const create = async (req, res) => {
    try {
        const spell = await spellService.createSpell(req.body);
        res.status(201).json(spell);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ message: "Ya existe un hechizo con ese nombre" });
        }
        res.status(400).json({ message: err.message });
    }
};

export const remove = async (req, res) => {
    try {
        const deleted = await spellService.deleteSpell(req.params.id);
        if (!deleted) return res.status(404).json({ message: "Hechizo no encontrado" });
        res.json({ message: "Hechizo eliminado" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
