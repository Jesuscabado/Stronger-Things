import Monster from "../models/Monster.js";

const notFound = (msg = "Monstruo no encontrado") => {
    const err = new Error(msg);
    err.status = 404;
    return err;
};
const forbidden = (msg = "Acceso denegado") => {
    const err = new Error(msg);
    err.status = 403;
    return err;
};

/**
 * Construye la query de Mongo a partir de filtros.
 *
 * Por defecto devuelve TANTO los monstruos privados del usuario COMO los
 * públicos del SRD (que tienen isPublic: true y user: null).
 *
 * Si filters.source === "mine", devuelve solo los privados del usuario.
 * Si filters.source === "public", devuelve solo los del SRD.
 */
const buildQuery = (userId, filters = {}) => {
    let scope;

    if (filters.source === "mine") {
        scope = { user: userId };
    } else if (filters.source === "public") {
        scope = { isPublic: true };
    } else {
        scope = {
            $or: [
                { user: userId },
                { isPublic: true }
            ]
        };
    }

    const query = { ...scope };

    if (filters.search) {
        const escaped = filters.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        query.name = new RegExp(escaped, "i");
    }
    if (filters.type) query.type = filters.type;
    if (filters.size) query.size = filters.size;
    if (filters.cr)   query.challengeRating = filters.cr;

    return query;
};

export const list = async (userId, filters = {}) => {
    return Monster.find(buildQuery(userId, filters))
        .sort({ challengeRating: 1, name: 1 })
        .lean();
};

export const getById = async (id, userId) => {
    const monster = await Monster.findById(id);
    if (!monster) throw notFound();

    // Los públicos los puede ver cualquier DM autenticado
    if (monster.isPublic) return monster;

    // Los privados, solo su dueño
    if (!monster.user || monster.user.toString() !== userId.toString()) {
        throw forbidden();
    }
    return monster;
};

export const checkNameExists = async (name, excludeId = null) => {
    const escaped = name.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const query = { name: new RegExp(`^${escaped}$`, "i") };
    if (excludeId) query._id = { $ne: excludeId };
    return !!(await Monster.findOne(query).lean());
};

export const create = async (data, userId) => {
    const clean = { ...data };
    delete clean.isPublic;
    delete clean.srdIndex;

    const escaped = clean.name.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const existing = await Monster.findOne({ name: new RegExp(`^${escaped}$`, "i") });
    if (existing) {
        const err = new Error(`Ya existe un monstruo llamado "${clean.name}"`);
        err.status = 409;
        throw err;
    }

    return Monster.create({ ...clean, user: userId });
};

export const update = async (id, data, userId) => {
    const monster = await Monster.findById(id);
    if (!monster) throw notFound();

    if (monster.isPublic) {
        const err = new Error("Los monstruos del SRD no se pueden editar. Clónalo a tu bestiario privado para personalizarlo.");
        err.status = 403;
        throw err;
    }

    if (!monster.user || monster.user.toString() !== userId.toString()) {
        throw forbidden();
    }

    delete data.user;
    delete data.isPublic;
    delete data.srdIndex;

    Object.assign(monster, data);
    await monster.save();
    return monster;
};

export const remove = async (id, userId) => {
    const monster = await Monster.findById(id);
    if (!monster) throw notFound();

    if (monster.isPublic) {
        const err = new Error("Los monstruos del SRD no se pueden eliminar.");
        err.status = 403;
        throw err;
    }

    if (!monster.user || monster.user.toString() !== userId.toString()) {
        throw forbidden();
    }
    await monster.deleteOne();
    return { ok: true };
};

/**
 * Clona un monstruo público al bestiario privado del usuario.
 * Útil para personalizar un monstruo del SRD sin romper su versión original.
 */
export const cloneToMyBestiary = async (id, userId) => {
    const original = await Monster.findById(id).lean();
    if (!original) throw notFound();
    if (!original.isPublic) {
        const err = new Error("Solo se pueden clonar monstruos del SRD público");
        err.status = 400;
        throw err;
    }

    // eslint-disable-next-line no-unused-vars
    const { _id, isPublic, srdIndex, createdAt, updatedAt, ...rest } = original;

    const clone = await Monster.create({
        ...rest,
        user: userId,
        isPublic: false,
        name: `${rest.name} (copia)`
    });

    return clone;
};