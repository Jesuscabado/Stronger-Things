import * as sessionService from "../services/sessionService.js";

const handleStatusError = (error, res, next) => {
    if (error.status) return res.status(error.status).json({ message: error.message });
    next(error);
};

export const listSessions = async (req, res, next) => {
    try {
        const sessions = await sessionService.list(req.user._id);
        res.json(sessions);
    } catch (err) { handleStatusError(err, res, next); }
};

export const getSession = async (req, res, next) => {
    try {
        const session = await sessionService.getById(req.params.id, req.user._id);
        res.json(session);
    } catch (err) { handleStatusError(err, res, next); }
};

export const createSession = async (req, res, next) => {
    try {
        const session = await sessionService.create(req.body, req.user._id);
        res.status(201).json(session);
    } catch (err) { handleStatusError(err, res, next); }
};

export const updateSession = async (req, res, next) => {
    try {
        const session = await sessionService.update(req.params.id, req.body, req.user._id);
        res.json(session);
    } catch (err) { handleStatusError(err, res, next); }
};

export const deleteSession = async (req, res, next) => {
    try {
        const result = await sessionService.remove(req.params.id, req.user._id);
        res.json(result);
    } catch (err) { handleStatusError(err, res, next); }
};

export const addParticipant = async (req, res, next) => {
    try {
        const { characterId } = req.body;
        if (!characterId) return res.status(400).json({ message: "Falta el id del personaje" });
        const session = await sessionService.addParticipant(req.params.id, characterId, req.user._id);
        res.json(session);
    } catch (err) { handleStatusError(err, res, next); }
};

export const removeParticipant = async (req, res, next) => {
    try {
        const result = await sessionService.removeParticipant(
            req.params.id,
            req.params.characterId,
            req.user._id
        );
        res.json(result);
    } catch (err) { handleStatusError(err, res, next); }
};
