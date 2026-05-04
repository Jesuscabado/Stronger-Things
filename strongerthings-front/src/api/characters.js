import { api } from "./client.js";

export const charactersApi = {
    list: () => api.get("/api/characters"),
    get: (id) => api.get(`/api/characters/${id}`),
    create: (data) => api.post("/api/characters", data),
    update: (id, data) => api.put(`/api/characters/${id}`, data),
    remove: (id) => api.del(`/api/characters/${id}`),

    // inventario
    addItem: (id, data) => api.post(`/api/characters/${id}/inventory`, data),
    updateItem: (id, itemId, data) => api.put(`/api/characters/${id}/inventory/${itemId}`, data),
    removeItem: (id, itemId) => api.del(`/api/characters/${id}/inventory/${itemId}`),

    // hoja PDF
    uploadSheet: (id, file) => {
        const fd = new FormData();
        fd.append("sheet", file);
        return api.upload(`/api/characters/${id}/sheet`, fd);
    },
    downloadSheet: (id) => api.download(`/api/characters/${id}/sheet`),
    deleteSheet: (id) => api.del(`/api/characters/${id}/sheet`)
};
