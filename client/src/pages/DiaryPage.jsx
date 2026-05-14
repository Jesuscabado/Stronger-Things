import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { charactersApi } from "../api/characters.js";
import { translateClass } from "../utils/dndLabels.js";

/**
 * Página /diary
 *
 * Vista global del diario del usuario: lista cronológica de TODAS las
 * entradas de TODOS sus personajes, en modo solo lectura.
 *
 * Para crear/editar/borrar entradas, el jugador va a la pestaña "Diario"
 * dentro de cada personaje. Aquí solo se consulta.
 *
 * Implementación: reutilizamos GET /api/characters, que ya devuelve los
 * personajes del usuario con su array `diary` incluido. Aplanamos en
 * cliente y filtramos.
 */
export default function DiaryPage() {
    const [characters, setCharacters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Filtros
    const [characterFilter, setCharacterFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [expanded, setExpanded] = useState(null);  // id de entrada expandida

    useEffect(() => {
        let cancelled = false;
        charactersApi.list()
            .then(data => { if (!cancelled) setCharacters(data); })
            .catch(err => { if (!cancelled) setError(err.message); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, []);

    /**
     * Aplanado: para cada personaje, expandimos sus entradas a un objeto
     * con metadata del personaje. useMemo porque el aplanado y ordenación
     * se ejecutan en cada render — y aquí no son triviales si el usuario
     * tiene muchos personajes.
     */
    const allEntries = useMemo(() => {
        const flat = [];
        for (const c of characters) {
            for (const e of (c.diary || [])) {
                flat.push({
                    ...e,
                    _characterId: c._id,
                    _characterName: c.name,
                    _characterClass: c.charClass,
                    _characterLevel: c.level,
                    _characterAvatar: c.avatar?.cloudinaryUrl || null
                });
            }
        }
        // Orden: más reciente arriba. date > createdAt como fallback.
        flat.sort((a, b) => {
            const da = new Date(a.date || a.createdAt || 0);
            const db = new Date(b.date || b.createdAt || 0);
            return db - da;
        });
        return flat;
    }, [characters]);

    // Aplicar filtro de personaje + búsqueda de texto
    const normalizedSearch = search.trim().toLowerCase();
    const filtered = allEntries.filter(e => {
        const matchCharacter = characterFilter === "all" || e._characterId === characterFilter;
        const matchSearch = !normalizedSearch
            || (e.title || "").toLowerCase().includes(normalizedSearch)
            || (e.content || "").toLowerCase().includes(normalizedSearch);
        return matchCharacter && matchSearch;
    });

    /* ─── Render ─── */

    if (loading) return <div className="loading">Recopilando crónicas...</div>;

    if (error) {
        return (
            <div className="container">
                <div className="alert">{error}</div>
            </div>
        );
    }

    // Edge case: el usuario no tiene personajes todavía
    if (characters.length === 0) {
        return (
            <div className="container">
                <h1>📔 Crónicas</h1>
                <div className="empty">
                    Aún no tienes héroes. <Link to="/characters">Crea uno</Link> para empezar a escribir tu diario.
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <div style={{ marginBottom: "1.5rem" }}>
                <h1>📔 Crónicas</h1>
                <p style={{ color: "var(--ink-faded)", margin: 0 }}>
                    Diario combinado de todos tus héroes en modo lectura.
                    Para escribir nuevas entradas, ve a la pestaña Diario de cada personaje.
                </p>
            </div>

            {/* Barra de filtros */}
            <form
                className="scroll-card"
                onSubmit={(e) => e.preventDefault()}
                style={{ padding: "1rem 1.5rem", marginBottom: "1rem" }}
            >
                <div className="grid grid-2" style={{ gap: "1rem", alignItems: "end" }}>
                    <div className="field" style={{ marginBottom: 0 }}>
                        <label>Buscar en las entradas</label>
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Título o contenido..."
                        />
                    </div>
                    <div className="field" style={{ marginBottom: 0 }}>
                        <label>Personaje</label>
                        <select
                            value={characterFilter}
                            onChange={(e) => setCharacterFilter(e.target.value)}
                        >
                            <option value="all">Todos los héroes</option>
                            {characters.map(c => (
                                <option key={c._id} value={c._id}>
                                    {c.name} — {translateClass(c.charClass)} {c.level}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </form>

            {filtered.length === 0 ? (
                <div className="empty">
                    {normalizedSearch || characterFilter !== "all"
                        ? "No hay entradas que coincidan con tu búsqueda."
                        : "Tus crónicas están en blanco. Ve a la pestaña Diario de un personaje para escribir la primera entrada."}
                </div>
            ) : (
                <>
                    <p style={{ color: "var(--ink-faded)", fontSize: "0.9rem", margin: "0 0 1rem" }}>
                        Mostrando {filtered.length} de {allEntries.length} entrada{allEntries.length === 1 ? "" : "s"}
                    </p>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                        {filtered.map(entry => (
                            <DiaryEntryCard
                                key={entry._id}
                                entry={entry}
                                expanded={expanded === entry._id}
                                onToggle={() => setExpanded(expanded === entry._id ? null : entry._id)}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

/**
 * Tarjeta de una entrada del diario en la vista global. Solo lectura.
 * Click sobre la cabecera para expandir el contenido completo.
 */
function DiaryEntryCard({ entry, expanded, onToggle }) {
    return (
        <div
            className="scroll-card"
            style={{ padding: 0, overflow: "hidden" }}
        >
            <div
                onClick={onToggle}
                style={{
                    padding: "0.9rem 1.2rem",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "1rem"
                }}
            >
                {/* Avatar mini + información del personaje */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", flex: 1, minWidth: 0 }}>
                    {entry._characterAvatar ? (
                        <img
                            src={entry._characterAvatar}
                            alt={entry._characterName}
                            style={{
                                width: "44px",
                                height: "44px",
                                borderRadius: "50%",
                                objectFit: "cover",
                                border: "2px solid var(--gold)",
                                flexShrink: 0
                            }}
                        />
                    ) : (
                        <div style={{
                            width: "44px",
                            height: "44px",
                            borderRadius: "50%",
                            background: "var(--parchment)",
                            border: "2px dashed var(--parchment-shadow)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "1.2rem",
                            flexShrink: 0
                        }}>
                            🧙
                        </div>
                    )}

                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                            fontFamily: "Cinzel, serif",
                            fontSize: "1rem",
                            color: "var(--ink, #3d2817)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap"
                        }}>
                            {entry.title || <em style={{ color: "var(--ink-faded)" }}>Sin título</em>}
                        </div>
                        <div style={{ fontSize: "0.8rem", color: "var(--ink-faded)", display: "flex", flexWrap: "wrap", gap: "0.4rem", alignItems: "center" }}>
                            <Link
                                to={`/characters/${entry._characterId}`}
                                onClick={(e) => e.stopPropagation()}
                                style={{ borderBottom: "none" }}
                            >
                                {entry._characterName}
                            </Link>
                            <span>·</span>
                            <span>{formatDate(entry.date || entry.createdAt)}</span>
                        </div>
                    </div>
                </div>

                <span style={{ fontSize: "1.2rem", color: "var(--ink-faded)", flexShrink: 0 }}>
                    {expanded ? "▾" : "▸"}
                </span>
            </div>

            {expanded && (
                <div style={{
                    padding: "0 1.2rem 1rem",
                    borderTop: "1px dashed var(--parchment-shadow)"
                }}>
                    <div style={{
                        whiteSpace: "pre-wrap",
                        lineHeight: 1.6,
                        padding: "0.8rem 0",
                        fontSize: "0.95rem"
                    }}>
                        {entry.content}
                    </div>
                    <div style={{ marginTop: "0.4rem" }}>
                        <Link
                            to={`/characters/${entry._characterId}`}
                            className="btn btn-small"
                            style={{ borderBottom: "none" }}
                        >
                            Ir a {entry._characterName} →
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}

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
