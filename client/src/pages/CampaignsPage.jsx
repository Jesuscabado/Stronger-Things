import { useEffect, useRef, useState } from "react";
import { campaignsApi, charactersSearchApi } from "../api/campaigns.js";
import { monstersApi } from "../api/monsters.js";
import { useAuth } from "../context/AuthContext.jsx";
import { campaignColor, monsterTypeColor } from "../utils/dndColors.js";

// ─── Iconos SVG ──────────────────────────────────────────────────────────────

const IconEdit = ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M11.5 2.5a1.414 1.414 0 0 1 2 2L5 13H3v-2L11.5 2.5z" />
    </svg>
);

// ─── Constantes ───────────────────────────────────────────────────────────────

const STATUS_LABEL = { planning: "Planificando", active: "En curso", paused: "En pausa", completed: "Completada" };
const STATUS_COLOR = { planning: "var(--ink-faded)", active: "var(--gold-bright)", paused: "var(--parchment-shadow)", completed: "var(--blood)" };

const LOG_KIND_LABEL = { diary: "Diario", note: "Nota", encounter: "Encuentro" };
const LOG_KIND_ICON  = { diary: "📖", note: "📝", encounter: "⚔️" };

// ─── Página raíz ─────────────────────────────────────────────────────────────

export default function CampaignsPage() {
    const { user } = useAuth();
    if (!user?.isDM) return <NoDMAccess />;
    return <Campaigns />;
}

function NoDMAccess() {
    return (
        <div className="container">
            <div className="scroll-card" style={{ textAlign: "center", padding: "3rem 2rem" }}>
                <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🔒</div>
                <h1>Acceso restringido</h1>
                <p style={{ color: "var(--ink-faded)", maxWidth: "480px", margin: "1rem auto" }}>
                    Las campañas están disponibles únicamente para los Directores de Juego.
                    Contacta con un administrador para que te asigne el rol DM.
                </p>
            </div>
        </div>
    );
}

// ─── Vista principal ──────────────────────────────────────────────────────────

function Campaigns() {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState("");
    const [success, setSuccess]     = useState("");

    // Navegación: campaña seleccionada → sesión seleccionada
    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [selectedSession,  setSelectedSession]  = useState(null);

    // Formulario campaña
    const [showCampaignForm, setShowCampaignForm] = useState(false);
    const [campaignForm, setCampaignForm]         = useState(emptyCampaignForm());
    const [editingCampaignId, setEditingCampaignId] = useState(null);

    const flash = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(""), 2500); };

    // ── Carga ────────────────────────────────────────────────────────────────

    const load = async () => {
        try {
            setLoading(true);
            setCampaigns(await campaignsApi.list());
        } catch (e) { setError(e.message); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const reloadCampaign = async (id) => {
        try {
            const updated = await campaignsApi.get(id);
            setCampaigns(prev => prev.map(c => c._id === id ? updated : c));
            setSelectedCampaign(updated);
            // Si hay sesión activa, refresca también
            if (selectedSession) {
                const sess = updated.sessions?.find(s => s._id === selectedSession._id);
                setSelectedSession(sess || null);
            }
        } catch (e) { setError(e.message); }
    };

    // ── Campañas CRUD ────────────────────────────────────────────────────────

    const openCreateCampaign = () => {
        setCampaignForm(emptyCampaignForm());
        setEditingCampaignId(null);
        setShowCampaignForm(true);
    };

    const openEditCampaign = (c) => {
        setCampaignForm({ name: c.name, description: c.description || "", status: c.status, notes: c.notes || "" });
        setEditingCampaignId(c._id);
        setShowCampaignForm(true);
    };

    const submitCampaign = async (e) => {
        e.preventDefault();
        try {
            if (editingCampaignId) {
                await campaignsApi.update(editingCampaignId, campaignForm);
                flash("Campaña actualizada");
                await reloadCampaign(editingCampaignId);
            } else {
                const created = await campaignsApi.create(campaignForm);
                flash("Campaña creada");
                setCampaigns(prev => [created, ...prev]);
            }
            setShowCampaignForm(false);
            setEditingCampaignId(null);
        } catch (e) { setError(e.message); }
    };

    const deleteCampaign = async (c) => {
        if (!confirm(`¿Eliminar la campaña "${c.name}" y todas sus sesiones?`)) return;
        try {
            await campaignsApi.remove(c._id);
            flash("Campaña eliminada");
            if (selectedCampaign?._id === c._id) { setSelectedCampaign(null); setSelectedSession(null); }
            load();
        } catch (e) { setError(e.message); }
    };

    const selectCampaign = async (c) => {
        if (selectedCampaign?._id === c._id) { setSelectedCampaign(null); setSelectedSession(null); return; }
        setSelectedSession(null);
        try {
            const full = await campaignsApi.get(c._id);
            setSelectedCampaign(full);
        } catch (e) { setError(e.message); }
    };

    // ── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="container">
            {/* Cabecera */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
                <h1 style={{ margin: 0 }}>Campañas</h1>
                <button className="btn btn-primary" onClick={openCreateCampaign}>+ Nueva campaña</button>
            </div>

            {error   && <div className="alert" style={{ cursor: "pointer" }} onClick={() => setError("")}>{error}</div>}
            {success && <div className="alert-success" style={{ marginBottom: "1rem", padding: "0.75rem 1rem", borderRadius: "4px" }}>{success}</div>}

            {showCampaignForm && (
                <CampaignForm
                    form={campaignForm}
                    setForm={setCampaignForm}
                    editingId={editingCampaignId}
                    onSubmit={submitCampaign}
                    onCancel={() => setShowCampaignForm(false)}
                />
            )}

            {loading ? (
                <p style={{ color: "var(--ink-faded)" }}>Cargando campañas…</p>
            ) : campaigns.length === 0 && !showCampaignForm ? (
                <div className="scroll-card" style={{ textAlign: "center", padding: "2rem" }}>
                    <p style={{ color: "var(--ink-faded)" }}>Aún no tienes campañas. ¡Crea la primera!</p>
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: selectedCampaign ? "300px 1fr" : "1fr", gap: "1.25rem", alignItems: "start" }}>

                    {/* Lista de campañas */}
                    {(() => {
                        // Índice de color basado en orden de creación (más antigua = 0)
                        const colorIdx = Object.fromEntries(
                            [...campaigns]
                                .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                                .map((c, i) => [c._id, i])
                        );
                        return (
                            <>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                                {campaigns.map(c => (
                                    <CampaignCard
                                        key={c._id}
                                        campaign={c}
                                        colorIndex={colorIdx[c._id]}
                                        isSelected={selectedCampaign?._id === c._id}
                                        onClick={() => selectCampaign(c)}
                                        onEdit={() => openEditCampaign(c)}
                                        onDelete={() => deleteCampaign(c)}
                                    />
                                ))}
                            </div>

                            {/* Panel derecho */}
                            {selectedCampaign && (
                                selectedSession ? (
                                    <SessionView
                                        campaign={selectedCampaign}
                                        colorIndex={colorIdx[selectedCampaign._id]}
                                        session={selectedSession}
                                        onBack={() => setSelectedSession(null)}
                                        onChanged={() => reloadCampaign(selectedCampaign._id)}
                                        onError={setError}
                                        onFlash={flash}
                                    />
                                ) : (
                                    <CampaignDetail
                                        campaign={selectedCampaign}
                                        colorIndex={colorIdx[selectedCampaign._id]}
                                        onClose={() => { setSelectedCampaign(null); setSelectedSession(null); }}
                                        onSelectSession={setSelectedSession}
                                        onChanged={() => reloadCampaign(selectedCampaign._id)}
                                        onError={setError}
                                        onFlash={flash}
                                    />
                                )
                            )}
                            </>
                        );
                    })()}
                </div>
            )}
        </div>
    );
}

// ─── Tarjeta de campaña ───────────────────────────────────────────────────────

function CampaignCard({ campaign, colorIndex, isSelected, onClick, onEdit, onDelete }) {
    const { color, bg } = campaignColor(colorIndex);
    return (
        <div
            className="scroll-card"
            style={{
                padding: "0.9rem 1.1rem",
                cursor: "pointer",
                borderLeft: `4px solid ${color}`,
                background: isSelected ? bg : undefined,
                boxShadow: isSelected ? `0 0 0 2px ${color}` : undefined
            }}
            onClick={onClick}
        >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                        <strong style={{ fontSize: "0.95rem", color }}>{campaign.name}</strong>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.2rem", flexWrap: "wrap" }}>
                        <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--ink-faded)" }}>
                            {campaign.sessions?.length || 0} sesión{campaign.sessions?.length !== 1 ? "es" : ""}
                            {" · "}
                            {campaign.participants?.length || 0} aventurero{campaign.participants?.length !== 1 ? "s" : ""}
                        </p>
                        <span style={{ fontSize: "0.72rem", color: STATUS_COLOR[campaign.status] }}>● {STATUS_LABEL[campaign.status]}</span>
                    </div>
                </div>
                <div style={{ display: "flex", gap: "0.3rem", flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                    <button className="btn btn-small" onClick={onEdit}><IconEdit /></button>
                    <button className="btn btn-small" style={{ color: "var(--blood)" }} onClick={onDelete}>✕</button>
                </div>
            </div>
        </div>
    );
}

// ─── Formulario de campaña ────────────────────────────────────────────────────

function CampaignForm({ form, setForm, editingId, onSubmit, onCancel }) {
    const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
    return (
        <div className="scroll-card" style={{ marginBottom: "1.25rem", padding: "1.4rem" }}>
            <h2 style={{ marginTop: 0 }}>{editingId ? "Editar campaña" : "Nueva campaña"}</h2>
            <form onSubmit={onSubmit}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.9rem" }}>
                    <div style={{ gridColumn: "1/-1" }}>
                        <label style={lbl}>Nombre *</label>
                        <input type="text" value={form.name} onChange={set("name")} required placeholder="La Maldición de Strahd…" style={{ width: "100%" }} />
                    </div>
                    <div>
                        <label style={lbl}>Estado</label>
                        <select value={form.status} onChange={set("status")} style={{ width: "100%" }}>
                            <option value="planning">Planificando</option>
                            <option value="active">En curso</option>
                            <option value="paused">En pausa</option>
                            <option value="completed">Completada</option>
                        </select>
                    </div>
                    <div>
                        <label style={lbl}>Descripción</label>
                        <input type="text" value={form.description} onChange={set("description")} placeholder="Breve resumen…" style={{ width: "100%" }} />
                    </div>
                    <div style={{ gridColumn: "1/-1" }}>
                        <label style={lbl}>Notas del DM (privadas)</label>
                        <textarea value={form.notes} onChange={set("notes")} rows={3} style={{ width: "100%", resize: "vertical" }} />
                    </div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                    <button type="submit" className="btn btn-primary">{editingId ? "Guardar" : "Crear campaña"}</button>
                    <button type="button" className="btn" onClick={onCancel}>Cancelar</button>
                </div>
            </form>
        </div>
    );
}

// ─── Detalle de campaña ───────────────────────────────────────────────────────

function CampaignDetail({ campaign, colorIndex, onClose, onSelectSession, onChanged, onError, onFlash }) {
    const { color, bg } = campaignColor(colorIndex);
    const [tab, setTab]           = useState("sessions"); // "sessions" | "participants" | "notes"
    const [showSessionForm, setShowSessionForm] = useState(false);
    const [sessionForm, setSessionForm]         = useState(emptySessionForm());
    const [editingSessionId, setEditingSessionId] = useState(null);

    const submitSession = async (e) => {
        e.preventDefault();
        try {
            if (editingSessionId) {
                await campaignsApi.updateSession(campaign._id, editingSessionId, sessionForm);
                onFlash("Sesión actualizada");
            } else {
                await campaignsApi.addSession(campaign._id, sessionForm);
                onFlash("Sesión creada");
            }
            setShowSessionForm(false);
            setEditingSessionId(null);
            setSessionForm(emptySessionForm());
            onChanged();
        } catch (e) { onError(e.message); }
    };

    const deleteSession = async (s) => {
        if (!confirm(`¿Eliminar la sesión "${s.title}"?`)) return;
        try {
            await campaignsApi.removeSession(campaign._id, s._id);
            onFlash("Sesión eliminada");
            onChanged();
        } catch (e) { onError(e.message); }
    };

    const openEditSession = (s) => {
        setSessionForm({ title: s.title, date: s.date ? s.date.slice(0, 10) : "", summary: s.summary || "" });
        setEditingSessionId(s._id);
        setShowSessionForm(true);
    };

    const sessions = [...(campaign.sessions || [])].sort((a, b) => {
        if (a.date && b.date) return new Date(a.date) - new Date(b.date);
        return new Date(a.createdAt) - new Date(b.createdAt);
    });

    return (
        <div className="scroll-card" style={{ padding: "1.4rem", borderTop: `4px solid ${color}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                        <h2 style={{ margin: 0, color }}>{campaign.name}</h2>
                    </div>
                    <span style={{ fontSize: "0.8rem", color: STATUS_COLOR[campaign.status] }}>● {STATUS_LABEL[campaign.status]}</span>
                    {campaign.description && <p style={{ margin: "0.3rem 0 0", color: "var(--ink-faded)", fontSize: "0.85rem" }}>{campaign.description}</p>}
                </div>
                <button className="btn btn-small" onClick={onClose}>✕</button>
            </div>

            {/* Pestañas internas */}
            <div style={{ display: "flex", gap: "0.3rem", borderBottom: `2px solid ${color}`, marginBottom: "1rem" }}>
                {[["sessions", "Sesiones"], ["participants", "Aventureros"], ["notes", "Notas DM"]].map(([id, label]) => (
                    <button
                        key={id}
                        className="btn btn-small"
                        style={{ borderRadius: "4px 4px 0 0", borderBottom: "none", opacity: tab === id ? 1 : 0.55, fontWeight: tab === id ? 700 : 400, background: tab === id ? bg : undefined, color: tab === id ? color : undefined }}
                        onClick={() => setTab(id)}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* ── Sesiones ── */}
            {tab === "sessions" && (
                <div>
                    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.75rem" }}>
                        <button className="btn btn-primary" onClick={() => { setSessionForm(emptySessionForm()); setEditingSessionId(null); setShowSessionForm(true); }}>
                            + Nueva sesión
                        </button>
                    </div>

                    {showSessionForm && (
                        <SessionForm
                            form={sessionForm}
                            setForm={setSessionForm}
                            editingId={editingSessionId}
                            onSubmit={submitSession}
                            onCancel={() => setShowSessionForm(false)}
                        />
                    )}

                    {sessions.length === 0 ? (
                        <p style={{ color: "var(--ink-faded)", fontSize: "0.9rem" }}>Aún no hay sesiones. Crea la primera.</p>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            {sessions.map((s, i) => (
                                <div
                                    key={s._id}
                                    className="scroll-card"
                                    style={{ padding: "0.75rem 1rem", cursor: "pointer", borderLeft: `4px solid ${color}` }}
                                    onClick={() => onSelectSession(s)}
                                >
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <div>
                                            <strong style={{ fontSize: "0.9rem" }}>Sesión {i + 1}: {s.title}</strong>
                                            {s.date && <span style={{ fontSize: "0.78rem", color: "var(--ink-faded)", marginLeft: "0.5rem" }}>{new Date(s.date).toLocaleDateString("es-ES")}</span>}
                                            <p style={{ margin: "0.2rem 0 0", fontSize: "0.78rem", color: "var(--ink-faded)" }}>
                                                {s.log?.length || 0} entrada{s.log?.length !== 1 ? "s" : ""} en el log
                                            </p>
                                        </div>
                                        <div style={{ display: "flex", gap: "0.3rem" }} onClick={e => e.stopPropagation()}>
                                            <button className="btn btn-small" onClick={() => openEditSession(s)}><IconEdit /></button>
                                            <button className="btn btn-small" style={{ color: "var(--blood)" }} onClick={() => deleteSession(s)}>✕</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── Aventureros ── */}
            {tab === "participants" && (
                <ParticipantsPanel
                    campaign={campaign}
                    onChanged={onChanged}
                    onError={onError}
                    onFlash={onFlash}
                />
            )}

            {/* ── Notas DM ── */}
            {tab === "notes" && (
                <NotesPanel
                    campaign={campaign}
                    onChanged={onChanged}
                    onError={onError}
                    onFlash={onFlash}
                />
            )}
        </div>
    );
}

// ─── Panel de participantes ───────────────────────────────────────────────────

function ParticipantsPanel({ campaign, onChanged, onError, onFlash }) {
    const [query, setQuery]           = useState("");
    const [results, setResults]       = useState([]);
    const [searching, setSearching]   = useState(false);
    const timer = useRef(null);

    useEffect(() => {
        if (query.trim().length < 2) { setResults([]); return; }
        clearTimeout(timer.current);
        timer.current = setTimeout(async () => {
            setSearching(true);
            try { setResults(await charactersSearchApi.search(query.trim())); }
            catch (e) { onError(e.message); }
            finally { setSearching(false); }
        }, 350);
        return () => clearTimeout(timer.current);
    }, [query]);

    const add = async (char) => {
        try {
            await campaignsApi.addParticipant(campaign._id, char._id);
            setQuery(""); setResults([]);
            onFlash(`${char.name} añadido a la campaña`);
            onChanged();
        } catch (e) { onError(e.message); }
    };

    const remove = async (charId) => {
        if (!confirm("¿Quitar este aventurero de la campaña?")) return;
        try {
            await campaignsApi.removeParticipant(campaign._id, charId);
            onFlash("Aventurero retirado");
            onChanged();
        } catch (e) { onError(e.message); }
    };

    const participantIds = new Set(campaign.participants?.map(p => p.character?._id || p.character));

    return (
        <div>
            <h3 style={{ marginTop: 0, fontSize: "0.95rem" }}>Aventureros ({campaign.participants?.length || 0})</h3>

            {campaign.participants?.length > 0 ? (
                <ul style={{ listStyle: "none", padding: 0, marginBottom: "1.25rem" }}>
                    {campaign.participants.map(p => {
                        const c = p.character;
                        return (
                            <li key={c?._id || p.characterName} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.45rem 0", borderBottom: "1px solid var(--parchment-shadow)" }}>
                                <div>
                                    <strong style={{ fontSize: "0.9rem" }}>{c?.name || p.characterName}</strong>
                                    {c && <span style={{ fontSize: "0.78rem", color: "var(--ink-faded)", marginLeft: "0.4rem" }}>{c.charClass} nv.{c.level}</span>}
                                </div>
                                <button className="btn btn-small" style={{ color: "var(--blood)" }} onClick={() => remove(c?._id)}>Quitar</button>
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <p style={{ color: "var(--ink-faded)", fontSize: "0.85rem", marginBottom: "1rem" }}>Ningún aventurero todavía.</p>
            )}

            <label style={lbl}>Buscar personaje por nombre</label>
            <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Nombre del personaje…" style={{ width: "100%" }} />
            {searching && <p style={hint}>Buscando…</p>}
            {results.length > 0 && (
                <ul style={{ listStyle: "none", padding: 0, marginTop: "0.5rem", border: "1px solid var(--parchment-shadow)", borderRadius: "4px", overflow: "hidden" }}>
                    {results.map(c => {
                        const already = participantIds.has(c._id);
                        return (
                            <li key={c._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.45rem 0.75rem", borderBottom: "1px solid var(--parchment-shadow)" }}>
                                <div>
                                    <strong style={{ fontSize: "0.88rem" }}>{c.name}</strong>
                                    <span style={{ fontSize: "0.78rem", color: "var(--ink-faded)", marginLeft: "0.4rem" }}>{c.charClass} nv.{c.level}</span>
                                    {c.user?.username && <span style={{ fontSize: "0.75rem", color: "var(--ink-faded)", marginLeft: "0.3rem" }}>— {c.user.username}</span>}
                                </div>
                                <button className="btn btn-small btn-gold" disabled={already} onClick={() => add(c)}>{already ? "Ya está" : "Añadir"}</button>
                            </li>
                        );
                    })}
                </ul>
            )}
            {query.trim().length >= 2 && !searching && results.length === 0 && <p style={hint}>Sin resultados.</p>}
        </div>
    );
}

// ─── Panel de notas DM ────────────────────────────────────────────────────────

function NotesPanel({ campaign, onChanged, onError, onFlash }) {
    const [notes, setNotes]   = useState(campaign.notes || "");
    const [saving, setSaving] = useState(false);

    useEffect(() => setNotes(campaign.notes || ""), [campaign._id, campaign.notes]);

    const save = async () => {
        setSaving(true);
        try {
            await campaignsApi.update(campaign._id, { notes });
            onFlash("Notas guardadas");
            onChanged();
        } catch (e) { onError(e.message); }
        finally { setSaving(false); }
    };

    return (
        <div>
            <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={10}
                placeholder="Notas privadas del DM: tramas, secretos, preparación de la siguiente sesión…"
                style={{ width: "100%", resize: "vertical" }}
            />
            <button className="btn btn-primary" onClick={save} disabled={saving} style={{ marginTop: "0.5rem" }}>
                {saving ? "Guardando…" : "Guardar notas"}
            </button>
        </div>
    );
}

// ─── Vista de sesión con log ──────────────────────────────────────────────────

function SessionView({ campaign, colorIndex, session, onBack, onChanged, onError, onFlash }) {
    const [logKind, setLogKind]       = useState("note");
    const [logContent, setLogContent] = useState("");
    const [logMonster, setLogMonster] = useState("");
    const [adding, setAdding]         = useState(false);
    const [editingEntry, setEditingEntry] = useState(null);
    const [monsterPopup, setMonsterPopup] = useState(null);

    const log = [...(session.log || [])].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    const addEntry = async () => {
        if (logKind !== "encounter" && !logContent.trim()) return;
        if (logKind === "encounter" && !logMonster && !logContent.trim()) return;
        setAdding(true);
        try {
            await campaignsApi.addLogEntry(campaign._id, session._id, {
                kind: logKind,
                content: logContent,
                monsterId: logKind === "encounter" && logMonster ? logMonster : undefined
            });
            setLogContent("");
            setLogMonster("");
            onChanged();
            onFlash("Entrada añadida");
        } catch (e) { onError(e.message); }
        finally { setAdding(false); }
    };

    const saveEdit = async () => {
        try {
            await campaignsApi.updateLogEntry(campaign._id, session._id, editingEntry._id, { content: editingEntry.content });
            setEditingEntry(null);
            onChanged();
            onFlash("Entrada actualizada");
        } catch (e) { onError(e.message); }
    };

    const deleteEntry = async (entryId) => {
        if (!confirm("¿Eliminar esta entrada del log?")) return;
        try {
            await campaignsApi.removeLogEntry(campaign._id, session._id, entryId);
            onChanged();
            onFlash("Entrada eliminada");
        } catch (e) { onError(e.message); }
    };

    const sessions = [...(campaign.sessions || [])].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const sessionIndex = sessions.findIndex(s => s._id === session._id);
    const { color: sessionColor, bg: sessionBg } = campaignColor(colorIndex);

    return (
        <>
        <div className="scroll-card" style={{ padding: "1.4rem", borderTop: `4px solid ${sessionColor}` }}>
            {/* Cabecera sesión */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                <div>
                    <button className="btn btn-small" onClick={onBack} style={{ marginBottom: "0.4rem", borderColor: sessionColor, color: sessionColor }}>← {campaign.name}</button>
                    <h2 style={{ margin: 0, fontSize: "1.1rem", color: sessionColor }}>
                        Sesión {sessionIndex + 1}: {session.title}
                    </h2>
                    {session.date && <p style={{ margin: "0.15rem 0 0", fontSize: "0.8rem", color: "var(--ink-faded)" }}>{new Date(session.date).toLocaleDateString("es-ES")}</p>}
                    {session.summary && <p style={{ margin: "0.4rem 0 0", fontSize: "0.85rem", color: "var(--ink-faded)" }}>{session.summary}</p>}
                </div>
            </div>

            {/* Formulario nueva entrada */}
            <div className="scroll-card" style={{ padding: "1rem", marginBottom: "1.25rem", background: "rgba(0,0,0,0.03)" }}>
                <p style={{ margin: "0 0 0.6rem", fontWeight: 600, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-faded)" }}>
                    Añadir al log
                </p>
                <div style={{ display: "flex", gap: "0.4rem", marginBottom: "0.6rem", flexWrap: "wrap" }}>
                    {Object.entries(LOG_KIND_LABEL).map(([k, label]) => (
                        <button
                            key={k}
                            className="btn btn-small"
                            style={{ fontWeight: logKind === k ? 700 : 400, opacity: logKind === k ? 1 : 0.6, borderColor: logKind === k ? sessionColor : undefined }}
                            onClick={() => setLogKind(k)}
                        >
                            {LOG_KIND_ICON[k]} {label}
                        </button>
                    ))}
                </div>

                {logKind === "encounter" && (
                    <MonsterPicker
                        value={logMonster}
                        onChange={setLogMonster}
                        campaignMonsters={campaign.monsters || []}
                    />
                )}

                <textarea
                    value={logContent}
                    onChange={e => setLogContent(e.target.value)}
                    rows={logKind === "diary" ? 4 : 2}
                    placeholder={
                        logKind === "diary"     ? "Narra lo que ha sucedido en la sesión…" :
                        logKind === "encounter" ? "Descripción del encuentro, resultado…"  :
                        "Apunte rápido, recordatorio…"
                    }
                    style={{ width: "100%", resize: "vertical" }}
                    onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey) addEntry(); }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.5rem" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--ink-faded)" }}>Ctrl+Enter para añadir</span>
                    <button className="btn btn-primary" onClick={addEntry} disabled={adding}>
                        {adding ? "Añadiendo…" : `+ ${LOG_KIND_LABEL[logKind]}`}
                    </button>
                </div>
            </div>

            {/* Log */}
            {log.length === 0 ? (
                <p style={{ color: "var(--ink-faded)", fontSize: "0.9rem", textAlign: "center" }}>El log está vacío. Añade la primera entrada.</p>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                    {log.map(entry => (
                        <div key={entry._id} style={{ borderLeft: `3px solid ${entry.kind === "diary" ? "var(--gold)" : entry.kind === "encounter" ? "var(--blood)" : "var(--parchment-shadow)"}`, paddingLeft: "0.85rem", position: "relative" }}>
                            {editingEntry?._id === entry._id ? (
                                <div>
                                    <textarea
                                        value={editingEntry.content}
                                        onChange={e => setEditingEntry(p => ({ ...p, content: e.target.value }))}
                                        rows={3}
                                        style={{ width: "100%", resize: "vertical" }}
                                        autoFocus
                                    />
                                    <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.3rem" }}>
                                        <button className="btn btn-small btn-primary" onClick={saveEdit}>Guardar</button>
                                        <button className="btn btn-small" onClick={() => setEditingEntry(null)}>Cancelar</button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                                        <div style={{ flex: 1 }}>
                                            <span style={{ fontSize: "0.72rem", color: "var(--ink-faded)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                                                {LOG_KIND_ICON[entry.kind]} {LOG_KIND_LABEL[entry.kind]}
                                                {" · "}
                                                {new Date(entry.createdAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                                            </span>
                                            {entry.kind === "encounter" && (entry.monster || entry.monsterName) && (
                                                <p style={{ margin: "0.15rem 0 0", fontSize: "0.85rem", fontWeight: 600 }}>
                                                    {entry.monster?._id ? (
                                                        <button
                                                            onClick={() => setMonsterPopup(entry.monster._id)}
                                                            style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "var(--blood)", fontWeight: 600, fontSize: "inherit", textDecoration: "underline dotted", textUnderlineOffset: "3px" }}
                                                            title="Ver stat block"
                                                        >
                                                            ⚔️ {entry.monster.name}
                                                        </button>
                                                    ) : (
                                                        <span style={{ color: "var(--blood)" }}>⚔️ {entry.monsterName}</span>
                                                    )}
                                                    {entry.monster?.challengeRating && <span style={{ fontWeight: 400, color: "var(--ink-faded)", marginLeft: "0.3rem" }}>CR {entry.monster.challengeRating}</span>}
                                                </p>
                                            )}
                                            {entry.content && <p style={{ margin: "0.2rem 0 0", fontSize: "0.88rem", whiteSpace: "pre-wrap" }}>{entry.content}</p>}
                                        </div>
                                        <div style={{ display: "flex", gap: "0.25rem", flexShrink: 0 }}>
                                            {entry.kind !== "encounter" && (
                                                <button className="btn btn-small" style={{ padding: "0.15rem 0.4rem" }} onClick={() => setEditingEntry({ _id: entry._id, content: entry.content || "" })}><IconEdit /></button>
                                            )}
                                            <button className="btn btn-small" style={{ padding: "0.15rem 0.4rem", color: "var(--blood)" }} onClick={() => deleteEntry(entry._id)}>✕</button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>

        {monsterPopup && (
            <MonsterStatModal monsterId={monsterPopup} onClose={() => setMonsterPopup(null)} />
        )}
        </>
    );
}

// ─── Formulario de sesión ─────────────────────────────────────────────────────

function SessionForm({ form, setForm, editingId, onSubmit, onCancel }) {
    const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
    return (
        <div style={{ background: "rgba(0,0,0,0.04)", borderRadius: "6px", padding: "1rem", marginBottom: "0.75rem" }}>
            <form onSubmit={onSubmit}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.7rem" }}>
                    <div style={{ gridColumn: "1/-1" }}>
                        <label style={lbl}>Título *</label>
                        <input type="text" value={form.title} onChange={set("title")} required placeholder="La llegada al pueblo…" style={{ width: "100%" }} />
                    </div>
                    <div>
                        <label style={lbl}>Fecha</label>
                        <input type="date" value={form.date} onChange={set("date")} style={{ width: "100%" }} />
                    </div>
                    <div>
                        <label style={lbl}>Resumen</label>
                        <input type="text" value={form.summary} onChange={set("summary")} placeholder="Breve descripción…" style={{ width: "100%" }} />
                    </div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
                    <button type="submit" className="btn btn-primary">{editingId ? "Guardar" : "Crear sesión"}</button>
                    <button type="button" className="btn" onClick={onCancel}>Cancelar</button>
                </div>
            </form>
        </div>
    );
}

// ─── Selector de monstruo con filtros y buscador ─────────────────────────────

function MonsterPicker({ value, onChange, campaignMonsters }) {
    const FILTERS = [["campaign", "Campaña"], ["mine", "Míos"], ["srd", "SRD"], ["all", "Todos"]];
    const [filter, setFilter]       = useState("campaign");
    const [search, setSearch]       = useState("");
    const [apiMonsters, setApiMonsters] = useState([]);
    const [loading, setLoading]     = useState(false);

    useEffect(() => {
        if (filter === "campaign") return;
        setLoading(true);
        const params = filter === "all" ? {} : { source: filter };
        monstersApi.list(params)
            .then(setApiMonsters)
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [filter]);

    const source   = filter === "campaign" ? campaignMonsters : apiMonsters;
    const filtered = search.trim()
        ? source.filter(m => m.name.toLowerCase().includes(search.toLowerCase()))
        : source;

    const selectedMonster = [...campaignMonsters, ...apiMonsters].find(m => m._id === value);

    return (
        <div style={{ marginBottom: "0.5rem" }}>
            <label style={lbl}>Monstruo (opcional)</label>

            {value ? (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 0.7rem", background: "rgba(139,0,0,0.1)", borderRadius: "4px", marginBottom: "0.4rem" }}>
                    <span style={{ fontSize: "0.9rem", flex: 1 }}>⚔️ <strong>{selectedMonster?.name ?? "Monstruo seleccionado"}</strong></span>
                    <button className="btn btn-small" style={{ padding: "0.1rem 0.5rem" }} onClick={() => onChange("")}>✕</button>
                </div>
            ) : (
                <>
                    <div style={{ display: "flex", gap: "0.3rem", marginBottom: "0.4rem", flexWrap: "wrap" }}>
                        {FILTERS.map(([f, label]) => (
                            <button
                                key={f}
                                className="btn btn-small"
                                style={{ opacity: filter === f ? 1 : 0.5, fontWeight: filter === f ? 700 : 400 }}
                                onClick={() => setFilter(f)}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar monstruo…"
                        style={{ width: "100%", marginBottom: "0.3rem" }}
                    />

                    <ul style={{ listStyle: "none", padding: 0, marginTop: 0, border: "1px solid var(--parchment-shadow)", borderRadius: "4px", overflow: "hidden", maxHeight: "160px", overflowY: "auto" }}>
                        {loading ? (
                            <li style={{ padding: "0.45rem 0.75rem", color: "var(--ink-faded)", fontSize: "0.85rem" }}>Cargando…</li>
                        ) : filtered.length === 0 ? (
                            <li style={{ padding: "0.45rem 0.75rem", color: "var(--ink-faded)", fontSize: "0.85rem" }}>
                                {filter === "campaign" ? "Sin monstruos en el pool de esta campaña." : "Sin resultados."}
                            </li>
                        ) : (
                            filtered.map(m => (
                                <li
                                    key={m._id}
                                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.45rem 0.75rem", borderBottom: "1px solid var(--parchment-shadow)", cursor: "pointer" }}
                                    onClick={() => onChange(m._id)}
                                >
                                    <span style={{ fontSize: "0.88rem" }}>{m.name}</span>
                                    <span style={{ color: "var(--ink-faded)", fontSize: "0.78rem" }}>CR {m.challengeRating}</span>
                                </li>
                            ))
                        )}
                    </ul>
                </>
            )}
        </div>
    );
}

// ─── Modal stat block de monstruo ────────────────────────────────────────────

function MonsterStatModal({ monsterId, onClose }) {
    const [monster, setMonster] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState("");

    useEffect(() => {
        setLoading(true);
        setError("");
        monstersApi.get(monsterId)
            .then(setMonster)
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, [monsterId]);

    useEffect(() => {
        const onKey = (e) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    const abil = (m, key) => {
        const v = m.abilityScores?.[key] ?? 10;
        const mod = Math.floor((v - 10) / 2);
        return `${v} (${mod >= 0 ? "+" : ""}${mod})`;
    };

    return (
        <div className="modal-overlay modal-overlay--form" onClick={onClose}>
            <div className="modal-content modal-content--form" style={{ maxWidth: "600px" }} onClick={e => e.stopPropagation()}>
                <div style={{ padding: "1.5rem 2rem", borderBottom: "1px solid var(--parchment-shadow)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h2 style={{ margin: 0, fontSize: "1.2rem" }}>Stat Block</h2>
                    <button className="btn btn-small" onClick={onClose}>✕ Cerrar</button>
                </div>

                <div style={{ padding: "1.5rem 2rem", overflowY: "auto" }}>
                    {loading && <p style={{ color: "var(--ink-faded)" }}>Cargando…</p>}
                    {error   && <p style={{ color: "var(--blood)" }}>{error}</p>}
                    {monster && (
                        <>
                            {/* Cabecera */}
                            <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start", marginBottom: "1rem" }}>
                                {monster.image?.cloudinaryUrl && (
                                    <img src={monster.image.cloudinaryUrl} alt={monster.name}
                                        style={{ width: "72px", height: "72px", objectFit: "cover", borderRadius: "2px", border: "1px solid var(--ink-faded)", flexShrink: 0 }} />
                                )}
                                <div>
                                    <h3 style={{ margin: "0 0 0.3rem" }}>{monster.name}</h3>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", fontSize: "0.85rem" }}>
                                        <span className="badge-tag">{monster.size}</span>
                                        {(() => {
                                            const { color, bg } = monsterTypeColor(monster.type);
                                            return (
                                                <span className="badge-tag" style={{ background: bg, color, border: `1px solid ${color}40` }}>
                                                    {monster.type}{monster.subtype ? ` (${monster.subtype})` : ""}
                                                </span>
                                            );
                                        })()}
                                        <span className="badge-tag" style={{ background: "rgba(160,32,32,0.15)" }}>CR {monster.challengeRating}</span>
                                        {monster.isPublic && <span className="badge-tag" style={{ background: "rgba(59,109,255,0.15)", color: "#3b6dff" }}>SRD</span>}
                                    </div>
                                    <p style={{ margin: "0.3rem 0 0", fontSize: "0.85rem", color: "var(--ink-faded)" }}>{monster.alignment}</p>
                                </div>
                            </div>

                            {/* Defensas */}
                            <div style={{ fontSize: "0.9rem", lineHeight: 1.7, marginBottom: "1rem", borderTop: "1px dashed var(--parchment-shadow)", paddingTop: "0.75rem" }}>
                                <div><strong>Clase de armadura:</strong> {monster.armorClass}{monster.armorClassNote && ` (${monster.armorClassNote})`}</div>
                                <div><strong>Puntos de golpe:</strong> {monster.hitPoints?.average}{monster.hitPoints?.roll && ` (${monster.hitPoints.roll})`}</div>
                                <div><strong>Velocidad:</strong> {(monster.speed || []).join(", ") || "—"}</div>
                            </div>

                            {/* Atributos */}
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: "0.4rem", margin: "0.75rem 0 1rem", fontSize: "0.85rem", textAlign: "center", borderTop: "1px dashed var(--parchment-shadow)", paddingTop: "0.75rem" }}>
                                {["strength","dexterity","constitution","intelligence","wisdom","charisma"].map(k => (
                                    <div key={k}>
                                        <div style={{ fontFamily: "Cinzel,serif", fontSize: "0.68rem", color: "var(--ink-faded)", textTransform: "uppercase" }}>{k.slice(0,3)}</div>
                                        <strong>{abil(monster, k)}</strong>
                                    </div>
                                ))}
                            </div>

                            {/* Sentidos y resistencias */}
                            <div style={{ fontSize: "0.85rem", lineHeight: 1.7, marginBottom: "0.75rem" }}>
                                {monster.senses?.length > 0     && <div><strong>Sentidos:</strong> {monster.senses.join(", ")}, Percepción pasiva {monster.passivePerception}</div>}
                                {monster.languages?.length > 0  && <div><strong>Idiomas:</strong> {monster.languages.join(", ")}</div>}
                                {monster.damageResistances?.length > 0  && <div><strong>Resistencias:</strong> {monster.damageResistances.join(", ")}</div>}
                                {monster.damageImmunities?.length > 0   && <div><strong>Inmunidades:</strong> {monster.damageImmunities.join(", ")}</div>}
                                {monster.conditionImmunities?.length > 0 && <div><strong>Inmunidad a condiciones:</strong> {monster.conditionImmunities.join(", ")}</div>}
                            </div>

                            {/* Acciones */}
                            {monster.actions?.length > 0 && <MonsterActionsGroup actions={monster.actions} />}

                            {monster.spellcastingNote && (
                                <div style={{ marginTop: "1rem", padding: "0.6rem", background: "rgba(184,134,11,0.08)", borderLeft: "3px solid var(--gold)", borderRadius: "2px", fontSize: "0.9rem", whiteSpace: "pre-wrap" }}>
                                    <strong>Lanzamiento de conjuros:</strong> {monster.spellcastingNote}
                                </div>
                            )}
                            {monster.description && (
                                <p style={{ marginTop: "1rem", fontStyle: "italic", fontSize: "0.9rem", whiteSpace: "pre-wrap" }}>{monster.description}</p>
                            )}
                            {monster.dmNotes && (
                                <div style={{ marginTop: "1rem", padding: "0.6rem", background: "rgba(139,0,0,0.08)", borderLeft: "3px solid var(--blood)", borderRadius: "2px", fontSize: "0.9rem", whiteSpace: "pre-wrap" }}>
                                    <strong>📝 Notas del DM:</strong><br />{monster.dmNotes}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function MonsterActionsGroup({ actions }) {
    const grouped = {};
    for (const a of actions) {
        const k = a.kind || "action";
        if (!grouped[k]) grouped[k] = [];
        grouped[k].push(a);
    }
    const order  = ["trait","action","bonus","reaction","legendary","lair"];
    const titles = { trait:"Rasgos", action:"Acciones", bonus:"Acciones adicionales", reaction:"Reacciones", legendary:"Acciones legendarias", lair:"Acciones de guarida" };
    return (
        <>
            {order.filter(k => grouped[k]).map(k => (
                <div key={k} style={{ marginTop: "1rem" }}>
                    <h4 style={{ borderBottom: "1px solid var(--gold)", paddingBottom: "0.2rem", marginBottom: "0.4rem" }}>{titles[k]}</h4>
                    {grouped[k].map(a => (
                        <div key={a._id} style={{ marginBottom: "0.6rem", fontSize: "0.9rem" }}>
                            <strong>{a.name}.</strong>{" "}
                            {(a.attackBonus !== undefined && a.attackBonus !== null && a.attackBonus !== "") && (
                                <em>Ataque: {a.attackBonus >= 0 ? "+" : ""}{a.attackBonus} al golpe{a.reach && `, alcance ${a.reach}`}. Impacto: {a.damage}{a.damageType ? ` de daño ${a.damageType}` : ""}.</em>
                            )}{" "}
                            <span style={{ whiteSpace: "pre-wrap" }}>{a.description}</span>
                        </div>
                    ))}
                </div>
            ))}
        </>
    );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const emptyCampaignForm = () => ({ name: "", description: "", status: "planning", notes: "" });
const emptySessionForm  = () => ({ title: "", date: "", summary: "" });
const lbl  = { display: "block", marginBottom: "0.25rem", fontWeight: 600, fontSize: "0.85rem" };
const hint = { fontSize: "0.8rem", color: "var(--ink-faded)", marginTop: "0.4rem" };
