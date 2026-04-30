import BaseObject from "../models/BaseObject.js";

export const findAllBaseObjects = () => BaseObject.find();
export const findBaseObjectById = (id) => BaseObject.findById(id);
export const createBaseObject = (data) => BaseObject.create(data);

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