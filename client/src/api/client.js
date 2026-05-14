const BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";
const getToken = () => localStorage.getItem("token");

/**
 * Error enriquecido con metadata HTTP.
 * Permite a los componentes distinguir entre 404, 403, etc.
 */
class ApiError extends Error {
    constructor(message, { status, error, details } = {}) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.error = error;
        this.details = details;
    }
}

export const apiFetch = async (path, options = {}) => {
    const headers = {
        ...(options.body && !(options.body instanceof FormData) && { "Content-Type": "application/json" }),
        ...(getToken() && { Authorization: `Bearer ${getToken()}` }),
        ...options.headers
    };

    let res;
    try {
        res = await fetch(`${BASE}${path}`, { ...options, headers });
    } catch (networkErr) {
        // Error de red: backend caído, sin conexión, CORS bloqueado
        throw new ApiError("No se pudo conectar con el servidor", {
            status: 0,
            error: "NetworkError"
        });
    }

    if (res.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        // Solo redirigir si NO estamos ya en login (evita loops)
        if (!window.location.pathname.includes("/login")) {
            window.location.href = "/login";
        }
        throw new ApiError("Sesión expirada", { status: 401, error: "Unauthorized" });
    }

    const contentType = res.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const data = isJson ? await res.json() : await res.blob();

    if (!res.ok) {
        const message = (isJson && (data.message || data.error)) || `Error ${res.status}`;
        throw new ApiError(message, {
            status: res.status,
            error: data?.error,
            details: data?.details
        });
    }

    return data;
};

export const api = {
    get:   (path) => apiFetch(path),
    post:  (path, body) => apiFetch(path, { method: "POST", body: JSON.stringify(body) }),
    put:   (path, body) => apiFetch(path, { method: "PUT", body: JSON.stringify(body) }),
    patch: (path, body) => apiFetch(path, { method: "PATCH", body: JSON.stringify(body) }),
    del:   (path) => apiFetch(path, { method: "DELETE" }),
    upload: (path, formData) => apiFetch(path, { method: "POST", body: formData }),
    download: (path) => apiFetch(path)
};
