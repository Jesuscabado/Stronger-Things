import { api } from "./client.js";

const base = "/api/maps";

export const mapsApi = {
    list:     ()                  => api.get(base),
    get:      (id)                => api.get(`${base}/${id}`),
    create:   (data)              => api.post(base, data),
    update:   (id, data)          => api.put(`${base}/${id}`, data),
    remove:   (id)                => api.del(`${base}/${id}`),
    generate: (prompt, options)   => api.post(`${base}/generate`, { prompt, options })
};
