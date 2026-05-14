import { api } from "./client.js";

export const monstersApi = {
    list:   (params = {}) => {
        const qs = new URLSearchParams();
        if (params.search) qs.set("search", params.search);
        if (params.type)   qs.set("type",   params.type);
        if (params.size)   qs.set("size",   params.size);
        if (params.cr)     qs.set("cr",     params.cr);
        const query = qs.toString() ? `?${qs.toString()}` : "";
        return api.get(`/api/monsters${query}`);
    },
    get:    (id) => api.get(`/api/monsters/${id}`),
    create: (data) => api.post("/api/monsters", data),
    update: (id, data) => api.put(`/api/monsters/${id}`, data),
    remove: (id) => api.del(`/api/monsters/${id}`)
};