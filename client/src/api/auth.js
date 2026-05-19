import { api } from "./client.js";
export const authApi = {
    toggleDM: (isDM) => api.patch("/api/auth/me/dm", { isDM }),
    register: (data) => api.post("/api/auth/register", data),
    login: (data) => api.post("/api/auth/login", data),
    me: () => api.get("/api/auth/me"),
    loginWithGoogle: (credential) => api.post("/api/auth/google", { credential }),
};
