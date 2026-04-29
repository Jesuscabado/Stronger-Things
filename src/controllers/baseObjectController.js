import * as baseObjectService from "../services/baseObjectService.js";

export const getAllBaseObjects = async (req, res, next) => {
    try {
        const objects = await baseObjectService.findAllBaseObjects();
        res.status(200).json(objects);
    } catch (error) {
        next(error);
    }
};

export const createBaseObject = async (req, res, next) => {
    try {
        const created = await baseObjectService.createBaseObject(req.body);
        res.status(201).json(created);
    } catch (error) {
        // Duplicate key (name unique)
        if (error.code === 11000) {
            return res.status(400).json({
                message: "Ya existe un objeto con ese nombre",
                field: error.keyValue
            });
        }
        next(error);
    }
};
