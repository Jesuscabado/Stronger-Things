import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { mapsApi } from "../api/maps.js";
import { useAuth } from "../context/AuthContext.jsx";

const canUseMaps = (u) => u?.role === "admin" || u?.features?.includes("maps");

export default function MapsPage() {
    const { user } = useAuth();
    if (!canUseMaps(user)) return (
        <div className="container">
            <div className="scroll-card" style={{ textAlign: "center", padding: "3rem 2rem" }}>
                <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🔒</div>
                <h1>Acceso restringido</h1>
                <p style={{ color: "var(--ink-faded)", maxWidth: "480px", margin: "1rem auto" }}>
                    El acceso al editor de mapas debe ser habilitado por un administrador.
                </p>
            </div>
        </div>
    );
    return <MapsList />;
}

function MapsList() {
    const navigate = useNavigate();
    const [maps, setMaps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const flash = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(""), 2500); };

    const load = async () => {
        try {
            setLoading(true);
            setMaps(await mapsApi.list());
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const handleDelete = async (map) => {
        if (!confirm(`¿Eliminar el mapa "${map.name}"?`)) return;
        try {
            await mapsApi.remove(map._id);
            flash("Mapa eliminado");
            setMaps(prev => prev.filter(m => m._id !== map._id));
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="container">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
                <h1 style={{ margin: 0 }}>Mapas tácticos</h1>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button className="btn btn-primary" onClick={() => navigate("/maps/new")}>
                        + Nuevo mapa
                    </button>
                </div>
            </div>

            {error   && <div className="alert" onClick={() => setError("")}>{error}</div>}
            {success && (
                <div className="alert-success" style={{ marginBottom: "1rem", padding: "0.75rem 1rem", borderRadius: "4px" }}>
                    {success}
                </div>
            )}

            {loading ? (
                <p style={{ color: "var(--ink-faded)" }}>Cargando mapas…</p>
            ) : maps.length === 0 ? (
                <div className="scroll-card" style={{ textAlign: "center", padding: "2.5rem" }}>
                    <p style={{ color: "var(--ink-faded)", marginBottom: "1.25rem" }}>
                        No tienes mapas todavía. Crea uno desde cero o deja que la IA lo genere por ti.
                    </p>
                    <button className="btn btn-primary" onClick={() => navigate("/maps/new")}>
                        Crear primer mapa
                    </button>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {maps.map(m => (
                        <MapCard
                            key={m._id}
                            map={m}
                            onEdit={() => navigate(`/maps/${m._id}/edit`)}
                            onDelete={() => handleDelete(m)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function MapCard({ map, onEdit, onDelete }) {
    const { grid, session } = map;
    const dims = grid ? `${grid.cols}×${grid.rows}` : "";

    return (
        <div className="scroll-card" style={{ padding: "1rem 1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                        <strong style={{ fontSize: "1rem" }}>{map.name}</strong>
                        {dims && (
                            <span style={{ fontSize: "0.75rem", color: "var(--ink-faded)" }}>
                                {dims} celdas
                            </span>
                        )}
                        {session && (
                            <span style={{ fontSize: "0.75rem", color: "var(--gold)" }}>
                                {session.name}
                            </span>
                        )}
                    </div>
                    {map.description && (
                        <p style={{ margin: "0.3rem 0 0", fontSize: "0.85rem", color: "var(--ink-faded)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {map.description}
                        </p>
                    )}
                    <p style={{ margin: "0.2rem 0 0", fontSize: "0.78rem", color: "var(--ink-faded)" }}>
                        Editado {new Date(map.updatedAt).toLocaleDateString("es-ES")}
                    </p>
                </div>
                <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0 }}>
                    <button className="btn btn-small" onClick={onEdit}>Editar</button>
                    <button className="btn btn-small" style={{ color: "var(--blood)" }} onClick={onDelete}>
                        Eliminar
                    </button>
                </div>
            </div>
        </div>
    );
}
