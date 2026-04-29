import { api } from "./client.js";

export const authApi = {
    register: (data) => api.post("/api/auth/register", data),
    login: (data) => api.post("/api/auth/login", data),
    me: () => api.get("/api/auth/me")
};
