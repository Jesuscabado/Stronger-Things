import { useEffect, useState } from "react";
import { adminApi } from "../api/admin.js";
import PageIntro from "../components/layout/PageIntro.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function AdminPage() {
    const { user: currentUser } = useAuth();
    const [users, setUsers]   = useState([]);
    const [stats, setStats]   = useState(null);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState("");
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

    const handleToggleRole = async (u) => {
        const newRole = u.role === "admin" ? "user" : "admin";
        if (!confirm(`¿Cambiar a ${u.username} de "${u.role}" a "${newRole}"?`)) return;
        try { await adminApi.updateRole(u._id, newRole); flash("Rol actualizado"); load(); }
        catch (err) { setError(err.message); }
    };

    const handleToggleDM = async (u) => {
        const next = !u.isDM;
        if (!confirm(`¿${next ? "Asignar" : "Quitar"} rol DM a ${u.username}?`)) return;
        try { await adminApi.updateDM(u._id, next); flash(`Rol DM ${next ? "asignado" : "retirado"}`); load(); }
        catch (err) { setError(err.message); }
    };

    const handleToggleFeature = async (u, feature) => {
        const hasFeat = (u.features ?? []).includes(feature);
        const next    = !hasFeat;
        const labels  = { maps: "acceso a Mapas", campaigns: "acceso a Campañas" };
        if (!confirm(`¿${next ? "Dar" : "Quitar"} ${labels[feature]} a ${u.username}?`)) return;
        try { await adminApi.updateFeature(u._id, feature, next); flash(`${labels[feature]} ${next ? "concedido" : "retirado"}`); load(); }
        catch (err) { setError(err.message); }
    };

    const handleDelete = async (u) => {
        if (!confirm(`¿Eliminar a ${u.username}? Se borrarán también todos sus personajes. Esta acción no se puede deshacer.`)) return;
        try { await adminApi.deleteUser(u._id); flash("Usuario eliminado"); load(); }
        catch (err) { setError(err.message); }
    };

    if (loading) return <div className="loading">Consultando los registros del Maestro...</div>;

    return (
        <div className="container">
            <PageIntro pageKey="admin" text="Panel de administración. Gestiona usuarios y sus roles (DM, admin), supervisa las estadísticas globales y administra el contenido del SRD como objetos, hechizos y monstruos." />
            <h1>Panel de administración</h1>

            {error   && <div className="alert">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            {/* ── Estadísticas ── */}
            {stats && (
                <div className="scroll-card" style={{ marginBottom: "1.5rem" }}>
                    <h2>Estadísticas</h2>
                    <div className="grid grid-3">
                        <StatBox value={stats.users}      label="Aventureros totales" color="var(--gold)" />
                        <StatBox value={stats.admins}     label="Administradores"     color="var(--blood)" />
                        <StatBox value={stats.dms}        label="Directores de juego" color="var(--gold)" />
                        <StatBox value={stats.characters} label="Personajes creados"  color="var(--ink)" />
                    </div>
                </div>
            )}

            {/* ── Lista de usuarios ── */}
            <div className="scroll-card">
                <h2>Usuarios</h2>
                {users.length === 0 ? (
                    <div className="empty">No hay usuarios.</div>
                ) : (
                    <div className="admin-users">
                        {users.map(u => (
                            <UserCard
                                key={u._id}
                                user={u}
                                isMe={u._id === currentUser._id}
                                onToggleRole={handleToggleRole}
                                onToggleDM={handleToggleDM}
                                onToggleFeature={handleToggleFeature}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function StatBox({ value, label, color }) {
    return (
        <div style={{ textAlign: "center", padding: "1rem" }}>
            <div style={{ fontSize: "2.5rem", fontFamily: "Cinzel", color }}>{value}</div>
            <div style={{ color: "var(--ink-faded)", fontFamily: "Cinzel", textTransform: "uppercase", fontSize: "0.85rem" }}>{label}</div>
        </div>
    );
}

function UserCard({ user: u, isMe, onToggleRole, onToggleDM, onToggleFeature, onDelete }) {
    const hasMaps      = (u.features ?? []).includes("maps");
    const hasCampaigns = (u.features ?? []).includes("campaigns");
    const isAdmin = u.role === "admin";

    return (
        <div className="admin-user-card">
            {/* Info */}
            <div className="admin-user-card__info">
                <div className="admin-user-card__name">
                    <span style={{ fontFamily: "Cinzel", fontWeight: 600 }}>{u.username}</span>
                    {isMe && <span className="admin-badge admin-badge--gold">tú</span>}
                    <span className={`admin-badge ${isAdmin ? "admin-badge--blood" : "admin-badge--faded"}`}>
                        {u.role}
                    </span>
                    {u.isDM && <span className="admin-badge admin-badge--gold">DM</span>}
                    {hasMaps && !isAdmin && <span className="admin-badge admin-badge--purple">Mapas</span>}
                    {hasCampaigns && !isAdmin && <span className="admin-badge admin-badge--purple">Campañas</span>}
                </div>
                <div className="admin-user-card__email">{u.email}</div>
                <div className="admin-user-card__date">
                    Registrado {new Date(u.createdAt).toLocaleDateString("es-ES")}
                </div>
            </div>

            {/* Acciones — grid 2 columnas */}
            <div className="admin-user-card__actions">
                <button
                    className="btn btn-small"
                    onClick={() => onToggleRole(u)}
                    disabled={isMe}
                    title={isAdmin ? "Quitar rol de administrador y convertir en usuario normal" : "Convertir en administrador con acceso total"}
                >
                    {isAdmin ? "↓ Degradar" : "↑ Promover"}
                </button>

                <button
                    className="btn btn-small"
                    onClick={() => onToggleDM(u)}
                    disabled={isMe}
                    style={{ color: u.isDM ? "var(--blood)" : "var(--gold)" }}
                    title={u.isDM ? "Retirar el rol de Director de Juego" : "Asignar rol de Director de Juego (gestiona campañas, bestiario y sesiones)"}
                >
                    {u.isDM ? "✕ DM" : "🎲 DM"}
                </button>

                {isAdmin ? (
                    <span className="admin-perm-label" title="Los administradores tienen acceso ilimitado a Mapas">Mapas ∞</span>
                ) : (
                    <button
                        className="btn btn-small"
                        onClick={() => onToggleFeature(u, "maps")}
                        disabled={isMe}
                        style={{ color: hasMaps ? "var(--blood)" : "var(--gold)" }}
                        title={hasMaps ? "Revocar acceso al editor de mapas tácticos" : "Conceder acceso al editor de mapas tácticos"}
                    >
                        {hasMaps ? "✕ Mapas" : "✓ Mapas"}
                    </button>
                )}

                {isAdmin ? (
                    <span className="admin-perm-label" title="Los administradores tienen acceso ilimitado a Campañas">Campañas ∞</span>
                ) : (
                    <button
                        className="btn btn-small"
                        onClick={() => onToggleFeature(u, "campaigns")}
                        disabled={isMe}
                        style={{ color: hasCampaigns ? "var(--blood)" : "var(--gold)" }}
                        title={hasCampaigns ? "Revocar acceso a la gestión de campañas" : "Conceder acceso a la gestión de campañas y sesiones"}
                    >
                        {hasCampaigns ? "✕ Campañas" : "✓ Campañas"}
                    </button>
                )}

                <button
                    className="btn btn-small btn-danger"
                    onClick={() => onDelete(u)}
                    disabled={isMe}
                    title="Eliminar usuario y todos sus personajes de forma permanente"
                >
                    Eliminar
                </button>
            </div>
        </div>
    );
}
