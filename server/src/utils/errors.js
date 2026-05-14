/**
 * Errores tipados de la app. Cada uno tiene un `status` HTTP asociado.
 * El errorHandler middleware los detecta y devuelve la respuesta correcta.
 *
 * Uso desde un service:
 *   throw new NotFoundError("Personaje no encontrado");
 *   throw new ForbiddenError("No tienes permiso");
 *   throw new ValidationError("El nombre es obligatorio", { field: "name" });
 *   throw new ConflictError("Ya existe un personaje con ese nombre");
 *   throw new UnauthorizedError("Token inválido");
 */

export class AppError extends Error {
    constructor(message, status = 500, details = null) {
        super(message);
        this.name = this.constructor.name;
        this.status = status;
        this.details = details;
        Error.captureStackTrace?.(this, this.constructor);
    }
}

export class ValidationError extends AppError {
    constructor(message, details = null) {
        super(message, 400, details);
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = "No autenticado") {
        super(message, 401);
    }
}

export class ForbiddenError extends AppError {
    constructor(message = "No tienes permiso para realizar esta acción") {
        super(message, 403);
    }
}

export class NotFoundError extends AppError {
    constructor(message = "Recurso no encontrado") {
        super(message, 404);
    }
}

export class ConflictError extends AppError {
    constructor(message = "Conflicto: el recurso ya existe") {
        super(message, 409);
    }
}

export class ExternalServiceError extends AppError {
    constructor(message = "Error en un servicio externo", details = null) {
        super(message, 502, details);
    }
}
