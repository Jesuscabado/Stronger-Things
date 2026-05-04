const BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

const getToken = () => localStorage.getItem("token");

export const apiFetch = async (path, options = {}) => {
    const headers = {
        ...(options.body && !(options.body instanceof FormData) && { "Content-Type": "application/json" }),
        ...(getToken() && { Authorization: `Bearer ${getToken()}` }),
        ...options.headers
    };

    const res = await fetch(`${BASE}${path}`, { ...options, headers });

    if (res.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
        throw new Error("Sesión expirada");
    }

    const contentType = res.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const data = isJson ? await res.json() : await res.blob();

    if (!res.ok) {
        const message = (isJson && data.message) || `Error ${res.status}`;
        throw new Error(message);
    }
    return data;
};

export const api = {
    get: (path) => apiFetch(path),
    post: (path, body) => apiFetch(path, { method: "POST", body: JSON.stringify(body) }),
    put: (path, body) => apiFetch(path, { method: "PUT", body: JSON.stringify(body) }),
    del: (path) => apiFetch(path, { method: "DELETE" }),
    upload: (path, formData) => apiFetch(path, { method: "POST", body: formData }),
    download: (path) => apiFetch(path)   // devuelve Blob
};
