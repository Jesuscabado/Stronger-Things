/**
 * Genera un middleware que comprueba que en req.body existan
 * todos los campos pasados en `requiredFields`.
 *
 * Uso: router.post('/', validateBody(['name', 'charClass', 'user']), controller)
 */
export const validateBody = (requiredFields = []) => (req, res, next) => {
    if (!req.body || typeof req.body !== "object") {
        return res.status(400).json({ message: "Body requerido en formato JSON" });
    }

    const missing = requiredFields.filter((field) => {
        const value = req.body[field];
        return value === undefined || value === null || value === "";
    });

    if (missing.length > 0) {
        return res.status(400).json({
            message: "Faltan campos obligatorios",
            missing
        });
    }

    next();
};

/**
 * Verifica que el id de la URL sea un ObjectId válido de MongoDB.
 */
export const validateObjectId = (paramName = "id") => (req, res, next) => {
    const id = req.params[paramName];
    if (!/^[a-fA-F0-9]{24}$/.test(id)) {
        return res.status(400).json({ message: `Id inválido: ${id}` });
    }
    next();
};
