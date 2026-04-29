import BaseObject from "../models/BaseObject.js";

export const findAllBaseObjects = () => BaseObject.find();

export const findBaseObjectById = (id) => BaseObject.findById(id);

export const createBaseObject = (data) => BaseObject.create(data);

/**
 * Construye una instancia de objeto lista para embeber en el inventario
 * de un personaje. No la persiste todavía — sólo la prepara.
 */
export const createObjectInstance = (baseObjectId, { customName, quantity, durability, equipped, notes } = {}) => {
    return {
        baseObject: baseObjectId,
        customName,
        quantity: quantity ?? 1,
        durability: durability ?? 100,
        equipped: equipped ?? false,
        notes
    };
};
