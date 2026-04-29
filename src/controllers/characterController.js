import * as characterService from "../services/characterService.js";

export const getAllCharacters = async (req, res, next) => {
    try {
        const characters = await characterService.findAllCharacters();
        res.status(200).json(characters);
    } catch (error) {
        next(error);
    }
};

export const getCharacterById = async (req, res, next) => {
    try {
        const character = await characterService.findCharacterById(req.params.id);
        if (!character) {
            return res.status(404).json({ message: "Personaje no encontrado" });
        }
        res.status(200).json(character);
    } catch (error) {
        next(error);
    }
};

export const createCharacter = async (req, res, next) => {
    try {
        const character = await characterService.createCharacter(req.body);
        res.status(201).json(character);
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/characters/:id/inventory
 * Body esperado:
 * {
 *   "baseObject": "<id>",
 *   "customName": "Dardo",
 *   "durability": 80,
 *   "quantity": 1
 * }
 */
export const addItemToInventory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { baseObject, ...instanceData } = req.body;

        if (!baseObject) {
            return res.status(400).json({ message: "Falta el campo 'baseObject'" });
        }

        const character = await characterService.giveObjectToCharacter(id, baseObject, instanceData);
        res.status(201).json(character);
    } catch (error) {
        if (error.status) {
            return res.status(error.status).json({ message: error.message });
        }
        next(error);
    }
};
