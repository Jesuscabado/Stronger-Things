import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { charactersApi } from "../api/characters.js";
import { campaignsApi } from "../api/campaigns.js";
import { useAuth } from "../context/AuthContext.jsx";
import { translateClass } from "../utils/dndLabels.js";

// ─── Iconos ───────────────────────────────────────────────────────────────────

const IconEdit = ({ size = 13 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M11.5 2.5a1.414 1.414 0 0 1 2 2L5 13H3v-2L11.5 2.5z" />
    </svg>
);

// ─── Utilidades ───────────────────────────────────────────────────────────────

function formatDate(value) {
    if (!value) return "Sin fecha";
    const d = new Date(value);
    if (isNaN(d.getTime())) return "Sin fecha";
    return d.toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" });
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function DiaryPage() {
    const { user } = useAuth();
    const isDM = user?.isDM === true;

    const [tab, setTab] = useState(isDM ? "dm" : "heroes");

    return (
        <div className="container">
            <div style={{ marginBottom: "1.5rem" }}>
                <h1>📔 Crónicas</h1>
                <p style={{ color: "var(--ink-faded)", margin: 0 }}>
                    {isDM
                        ? "Diario de aventureros y registro de tus campañas."
                        : "Diario combinado de todos tus héroes en modo lectura."}
                </p>
            </div>

            {isDM && (
                <div style={{ display: "flex", gap: "0.3rem", borderBottom: "2px solid var(--parchment-shadow)", marginBottom: "1.25rem" }}>
                    {[["dm", "Director de Juego"], ["heroes", "Aventureros"]].map(([id, label]) => (
                        <button
                            key={id}
                            className="btn btn-small"
                            style={{
                                borderRadius: "4px 4px 0 0",
                                borderBottom: "none",
                                opacity: tab === id ? 1 : 0.55,
                                fontWeight: tab === id ? 700 : 400,
                                background: tab === id ? "var(--parchment-shadow)" : undefined
                            }}
                            onClick={() => setTab(id)}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            )}

            {tab === "dm"     && <DMChronicles />}
            {tab === "heroes" && <HeroesChronicles />}
        </div>
    );
}

// ─── Crónicas DM ──────────────────────────────────────────────────────────────

function DMChronicles() {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState("");
    const [success, setSuccess]     = useState("");
    const [search, setSearch]       = useState("");
    const [campaignFilter, setCampaignFilter] = useState("all");
    const [expandedEntry, setExpandedEntry]   = useState(null);

    const load = () => {
        setLoading(true);
        campaignsApi.list()
            .then(setCampaigns)
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    const flash = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(""), 2500); };

    const norm = search.trim().toLowerCase();

    // Estructura agrupada: todas las sesiones visibles + entradas filtradas por búsqueda
    const grouped = useMemo(() => {
        return campaigns
            .filter(c => campaignFilter === "all" || c._id === campaignFilter)
            .map(c => {
                const sessions = [...(c.sessions || [])]
                    .sort((a, b) => {
                        if (a.date && b.date) return new Date(a.date) - new Date(b.date);
                        return new Date(a.createdAt) - new Date(b.createdAt);
                    })
                    .map(s => {
                        const diaryEntries = (s.log || []).filter(e => {
                            if (e.kind !== "diary") return false;
                            if (!norm) return true;
                            return (e.content || "").toLowerCase().includes(norm)
                                || s.title.toLowerCase().includes(norm)
                                || c.name.toLowerCase().includes(norm);
                        });
                        return { ...s, _diaryEntries: diaryEntries };
                    })
                    // Con búsqueda: mostrar solo sesiones con entradas o título coincidente
                    // Sin búsqueda: mostrar todas las sesiones
                    .filter(s => !norm || s._diaryEntries.length > 0 || s.title.toLowerCase().includes(norm));

                const notesVisible = !norm
                    || c.name.toLowerCase().includes(norm)
                    || (c.notes || "").toLowerCase().includes(norm);

                return { ...c, _filteredSessions: sessions, _notesVisible: notesVisible };
            })
            // Mostrar campañas con sesiones, notas coincidentes, o sin búsqueda activa
            .filter(c => c._filteredSessions.length > 0 || (c._notesVisible && c.notes?.trim()));
    }, [campaigns, campaignFilter, norm]);

    if (loading) return <div className="loading">Consultando los tomos del DM…</div>;
    if (error)   return <div className="alert">{error}</div>;

    if (campaigns.length === 0) {
        return (
            <div className="empty">
                Aún no tienes campañas. <Link to="/campaigns">Crea una</Link> para empezar tu crónica.
            </div>
        );
    }

    return (
        <>
            {error   && <div className="alert" style={{ cursor: "pointer" }} onClick={() => setError("")}>{error}</div>}
            {success && <div className="alert alert-success" style={{ marginBottom: "1rem" }}>{success}</div>}

            {/* Filtros */}
            <form className="scroll-card" onSubmit={e => e.preventDefault()} style={{ padding: "1rem 1.5rem", marginBottom: "1.25rem" }}>
                <div className="grid grid-2" style={{ gap: "1rem", alignItems: "end" }}>
                    <div className="field" style={{ marginBottom: 0 }}>
                        <label>Buscar</label>
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Texto, sesión, campaña…" />
                    </div>
                    <div className="field" style={{ marginBottom: 0 }}>
                        <label>Campaña</label>
                        <select value={campaignFilter} onChange={e => setCampaignFilter(e.target.value)}>
                            <option value="all">Todas las campañas</option>
                            {campaigns.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>
                    </div>
                </div>
            </form>

            {grouped.length === 0 ? (
                <div className="empty">
                    {norm || campaignFilter !== "all"
                        ? "No hay entradas que coincidan."
                        : "Aún no hay diario ni notas en tus campañas."}
                </div>
            ) : (
                grouped.map(campaign => (
                    <div key={campaign._id} style={{ marginBottom: "2rem" }}>

                        {/* ── Cabecera de campaña ── */}
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.9rem" }}>
                            <h2 style={{ margin: 0, fontSize: "1.2rem" }}>{campaign.name}</h2>
                            <Link to="/campaigns" style={{ fontSize: "0.8rem", color: "var(--ink-faded)", borderBottom: "none" }}>
                                Ver campaña →
                            </Link>
                        </div>

                        {/* ── Sesiones con entradas de diario ── */}
                        {campaign._filteredSessions.length > 0 && (
                            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: campaign._showNotes ? "1rem" : 0 }}>
                                {campaign._filteredSessions.map((session, idx) => (
                                    <SessionBlock
                                        key={session._id}
                                        session={session}
                                        sessionNumber={idx + 1}
                                        campaignId={campaign._id}
                                        expandedEntry={expandedEntry}
                                        onToggleEntry={id => setExpandedEntry(expandedEntry === id ? null : id)}
                                        onSaved={() => { flash("Entrada actualizada"); load(); }}
                                        onError={setError}
                                    />
                                ))}
                            </div>
                        )}

                        {/* ── Notas de campaña (siempre visible) ── */}
                        <CampaignNotesBlock
                            campaign={campaign}
                            onSaved={() => { flash("Notas guardadas"); load(); }}
                            onError={setError}
                        />
                    </div>
                ))
            )}
        </>
    );
}

// ─── Bloque de una sesión con sus entradas de diario ─────────────────────────

function SessionBlock({ session, sessionNumber, campaignId, expandedEntry, onToggleEntry, onSaved, onError }) {
    const entries = session._diaryEntries;
    const [editingId, setEditingId] = useState(null);
    const [draft, setDraft]         = useState("");
    const [saving, setSaving]       = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newContent, setNewContent]   = useState("");
    const [adding, setAdding]           = useState(false);

    const startEdit = (entry, e) => {
        e.stopPropagation();
        setEditingId(entry._id);
        setDraft(entry.content || "");
    };

    const saveEdit = async (entryId) => {
        setSaving(true);
        try {
            await campaignsApi.updateLogEntry(campaignId, session._id, entryId, { content: draft });
            setEditingId(null);
            onSaved();
        } catch (err) {
            onError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const cancelEdit = (e) => {
        e?.stopPropagation();
        setEditingId(null);
        setDraft("");
    };

    const addEntry = async () => {
        if (!newContent.trim()) return;
        setAdding(true);
        try {
            await campaignsApi.addLogEntry(campaignId, session._id, { kind: "diary", content: newContent });
            setNewContent("");
            setShowAddForm(false);
            onSaved();
        } catch (err) {
            onError(err.message);
        } finally {
            setAdding(false);
        }
    };

    return (
        <div className="scroll-card" style={{ padding: 0, overflow: "hidden" }}>
            {/* Cabecera de sesión */}
            <div style={{ padding: "0.7rem 1.1rem", background: "rgba(0,0,0,0.04)", borderBottom: "1px solid var(--parchment-shadow)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <span style={{ fontFamily: "Cinzel, serif", fontSize: "0.92rem", fontWeight: 700 }}>
                        Sesión {sessionNumber}: {session.title}
                    </span>
                    {session.date && (
                        <span style={{ marginLeft: "0.6rem", fontSize: "0.78rem", color: "var(--ink-faded)" }}>
                            {formatDate(session.date)}
                        </span>
                    )}
                </div>
                <span style={{ fontSize: "0.78rem", color: "var(--ink-faded)" }}>
                    {entries.length} entrada{entries.length !== 1 ? "s" : ""}
                </span>
            </div>

            {/* Entradas de diario */}
            <div style={{ display: "flex", flexDirection: "column" }}>
                {entries.length === 0 && !showAddForm && (
                    <p style={{ margin: 0, padding: "0.65rem 1.1rem", fontSize: "0.85rem", color: "var(--ink-faded)", fontStyle: "italic" }}>
                        Sin entradas de diario todavía.
                    </p>
                )}
                {entries.map((entry, i) => {
                    const isExpanded = expandedEntry === entry._id;
                    const isEditing  = editingId === entry._id;

                    return (
                        <div
                            key={entry._id}
                            style={{ borderBottom: i < entries.length - 1 ? "1px solid var(--parchment-shadow)" : "none", borderLeft: "3px solid var(--gold)" }}
                        >
                            {/* Cabecera de la entrada */}
                            <div
                                onClick={() => !isEditing && onToggleEntry(entry._id)}
                                style={{ padding: "0.65rem 1.1rem", cursor: isEditing ? "default" : "pointer", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}
                            >
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ margin: 0, fontSize: "0.9rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                        {entry.content
                                            ? entry.content.slice(0, 100) + (entry.content.length > 100 ? "…" : "")
                                            : <em style={{ color: "var(--ink-faded)" }}>Sin contenido</em>}
                                    </p>
                                    <span style={{ fontSize: "0.75rem", color: "var(--ink-faded)" }}>
                                        {formatDate(entry.createdAt)}
                                    </span>
                                </div>
                                <div style={{ display: "flex", gap: "0.3rem", alignItems: "center", flexShrink: 0 }}>
                                    {!isEditing && (
                                        <button
                                            className="btn btn-small"
                                            style={{ padding: "0.15rem 0.5rem" }}
                                            onClick={e => startEdit(entry, e)}
                                            title="Editar entrada"
                                        >
                                            <IconEdit />
                                        </button>
                                    )}
                                    {!isEditing && (
                                        <span style={{ fontSize: "1rem", color: "var(--ink-faded)" }}>
                                            {isExpanded ? "▾" : "▸"}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Modo edición */}
                            {isEditing && (
                                <div style={{ padding: "0 1.1rem 0.9rem", borderTop: "1px dashed var(--parchment-shadow)" }} onClick={e => e.stopPropagation()}>
                                    <textarea
                                        value={draft}
                                        onChange={e => setDraft(e.target.value)}
                                        rows={5}
                                        autoFocus
                                        style={{ width: "100%", resize: "vertical", marginBottom: "0.5rem" }}
                                    />
                                    <div style={{ display: "flex", gap: "0.4rem" }}>
                                        <button className="btn btn-small btn-primary" onClick={() => saveEdit(entry._id)} disabled={saving}>
                                            {saving ? "Guardando…" : "Guardar"}
                                        </button>
                                        <button className="btn btn-small" onClick={cancelEdit}>Cancelar</button>
                                    </div>
                                </div>
                            )}

                            {/* Contenido expandido (solo lectura) */}
                            {isExpanded && !isEditing && (
                                <div style={{ padding: "0 1.1rem 0.9rem", fontSize: "0.95rem", lineHeight: 1.7, whiteSpace: "pre-wrap", borderTop: "1px dashed var(--parchment-shadow)" }}>
                                    {entry.content}
                                </div>
                            )}
                        </div>
                    );
                })}
                {/* ── Formulario nueva entrada ── */}
                {showAddForm ? (
                    <div style={{ borderTop: "1px solid var(--parchment-shadow)", padding: "0.75rem 1.1rem", borderLeft: "3px solid var(--gold-bright)" }}>
                        <textarea
                            value={newContent}
                            onChange={e => setNewContent(e.target.value)}
                            rows={4}
                            autoFocus
                            placeholder="Narra lo que ha sucedido en la sesión…"
                            style={{ width: "100%", resize: "vertical", marginBottom: "0.5rem" }}
                            onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey) addEntry(); }}
                        />
                        <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                            <button className="btn btn-small btn-primary" onClick={addEntry} disabled={adding || !newContent.trim()}>
                                {adding ? "Guardando…" : "Añadir entrada"}
                            </button>
                            <button className="btn btn-small" onClick={() => { setShowAddForm(false); setNewContent(""); }}>Cancelar</button>
                            <span style={{ fontSize: "0.75rem", color: "var(--ink-faded)", marginLeft: "auto" }}>Ctrl+Enter para guardar</span>
                        </div>
                    </div>
                ) : (
                    <div style={{ borderTop: entries.length > 0 ? "1px solid var(--parchment-shadow)" : "none", padding: "0.5rem 1.1rem" }}>
                        <button
                            className="btn btn-small"
                            style={{ fontSize: "0.78rem" }}
                            onClick={() => setShowAddForm(true)}
                        >
                            ＋ Nueva entrada
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Bloque de notas de campaña (editable) ───────────────────────────────────

function CampaignNotesBlock({ campaign, onSaved, onError }) {
    const isEmpty = !campaign.notes?.trim();
    const [editing, setEditing] = useState(false);
    const [draft, setDraft]     = useState(campaign.notes || "");
    const [saving, setSaving]   = useState(false);

    // Sincronizar si la campaña se recarga desde fuera
    useEffect(() => {
        setDraft(campaign.notes || "");
        setEditing(false);
    }, [campaign._id, campaign.notes]);

    const save = async () => {
        setSaving(true);
        try {
            await campaignsApi.update(campaign._id, { notes: draft });
            setEditing(false);
            onSaved();
        } catch (err) {
            onError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="scroll-card" style={{ padding: "1rem 1.25rem", borderLeft: "4px solid var(--gold)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <p style={{ margin: 0, fontFamily: "Cinzel, serif", fontSize: "0.85rem", color: "var(--ink-faded)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    📝 Notas del DM
                </p>
                {!editing && (
                    <button className="btn btn-small" style={{ padding: "0.15rem 0.5rem" }} onClick={() => setEditing(true)} title="Editar notas">
                        <IconEdit />
                    </button>
                )}
            </div>

            {editing ? (
                <>
                    <textarea
                        value={draft}
                        onChange={e => setDraft(e.target.value)}
                        rows={6}
                        autoFocus
                        placeholder="Notas privadas del DM: tramas, secretos, preparación…"
                        style={{ width: "100%", resize: "vertical", marginBottom: "0.5rem" }}
                    />
                    <div style={{ display: "flex", gap: "0.4rem" }}>
                        <button className="btn btn-small btn-primary" onClick={save} disabled={saving}>
                            {saving ? "Guardando…" : "Guardar"}
                        </button>
                        <button className="btn btn-small" onClick={() => { setEditing(false); setDraft(campaign.notes || ""); }}>
                            Cancelar
                        </button>
                    </div>
                </>
            ) : isEmpty ? (
                <button className="btn btn-small" style={{ fontSize: "0.78rem" }} onClick={() => setEditing(true)}>
                    ＋ Añadir notas
                </button>
            ) : (
                <div style={{ whiteSpace: "pre-wrap", fontSize: "0.95rem", lineHeight: 1.7 }}>
                    {campaign.notes}
                </div>
            )}
        </div>
    );
}


// ─── Crónicas de aventureros (existente) ─────────────────────────────────────

function HeroesChronicles() {
    const [characters, setCharacters] = useState([]);
    const [loading, setLoading]       = useState(true);
    const [error, setError]           = useState("");
    const [characterFilter, setCharacterFilter] = useState("all");
    const [search, setSearch]         = useState("");
    const [expanded, setExpanded]     = useState(null);

    useEffect(() => {
        let cancelled = false;
        charactersApi.list()
            .then(data => { if (!cancelled) setCharacters(data); })
            .catch(err  => { if (!cancelled) setError(err.message); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, []);

    const allEntries = useMemo(() => {
        const flat = [];
        for (const c of characters) {
            for (const e of (c.diary || [])) {
                flat.push({
                    ...e,
                    _characterId:    c._id,
                    _characterName:  c.name,
                    _characterClass: c.charClass,
                    _characterLevel: c.level,
                    _characterAvatar: c.avatar?.cloudinaryUrl || null
                });
            }
        }
        flat.sort((a, b) => {
            const da = new Date(a.date || a.createdAt || 0);
            const db = new Date(b.date || b.createdAt || 0);
            return db - da;
        });
        return flat;
    }, [characters]);

    const norm = search.trim().toLowerCase();
    const filtered = allEntries.filter(e => {
        const matchCharacter = characterFilter === "all" || e._characterId === characterFilter;
        const matchSearch    = !norm
            || (e.title   || "").toLowerCase().includes(norm)
            || (e.content || "").toLowerCase().includes(norm);
        return matchCharacter && matchSearch;
    });

    if (loading) return <div className="loading">Recopilando crónicas…</div>;
    if (error)   return <div className="alert">{error}</div>;

    if (characters.length === 0) {
        return (
            <div className="empty">
                Aún no tienes héroes. <Link to="/characters">Crea uno</Link> para empezar a escribir tu diario.
            </div>
        );
    }

    return (
        <>
            <form className="scroll-card" onSubmit={e => e.preventDefault()} style={{ padding: "1rem 1.5rem", marginBottom: "1rem" }}>
                <div className="grid grid-2" style={{ gap: "1rem", alignItems: "end" }}>
                    <div className="field" style={{ marginBottom: 0 }}>
                        <label>Buscar en las entradas</label>
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Título o contenido…" />
                    </div>
                    <div className="field" style={{ marginBottom: 0 }}>
                        <label>Personaje</label>
                        <select value={characterFilter} onChange={e => setCharacterFilter(e.target.value)}>
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
                    {norm || characterFilter !== "all"
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
        </>
    );
}

// ─── Tarjeta entrada diario de personaje ─────────────────────────────────────

function DiaryEntryCard({ entry, expanded, onToggle }) {
    return (
        <div className="scroll-card" style={{ padding: 0, overflow: "hidden" }}>
            <div
                onClick={onToggle}
                style={{ padding: "0.9rem 1.2rem", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", flex: 1, minWidth: 0 }}>
                    {entry._characterAvatar ? (
                        <img
                            src={entry._characterAvatar}
                            alt={entry._characterName}
                            style={{ width: "44px", height: "44px", borderRadius: "50%", objectFit: "cover", border: "2px solid var(--gold)", flexShrink: 0 }}
                        />
                    ) : (
                        <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "var(--parchment)", border: "2px dashed var(--parchment-shadow)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", flexShrink: 0 }}>
                            🧙
                        </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "Cinzel, serif", fontSize: "1rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {entry.title || <em style={{ color: "var(--ink-faded)" }}>Sin título</em>}
                        </div>
                        <div style={{ fontSize: "0.8rem", color: "var(--ink-faded)", display: "flex", flexWrap: "wrap", gap: "0.4rem", alignItems: "center" }}>
                            <Link to={`/characters/${entry._characterId}`} onClick={e => e.stopPropagation()} style={{ borderBottom: "none" }}>
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
                <div style={{ padding: "0 1.2rem 1rem", borderTop: "1px dashed var(--parchment-shadow)" }}>
                    <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6, padding: "0.8rem 0", fontSize: "0.95rem" }}>
                        {entry.content}
                    </div>
                    <Link to={`/characters/${entry._characterId}`} className="btn btn-small" style={{ borderBottom: "none" }}>
                        Ir a {entry._characterName} →
                    </Link>
                </div>
            )}
        </div>
    );
}
