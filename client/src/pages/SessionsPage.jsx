import { useEffect, useState, useRef } from "react";
import { sessionsApi, charactersSearchApi } from "../api/sessions.js";
import { useAuth } from "../context/AuthContext.jsx";

const STATUS_LABEL = {
    planning:  "Planificando",
    active:    "En curso",
    completed: "Completada"
};

const STATUS_COLOR = {
    planning:  "var(--ink-faded)",
    active:    "var(--gold-bright)",
    completed: "var(--blood)"
};

const emptySession = {
    name: "",
    description: "",
    date: "",
    status: "planning",
    notes: ""
};

export default function SessionsPage() {
    const { user } = useAuth();
    const isDM = user?.isDM === true;
    return isDM ? <Sessions /> : <NoDMAccess />;
}

function NoDMAccess() {
    return (
        <div className="container">
            <div className="scroll-card" style={{ textAlign: "center", padding: "3rem 2rem" }}>
                <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🔒</div>
                <h1>Acceso restringido</h1>
                <p style={{ color: "var(--ink-faded)", maxWidth: "480px", margin: "1rem auto" }}>
                    Las sesiones están disponibles únicamente para los Directores de Juego.
                    Contacta con un administrador para que te asigne el rol DM.
                </p>
            </div>
        </div>
    );
}

function Sessions() {

    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [selected, setSelected] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(emptySession);
    const [editingId, setEditingId] = useState(null);
    const [saving, setSaving] = useState(false);

    const flash = (msg) => {
        setSuccess(msg);
        setTimeout(() => setSuccess(""), 2500);
    };

    const load = async () => {
        try {
            setLoading(true);
            const data = await sessionsApi.list();
            setSessions(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    // Refresca el selected tras cambios
    const reloadSelected = async (id) => {
        try {
            const updated = await sessionsApi.get(id);
            setSelected(updated);
            setSessions(prev => prev.map(s => s._id === id ? updated : s));
        } catch (err) {
            setError(err.message);
        }
    };

    const openCreate = () => {
        setForm(emptySession);
        setEditingId(null);
        setShowForm(true);
    };

    const openEdit = (session) => {
        setForm({
            name: session.name,
            description: session.description || "",
            date: session.date ? session.date.slice(0, 10) : "",
            status: session.status,
            notes: session.notes || ""
        });
        setEditingId(session._id);
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingId(null);
        setForm(emptySession);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                ...form,
                date: form.date || undefined
            };
            if (editingId) {
                await sessionsApi.update(editingId, payload);
                flash("Sesión actualizada");
                if (selected?._id === editingId) await reloadSelected(editingId);
            } else {
                const created = await sessionsApi.create(payload);
                flash("Sesión creada");
                setSessions(prev => [created, ...prev]);
            }
            closeForm();
            if (!editingId) load();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (session) => {
        if (!confirm(`¿Eliminar la sesión "${session.name}"?`)) return;
        try {
            await sessionsApi.remove(session._id);
            flash("Sesión eliminada");
            if (selected?._id === session._id) setSelected(null);
            load();
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="container">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
                <h1 style={{ margin: 0 }}>Sesiones</h1>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button className="btn btn-primary" onClick={openCreate}>+ Nueva sesión</button>
                </div>
            </div>

            {error   && <div className="alert" onClick={() => setError("")}>{error}</div>}
            {success && <div className="alert-success" style={{ marginBottom: "1rem", padding: "0.75rem 1rem", borderRadius: "4px" }}>{success}</div>}

            {showForm && (
                <SessionForm
                    form={form}
                    setForm={setForm}
                    editingId={editingId}
                    saving={saving}
                    onSubmit={handleSubmit}
                    onCancel={closeForm}
                />
            )}

            {loading ? (
                <p style={{ color: "var(--ink-faded)" }}>Cargando sesiones…</p>
            ) : sessions.length === 0 && !showForm ? (
                <div className="scroll-card" style={{ textAlign: "center", padding: "2rem" }}>
                    <p style={{ color: "var(--ink-faded)" }}>No tienes sesiones aún. Crea la primera para empezar tu campaña.</p>
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 1.4fr" : "1fr", gap: "1.5rem", alignItems: "start" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        {sessions.map(s => (
                            <SessionCard
                                key={s._id}
                                session={s}
                                isSelected={selected?._id === s._id}
                                onClick={() => setSelected(selected?._id === s._id ? null : s)}
                                onEdit={() => openEdit(s)}
                                onDelete={() => handleDelete(s)}
                            />
                        ))}
                    </div>

                    {selected && (
                        <SessionDetail
                            session={selected}
                            onClose={() => setSelected(null)}
                            onParticipantChange={() => reloadSelected(selected._id)}
                            onError={setError}
                        />
                    )}
                </div>
            )}
        </div>
    );
}

function SessionCard({ session, isSelected, onClick, onEdit, onDelete }) {
    return (
        <div
            className="scroll-card"
            style={{
                padding: "1rem 1.25rem",
                cursor: "pointer",
                borderColor: isSelected ? "var(--gold)" : undefined,
                boxShadow: isSelected ? "0 0 0 2px var(--gold)" : undefined
            }}
            onClick={onClick}
        >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                        <strong style={{ fontSize: "1rem" }}>{session.name}</strong>
                        <span style={{ fontSize: "0.75rem", color: STATUS_COLOR[session.status] }}>
                            ● {STATUS_LABEL[session.status]}
                        </span>
                    </div>
                    {session.date && (
                        <p style={{ margin: "0.15rem 0 0", fontSize: "0.8rem", color: "var(--ink-faded)" }}>
                            {new Date(session.date).toLocaleDateString("es-ES")}
                        </p>
                    )}
                    {session.description && (
                        <p style={{ margin: "0.4rem 0 0", fontSize: "0.85rem", color: "var(--ink-faded)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {session.description}
                        </p>
                    )}
                    <p style={{ margin: "0.3rem 0 0", fontSize: "0.8rem", color: "var(--ink-faded)" }}>
                        {session.participants?.length || 0} participante{session.participants?.length !== 1 ? "s" : ""}
                    </p>
                </div>
                <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                    <button className="btn btn-small" onClick={onEdit}>Editar</button>
                    <button className="btn btn-small" style={{ color: "var(--blood)" }} onClick={onDelete}>Eliminar</button>
                </div>
            </div>
        </div>
    );
}

function SessionForm({ form, setForm, editingId, saving, onSubmit, onCancel }) {
    const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

    return (
        <div className="scroll-card" style={{ marginBottom: "1.5rem", padding: "1.5rem" }}>
            <h2 style={{ marginTop: 0 }}>{editingId ? "Editar sesión" : "Nueva sesión"}</h2>
            <form onSubmit={onSubmit}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div style={{ gridColumn: "1 / -1" }}>
                        <label style={{ display: "block", marginBottom: "0.3rem", fontWeight: 600 }}>Nombre *</label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={set("name")}
                            required
                            placeholder="El Castillo Ravenloft..."
                            style={{ width: "100%" }}
                        />
                    </div>
                    <div>
                        <label style={{ display: "block", marginBottom: "0.3rem", fontWeight: 600 }}>Fecha</label>
                        <input
                            type="date"
                            value={form.date}
                            onChange={set("date")}
                            style={{ width: "100%" }}
                        />
                    </div>
                    <div>
                        <label style={{ display: "block", marginBottom: "0.3rem", fontWeight: 600 }}>Estado</label>
                        <select value={form.status} onChange={set("status")} style={{ width: "100%" }}>
                            <option value="planning">Planificando</option>
                            <option value="active">En curso</option>
                            <option value="completed">Completada</option>
                        </select>
                    </div>
                    <div style={{ gridColumn: "1 / -1" }}>
                        <label style={{ display: "block", marginBottom: "0.3rem", fontWeight: 600 }}>Descripción</label>
                        <textarea
                            value={form.description}
                            onChange={set("description")}
                            rows={2}
                            placeholder="Breve resumen de la sesión..."
                            style={{ width: "100%", resize: "vertical" }}
                        />
                    </div>
                    <div style={{ gridColumn: "1 / -1" }}>
                        <label style={{ display: "block", marginBottom: "0.3rem", fontWeight: 600 }}>Notas del DM (privadas)</label>
                        <textarea
                            value={form.notes}
                            onChange={set("notes")}
                            rows={3}
                            placeholder="Notas internas para el DM..."
                            style={{ width: "100%", resize: "vertical" }}
                        />
                    </div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? "Guardando…" : editingId ? "Guardar cambios" : "Crear sesión"}
                    </button>
                    <button type="button" className="btn" onClick={onCancel}>Cancelar</button>
                </div>
            </form>
        </div>
    );
}

function SessionDetail({ session, onClose, onParticipantChange, onError }) {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const searchTimer = useRef(null);

    useEffect(() => {
        if (!searchQuery.trim() || searchQuery.trim().length < 2) {
            setSearchResults([]);
            return;
        }
        clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(async () => {
            setSearching(true);
            try {
                const results = await charactersSearchApi.search(searchQuery.trim());
                setSearchResults(results);
            } catch (err) {
                onError(err.message);
            } finally {
                setSearching(false);
            }
        }, 350);
        return () => clearTimeout(searchTimer.current);
    }, [searchQuery]);

    const addParticipant = async (character) => {
        try {
            await sessionsApi.addParticipant(session._id, character._id);
            setSearchQuery("");
            setSearchResults([]);
            await onParticipantChange();
        } catch (err) {
            onError(err.message);
        }
    };

    const removeParticipant = async (characterId) => {
        if (!confirm("¿Quitar este personaje de la sesión?")) return;
        try {
            await sessionsApi.removeParticipant(session._id, characterId);
            await onParticipantChange();
        } catch (err) {
            onError(err.message);
        }
    };

    const participantIds = new Set(session.participants?.map(p => p.character?._id || p.character));

    return (
        <div className="scroll-card" style={{ padding: "1.5rem", position: "sticky", top: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h2 style={{ margin: 0, fontSize: "1.2rem" }}>{session.name}</h2>
                <button className="btn btn-small" onClick={onClose}>✕ Cerrar</button>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.8rem", color: STATUS_COLOR[session.status] }}>
                    ● {STATUS_LABEL[session.status]}
                </span>
                {session.date && (
                    <span style={{ fontSize: "0.8rem", color: "var(--ink-faded)" }}>
                        {new Date(session.date).toLocaleDateString("es-ES")}
                    </span>
                )}
            </div>

            {session.description && (
                <p style={{ color: "var(--ink-faded)", fontSize: "0.9rem", marginBottom: "1rem" }}>
                    {session.description}
                </p>
            )}

            {session.notes && (
                <div style={{ background: "rgba(0,0,0,0.05)", borderLeft: "3px solid var(--gold)", padding: "0.75rem 1rem", marginBottom: "1.25rem", borderRadius: "0 4px 4px 0" }}>
                    <strong style={{ fontSize: "0.8rem", color: "var(--ink-faded)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Notas del DM</strong>
                    <p style={{ margin: "0.3rem 0 0", fontSize: "0.9rem", whiteSpace: "pre-wrap" }}>{session.notes}</p>
                </div>
            )}

            <h3 style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>
                Participantes ({session.participants?.length || 0})
            </h3>

            {session.participants?.length > 0 && (
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1rem" }}>
                    {session.participants.map((p) => {
                        const char = p.character;
                        const charId = char?._id || p.characterName;
                        return (
                            <li key={charId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0", borderBottom: "1px solid var(--parchment-shadow)" }}>
                                <div>
                                    <strong style={{ fontSize: "0.9rem" }}>
                                        {char?.name || p.characterName}
                                    </strong>
                                    {char && (
                                        <span style={{ fontSize: "0.8rem", color: "var(--ink-faded)", marginLeft: "0.5rem" }}>
                                            {char.charClass} nv.{char.level}
                                        </span>
                                    )}
                                    {char?.user?.username && (
                                        <span style={{ fontSize: "0.75rem", color: "var(--ink-faded)", marginLeft: "0.4rem" }}>
                                            — {char.user.username}
                                        </span>
                                    )}
                                </div>
                                <button
                                    className="btn btn-small"
                                    style={{ color: "var(--blood)", flexShrink: 0 }}
                                    onClick={() => removeParticipant(char?._id)}
                                >
                                    Quitar
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}

            <div>
                <label style={{ display: "block", marginBottom: "0.4rem", fontWeight: 600, fontSize: "0.9rem" }}>
                    Añadir personaje (buscar por nombre)
                </label>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Nombre del personaje…"
                    style={{ width: "100%" }}
                />

                {searching && <p style={{ fontSize: "0.8rem", color: "var(--ink-faded)", marginTop: "0.4rem" }}>Buscando…</p>}

                {searchResults.length > 0 && (
                    <ul style={{ listStyle: "none", padding: 0, margin: "0.5rem 0 0", border: "1px solid var(--parchment-shadow)", borderRadius: "4px", overflow: "hidden" }}>
                        {searchResults.map(char => {
                            const alreadyIn = participantIds.has(char._id);
                            return (
                                <li
                                    key={char._id}
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        padding: "0.5rem 0.75rem",
                                        borderBottom: "1px solid var(--parchment-shadow)",
                                        background: alreadyIn ? "rgba(0,0,0,0.04)" : undefined
                                    }}
                                >
                                    <div>
                                        <strong style={{ fontSize: "0.9rem" }}>{char.name}</strong>
                                        <span style={{ fontSize: "0.8rem", color: "var(--ink-faded)", marginLeft: "0.5rem" }}>
                                            {char.charClass} nv.{char.level}
                                        </span>
                                        {char.user?.username && (
                                            <span style={{ fontSize: "0.75rem", color: "var(--ink-faded)", marginLeft: "0.4rem" }}>
                                                — {char.user.username}
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        className="btn btn-small btn-gold"
                                        disabled={alreadyIn}
                                        onClick={() => addParticipant(char)}
                                    >
                                        {alreadyIn ? "Ya está" : "Añadir"}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}

                {searchQuery.trim().length >= 2 && !searching && searchResults.length === 0 && (
                    <p style={{ fontSize: "0.8rem", color: "var(--ink-faded)", marginTop: "0.4rem" }}>
                        No se encontraron personajes con ese nombre.
                    </p>
                )}
            </div>
        </div>
    );
}
