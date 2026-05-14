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
 * Siempre incluye `user` para garantizar scoping.
 */
const buildQuery = (userId, filters = {}) => {
    const query = { user: userId };

    if (filters.search) {
        // Búsqueda case-insensitive por nombre. Escape de regex para evitar
        // que el usuario rompa la query metiendo caracteres especiales.
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
        .sort({ name: 1 })
        .lean();
};

export const getById = async (id, userId) => {
    const monster = await Monster.findById(id);
    if (!monster) throw notFound();
    if (monster.user.toString() !== userId.toString()) throw forbidden();
    return monster;
};

export const create = async (data, userId) => {
    const monster = await Monster.create({ ...data, user: userId });
    return monster;
};

export const update = async (id, data, userId) => {
    const monster = await Monster.findById(id);
    if (!monster) throw notFound();
    if (monster.user.toString() !== userId.toString()) throw forbidden();

    // No permitir cambiar el owner
    delete data.user;

    Object.assign(monster, data);
    await monster.save();
    return monster;
};

export const remove = async (id, userId) => {
    const monster = await Monster.findById(id);
    if (!monster) throw notFound();
    if (monster.user.toString() !== userId.toString()) throw forbidden();
    await monster.deleteOne();
    return { ok: true };
};
