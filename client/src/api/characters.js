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

    // hechizos
    addSpell: (id, data) => api.post(`/api/characters/${id}/spells`, data),
    updateSpell: (id, knownId, data) => api.patch(`/api/characters/${id}/spells/${knownId}`, data),
    removeSpell: (id, knownId) => api.del(`/api/characters/${id}/spells/${knownId}`),

    // hoja PDF
    uploadSheet: (id, file) => {
        const fd = new FormData();
        fd.append("sheet", file);
        return api.upload(`/api/characters/${id}/sheet`, fd);
    },
    downloadSheet: (id) => api.download(`/api/characters/${id}/sheet`),
    deleteSheet: (id) => api.del(`/api/characters/${id}/sheet`),

    // avatar
    uploadAvatar: (id, file) => {
        const fd = new FormData();
        fd.append("avatar", file);
        return api.upload(`/api/characters/${id}/avatar`, fd);
    },
    deleteAvatar: (id) => api.del(`/api/characters/${id}/avatar`),

    // diario
    addDiaryEntry: (id, data) => api.post(`/api/characters/${id}/diary`, data),
    updateDiaryEntry: (id, entryId, data) => api.put(`/api/characters/${id}/diary/${entryId}`, data),
    removeDiaryEntry: (id, entryId) => api.del(`/api/characters/${id}/diary/${entryId}`),
};