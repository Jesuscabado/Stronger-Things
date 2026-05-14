import { useEffect } from "react";

/**
 * Componente individual de notificación toast.
 * Renderizado por ToastContainer dentro del contexto.
 */
export default function Toast({ toast, onClose }) {
    useEffect(() => {
        if (toast.duration === 0) return; // 0 = sin auto-cierre
        const timer = setTimeout(() => onClose(toast.id), toast.duration);
        return () => clearTimeout(timer);
    }, [toast.id, toast.duration, onClose]);

    const icons = {
        success: "✓",
        error: "✗",
        warning: "⚠",
        info: "ⓘ"
    };

    return (
        <div className={`toast toast--${toast.type}`} role="alert">
            <span className="toast__icon">{icons[toast.type] || icons.info}</span>
            <div className="toast__content">
                {toast.title && <div className="toast__title">{toast.title}</div>}
                <div className="toast__message">{toast.message}</div>
            </div>
            <button
                className="toast__close"
                onClick={() => onClose(toast.id)}
                aria-label="Cerrar"
            >
                ×
            </button>
        </div>
    );
}
