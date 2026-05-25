import * as baseObjectService from "../services/baseObjectService.js";

const handleStatusError = (error, res, next) => {
    if (error.status) return res.status(error.status).json({ message: error.message });
    next(error);
};

export const checkName = async (req, res, next) => {
    try {
        const { name, excludeId } = req.query;
        if (!name || !name.trim()) return res.json({ exists: false });
        const exists = await baseObjectService.checkNameExists(name, excludeId || null);
        res.json({ exists });
    } catch (err) { handleStatusError(err, res, next); }
};

export const getAllBaseObjects = async (req, res, next) => {
    try {
        res.status(200).json(await baseObjectService.findAllBaseObjects());
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
        res.status(201).json(await baseObjectService.createBaseObject(req.body));
    } catch (error) {
        handleStatusError(error, res, next);
    }
};

export const updateBaseObject = async (req, res, next) => {
    try {
        const isAdmin = req.user?.role === "admin";
        res.status(200).json(await baseObjectService.updateBaseObject(req.params.id, req.body, isAdmin));
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: "Nombre duplicado", field: error.keyValue });
        }
        handleStatusError(error, res, next);
    }
};

export const deleteBaseObject = async (req, res, next) => {
    try {
        const isAdmin = req.user?.role === "admin";
        res.status(200).json(await baseObjectService.deleteBaseObject(req.params.id, isAdmin));
    } catch (error) { handleStatusError(error, res, next); }
};