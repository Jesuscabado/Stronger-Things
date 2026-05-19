import * as monsterService from "../services/monsterService.js";

const handleStatusError = (error, res, next) => {
    if (error.status) return res.status(error.status).json({ message: error.message });
    next(error);
};

export const checkName = async (req, res, next) => {
    try {
        const { name, excludeId } = req.query;
        if (!name || !name.trim()) return res.json({ exists: false });
        const exists = await monsterService.checkNameExists(name, excludeId || null);
        res.json({ exists });
    } catch (err) { handleStatusError(err, res, next); }
};

export const listMonsters = async (req, res, next) => {
    try {
        const monsters = await monsterService.list(req.user._id, req.query);
        res.json(monsters);
    } catch (err) { handleStatusError(err, res, next); }
};

export const getMonster = async (req, res, next) => {
    try {
        const monster = await monsterService.getById(req.params.id, req.user._id);
        res.json(monster);
    } catch (err) { handleStatusError(err, res, next); }
};

export const createMonster = async (req, res, next) => {
    try {
        const monster = await monsterService.create(req.body, req.user._id);
        res.status(201).json(monster);
    } catch (err) { handleStatusError(err, res, next); }
};

export const updateMonster = async (req, res, next) => {
    try {
        const monster = await monsterService.update(req.params.id, req.body, req.user._id);
        res.json(monster);
    } catch (err) { handleStatusError(err, res, next); }
};

export const deleteMonster = async (req, res, next) => {
    try {
        const result = await monsterService.remove(req.params.id, req.user._id);
        res.json(result);
    } catch (err) { handleStatusError(err, res, next); }
};

export const cloneMonster = async (req, res, next) => {
    try {
        const monster = await monsterService.cloneToMyBestiary(req.params.id, req.user._id);
        res.status(201).json(monster);
    } catch (err) { handleStatusError(err, res, next); }
};
