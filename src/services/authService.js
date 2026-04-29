import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const SALT_ROUNDS = 10;

/**
 * Crea un usuario nuevo. Hashea la contraseña antes de persistir.
 * Lanza error 400 si el email/username ya existen.
 */
export const registerUser = async ({ username, email, password }) => {
    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) {
        const err = new Error("Email o username ya registrado");
        err.status = 400;
        throw err;
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({ username, email, password_hash });
    return user;
};

/**
 * Comprueba credenciales y devuelve { user, token }.
 * Lanza 401 si email o password no son válidos.
 */
export const loginUser = async ({ email, password }) => {
    const user = await User.findOne({ email });
    if (!user) {
        const err = new Error("Credenciales inválidas");
        err.status = 401;
        throw err;
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
        const err = new Error("Credenciales inválidas");
        err.status = 401;
        throw err;
    }

    const token = generateToken(user);
    return { user, token };
};

export const generateToken = (user) => {
    const payload = { sub: user._id.toString(), username: user.username };
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || "1d"
    });
};

export const verifyToken = (token) => jwt.verify(token, process.env.JWT_SECRET);
