import path from "node:path";
import fs from "node:fs/promises";
import Character from "../models/Character.js";
import BaseObject from "../models/BaseObject.js";
import { UPLOAD_PATH } from "../config/upload.js";

const notFound = (msg = "Personaje no encontrado") => {
    const err = new Error(msg);
    err.status = 404;
    return err;
};

const forbidden = () => {
    const err = new Error("No tienes permiso para acceder a este personaje");
    err.status = 403;
    return err;
};

/**
 * Devuelve solo los personajes del usuario logueado.
 */
export const findAllCharacters = (userId) =>
    Character.find({ user: userId })
        .populate("user", "username email")
        .populate("inventory.baseObject");

export const findCharacterById = async (id, userId) => {
    const character = await Character.findById(id)
        .populate("user", "username email")
        .populate("inventory.baseObject");
    if (!character) throw notFound();
    if (character.user._id.toString() !== userId.toString()) throw forbidden();
    return character;
};

export const createCharacter = (data, userId) =>
    Character.create({ ...data, user: userId });

export const updateCharacter = async (id, data, userId) => {
    const character = await Character.findById(id);
    if (!character) throw notFound();
    if (character.user.toString() !== userId.toString()) throw forbidden();

    // Bloqueamos cambiar el dueño
    delete data.user;
    Object.assign(character, data);
    await character.save();

    return Character.findById(id)
        .populate("user", "username email")
        .populate("inventory.baseObject");
};

export const deleteCharacter = async (id, userId) => {
    const character = await Character.findById(id);
    if (!character) throw notFound();
    if (character.user.toString() !== userId.toString()) throw forbidden();

    // Si tiene PDF, borrarlo del disco
    if (character.characterSheet?.storedName) {
        await fs.unlink(path.join(UPLOAD_PATH, character.characterSheet.storedName))
            .catch(() => {});
    }

    await character.deleteOne();
    return { deleted: true, id };
};

/* ───────── Inventario ───────── */

export const giveObjectToCharacter = async (characterId, baseObjectId, instanceData, userId) => {
    const character = await Character.findById(characterId);
    if (!character) throw notFound();
    if (character.user.toString() !== userId.toString()) throw forbidden();

    const baseObject = await BaseObject.findById(baseObjectId);
    if (!baseObject) throw notFound("BaseObject no encontrado en el catálogo");

    character.inventory.push({ baseObject: baseObjectId, ...instanceData });
    await character.save();

    return Character.findById(character._id)
        .populate("user", "username email")
        .populate("inventory.baseObject");
};

export const updateInventoryItem = async (characterId, itemId, updateData, userId) => {
    const character = await Character.findById(characterId);
    if (!character) throw notFound();
    if (character.user.toString() !== userId.toString()) throw forbidden();

    const item = character.inventory.id(itemId);
    if (!item) throw notFound("Item no encontrado en el inventario");

    // No permitimos cambiar la referencia al baseObject
    delete updateData.baseObject;
    Object.assign(item, updateData);
    await character.save();

    return Character.findById(character._id)
        .populate("user", "username email")
        .populate("inventory.baseObject");
};

export const removeInventoryItem = async (characterId, itemId, userId) => {
    const character = await Character.findById(characterId);
    if (!character) throw notFound();
    if (character.user.toString() !== userId.toString()) throw forbidden();

    const item = character.inventory.id(itemId);
    if (!item) throw notFound("Item no encontrado en el inventario");

    item.deleteOne();
    await character.save();

    return Character.findById(character._id)
        .populate("user", "username email")
        .populate("inventory.baseObject");
};

/* ───────── Hoja de personaje (PDF) ───────── */

export const attachCharacterSheet = async (characterId, file, userId) => {
    const character = await Character.findById(characterId);
    if (!character) {
        // Si subió PDF pero no existe el personaje, limpiamos el archivo
        await fs.unlink(file.path).catch(() => {});
        throw notFound();
    }
    if (character.user.toString() !== userId.toString()) {
        await fs.unlink(file.path).catch(() => {});
        throw forbidden();
    }

    // Si ya tenía uno, borramos el viejo
    if (character.characterSheet?.storedName) {
        await fs.unlink(path.join(UPLOAD_PATH, character.characterSheet.storedName))
            .catch(() => {});
    }

    character.characterSheet = {
        filename: file.originalname,
        storedName: file.filename,
        mimeType: file.mimetype,
        size: file.size,
        uploadedAt: new Date()
    };
    await character.save();
    return character;
};

export const getCharacterSheetPath = async (characterId, userId) => {
    const character = await Character.findById(characterId);
    if (!character) throw notFound();
    if (character.user.toString() !== userId.toString()) throw forbidden();
    if (!character.characterSheet?.storedName) {
        throw notFound("Este personaje no tiene hoja de personaje subida");
    }
    return {
        absolutePath: path.join(UPLOAD_PATH, character.characterSheet.storedName),
        downloadName: character.characterSheet.filename
    };
};

export const removeCharacterSheet = async (characterId, userId) => {
    const character = await Character.findById(characterId);
    if (!character) throw notFound();
    if (character.user.toString() !== userId.toString()) throw forbidden();
    if (!character.characterSheet?.storedName) {
        throw notFound("Este personaje no tiene hoja de personaje subida");
    }

    await fs.unlink(path.join(UPLOAD_PATH, character.characterSheet.storedName))
        .catch(() => {});
    character.characterSheet = undefined;
    await character.save();
    return { deleted: true };
};