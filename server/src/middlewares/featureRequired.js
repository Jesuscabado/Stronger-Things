export const featureRequired = (feature) => (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "No autenticado" });
    if (req.user.role === "admin" || (req.user.features ?? []).includes(feature)) return next();
    return res.status(403).json({ message: "No tienes acceso a esta funcionalidad" });
};
