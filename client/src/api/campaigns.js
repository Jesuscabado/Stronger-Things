import { api } from "./client.js";

const base = "/api/campaigns";

export const campaignsApi = {
    // Campañas
    list:   ()         => api.get(base),
    get:    (id)       => api.get(`${base}/${id}`),
    create: (data)     => api.post(base, data),
    update: (id, data) => api.put(`${base}/${id}`, data),
    remove: (id)       => api.del(`${base}/${id}`),

    // Participantes
    addParticipant:    (id, characterId) => api.post(`${base}/${id}/participants`, { characterId }),
    removeParticipant: (id, charId)      => api.del(`${base}/${id}/participants/${charId}`),

    // Sesiones
    addSession:    (id, data)           => api.post(`${base}/${id}/sessions`, data),
    updateSession: (id, sessionId, data) => api.put(`${base}/${id}/sessions/${sessionId}`, data),
    removeSession: (id, sessionId)       => api.del(`${base}/${id}/sessions/${sessionId}`),

    // Log
    addLogEntry:    (id, sessionId, data)           => api.post(`${base}/${id}/sessions/${sessionId}/log`, data),
    updateLogEntry: (id, sessionId, entryId, data)  => api.put(`${base}/${id}/sessions/${sessionId}/log/${entryId}`, data),
    removeLogEntry: (id, sessionId, entryId)        => api.del(`${base}/${id}/sessions/${sessionId}/log/${entryId}`),
};

export const charactersSearchApi = {
    search: (q) => api.get(`/api/characters/search?${new URLSearchParams({ q })}`)
};
