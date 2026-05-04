import Character from "../models/Character.js";
import BaseObject from "../models/BaseObject.js";
import {
    uploadToCloudinary,
    deleteFromCloudinary,
    uploadImageToCloudinary,
    deleteImageFromCloudinary
} from "./cloudinaryService.js";

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

/* ───────── CRUD ───────── */

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

    if (character.characterSheet?.cloudinaryPublicId) {
        await deleteFromCloudinary(character.characterSheet.cloudinaryPublicId).catch(() => {});
    }
    if (character.avatar?.cloudinaryPublicId) {
        await deleteImageFromCloudinary(character.avatar.cloudinaryPublicId).catch(() => {});
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

/* ───────── Hoja de personaje (PDF en Cloudinary) ───────── */

export const attachCharacterSheet = async (characterId, file, userId) => {
    const character = await Character.findById(characterId);
    if (!character) throw notFound();
    if (character.user.toString() !== userId.toString()) throw forbidden();

    if (character.characterSheet?.cloudinaryPublicId) {
        await deleteFromCloudinary(character.characterSheet.cloudinaryPublicId).catch(() => {});
    }

    const sanitizedName = character.name.replace(/[^a-zA-Z0-9_-]/g, "_");   
    const result = await uploadToCloudinary(
    file.buffer,
    `${sanitizedName}-character-sheet.pdf`
);

    character.characterSheet = {
    filename: `${character.name}-character-sheet.pdf`,
    mimeType: file.mimetype,
    size: file.size,
    uploadedAt: new Date(),
    cloudinaryPublicId: result.public_id,
    cloudinaryUrl: result.secure_url
};
    await character.save();
    return character;
};

export const getCharacterSheetUrl = async (characterId, userId) => {
    const character = await Character.findById(characterId);
    if (!character) throw notFound();
    if (character.user.toString() !== userId.toString()) throw forbidden();
    if (!character.characterSheet?.cloudinaryUrl) {
        throw notFound("Este personaje no tiene hoja de personaje subida");
    }
    return {
        url: character.characterSheet.cloudinaryUrl,
        downloadName: character.characterSheet.filename
    };
};

export const removeCharacterSheet = async (characterId, userId) => {
    const character = await Character.findById(characterId);
    if (!character) throw notFound();
    if (character.user.toString() !== userId.toString()) throw forbidden();
    if (!character.characterSheet?.cloudinaryPublicId) {
        throw notFound("Este personaje no tiene hoja subida");
    }
    await deleteFromCloudinary(character.characterSheet.cloudinaryPublicId).catch(() => {});
    character.characterSheet = undefined;
    await character.save();
    return { deleted: true };
};

export const attachAvatar = async (characterId, file, userId) => {
    const character = await Character.findById(characterId);
    if (!character) throw notFound();
    if (character.user.toString() !== userId.toString()) throw forbidden();

    // Borrar el avatar anterior si existía
    if (character.avatar?.cloudinaryPublicId) {
        await deleteImageFromCloudinary(character.avatar.cloudinaryPublicId).catch(() => {});
    }

    const result = await uploadImageToCloudinary(file.buffer, character.name);
    

    character.avatar = {
        cloudinaryPublicId: result.public_id,
        cloudinaryUrl: result.secure_url,
        uploadedAt: new Date()
    };
    await character.save();
    return character;
};

export const removeAvatar = async (characterId, userId) => {
    const character = await Character.findById(characterId);
    if (!character) throw notFound();
    if (character.user.toString() !== userId.toString()) throw forbidden();
    if (!character.avatar?.cloudinaryPublicId) {
        throw notFound("Este personaje no tiene avatar");
    }
    await deleteImageFromCloudinary(character.avatar.cloudinaryPublicId).catch(() => {});
    character.avatar = undefined;
    await character.save();
    return { deleted: true };
};