import { api } from "./client.js";

export const objectsApi = {
    list:    ()           => api.get("/api/objects"),
    create:  (data)       => api.post("/api/objects", data),
    update:  (id, data)   => api.put(`/api/objects/${id}`, data),
    remove:  (id)         => api.del(`/api/objects/${id}`),
    checkName: (name, excludeId) => {
        const qs = new URLSearchParams({ name });
        if (excludeId) qs.set("excludeId", excludeId);
        return api.get(`/api/objects/check-name?${qs}`);
    }
};
