import { API_URL } from "../config";

export const notesApi = {
    async list() {
        const res = await fetch(`${API_URL}/api/notes`, {
            credentials: "include",
        });
        return res.json();
    },

    async create(payload) {
        const res = await fetch(`${API_URL}/api/notes`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        return res.json();
    },

    async update(id, payload) {
        const res = await fetch(`${API_URL}/api/notes/${id}`, {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        return res.json();
    },

    async remove(id) {
        const res = await fetch(`${API_URL}/api/notes/${id}`, {
            method: "DELETE",
            credentials: "include",
        });
        return res.json();
    }
        
    
};