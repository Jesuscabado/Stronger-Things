import User from "../models/User.js";
import Character from "../models/Character.js";

export const findAllUsers = () => User.find().sort({ createdAt: -1 });

export const findUserById = (id) => User.findById(id);

export const updateUserRole = async (id, role) => {
    if (!["user", "admin"].includes(role)) {
        const err = new Error("Rol inválido");
        err.status = 400;
        throw err;
    }
    const user = await User.findByIdAndUpdate(id, { role }, { new: true });
    if (!user) {
        const err = new Error("Usuario no encontrado");
        err.status = 404;
        throw err;
    }
    return user;
};

export const updateUserDM = async (id, isDM) => {
    if (typeof isDM !== "boolean") {
        const err = new Error("Se esperaba un valor booleano para isDM");
        err.status = 400;
        throw err;
    }
    const user = await User.findByIdAndUpdate(id, { isDM }, { new: true });
    if (!user) {
        const err = new Error("Usuario no encontrado");
        err.status = 404;
        throw err;
    }
    return user;
};

export const updateUserFeature = async (id, feature, enabled) => {
    const update = enabled
        ? { $addToSet: { features: feature } }
        : { $pull:     { features: feature } };
    const user = await User.findByIdAndUpdate(id, update, { new: true });
    if (!user) {
        const err = new Error("Usuario no encontrado");
        err.status = 404;
        throw err;
    }
    return user;
};

export const deleteUser = async (id) => {
    const user = await User.findById(id);
    if (!user) {
        const err = new Error("Usuario no encontrado");
        err.status = 404;
        throw err;
    }
    // Borramos en cascada todos sus personajes
    await Character.deleteMany({ user: id });
    await user.deleteOne();
    return { deleted: true, id };
};

/**
 * Devuelve estadísticas para el dashboard del admin
 */
export const getStats = async () => {
    const [users, admins, dms, characters] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ role: "admin" }),
        User.countDocuments({ isDM: true }),
        Character.countDocuments()
    ]);
    return { users, admins, dms, regularUsers: users - admins, characters };
};