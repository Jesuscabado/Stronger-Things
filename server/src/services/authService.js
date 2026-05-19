import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";

const SALT_ROUNDS = 10;

// Cliente OAuth de Google. Se inicializa una vez con el Client ID del .env.
// Se usa solo para verificar el id_token que envía el frontend.
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

    // Si el usuario se registró solo con Google, no tiene password_hash.
    // Evitamos que bcrypt.compare pete con undefined y damos un mensaje claro.
    if (!user.password_hash) {
        const err = new Error("Esta cuenta usa acceso con Google. Entra con el botón de Google.");
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

/**
 * Login / registro con Google.
 *
 * Recibe el id_token (credential) que el frontend obtuvo del componente
 * GoogleLogin. Lo verifica con la librería oficial de Google, extrae el
 * email y los datos del perfil, y:
 *   - Si existe un usuario con ese googleId  → login directo.
 *   - Si existe un usuario con ese email (registro local) → vincula la
 *     cuenta (provider pasa a "both") y login.
 *   - Si no existe ningún usuario → crea uno nuevo (provider "google").
 *
 * Devuelve { user, token } igual que loginUser, reutilizando el mismo
 * generateToken para que el resto de la app no note diferencia.
 */
export const loginWithGoogle = async (credential) => {
    if (!credential) {
        const err = new Error("Falta el credential de Google");
        err.status = 400;
        throw err;
    }

    // 1) Verificar el token contra Google
    let payload;
    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        payload = ticket.getPayload();
    } catch {
        const err = new Error("Token de Google inválido");
        err.status = 401;
        throw err;
    }

    const { sub: googleId, email, name, email_verified } = payload;

    if (!email || !email_verified) {
        const err = new Error("El email de Google no está verificado");
        err.status = 401;
        throw err;
    }

    const normalizedEmail = email.toLowerCase();

    // 2) Buscar por googleId (usuario que ya entró antes con Google)
    let user = await User.findOne({ googleId });

    if (!user) {
        // 3) Buscar por email para vincular una cuenta local existente
        user = await User.findOne({ email: normalizedEmail });

        if (user) {
            // Ya tenía cuenta local: la vinculamos con Google.
            user.googleId = googleId;
            user.provider = user.provider === "local" ? "both" : "google";
            await user.save();
        } else {
            // 4) Usuario totalmente nuevo: crear con provider "google".
            // Generamos un username único a partir del nombre de Google.
            const base = (name || normalizedEmail.split("@")[0])
                .replace(/[^a-zA-Z0-9_-]/g, "")
                .slice(0, 20) || "user";

            const username = await uniqueUsernameFrom(base);

            user = await User.create({
                username,
                email: normalizedEmail,
                googleId,
                provider: "google"
                // sin password_hash; role/isDM usan sus defaults del schema
            });
        }
    }

    // 5) Emitir nuestro propio JWT (mismo helper que el login local)
    const token = generateToken(user);
    return { user, token };
};

/**
 * Devuelve un username libre a partir de uno base. Si "Jesus" ya existe,
 * prueba "Jesus1", "Jesus2"... Como salvaguarda final usa un sufijo
 * temporal para no quedarse en bucle infinito.
 */
const uniqueUsernameFrom = async (base) => {
    let candidate = base;
    let suffix = 1;
    while (await User.findOne({ username: candidate }).lean()) {
        candidate = `${base}${suffix++}`;
        if (suffix > 100) {
            candidate = `${base}${Date.now()}`;
            break;
        }
    }
    return candidate;
};

export const generateToken = (user) => {
    const payload = { sub: user._id.toString(), username: user.username };
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || "1d"
    });
};

export const verifyToken = (token) => jwt.verify(token, process.env.JWT_SECRET);