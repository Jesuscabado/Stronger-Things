import { useEffect, useState } from "react";
import { adminApi } from "../api/admin.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function AdminPage() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const load = async () => {
        try {
            setLoading(true);
            const [userList, statsData] = await Promise.all([
                adminApi.listUsers(),
                adminApi.stats()
            ]);
            setUsers(userList);
            setStats(statsData);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const flash = (msg) => {
        setSuccess(msg);
        setTimeout(() => setSuccess(""), 2500);
    };

    const handleToggleRole = async (user) => {
        const newRole = user.role === "admin" ? "user" : "admin";
        if (!confirm(`¿Cambiar a ${user.username} de "${user.role}" a "${newRole}"?`)) return;
        try {
            await adminApi.updateRole(user._id, newRole);
            flash("Rol actualizado");
            load();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDelete = async (user) => {
        if (!confirm(`¿Eliminar a ${user.username}? Se borrarán también todos sus personajes. Esta acción no se puede deshacer.`)) return;
        try {
            await adminApi.deleteUser(user._id);
            flash("Usuario eliminado");
            load();
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) return <div className="loading">Consultando los registros del Maestro...</div>;

    return (
        <div className="container">
            <h1>⚜ Panel de administración</h1>

            {error && <div className="alert">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            {stats && (
                <div className="scroll-card">
                    <h2>Estadísticas</h2>
                    <div className="grid grid-3">
                        <div style={{ textAlign: "center", padding: "1rem" }}>
                            <div style={{ fontSize: "2.5rem", fontFamily: "Cinzel", color: "var(--gold)" }}>{stats.users}</div>
                            <div style={{ color: "var(--ink-faded)", fontFamily: "Cinzel", textTransform: "uppercase", fontSize: "0.85rem" }}>Aventureros totales</div>
                        </div>
                        <div style={{ textAlign: "center", padding: "1rem" }}>
                            <div style={{ fontSize: "2.5rem", fontFamily: "Cinzel", color: "var(--blood)" }}>{stats.admins}</div>
                            <div style={{ color: "var(--ink-faded)", fontFamily: "Cinzel", textTransform: "uppercase", fontSize: "0.85rem" }}>Administradores</div>
                        </div>
                        <div style={{ textAlign: "center", padding: "1rem" }}>
                            <div style={{ fontSize: "2.5rem", fontFamily: "Cinzel", color: "var(--ink)" }}>{stats.characters}</div>
                            <div style={{ color: "var(--ink-faded)", fontFamily: "Cinzel", textTransform: "uppercase", fontSize: "0.85rem" }}>Personajes creados</div>
                        </div>
                    </div>
                </div>
            )}

            <div className="scroll-card">
                <h2>Usuarios</h2>
                {users.length === 0 ? (
                    <div className="empty">No hay usuarios.</div>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ borderBottom: "2px solid var(--ink)", textAlign: "left" }}>
                                    <th style={{ padding: "0.6rem", fontFamily: "Cinzel", fontSize: "0.85rem", textTransform: "uppercase" }}>Aventurero</th>
                                    <th style={{ padding: "0.6rem", fontFamily: "Cinzel", fontSize: "0.85rem", textTransform: "uppercase" }}>Email</th>
                                    <th style={{ padding: "0.6rem", fontFamily: "Cinzel", fontSize: "0.85rem", textTransform: "uppercase" }}>Rol</th>
                                    <th style={{ padding: "0.6rem", fontFamily: "Cinzel", fontSize: "0.85rem", textTransform: "uppercase" }}>Creado</th>
                                    <th style={{ padding: "0.6rem", fontFamily: "Cinzel", fontSize: "0.85rem", textTransform: "uppercase" }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => {
                                    const isMe = u._id === currentUser._id;
                                    return (
                                        <tr key={u._id} style={{ borderBottom: "1px dashed var(--parchment-shadow)" }}>
                                            <td style={{ padding: "0.6rem", fontFamily: "Cinzel" }}>
                                                {u.username}
                                                {isMe && <span style={{ marginLeft: "0.5rem", fontSize: "0.75rem", color: "var(--gold)" }}>(tú)</span>}
                                            </td>
                                            <td style={{ padding: "0.6rem", color: "var(--ink-faded)" }}>{u.email}</td>
                                            <td style={{ padding: "0.6rem" }}>
                                                <span className="class-badge" style={{
                                                    color: u.role === "admin" ? "var(--blood)" : "var(--ink-faded)"
                                                }}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td style={{ padding: "0.6rem", color: "var(--ink-faded)", fontSize: "0.85rem" }}>
                                                {new Date(u.createdAt).toLocaleDateString()}
                                            </td>
                                            <td style={{ padding: "0.6rem" }}>
                                                <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
                                                    <button
                                                        className="btn btn-small"
                                                        onClick={() => handleToggleRole(u)}
                                                        disabled={isMe}
                                                        title={isMe ? "No puedes cambiar tu propio rol" : ""}
                                                    >
                                                        {u.role === "admin" ? "↓ Degradar" : "↑ Promover"}
                                                    </button>
                                                    <button
                                                        className="btn btn-small btn-danger"
                                                        onClick={() => handleDelete(u)}
                                                        disabled={isMe}
                                                    >
                                                        Eliminar
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}