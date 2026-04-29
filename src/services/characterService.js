import Character from "../models/Character.js";
import BaseObject from "../models/BaseObject.js";
import { createObjectInstance } from "./baseObjectService.js";

export const findAllCharacters = () =>
    Character.find().populate("user", "username email");

/**
 * Devuelve un personaje detallado con usuario y catálogo
 * de cada item del inventario poblado.
 */
export const findCharacterById = (id) =>
    Character.findById(id)
        .populate("user", "username email")
        .populate("inventory.baseObject");

export const createCharacter = (data) => Character.create(data);

/**
 * Añade una instancia de objeto al inventario del personaje.
 * - Verifica que el personaje existe.
 * - Verifica que el BaseObject existe en el catálogo.
 * - Construye la instancia con los stats personalizados (durability, customName...).
 */
export const giveObjectToCharacter = async (characterId, baseObjectId, instanceData = {}) => {
    const character = await Character.findById(characterId);
    if (!character) {
        const err = new Error("Personaje no encontrado");
        err.status = 404;
        throw err;
    }

    const baseObject = await BaseObject.findById(baseObjectId);
    if (!baseObject) {
        const err = new Error("BaseObject no encontrado en el catálogo");
        err.status = 404;
        throw err;
    }

    const instance = createObjectInstance(baseObjectId, instanceData);
    character.inventory.push(instance);
    await character.save();

    // Devolvemos el personaje con todo populado para una respuesta rica
    return Character.findById(character._id)
        .populate("user", "username email")
        .populate("inventory.baseObject");
};
