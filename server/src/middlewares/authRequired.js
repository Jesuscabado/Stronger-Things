import { verifyToken } from "../services/authService.js";
import User from "../models/User.js";

/**
 * Lee el header Authorization: Bearer <token>, verifica el JWT
 * y deja el usuario en req.user para los siguientes handlers.
 */
export const authRequired = async (req, res, next) => {
    try {
        const header = req.headers.authorization;
        if (!header || !header.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Token no proporcionado" });
        }

        const token = header.slice(7);
        const payload = verifyToken(token);

        const user = await User.findById(payload.sub);
        if (!user) {
            return res.status(401).json({ message: "Usuario no encontrado" });
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Token inválido o expirado" });
        }
        next(error);
    }
};
