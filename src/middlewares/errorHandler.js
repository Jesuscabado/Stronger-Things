/**
 * 404 — ruta no encontrada
 */
export const notFoundHandler = (req, res) => {
    res.status(404).json({ message: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
};

/**
 * Manejador global de errores. Distingue:
 *  - errores de validación de Mongoose -> 400
 *  - errores de cast (id mal formado)   -> 400
 *  - cualquier otro                     -> 500
 */
export const errorHandler = (err, req, res, _next) => {
    console.error("💥 Error:", err);

    if (err.name === "ValidationError") {
        return res.status(400).json({
            message: "Error de validación",
            errors: Object.fromEntries(
                Object.entries(err.errors).map(([k, v]) => [k, v.message])
            )
        });
    }

    if (err.name === "CastError") {
        return res.status(400).json({ message: `Valor inválido para el campo ${err.path}` });
    }

    res.status(err.status || 500).json({
        message: err.message || "Error interno del servidor"
    });
};
