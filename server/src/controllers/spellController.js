import * as spellService from "../services/spellService.js";

export const checkName = async (req, res) => {
    try {
        const { name, excludeId } = req.query;
        if (!name || !name.trim()) return res.json({ exists: false });
        const exists = await spellService.checkNameExists(name, excludeId || null);
        res.json({ exists });
    } catch {
        res.json({ exists: false });
    }
};

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
        res.status(err.status || 400).json({ message: err.message });
    }
};

export const remove = async (req, res) => {
    try {
        const isAdmin = req.user?.role === "admin";
        await spellService.deleteSpell(req.params.id, isAdmin);
        res.json({ message: "Hechizo eliminado" });
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
};
