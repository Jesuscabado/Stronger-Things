import { api } from "./client.js";

export const objectsApi = {
    list: () => api.get("/api/objects"),
    create: (data) => api.post("/api/objects", data)
};
