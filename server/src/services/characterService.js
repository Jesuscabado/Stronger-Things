import Character from "../models/Character.js";
import BaseObject from "../models/BaseObject.js";
import Spell from "../models/Spell.js";
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

const conflict = (msg) => {
    const err = new Error(msg);
    err.status = 409;
    return err;
};

const badRequest = (msg) => {
    const err = new Error(msg);
    err.status = 400;
    return err;
};

/**
 * Helper: carga un personaje con todas las relaciones populadas (inventario y hechizos).
 * Se usa en cada función que retorna un Character al cliente para que el front
 * tenga siempre los nombres y datos referenciados disponibles.
 */
const loadFullCharacter = (id) =>
    Character.findById(id)
        .populate("user", "username email")
        .populate("inventory.baseObject")
        .populate("spellcasting.spellsKnown.spell");

/* ───────── CRUD ───────── */

export const findAllCharacters = (userId) =>
    Character.find({ user: userId })
        .populate("user", "username email")
        .populate("inventory.baseObject")
        .populate("spellcasting.spellsKnown.spell");
        

export const findCharacterById = async (id, userId) => {
    const character = await loadFullCharacter(id);
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
    return loadFullCharacter(id);
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
    return loadFullCharacter(character._id);
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
    return loadFullCharacter(character._id);
};

export const removeInventoryItem = async (characterId, itemId, userId) => {
    const character = await Character.findById(characterId);
    if (!character) throw notFound();
    if (character.user.toString() !== userId.toString()) throw forbidden();
    const item = character.inventory.id(itemId);
    if (!item) throw notFound("Item no encontrado en el inventario");
    item.deleteOne();
    await character.save();
    return loadFullCharacter(character._id);
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

/* ───────── Avatar ───────── */

export const attachAvatar = async (characterId, file, userId) => {
    const character = await Character.findById(characterId);
    if (!character) throw notFound();
    if (character.user.toString() !== userId.toString()) throw forbidden();

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

/* ───────── Hechizos (NUEVO Fase 6b) ───────── */

/**
 * Aprende un hechizo del catálogo. Recibe el id del hechizo (Spell._id),
 * y opcionalmente `prepared` y `notes`.
 */
export const learnSpell = async (characterId, { spell: spellId, prepared, notes }, userId) => {
    const character = await Character.findById(characterId);
    if (!character) throw notFound();
    if (character.user.toString() !== userId.toString()) throw forbidden();

    const spell = await Spell.findById(spellId);
    if (!spell) throw notFound("Hechizo no encontrado en el catálogo");

    if (!character.spellcasting) character.spellcasting = {};
    if (!character.spellcasting.spellsKnown) character.spellcasting.spellsKnown = [];

    const exists = character.spellcasting.spellsKnown.some(
        s => s.spell?.toString() === spellId.toString()
    );
    if (exists) throw conflict("El personaje ya conoce este hechizo");

    character.spellcasting.spellsKnown.push({
        spell: spellId,
        prepared: !!prepared,
        notes: notes || ""
    });

    await character.save();
    return loadFullCharacter(character._id);
};

/**
 * Actualiza un hechizo aprendido. Típicamente para marcar/desmarcar `prepared`
 * o cambiar `notes`. El parámetro `knownId` es el _id del subdocumento dentro
 * de `spellsKnown` (no el _id del Spell del catálogo).
 */
export const updateLearnedSpell = async (characterId, knownId, updateData, userId) => {
    const character = await Character.findById(characterId);
    if (!character) throw notFound();
    if (character.user.toString() !== userId.toString()) throw forbidden();

    const known = character.spellcasting?.spellsKnown?.id(knownId);
    if (!known) throw notFound("Hechizo aprendido no encontrado");

    if ("prepared" in updateData) known.prepared = !!updateData.prepared;
    if ("notes" in updateData) known.notes = updateData.notes;
    // No permitimos cambiar el spell de referencia: para eso, eliminar y volver a aprender.

    await character.save();
    return loadFullCharacter(character._id);
};

/**
 * Elimina un hechizo de los conocidos del personaje.
 */
export const forgetSpell = async (characterId, knownId, userId) => {
    const character = await Character.findById(characterId);
    if (!character) throw notFound();
    if (character.user.toString() !== userId.toString()) throw forbidden();

    const known = character.spellcasting?.spellsKnown?.id(knownId);
    if (!known) throw notFound("Hechizo aprendido no encontrado");

    known.deleteOne();
    await character.save();
    return loadFullCharacter(character._id);
};

/* =========================================================================
   AÑADIR estas funciones al final de src/services/characterService.js
   -------------------------------------------------------------------------
   Patrón idéntico al de los hechizos (learnSpell, updateLearnedSpell,
   forgetSpell): usar el _id del subdocumento dentro del array, validar
   ownership con userId, devolver el personaje completo cargado.
   ========================================================================= */

/* ───────── Diario ───────── */

/**
 * Añade una nueva entrada de diario al personaje.
 * @param {string} characterId  - _id del personaje
 * @param {Object} entryData    - { title, date, content }
 * @param {string} userId       - usuario actual (para validar ownership)
 * @returns el personaje completo actualizado
 */
export const addDiaryEntry = async (characterId, entryData, userId) => {
    const character = await Character.findById(characterId);
    if (!character) throw notFound();
    if (character.user.toString() !== userId.toString()) throw forbidden();

    const { title, date, content } = entryData;
    if (!content || !content.trim()) {
        const err = new Error("El contenido de la entrada no puede estar vacío");
        err.status = 400;
        throw err;
    }

    character.diary.push({
        title: title?.trim() || "",
        // Si el cliente envía una fecha, la respetamos; si no, se aplica
        // el default del schema (Date.now). Las fechas vienen como ISO string.
        ...(date ? { date: new Date(date) } : {}),
        content
    });

    await character.save();
    return loadFullCharacter(character._id);
};

/**
 * Actualiza una entrada existente del diario.
 * @param {string} characterId
 * @param {string} entryId     - _id del subdocumento dentro de diary[]
 * @param {Object} updateData  - { title?, date?, content? }
 * @param {string} userId
 */
export const updateDiaryEntry = async (characterId, entryId, updateData, userId) => {
    const character = await Character.findById(characterId);
    if (!character) throw notFound();
    if (character.user.toString() !== userId.toString()) throw forbidden();

    const entry = character.diary.id(entryId);
    if (!entry) throw notFound("Entrada de diario no encontrada");

    if ("title" in updateData) entry.title = (updateData.title || "").trim();
    if ("date" in updateData && updateData.date) entry.date = new Date(updateData.date);
    if ("content" in updateData) {
        if (!updateData.content || !updateData.content.trim()) {
            const err = new Error("El contenido de la entrada no puede estar vacío");
            err.status = 400;
            throw err;
        }
        entry.content = updateData.content;
    }

    await character.save();
    return loadFullCharacter(character._id);
};

/**
 * Elimina una entrada del diario.
 */
export const removeDiaryEntry = async (characterId, entryId, userId) => {
    const character = await Character.findById(characterId);
    if (!character) throw notFound();
    if (character.user.toString() !== userId.toString()) throw forbidden();

    const entry = character.diary.id(entryId);
    if (!entry) throw notFound("Entrada de diario no encontrada");

    entry.deleteOne();
    await character.save();
    return loadFullCharacter(character._id);
};