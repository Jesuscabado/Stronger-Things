import * as baseObjectService from "../services/baseObjectService.js";

const handleStatusError = (error, res, next) => {
    if (error.status) return res.status(error.status).json({ message: error.message });
    next(error);
};

export const getAllBaseObjects = async (req, res, next) => {
    try {
        const objects = await baseObjectService.findAllBaseObjects();
        res.status(200).json(objects);
    } catch (error) { next(error); }
};

export const getBaseObjectById = async (req, res, next) => {
    try {
        const obj = await baseObjectService.findBaseObjectById(req.params.id);
        if (!obj) return res.status(404).json({ message: "BaseObject no encontrado" });
        res.status(200).json(obj);
    } catch (error) { next(error); }
};

export const createBaseObject = async (req, res, next) => {
    try {
        const created = await baseObjectService.createBaseObject(req.body);
        res.status(201).json(created);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: "Ya existe un objeto con ese nombre", field: error.keyValue });
        }
        next(error);
    }
};

export const updateBaseObject = async (req, res, next) => {
    try {
        const updated = await baseObjectService.updateBaseObject(req.params.id, req.body);
        res.status(200).json(updated);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: "Nombre duplicado", field: error.keyValue });
        }
        handleStatusError(error, res, next);
    }
};

export const deleteBaseObject = async (req, res, next) => {
    try {
        const result = await baseObjectService.deleteBaseObject(req.params.id);
        res.status(200).json(result);
    } catch (error) { handleStatusError(error, res, next); }
};