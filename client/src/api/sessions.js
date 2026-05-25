import { api } from "./client.js";

export const sessionsApi = {
    list:   ()         => api.get("/api/sessions"),
    get:    (id)       => api.get(`/api/sessions/${id}`),
    create: (data)     => api.post("/api/sessions", data),
    update: (id, data) => api.put(`/api/sessions/${id}`, data),
    remove: (id)       => api.del(`/api/sessions/${id}`),

    addParticipant:    (id, characterId)  => api.post(`/api/sessions/${id}/participants`, { characterId }),
    removeParticipant: (id, characterId)  => api.del(`/api/sessions/${id}/participants/${characterId}`),
};

export const charactersSearchApi = {
    search: (q) => {
        const qs = new URLSearchParams({ q });
        return api.get(`/api/characters/search?${qs}`);
    }
};
