import * as userService from "../services/userService.js";

const VALID_FEATURES = ["maps"];

const handleStatusError = (error, res, next) => {
    if (error.status) return res.status(error.status).json({ message: error.message });
    next(error);
};

export const getAllUsers = async (req, res, next) => {
    try { res.status(200).json(await userService.findAllUsers()); }
    catch (e) { next(e); }
};

export const updateUserRole = async (req, res, next) => {
    try {
        const user = await userService.updateUserRole(req.params.id, req.body.role);
        res.status(200).json(user);
    } catch (e) { handleStatusError(e, res, next); }
};

export const updateUserDM = async (req, res, next) => {
    try {
        const user = await userService.updateUserDM(req.params.id, req.body.isDM);
        res.status(200).json(user);
    } catch (e) { handleStatusError(e, res, next); }
};

export const updateUserFeature = async (req, res, next) => {
    try {
        const { feature, enabled } = req.body;
        if (!VALID_FEATURES.includes(feature))
            return res.status(400).json({ message: "Funcionalidad no válida" });
        const user = await userService.updateUserFeature(req.params.id, feature, Boolean(enabled));
        res.status(200).json(user);
    } catch (e) { handleStatusError(e, res, next); }
};

export const deleteUser = async (req, res, next) => {
    try {
        // Evitar que un admin se borre a sí mismo
        if (req.params.id === req.user._id.toString()) {
            return res.status(400).json({ message: "No puedes eliminar tu propia cuenta desde aquí" });
        }
        const result = await userService.deleteUser(req.params.id);
        res.status(200).json(result);
    } catch (e) { handleStatusError(e, res, next); }
};

export const getStats = async (req, res, next) => {
    try { res.status(200).json(await userService.getStats()); }
    catch (e) { next(e); }
};