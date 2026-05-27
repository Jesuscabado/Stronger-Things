import BaseObject from "../models/BaseObject.js";

export const findAllBaseObjects = () => BaseObject.find();
export const findBaseObjectById = (id) => BaseObject.findById(id);
export const checkNameExists = async (name, excludeId = null) => {
    const escaped = name.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const query = { name: new RegExp(`^${escaped}$`, "i") };
    if (excludeId) query._id = { $ne: excludeId };
    return !!(await BaseObject.findOne(query).lean());
};

export const createBaseObject = async (data) => {
    const escaped = data.name.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const existing = await BaseObject.findOne({ name: new RegExp(`^${escaped}$`, "i") });
    if (existing) {
        const err = new Error(`Ya existe un objeto llamado "${data.name}"`);
        err.status = 409;
        throw err;
    }
    return BaseObject.create(data);
};

export const updateBaseObject = async (id, data, isAdmin = false) => {
    const obj = await BaseObject.findById(id);
    if (!obj) throw Object.assign(new Error("Objeto no encontrado"), { status: 404 });
    if (obj.isPublic && !isAdmin) throw Object.assign(new Error("Solo los administradores pueden modificar objetos del catálogo SRD"), { status: 403 });
    Object.assign(obj, data);
    return obj.save();
};

export const deleteBaseObject = async (id, isAdmin = false) => {
    const obj = await BaseObject.findById(id);
    if (!obj) throw Object.assign(new Error("Objeto no encontrado"), { status: 404 });
    if (obj.isPublic && !isAdmin) throw Object.assign(new Error("Solo los administradores pueden eliminar objetos del catálogo SRD"), { status: 403 });
    await obj.deleteOne();
    return { deleted: true, id };
};