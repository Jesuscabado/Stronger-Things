import { logger } from "../utils/logger.js";
import { AppError } from "../utils/errors.js";

/**
 * Middleware global de manejo de errores.
 * Captura cualquier error que ocurra en las rutas y devuelve una respuesta
 * estructurada al cliente. Loguea con nivel apropiado según el tipo de error.
 *
 * Debe ir DESPUÉS de todas las rutas en index.js:
 *   app.use(errorHandler);
 */
export const errorHandler = (err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }

    const requestInfo = {
        method: req.method,
        path: req.originalUrl,
        userId: req.user?._id?.toString()
    };

    // 1. Errores de la app (tipados)
    if (err instanceof AppError) {
        const logLevel = err.status >= 500 ? "error" : "warn";
        logger[logLevel](`${err.status} ${err.message}`, requestInfo);
        return res.status(err.status).json({
            error: err.name,
            message: err.message,
            ...(err.details && { details: err.details })
        });
    }

    // 2. Errores con `.status` (estilo legacy de tu characterService)
    if (err.status) {
        const logLevel = err.status >= 500 ? "error" : "warn";
        logger[logLevel](`${err.status} ${err.message}`, requestInfo);
        return res.status(err.status).json({
            error: err.name || "Error",
            message: err.message
        });
    }

    // 3. Errores de validación de Mongoose
    if (err.name === "ValidationError") {
        const details = Object.fromEntries(
            Object.entries(err.errors).map(([k, v]) => [k, v.message])
        );
        logger.warn(`Validación Mongoose falló`, { ...requestInfo, details });
        return res.status(400).json({
            error: "ValidationError",
            message: "Datos inválidos",
            details
        });
    }

    // 4. Cast errors de Mongoose (id mal formado)
    if (err.name === "CastError") {
        logger.warn(`Cast error: ${err.path} = ${err.value}`, requestInfo);
        return res.status(400).json({
            error: "BadRequest",
            message: `ID no válido: ${err.value}`
        });
    }

    // 5. Duplicate key error (índice unique violado)
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern || {})[0] || "campo";
        logger.warn(`Duplicate key: ${field}`, requestInfo);
        return res.status(409).json({
            error: "Conflict",
            message: `Ya existe un registro con ese ${field}`
        });
    }

    // 6. JSON malformado en el body
    if (err.type === "entity.parse.failed") {
        logger.warn("JSON body malformado", requestInfo);
        return res.status(400).json({
            error: "BadRequest",
            message: "JSON malformado en el body"
        });
    }

    // 7. JWT errors
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
        logger.warn(`JWT error: ${err.message}`, requestInfo);
        return res.status(401).json({
            error: "Unauthorized",
            message: "Token inválido o expirado"
        });
    }

    // 8. Multer (subida de archivos)
    if (err.name === "MulterError") {
        logger.warn(`Multer error: ${err.code}`, requestInfo);
        const messages = {
            LIMIT_FILE_SIZE: "Archivo demasiado grande (máximo 50MB)",
            LIMIT_UNEXPECTED_FILE: `Campo de archivo inesperado: ${err.field}`,
            LIMIT_FILE_COUNT: "Demasiados archivos"
        };
        return res.status(400).json({
            error: "BadRequest",
            message: messages[err.code] || err.message
        });
    }

    // 9. Cualquier otro error: 500 genérico
    logger.error(`Error no controlado: ${err.message}`, {
        ...requestInfo,
        stack: err.stack
    });

    res.status(500).json({
        error: "InternalServerError",
        message: process.env.NODE_ENV === "production"
            ? "Error interno del servidor"
            : err.message
    });
};

/**
 * Handler para rutas no encontradas (404). Va antes del errorHandler.
 */
export const notFoundHandler = (req, res) => {
    logger.warn(`Ruta no encontrada: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        error: "NotFound",
        message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`
    });
};

/**
 * Middleware que loguea cada request entrante con su tiempo de respuesta.
 * Pónlo al principio de la cadena, justo después de cors() y express.json().
 */
export const requestLogger = (req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
        const duration = Date.now() - start;
        const level = res.statusCode >= 500 ? "error"
                    : res.statusCode >= 400 ? "warn"
                    : "info";
        logger[level](`${req.method} ${req.originalUrl} → ${res.statusCode} (${duration}ms)`);
    });
    next();
};