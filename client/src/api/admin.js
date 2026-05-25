import { api } from "./client.js";

export const adminApi = {
    stats:      ()             => api.get("/api/admin/stats"),
    listUsers:  ()             => api.get("/api/admin/users"),
    updateRole: (id, role)     => api.put(`/api/admin/users/${id}/role`, { role }),
    updateDM:   (id, isDM)     => api.put(`/api/admin/users/${id}/dm`, { isDM }),
    deleteUser: (id)           => api.del(`/api/admin/users/${id}`)
};