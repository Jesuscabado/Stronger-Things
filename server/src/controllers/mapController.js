import * as mapService from "../services/mapService.js";

const handleStatusError = (error, res, next) => {
    if (error.status) return res.status(error.status).json({ message: error.message });
    next(error);
};

export const listMaps = async (req, res, next) => {
    try {
        const maps = await mapService.list(req.user._id);
        res.json(maps);
    } catch (err) { handleStatusError(err, res, next); }
};

export const getMap = async (req, res, next) => {
    try {
        const map = await mapService.getById(req.params.id, req.user._id);
        res.json(map);
    } catch (err) { handleStatusError(err, res, next); }
};

export const createMap = async (req, res, next) => {
    try {
        const map = await mapService.create(req.body, req.user._id);
        res.status(201).json(map);
    } catch (err) { handleStatusError(err, res, next); }
};

export const updateMap = async (req, res, next) => {
    try {
        const map = await mapService.update(req.params.id, req.body, req.user._id);
        res.json(map);
    } catch (err) { handleStatusError(err, res, next); }
};

export const deleteMap = async (req, res, next) => {
    try {
        const result = await mapService.remove(req.params.id, req.user._id);
        res.json(result);
    } catch (err) { handleStatusError(err, res, next); }
};

export const generateMap = async (req, res, next) => {
    try {
        const { prompt, options } = req.body;
        const result = await mapService.generateFromPrompt(prompt, options, req.user._id);
        res.status(201).json(result);
    } catch (err) { handleStatusError(err, res, next); }
};
