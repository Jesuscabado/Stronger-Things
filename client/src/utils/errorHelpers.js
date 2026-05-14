/**
 * Helper para extraer un mensaje legible de cualquier error.
 * Detecta el formato estructurado del backend y devuelve algo útil.
 *
 * Uso desde un componente:
 *   try {
 *     await charactersApi.update(id, data);
 *   } catch (err) {
 *     toast.error(getErrorMessage(err));
 *   }
 */
export const getErrorMessage = (err) => {
    if (!err) return "Error desconocido";

    // Si es un string, devolverlo tal cual
    if (typeof err === "string") return err;

    // Error estándar de JS
    if (err.message) return err.message;

    // Algunas APIs devuelven { error, message }
    if (err.error) return err.error;

    return "Error desconocido";
};

/**
 * Helper para extraer detalles adicionales (campos de validación, etc.).
 * Devuelve un string formateado o null.
 *
 * Ejemplo de uso con detalles de validación de Mongoose:
 *   { name: "El nombre es obligatorio", level: "Debe ser entre 1 y 20" }
 *   → "name: El nombre es obligatorio · level: Debe ser entre 1 y 20"
 */
export const getErrorDetails = (err) => {
    if (!err?.details || typeof err.details !== "object") return null;
    return Object.entries(err.details)
        .map(([k, v]) => `${k}: ${v}`)
        .join(" · ");
};
