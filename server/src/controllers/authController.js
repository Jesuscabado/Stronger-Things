import * as authService from "../services/authService.js";

export const register = async (req, res, next) => {
    try {
        const { username, email, password } = req.body;
        const user = await authService.registerUser({ username, email, password });
        const token = authService.generateToken(user);
        res.status(201).json({ user, token });
    } catch (error) {
        if (error.status) {
            return res.status(error.status).json({ message: error.message });
        }
        // Mongo duplicate key
        if (error.code === 11000) {
            return res.status(400).json({
                message: "Email o username ya registrado",
                field: error.keyValue
            });
        }
        next(error);
    }
};

export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const { user, token } = await authService.loginUser({ email, password });
        res.status(200).json({ user, token });
    } catch (error) {
        if (error.status) {
            return res.status(error.status).json({ message: error.message });
        }
        next(error);
    }
};

/**
 * GET /api/auth/me — devuelve el usuario actual (requiere middleware authRequired).
 */
export const me = async (req, res) => {
    res.status(200).json(req.user);
};

 export const toggleDM = async (req, res, next) => {
        try {
            const { isDM } = req.body;
            if (typeof isDM !== "boolean") {
                return res.status(400).json({
                    message: "Se esperaba un campo 'isDM' booleano"
                });
            }
            req.user.isDM = isDM;
            await req.user.save();
            res.json(req.user);   //toJSON ya elimina el password_hash
        } catch (err) { next(err); }
    };

export const googleLogin = async (req, res, next) => {
    try {
        const { credential } = req.body;
        const result = await authService.loginWithGoogle(credential);
        res.json(result);   // { user, token }
    } catch (err) {
        if (err.status) return res.status(err.status).json({ message: err.message });
        next(err);
    }
};