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

export const updateBaseObject = async (id, data) => {
    const updated = await BaseObject.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!updated) {
        const err = new Error("BaseObject no encontrado");
        err.status = 404;
        throw err;
    }
    return updated;
};

export const deleteBaseObject = async (id) => {
    const deleted = await BaseObject.findByIdAndDelete(id);
    if (!deleted) {
        const err = new Error("BaseObject no encontrado");
        err.status = 404;
        throw err;
    }
    return { deleted: true, id };
};