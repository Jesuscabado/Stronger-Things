import { api } from "./client.js";

/**
 * API del catálogo de hechizos.
 */
export const spellsApi = {
    /**
     * @param {Object} filters - { class, level, search }
     */
    list: (filters = {}) => {
        const qs = new URLSearchParams();
        if (filters.class) qs.set("class", filters.class);
        if (filters.level !== undefined && filters.level !== "" && filters.level !== null) {
            qs.set("level", filters.level);
        }
        if (filters.search) qs.set("search", filters.search);
        const path = qs.toString() ? `/api/spells?${qs}` : "/api/spells";
        return api.get(path);
    },

    get: (id) => api.get(`/api/spells/${id}`),
    create: (data) => api.post("/api/spells", data),
    delete: (id) => api.del(`/api/spells/${id}`),
    checkName: (name, excludeId) => {
        const qs = new URLSearchParams({ name });
        if (excludeId) qs.set("excludeId", excludeId);
        return api.get(`/api/spells/check-name?${qs}`);
    }
};