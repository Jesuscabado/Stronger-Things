import { createContext, useContext, useState, useEffect } from "react";
import { authApi } from "../api/auth.js";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const stored = localStorage.getItem("user");
        return stored ? JSON.parse(stored) : null;
    });

    // Sincroniza el perfil con el servidor al arrancar para que cambios
    // de rol o isDM hechos en la DB se reflejen sin necesidad de re-login.
    useEffect(() => {
        if (!localStorage.getItem("token")) return;
        authApi.me().then(fresh => {
            localStorage.setItem("user", JSON.stringify(fresh));
            setUser(fresh);
        }).catch(() => {
            // Token expirado o inválido — el interceptor de apiFetch ya limpia localStorage
        });
    }, []);

    const persist = (token, user) => {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        setUser(user);
    };

    const login = async (email, password) => {
        const { user, token } = await authApi.login({ email, password });
        persist(token, user);
    };

    const loginWithCredentials = ({ user, token }) => {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        setUser(user);
    };

    const register = async (username, email, password) => {
        const { user, token } = await authApi.register({ username, email, password });
        persist(token, user);
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
    };

    const deleteAccount = async () => {
        await authApi.deleteAccount();
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
    };
    const updateUser = (newUserData) => {
        setUser(prev => {
            const updated = { ...prev, ...newUserData };
            localStorage.setItem("user", JSON.stringify(updated));
            return updated;
        });
    };

    return (
            
       <AuthContext.Provider value={{ user, login, logout, register, loginWithCredentials, updateUser, deleteAccount }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
