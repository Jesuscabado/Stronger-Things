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

    // Notas DM (cards)
    addNoteCard:    (id, data)           => api.post(`${base}/${id}/notecards`, data),
    updateNoteCard: (id, noteId, data)   => api.put(`${base}/${id}/notecards/${noteId}`, data),
    removeNoteCard: (id, noteId)         => api.del(`${base}/${id}/notecards/${noteId}`),

    // Pool de monstruos
    addMonster:    (id, monsterId) => api.post(`${base}/${id}/monsters`, { monsterId }),
    removeMonster: (id, monsterId) => api.del(`${base}/${id}/monsters/${monsterId}`),

    // Notas compartidas con jugadores
    addSharedNote:    (id, data)         => api.post(`${base}/${id}/sharednotes`, data),
    updateSharedNote: (id, noteId, data) => api.put(`${base}/${id}/sharednotes/${noteId}`, data),
    removeSharedNote: (id, noteId)       => api.del(`${base}/${id}/sharednotes/${noteId}`),

    // Plantillas de encuentro
    addEncounterTemplate:    (id, data)             => api.post(`${base}/${id}/encountertemplates`, data),
    updateEncounterTemplate: (id, templateId, data) => api.put(`${base}/${id}/encountertemplates/${templateId}`, data),
    removeEncounterTemplate: (id, templateId)       => api.del(`${base}/${id}/encountertemplates/${templateId}`),

    // Encuestas de disponibilidad (DM)
    addPoll:   (id, data)   => api.post(`${base}/${id}/polls`, data),
    closePoll: (id, pollId) => api.put(`${base}/${id}/polls/${pollId}/close`),
    removePoll: (id, pollId) => api.del(`${base}/${id}/polls/${pollId}`),
};

export const playerCampaignsApi = {
    list: ()   => api.get(`${base}/participating`),
    get:  (id) => api.get(`${base}/participating/${id}`),
    vote: (id, pollId, optionId, characterId) =>
        api.post(`${base}/participating/${id}/polls/${pollId}/options/${optionId}/vote`, { characterId }),
};

export const charactersSearchApi = {
    search: (q) => api.get(`/api/characters/search?${new URLSearchParams({ q })}`)
};
