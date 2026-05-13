import { useState } from "react";

/**
 * Pestaña DIARIO del personaje.
 *
 * Props:
 *   character     -> el personaje completo (usamos character.diary)
 *   onAddEntry    -> (data)            : crea una entrada
 *   onUpdateEntry -> (entryId, data)   : actualiza una entrada
 *   onRemoveEntry -> (entryId)         : borra una entrada
 *
 * Las tres funciones reciben el personaje ya actualizado desde el padre
 * (CharacterDetailPage) que se encarga de aplicarlo al estado.
 */
export default function DiarySection({ character, onAddEntry, onUpdateEntry, onRemoveEntry }) {
    const entries = character.diary || [];

    // Orden: más reciente arriba. Usamos `date`; si falta, caemos a createdAt.
    const sortedEntries = [...entries].sort((a, b) => {
        const dateA = new Date(a.date || a.createdAt || 0);
        const dateB = new Date(b.date || b.createdAt || 0);
        return dateB - dateA;
    });

    const [showForm, setShowForm] = useState(false);
    const [draft, setDraft] = useState({ title: "", date: today(), content: "" });
    const [expanded, setExpanded] = useState(null);    // id de entrada expandida
    const [editingId, setEditingId] = useState(null);  // id en modo edición
    const [editDraft, setEditDraft] = useState(null);

    const resetForm = () => {
        setDraft({ title: "", date: today(), content: "" });
        setShowForm(false);
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!draft.content.trim()) return;
        try {
            await onAddEntry({
                title: draft.title.trim(),
                date: draft.date,
                content: draft.content
            });
            resetForm();
        } catch (err) {
            // El padre ya muestra el error via toast/alert; aquí no rehacemos.
        }
    };

    const startEdit = (entry) => {
        setEditingId(entry._id);
        setEditDraft({
            title: entry.title || "",
            // Convertimos la fecha ISO a yyyy-mm-dd para el input type="date"
            date: toInputDate(entry.date || entry.createdAt),
            content: entry.content || ""
        });
        setExpanded(entry._id);  // forzamos expandida mientras se edita
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditDraft(null);
    };

    const saveEdit = async (entryId) => {
        if (!editDraft.content.trim()) return;
        try {
            await onUpdateEntry(entryId, {
                title: editDraft.title.trim(),
                date: editDraft.date,
                content: editDraft.content
            });
            cancelEdit();
        } catch (err) {
            // gestionado en el padre
        }
    };

    const handleDelete = async (entryId) => {
        if (!confirm("¿Eliminar esta entrada del diario? Esta acción no se puede deshacer.")) return;
        try {
            await onRemoveEntry(entryId);
            if (expanded === entryId) setExpanded(null);
        } catch (err) {
            // gestionado en el padre
        }
    };

    return (
        <div className="scroll-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.6rem" }}>
                <div>
                    <h2 style={{ margin: 0 }}>📖 Diario de aventuras</h2>
                    <p style={{ margin: "0.2rem 0 0", color: "var(--ink-faded)", fontSize: "0.85rem" }}>
                        {entries.length === 0
                            ? "Aún no hay entradas en tu diario."
                            : `${entries.length} entrada${entries.length === 1 ? "" : "s"} registrada${entries.length === 1 ? "" : "s"}.`}
                    </p>
                </div>
                {!showForm && (
                    <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                        + Nueva entrada
                    </button>
                )}
            </div>

            {/* Formulario de creación */}
            {showForm && (
                <form
                    onSubmit={handleCreate}
                    style={{
                        marginBottom: "1.5rem",
                        padding: "1rem",
                        background: "rgba(184, 134, 11, 0.05)",
                        borderRadius: "4px",
                        border: "1px dashed var(--gold, #b8860b)"
                    }}
                >
                    <div className="grid grid-2">
                        <div className="field">
                            <label>Título (opcional)</label>
                            <input
                                value={draft.title}
                                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                                placeholder="Sesión 3 — La cueva del basilisco"
                            />
                        </div>
                        <div className="field">
                            <label>Fecha</label>
                            <input
                                type="date"
                                value={draft.date}
                                onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="field">
                        <label>Contenido</label>
                        <textarea
                            rows="8"
                            value={draft.content}
                            onChange={(e) => setDraft({ ...draft, content: e.target.value })}
                            placeholder="Escribe aquí lo que ocurrió, tus impresiones, decisiones del personaje..."
                            required
                        />
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button type="submit" className="btn btn-primary" disabled={!draft.content.trim()}>
                            Guardar entrada
                        </button>
                        <button type="button" className="btn" onClick={resetForm}>
                            Cancelar
                        </button>
                    </div>
                </form>
            )}

            {/* Lista de entradas */}
            {sortedEntries.length === 0 && !showForm ? (
                <div className="empty">
                    Tu diario está vacío. Pulsa "+ Nueva entrada" para escribir la primera página.
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                    {sortedEntries.map(entry => {
                        const isExpanded = expanded === entry._id;
                        const isEditing = editingId === entry._id;

                        return (
                            <div
                                key={entry._id}
                                style={{
                                    border: "1px solid var(--parchment-shadow, #c4a878)",
                                    borderRadius: "4px",
                                    background: "rgba(255, 255, 255, 0.2)",
                                    overflow: "hidden",
                                    transition: "border-color 0.15s"
                                }}
                            >
                                {/* Cabecera clicable */}
                                <div
                                    onClick={() => !isEditing && setExpanded(isExpanded ? null : entry._id)}
                                    style={{
                                        padding: "0.8rem 1rem",
                                        cursor: isEditing ? "default" : "pointer",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        gap: "1rem"
                                    }}
                                >
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontFamily: "Cinzel, serif", fontSize: "1rem", color: "var(--ink, #3d2817)" }}>
                                            {entry.title || <em style={{ color: "var(--ink-faded)" }}>Sin título</em>}
                                        </div>
                                        <div style={{ fontSize: "0.8rem", color: "var(--ink-faded)" }}>
                                            {formatDate(entry.date || entry.createdAt)}
                                        </div>
                                    </div>
                                    {!isEditing && (
                                        <span style={{ fontSize: "1.2rem", color: "var(--ink-faded)", flexShrink: 0 }}>
                                            {isExpanded ? "▾" : "▸"}
                                        </span>
                                    )}
                                </div>

                                {/* Contenido expandido */}
                                {isExpanded && !isEditing && (
                                    <div style={{ padding: "0 1rem 1rem", borderTop: "1px dashed var(--parchment-shadow)" }}>
                                        <div style={{
                                            whiteSpace: "pre-wrap",
                                            lineHeight: 1.6,
                                            padding: "0.8rem 0",
                                            fontSize: "0.95rem"
                                        }}>
                                            {entry.content}
                                        </div>
                                        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                                            <button className="btn btn-small" onClick={() => startEdit(entry)}>
                                                Editar
                                            </button>
                                            <button
                                                className="btn btn-small btn-danger"
                                                onClick={() => handleDelete(entry._id)}
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Modo edición */}
                                {isEditing && editDraft && (
                                    <div style={{
                                        padding: "0.8rem 1rem 1rem",
                                        borderTop: "1px dashed var(--parchment-shadow)",
                                        background: "rgba(184, 134, 11, 0.04)"
                                    }}>
                                        <form onSubmit={(e) => { e.preventDefault(); saveEdit(entry._id); }}>
                                            <div className="grid grid-2">
                                                <div className="field">
                                                    <label>Título</label>
                                                    <input
                                                        value={editDraft.title}
                                                        onChange={(e) => setEditDraft({ ...editDraft, title: e.target.value })}
                                                    />
                                                </div>
                                                <div className="field">
                                                    <label>Fecha</label>
                                                    <input
                                                        type="date"
                                                        value={editDraft.date}
                                                        onChange={(e) => setEditDraft({ ...editDraft, date: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="field">
                                                <label>Contenido</label>
                                                <textarea
                                                    rows="8"
                                                    value={editDraft.content}
                                                    onChange={(e) => setEditDraft({ ...editDraft, content: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div style={{ display: "flex", gap: "0.5rem" }}>
                                                <button
                                                    type="submit"
                                                    className="btn btn-primary btn-small"
                                                    disabled={!editDraft.content.trim()}
                                                >
                                                    Guardar
                                                </button>
                                                <button type="button" className="btn btn-small" onClick={cancelEdit}>
                                                    Cancelar
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

/* ─── Helpers de fecha ─── */

// Devuelve hoy en formato yyyy-mm-dd (válido para <input type="date">).
function today() {
    const d = new Date();
    return toInputDate(d);
}

// Convierte cualquier Date o ISO string a yyyy-mm-dd.
function toInputDate(value) {
    if (!value) return today();
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return today();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

// Formato bonito para mostrar (ej. "12 de mayo de 2026")
function formatDate(value) {
    if (!value) return "Sin fecha";
    const d = new Date(value);
    if (isNaN(d.getTime())) return "Sin fecha";
    return d.toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}