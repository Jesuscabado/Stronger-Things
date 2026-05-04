import * as characterService from "../services/characterService.js";

const handleStatusError = (error, res, next) => {
    if (error.status) return res.status(error.status).json({ message: error.message });
    next(error);
};

export const getAllCharacters = async (req, res, next) => {
    try {
        const characters = await characterService.findAllCharacters(req.user._id);
        res.status(200).json(characters);
    } catch (error) { next(error); }
};

export const getCharacterById = async (req, res, next) => {
    try {
        const character = await characterService.findCharacterById(req.params.id, req.user._id);
        res.status(200).json(character);
    } catch (error) { handleStatusError(error, res, next); }
};

export const createCharacter = async (req, res, next) => {
    try {
        const character = await characterService.createCharacter(req.body, req.user._id);
        res.status(201).json(character);
    } catch (error) { next(error); }
};

export const updateCharacter = async (req, res, next) => {
    try {
        const character = await characterService.updateCharacter(req.params.id, req.body, req.user._id);
        res.status(200).json(character);
    } catch (error) { handleStatusError(error, res, next); }
};

export const deleteCharacter = async (req, res, next) => {
    try {
        const result = await characterService.deleteCharacter(req.params.id, req.user._id);
        res.status(200).json(result);
    } catch (error) { handleStatusError(error, res, next); }
};

/* Inventario */

export const addItemToInventory = async (req, res, next) => {
    try {
        const { baseObject, ...instanceData } = req.body;
        if (!baseObject) return res.status(400).json({ message: "Falta el campo 'baseObject'" });
        const character = await characterService.giveObjectToCharacter(
            req.params.id, baseObject, instanceData, req.user._id
        );
        res.status(201).json(character);
    } catch (error) { handleStatusError(error, res, next); }
};

export const updateInventoryItem = async (req, res, next) => {
    try {
        const character = await characterService.updateInventoryItem(
            req.params.id, req.params.itemId, req.body, req.user._id
        );
        res.status(200).json(character);
    } catch (error) { handleStatusError(error, res, next); }
};

export const removeInventoryItem = async (req, res, next) => {
    try {
        const character = await characterService.removeInventoryItem(
            req.params.id, req.params.itemId, req.user._id
        );
        res.status(200).json(character);
    } catch (error) { handleStatusError(error, res, next); }
};

/* PDF */

export const uploadCharacterSheet = async (req, res, next) => {
    try {
        if (!req.file) return res.status(400).json({ message: "Falta el archivo PDF (campo 'sheet')" });
        const character = await characterService.attachCharacterSheet(req.params.id, req.file, req.user._id);
        res.status(200).json({ message: "Hoja subida", characterSheet: character.characterSheet });
    } catch (error) { handleStatusError(error, res, next); }
};

export const downloadCharacterSheet = async (req, res, next) => {
    try {
        const { url } = await characterService.getCharacterSheetUrl(req.params.id, req.user._id);
        res.redirect(url);
    } catch (e) { handleStatusError(e, res, next); }
};

export const deleteCharacterSheet = async (req, res, next) => {
    try {
        const result = await characterService.removeCharacterSheet(req.params.id, req.user._id);
        res.status(200).json(result);
    } catch (error) { handleStatusError(error, res, next); }
};

export const uploadAvatar = async (req, res, next) => {
    try {
        if (!req.file) return res.status(400).json({ message: "Falta la imagen (campo 'avatar')" });
        const character = await characterService.attachAvatar(req.params.id, req.file, req.user._id);
        res.status(200).json({ message: "Avatar subido", avatar: character.avatar });
    } catch (e) { handleStatusError(e, res, next); }
};

export const deleteAvatar = async (req, res, next) => {
    try {
        const result = await characterService.removeAvatar(req.params.id, req.user._id);
        res.status(200).json(result);
    } catch (e) { handleStatusError(e, res, next); }
};