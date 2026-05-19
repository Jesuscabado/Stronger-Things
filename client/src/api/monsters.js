import { api } from "./client.js";

export const monstersApi = {
    list:   (params = {}) => {
        const qs = new URLSearchParams();
        if (params.search) qs.set("search", params.search);
        if (params.type)   qs.set("type",   params.type);
        if (params.size)   qs.set("size",   params.size);
        if (params.cr)     qs.set("cr",     params.cr);
        if (params.source) qs.set("source", params.source);
        const query = qs.toString() ? `?${qs.toString()}` : "";
        return api.get(`/api/monsters${query}`);
    },
    get:    (id) => api.get(`/api/monsters/${id}`),
    create: (data) => api.post("/api/monsters", data),
    update: (id, data) => api.put(`/api/monsters/${id}`, data),
    remove: (id) => api.del(`/api/monsters/${id}`),
    clone:  (id) => api.post(`/api/monsters/${id}/clone`, {}),
    uploadImage: (id, file) => {
        const fd = new FormData();
        fd.append("image", file);
        return api.upload(`/api/monsters/${id}/image`, fd);
    },
    deleteImage: (id) => api.del(`/api/monsters/${id}/image`),
    checkName: (name, excludeId) => {
        const qs = new URLSearchParams({ name });
        if (excludeId) qs.set("excludeId", excludeId);
        return api.get(`/api/monsters/check-name?${qs}`);
    }
};