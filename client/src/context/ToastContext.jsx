import { createContext, useContext, useState, useCallback } from "react";
import Toast from "../components/ui/Toast.jsx";

const ToastContext = createContext(null);

/**
 * Hook para mostrar notificaciones toast desde cualquier componente.
 * Uso:
 *   const toast = useToast();
 *   toast.success("Guardado");
 *   toast.error("Error al borrar", "Detalle opcional");
 *   toast.warning("Atención", "Hay cambios sin guardar");
 *   toast.info("Sesión iniciada");
 *
 * Opciones avanzadas:
 *   toast.success("Mensaje", null, { duration: 5000 });   // 5 segundos
 *   toast.error("Mensaje", null, { duration: 0 });        // no se cierra solo
 */
export const useToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) {
        throw new Error("useToast debe usarse dentro de ToastProvider");
    }
    return ctx;
};

let toastId = 0;

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const addToast = useCallback((type, message, title, options = {}) => {
        const id = ++toastId;
        const toast = {
            id,
            type,
            message,
            title,
            duration: options.duration ?? (type === "error" ? 6000 : 3000)
        };
        setToasts(prev => [...prev, toast]);
        return id;
    }, []);

    const api = {
        success: (message, title, options) => addToast("success", message, title, options),
        error:   (message, title, options) => addToast("error",   message, title, options),
        warning: (message, title, options) => addToast("warning", message, title, options),
        info:    (message, title, options) => addToast("info",    message, title, options),
        dismiss: removeToast
    };

    return (
        <ToastContext.Provider value={api}>
            {children}
            <div className="toast-container" aria-live="polite">
                {toasts.map(t => (
                    <Toast key={t.id} toast={t} onClose={removeToast} />
                ))}
            </div>
        </ToastContext.Provider>
    );
}
