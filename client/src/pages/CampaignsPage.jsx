import { useEffect, useRef, useState } from "react";
import { campaignsApi, charactersSearchApi } from "../api/campaigns.js";
import PageIntro from "../components/layout/PageIntro.jsx";
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
    const [expandedCard,     setExpandedCard]     = useState(null);

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
        if (selectedCampaign?._id === c._id) return;
        setSelectedSession(null);
        try {
            const full = await campaignsApi.get(c._id);
            setSelectedCampaign(full);
        } catch (e) { setError(e.message); }
    };

    // ── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="container">
            <PageIntro pageKey="campaigns" text="Aquí gestionas tus campañas de D&D. Crea campañas, añade sesiones con su log de eventos y gestiona los aventureros que participan en cada una." />
            {/* Cabecera */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
                <h1 style={{ margin: 0 }}>Campañas</h1>
                <button className="btn btn-primary" onClick={openCreateCampaign}>+ Nueva campaña</button>
            </div>

            {error   && <div className="alert" style={{ cursor: "pointer" }} onClick={() => setError("")}>{error}</div>}
            {success && <div className="alert-success" style={{ marginBottom: "1rem", padding: "0.75rem 1rem", borderRadius: "4px" }}>{success}</div>}

            {loading ? (
                <p style={{ color: "var(--ink-faded)" }}>Cargando campañas…</p>
            ) : campaigns.length === 0 && !showCampaignForm ? (
                <div className="scroll-card" style={{ textAlign: "center", padding: "2rem" }}>
                    <p style={{ color: "var(--ink-faded)" }}>Aún no tienes campañas. ¡Crea la primera!</p>
                </div>
            ) : (() => {
                const colorIdx = Object.fromEntries(
                    [...campaigns]
                        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                        .map((c, i) => [c._id, i])
                );

                const campaignForm_ = <CampaignForm
                    form={campaignForm}
                    setForm={setCampaignForm}
                    editingId={editingCampaignId}
                    onSubmit={submitCampaign}
                    onCancel={() => setShowCampaignForm(false)}
                />;

                const detailPanel = showCampaignForm
                    ? campaignForm_
                    : selectedCampaign
                        ? (selectedSession
                            ? <SessionView
                                campaign={selectedCampaign}
                                colorIndex={colorIdx[selectedCampaign._id]}
                                session={selectedSession}
                                onBack={() => setSelectedSession(null)}
                                onChanged={() => reloadCampaign(selectedCampaign._id)}
                                onError={setError}
                                onFlash={flash}
                              />
                            : <CampaignDetail
                                campaign={selectedCampaign}
                                colorIndex={colorIdx[selectedCampaign._id]}
                                onClose={() => { setSelectedCampaign(null); setSelectedSession(null); setExpandedCard(null); }}
                                onSelectSession={setSelectedSession}
                                onChanged={() => reloadCampaign(selectedCampaign._id)}
                                onError={setError}
                                onFlash={flash}
                                onEdit={() => openEditCampaign(selectedCampaign)}
                                onDelete={() => deleteCampaign(selectedCampaign)}
                              />)
                        : <div className="scroll-card" style={{ padding: "3rem 2rem", textAlign: "center", color: "var(--ink-faded)" }}>
                            <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🗺️</div>
                            <p style={{ margin: 0 }}>Selecciona una campaña para ver sus detalles</p>
                          </div>;

                // Sin campañas aún pero abriendo el formulario de creación
                if (campaigns.length === 0) {
                    return campaignForm_;
                }

                return (
                    <div className="campaigns-layout" data-has-detail={(selectedCampaign || showCampaignForm) ? "true" : undefined}>
                        <div className="campaigns-sidebar">
                            {campaigns.map(c => (
                                <CampaignCard
                                    key={c._id}
                                    campaign={c}
                                    colorIndex={colorIdx[c._id]}
                                    isSelected={selectedCampaign?._id === c._id}
                                    expanded={expandedCard === c._id}
                                    onToggle={() => {
                                        const next = expandedCard === c._id ? null : c._id;
                                        setExpandedCard(next);
                                        if (next !== null) selectCampaign(c);
                                    }}
                                    onEdit={() => openEditCampaign(c)}
                                    onDelete={() => deleteCampaign(c)}
                                />
                            ))}
                        </div>
                        <div className="campaigns-detail">
                            {detailPanel}
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}

// ─── Tarjeta de campaña ───────────────────────────────────────────────────────

function CampaignCard({ campaign, colorIndex, isSelected, expanded, onToggle, onEdit, onDelete }) {
    const { color, bg } = campaignColor(colorIndex);
    return (
        <div className="scroll-card" style={{ padding: 0, overflow: "hidden", boxShadow: isSelected ? `0 0 0 2px ${color}` : undefined }}>
            {/* Cabecera clicable */}
            <div
                onClick={onToggle}
                style={{
                    padding: "0.9rem 1.1rem",
                    cursor: "pointer",
                    borderLeft: `4px solid ${color}`,
                    background: expanded || isSelected ? bg : undefined,
                }}
            >
                <div style={{ flex: 1, minWidth: 0 }}>
                    <strong style={{ fontSize: "0.95rem", color, display: "block", overflow: "hidden", textOverflow: expanded ? undefined : "ellipsis", whiteSpace: expanded ? undefined : "nowrap" }}>
                        {campaign.name}
                    </strong>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.2rem", flexWrap: "wrap" }}>
                        <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--ink-faded)" }}>
                            {campaign.sessions?.length || 0} sesión{campaign.sessions?.length !== 1 ? "es" : ""}
                            {" · "}
                            {campaign.participants?.length || 0} aventurero{campaign.participants?.length !== 1 ? "s" : ""}
                        </p>
                        <span style={{ fontSize: "0.72rem", color: STATUS_COLOR[campaign.status] }}>● {STATUS_LABEL[campaign.status]}</span>
                    </div>
                </div>
            </div>

            {/* Detalle expandido: solo botones de gestión */}
            {expanded && (
                <div style={{ padding: "0.6rem 1.1rem 0.75rem", borderTop: "1px dashed var(--parchment-shadow)" }}>
                    {campaign.description && (
                        <p style={{ margin: "0 0 0.6rem", fontSize: "0.82rem", color: "var(--ink-faded)" }}>{campaign.description}</p>
                    )}
                    <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                        <button className="btn btn-small" style={{ width: "fit-content" }} onClick={e => { e.stopPropagation(); onEdit(); }}><IconEdit /> Editar</button>
                        <button className="btn btn-small btn-danger" style={{ width: "fit-content" }} onClick={e => { e.stopPropagation(); onDelete(); }}>× Eliminar</button>
                    </div>
                </div>
            )}
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
                <div className="form-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.9rem" }}>
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

function CampaignDetail({ campaign, colorIndex, onClose, onSelectSession, onChanged, onError, onFlash, onEdit, onDelete }) {
    const { color, bg } = campaignColor(colorIndex);
    const [tab, setTab]           = useState("sessions"); // "dashboard" | "sessions" | "participants" | "gallery" | "notes"
    const [showSessionForm, setShowSessionForm] = useState(false);
    const [sessionForm, setSessionForm]         = useState(emptySessionForm());
    const [editingSessionId, setEditingSessionId] = useState(null);
    const [expandedSession,  setExpandedSession] = useState(null);

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
        setSessionForm({
            title:     s.title,
            date:      s.date ? s.date.slice(0, 10) : "",
            summary:   s.summary || "",
            duration:  s.duration ?? "",
            attendees: (s.attendees || []).map(a => (a._id || a).toString())
        });
        setEditingSessionId(s._id);
        setShowSessionForm(true);
    };

    const sessions = [...(campaign.sessions || [])].sort((a, b) => {
        if (a.date && b.date) return new Date(a.date) - new Date(b.date);
        return new Date(a.createdAt) - new Date(b.createdAt);
    });

    return (
        <div className="scroll-card" style={{ padding: "1.4rem", borderTop: `4px solid ${color}` }}>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <div style={{ flex: 1, minWidth: "140px" }}>
                    <h2 style={{ margin: 0, color }}>{campaign.name}</h2>
                    <span style={{ fontSize: "0.8rem", color: STATUS_COLOR[campaign.status] }}>● {STATUS_LABEL[campaign.status]}</span>
                    {campaign.description && <p style={{ margin: "0.3rem 0 0", color: "var(--ink-faded)", fontSize: "0.85rem" }}>{campaign.description}</p>}
                </div>
                <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0, alignItems: "flex-start" }}>
                    <div className="mobile-only">
                        <button className="btn btn-small" onClick={onEdit}><IconEdit /> Editar</button>
                        <button className="btn btn-small btn-danger" onClick={onDelete}>× Eliminar</button>
                    </div>
                    <button className="btn btn-small" onClick={onClose}>✕</button>
                </div>
            </div>

            {/* Pestañas internas */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", borderBottom: `2px solid ${color}`, marginBottom: "1rem" }}>
                {[["dashboard", "📊 Resumen"], ["sessions", "Sesiones"], ["participants", "Aventureros"], ["gallery", "⚔️ Galería"], ["notes", "Notas DM"]].map(([id, label]) => (
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

            {/* ── Resumen ── */}
            {tab === "dashboard" && <CampaignDashboard campaign={campaign} color={color} bg={bg} />}

            {/* ── Sesiones ── */}
            {tab === "sessions" && (
                <div>
                    {!showSessionForm && (
                        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.75rem" }}>
                            <button className="btn btn-primary" onClick={() => { setSessionForm(emptySessionForm()); setEditingSessionId(null); setShowSessionForm(true); }}>
                                + Nueva sesión
                            </button>
                        </div>
                    )}

                    {showSessionForm && (
                        <SessionForm
                            form={sessionForm}
                            setForm={setSessionForm}
                            editingId={editingSessionId}
                            participants={campaign.participants || []}
                            onSubmit={submitSession}
                            onCancel={() => { setShowSessionForm(false); setEditingSessionId(null); }}
                        />
                    )}

                    {!showSessionForm && (sessions.length === 0 ? (
                        <p style={{ color: "var(--ink-faded)", fontSize: "0.9rem" }}>Aún no hay sesiones. Crea la primera.</p>
                    ) : (
                        <>
                            <p style={{ margin: "0 0 0.75rem", fontSize: "0.82rem", color: "var(--ink-faded)" }}>
                                {sessions.length} sesión{sessions.length !== 1 ? "es" : ""}
                            </p>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.6rem" }}>
                                {sessions.map((s, i) => {
                                    const isExp = expandedSession === s._id;
                                    return (
                                        <div
                                            key={s._id}
                                            style={{ background: isExp ? bg : "var(--parchment)", border: `1px solid ${color}33`, borderLeft: `3px solid ${color}`, borderRadius: "4px", overflow: "hidden", cursor: "pointer" }}
                                            onClick={() => setExpandedSession(id => id === s._id ? null : s._id)}
                                        >
                                            <div style={{ padding: "0.65rem 0.85rem" }}>
                                                <div style={{ fontSize: "0.68rem", color, fontFamily: "Cinzel, serif", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.15rem" }}>
                                                    Sesión {i + 1}
                                                </div>
                                                <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--ink)", overflow: "hidden", textOverflow: isExp ? undefined : "ellipsis", whiteSpace: isExp ? undefined : "nowrap", marginBottom: "0.2rem" }} title={s.title}>
                                                    {s.title}
                                                </div>
                                                <div style={{ fontSize: "0.72rem", color: "var(--ink-faded)" }}>
                                                    {s.date ? new Date(s.date).toLocaleDateString("es-ES") + " · " : ""}
                                                    {s.log?.length || 0} entrada{s.log?.length !== 1 ? "s" : ""}
                                                </div>
                                            </div>

                                            {isExp && (
                                                <div style={{ padding: "0.5rem 0.85rem 0.7rem", borderTop: `1px dashed ${color}44` }} onClick={e => e.stopPropagation()}>
                                                    {s.summary && <p style={{ margin: "0 0 0.5rem", fontSize: "0.82rem", color: "var(--ink-faded)" }}>{s.summary}</p>}
                                                    <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
                                                        <button className="btn btn-small btn-primary" onClick={() => onSelectSession(s)}>Abrir</button>
                                                        <button className="btn btn-small" onClick={() => openEditSession(s)}><IconEdit /> Editar</button>
                                                        <button className="btn btn-small btn-danger" onClick={() => deleteSession(s)}>× Eliminar</button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    ))}
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

            {/* ── Galería de encuentros ── */}
            {tab === "gallery" && <EncounterGallery campaign={campaign} />}

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

// ─── Resumen de campaña (dashboard) ──────────────────────────────────────────
// Métricas calculadas a partir de los datos ya cargados en `campaign`
// (sesiones, bitácora, participantes) — sin peticiones adicionales al servidor.

function CampaignDashboard({ campaign, color, bg }) {
    const sessions     = campaign.sessions || [];
    const participants = campaign.participants || [];

    const sessionsWithDate = sessions
        .filter(s => s.date)
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    const now    = new Date();
    const past   = sessionsWithDate.filter(s => new Date(s.date) <= now);
    const future = sessionsWithDate.filter(s => new Date(s.date) > now);
    const lastSession = past[past.length - 1] || null;
    const nextSession = future[0] || null;

    let avgGapDays = null;
    if (sessionsWithDate.length >= 2) {
        const gaps = sessionsWithDate.slice(1).map((s, i) =>
            (new Date(s.date) - new Date(sessionsWithDate[i].date)) / 86400000
        );
        avgGapDays = Math.round(gaps.reduce((sum, g) => sum + g, 0) / gaps.length);
    }

    const logCounts    = { diary: 0, note: 0, encounter: 0 };
    const monsterCount = {};
    sessions.forEach(session => {
        (session.log || []).forEach(entry => {
            logCounts[entry.kind] = (logCounts[entry.kind] || 0) + 1;
            if (entry.kind !== "encounter") return;

            const monsters = entry.monsters?.length > 0 ? entry.monsters : (entry.monster ? [entry.monster] : []);
            const names = monsters.length > 0
                ? monsters.map(m => (typeof m === "object" && m.name) ? m.name : null).filter(Boolean)
                : (entry.monsterNames?.length > 0 ? entry.monsterNames : (entry.monsterName ? [entry.monsterName] : []));
            names.forEach(name => { monsterCount[name] = (monsterCount[name] || 0) + 1; });
        });
    });
    const totalLogEntries = logCounts.diary + logCounts.note + logCounts.encounter;
    const topMonsters     = Object.entries(monsterCount).sort((a, b) => b[1] - a[1]).slice(0, 5);

    const totalMinutes = sessions.reduce((sum, s) => sum + (typeof s.duration === "number" ? s.duration : 0), 0);
    const totalHours   = totalMinutes > 0 ? Math.round((totalMinutes / 60) * 10) / 10 : null;

    const sessionsWithAttendance = sessions.filter(s => (s.attendees || []).length > 0);
    const attendance = {};
    sessionsWithAttendance.forEach(session => {
        (session.attendees || []).forEach(a => {
            const id   = (a._id || a).toString();
            const name = a.name || "Personaje";
            if (!attendance[id]) attendance[id] = { id, name, count: 0 };
            attendance[id].count++;
        });
    });
    const attendanceRanking = Object.values(attendance).sort((a, b) => b.count - a.count);

    const fmtDate = (d) => new Date(d).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });

    const stats = [
        { label: "Sesiones jugadas",     value: sessions.length },
        { label: "Aventureros",          value: participants.length },
        { label: "Encuentros",           value: logCounts.encounter },
        { label: "Entradas de bitácora", value: totalLogEntries },
    ];
    if (totalHours != null) stats.push({ label: "Horas jugadas", value: totalHours });

    return (
        <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "0.6rem", marginBottom: "1.2rem" }}>
                {stats.map(({ label, value }) => (
                    <div key={label} style={{ background: bg, border: `1px solid ${color}33`, borderLeft: `3px solid ${color}`, borderRadius: "4px", padding: "0.65rem 0.85rem", textAlign: "center" }}>
                        <div style={{ fontSize: "1.6rem", fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
                        <div style={{ fontSize: "0.7rem", color: "var(--ink-faded)", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "0.25rem" }}>{label}</div>
                    </div>
                ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.2rem" }}>
                <div style={{ minWidth: 0 }}>
                    <h3 style={{ margin: "0 0 0.5rem", fontSize: "0.95rem", color }}>📅 Ritmo de juego</h3>
                    {sessionsWithDate.length === 0 ? (
                        <p style={{ color: "var(--ink-faded)", fontSize: "0.85rem" }}>Aún no hay sesiones con fecha registrada.</p>
                    ) : (
                        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.85rem" }}>
                            {lastSession && (
                                <li><strong style={{ color: "var(--ink)" }}>Última sesión:</strong>{" "}
                                    <span style={{ color: "var(--ink-faded)" }}>{lastSession.title} · {fmtDate(lastSession.date)}</span></li>
                            )}
                            {nextSession && (
                                <li><strong style={{ color: "var(--ink)" }}>Próxima sesión:</strong>{" "}
                                    <span style={{ color: "var(--ink-faded)" }}>{nextSession.title} · {fmtDate(nextSession.date)}</span></li>
                            )}
                            {avgGapDays != null && (
                                <li><strong style={{ color: "var(--ink)" }}>Cadencia media:</strong>{" "}
                                    <span style={{ color: "var(--ink-faded)" }}>cada {avgGapDays} día{avgGapDays !== 1 ? "s" : ""}</span></li>
                            )}
                        </ul>
                    )}
                </div>

                <div style={{ minWidth: 0 }}>
                    <h3 style={{ margin: "0 0 0.5rem", fontSize: "0.95rem", color }}>📖 Bitácora</h3>
                    {totalLogEntries === 0 ? (
                        <p style={{ color: "var(--ink-faded)", fontSize: "0.85rem" }}>Aún no hay entradas registradas en el diario de sesiones.</p>
                    ) : (
                        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                            {Object.entries(LOG_KIND_LABEL).map(([kind, label]) => (
                                <li key={kind} style={{ display: "grid", gridTemplateColumns: "20px 1fr auto", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem" }}>
                                    <span>{LOG_KIND_ICON[kind]}</span>
                                    <span style={{ display: "flex", alignItems: "center", gap: "0.4rem", minWidth: 0 }}>
                                        <span style={{ color: "var(--ink)" }}>{label}</span>
                                        <BarTrack value={logCounts[kind] || 0} max={totalLogEntries} color={color} />
                                    </span>
                                    <span style={{ color, fontWeight: 700 }}>{logCounts[kind] || 0}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div style={{ minWidth: 0 }}>
                    <h3 style={{ margin: "0 0 0.5rem", fontSize: "0.95rem", color }}>🎭 Asistencia</h3>
                    {attendanceRanking.length === 0 ? (
                        <p style={{ color: "var(--ink-faded)", fontSize: "0.85rem" }}>Aún no se ha registrado la asistencia de ninguna sesión.</p>
                    ) : (
                        <>
                            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                                {attendanceRanking.map(({ id, name, count }) => (
                                    <li key={id} style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem" }}>
                                        <span style={{ display: "flex", alignItems: "center", gap: "0.4rem", minWidth: 0 }}>
                                            <span style={{ color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={name}>{name}</span>
                                            <BarTrack value={count} max={sessionsWithAttendance.length} color={color} />
                                        </span>
                                        <span style={{ color, fontWeight: 700 }}>{count}/{sessionsWithAttendance.length}</span>
                                    </li>
                                ))}
                            </ul>
                            <p style={{ ...hint, marginTop: "0.5rem" }}>
                                Sobre {sessionsWithAttendance.length} sesión{sessionsWithAttendance.length !== 1 ? "es" : ""} con asistencia registrada.
                            </p>
                        </>
                    )}
                </div>

                <div style={{ minWidth: 0 }}>
                    <h3 style={{ margin: "0 0 0.5rem", fontSize: "0.95rem", color }}>⚔️ Rivales habituales</h3>
                    {topMonsters.length === 0 ? (
                        <p style={{ color: "var(--ink-faded)", fontSize: "0.85rem" }}>Sin encuentros registrados todavía.</p>
                    ) : (
                        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                            {topMonsters.map(([name, count]) => (
                                <li key={name} style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", fontSize: "0.85rem" }}>
                                    <span style={{ color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={name}>{name}</span>
                                    <span style={{ color, fontWeight: 700, flexShrink: 0 }}>× {count}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}

// Barra de proporción ligera — evita depender de una librería de gráficos para el resumen.
function BarTrack({ value, max, color }) {
    const pct = max > 0 ? Math.round((value / max) * 100) : 0;
    return (
        <span style={{ flex: 1, minWidth: "40px", height: "6px", borderRadius: "3px", background: `${color}22`, overflow: "hidden" }}>
            <span style={{ display: "block", height: "100%", width: `${pct}%`, background: color, borderRadius: "3px" }} />
        </span>
    );
}

// ─── Modal de detalle de monstruo ────────────────────────────────────────────

function MonsterDetailModal({ monsterId, onClose }) {
    const [monster, setMonster] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState("");

    useEffect(() => {
        monstersApi.get(monsterId)
            .then(m => setMonster(m))
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, [monsterId]);

    const abil = (key) => {
        const v = monster?.abilityScores?.[key] ?? 10;
        const mod = Math.floor((v - 10) / 2);
        return `${v} (${mod >= 0 ? "+" : ""}${mod})`;
    };

    const { color, bg } = monster ? monsterTypeColor(monster.type) : { color: "var(--gold)", bg: "transparent" };

    return (
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 200 }}>
            <div
                className="scroll-card"
                onClick={e => e.stopPropagation()}
                style={{ maxWidth: "620px", width: "90%", maxHeight: "85vh", overflowY: "auto", margin: "auto", borderTop: `4px solid ${color}` }}
            >
                {loading && <p style={{ color: "var(--ink-faded)" }}>Cargando…</p>}
                {error   && <p style={{ color: "var(--blood)" }}>{error}</p>}
                {monster && (
                    <>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                            <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                                {monster.image?.cloudinaryUrl && (
                                    <img src={monster.image.cloudinaryUrl} alt={monster.name}
                                        style={{ width: "64px", height: "64px", objectFit: "cover", borderRadius: "2px", border: "1px solid var(--ink-faded)", flexShrink: 0 }} />
                                )}
                                <div>
                                    <h2 style={{ margin: 0, color }}>{monster.name}</h2>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", marginTop: "0.3rem" }}>
                                        <span className="badge-tag">{monster.size}</span>
                                        <span className="badge-tag" style={{ background: bg, color, border: `1px solid ${color}40` }}>
                                            {monster.type}{monster.subtype ? ` (${monster.subtype})` : ""}
                                        </span>
                                        <span className="badge-tag" style={{ background: "rgba(160,32,32,0.15)" }}>CR {monster.challengeRating}</span>
                                        {monster.alignment && <span style={{ fontSize: "0.82rem", color: "var(--ink-faded)", alignSelf: "center" }}>{monster.alignment}</span>}
                                    </div>
                                </div>
                            </div>
                            <button className="btn btn-small" onClick={onClose}>✕</button>
                        </div>

                        <div style={{ fontSize: "0.9rem", lineHeight: 1.7, marginBottom: "0.75rem" }}>
                            <div><strong>CA:</strong> {monster.armorClass}{monster.armorClassNote && ` (${monster.armorClassNote})`}</div>
                            <div><strong>Puntos de golpe:</strong> {monster.hitPoints?.average}{monster.hitPoints?.roll && ` (${monster.hitPoints.roll})`}</div>
                            <div><strong>Velocidad:</strong> {(monster.speed || []).join(", ") || "—"}</div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(50px, 1fr))", gap: "0.4rem", margin: "0.75rem 0", fontSize: "0.85rem", textAlign: "center" }}>
                            {["strength","dexterity","constitution","intelligence","wisdom","charisma"].map(k => (
                                <div key={k}>
                                    <div style={{ fontFamily: "Cinzel, serif", fontSize: "0.65rem", color: "var(--ink-faded)", textTransform: "uppercase" }}>{k.slice(0,3)}</div>
                                    <strong>{abil(k)}</strong>
                                </div>
                            ))}
                        </div>

                        <div style={{ fontSize: "0.85rem", lineHeight: 1.6, marginBottom: "0.5rem" }}>
                            {monster.senses?.length > 0           && <div><strong>Sentidos:</strong> {monster.senses.join(", ")}, Percepción pasiva {monster.passivePerception}</div>}
                            {monster.languages?.length > 0        && <div><strong>Idiomas:</strong> {monster.languages.join(", ")}</div>}
                            {monster.damageResistances?.length > 0 && <div><strong>Resistencias:</strong> {monster.damageResistances.join(", ")}</div>}
                            {monster.damageImmunities?.length > 0  && <div><strong>Inmunidades:</strong> {monster.damageImmunities.join(", ")}</div>}
                            {monster.conditionImmunities?.length > 0 && <div><strong>Inmunidad a condiciones:</strong> {monster.conditionImmunities.join(", ")}</div>}
                        </div>

                        {monster.actions?.length > 0 && <ActionsGroup actions={monster.actions} />}

                        {monster.spellcastingNote && (
                            <div style={{ marginTop: "0.75rem", padding: "0.6rem", background: "rgba(184,134,11,0.08)", borderLeft: "3px solid var(--gold)", borderRadius: "2px", fontSize: "0.9rem", whiteSpace: "pre-wrap" }}>
                                <strong>Lanzamiento de conjuros:</strong> {monster.spellcastingNote}
                            </div>
                        )}
                        {monster.description && (
                            <div style={{ marginTop: "0.75rem", fontStyle: "italic", whiteSpace: "pre-wrap", fontSize: "0.9rem" }}>{monster.description}</div>
                        )}
                        {monster.dmNotes && (
                            <div style={{ marginTop: "0.75rem", padding: "0.6rem", background: "rgba(139,0,0,0.08)", borderLeft: "3px solid var(--blood)", borderRadius: "2px", fontSize: "0.9rem", whiteSpace: "pre-wrap" }}>
                                <strong>📝 Notas del DM:</strong><br />{monster.dmNotes}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

function ActionsGroup({ actions }) {
    const grouped = {};
    for (const a of actions) {
        const key = a.kind || "action";
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(a);
    }
    const order  = ["trait", "action", "bonus", "reaction", "legendary", "lair"];
    const titles = { trait: "Rasgos", action: "Acciones", bonus: "Acciones adicionales", reaction: "Reacciones", legendary: "Acciones legendarias", lair: "Acciones de guarida" };
    return (
        <>
            {order.filter(k => grouped[k]).map(k => (
                <div key={k} style={{ marginTop: "0.75rem" }}>
                    <h4 style={{ borderBottom: "1px solid var(--gold)", paddingBottom: "0.2rem", marginBottom: "0.4rem" }}>{titles[k]}</h4>
                    {grouped[k].map(a => (
                        <div key={a._id} style={{ marginBottom: "0.5rem", fontSize: "0.88rem" }}>
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

// ─── Galería de encuentros ────────────────────────────────────────────────────

function EncounterGallery({ campaign }) {
    const [modalMonsterId, setModalMonsterId] = useState(null);
    const monsterMap = {};

    (campaign.sessions || []).forEach(session => {
        (session.log || []).forEach(entry => {
            if (entry.kind !== "encounter") return;

            // Formato nuevo: array de monstruos poblados
            const monsters = entry.monsters?.length > 0
                ? entry.monsters
                : entry.monster ? [entry.monster] : [];

            monsters.forEach(m => {
                const id   = (m._id || m).toString();
                const name = (typeof m === "object" && m.name) ? m.name
                           : entry.monsterNames?.[0] || entry.monsterName || "Desconocido";
                const type = typeof m === "object" ? m.type : null;
                const cr   = typeof m === "object" ? m.challengeRating : null;

                if (!monsterMap[id]) {
                    monsterMap[id] = { id, name, type, cr, count: 0, sessions: [] };
                }
                monsterMap[id].count++;
                if (!monsterMap[id].sessions.includes(session.title)) {
                    monsterMap[id].sessions.push(session.title);
                }
            });
        });
    });

    const entries = Object.values(monsterMap).sort((a, b) => b.count - a.count);

    if (entries.length === 0) {
        return <p style={{ color: "var(--ink-faded)", fontSize: "0.9rem" }}>Aún no hay encuentros registrados en esta campaña.</p>;
    }

    return (
        <div>
            {modalMonsterId && (
                <MonsterDetailModal monsterId={modalMonsterId} onClose={() => setModalMonsterId(null)} />
            )}
            <p style={{ margin: "0 0 0.75rem", fontSize: "0.82rem", color: "var(--ink-faded)" }}>
                {entries.length} criatura{entries.length !== 1 ? "s" : ""} distintas · {entries.reduce((s, e) => s + e.count, 0)} apariciones en total
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "0.6rem" }}>
                {entries.map(m => {
                    const { color, bg } = monsterTypeColor(m.type);
                    return (
                        <div
                            key={m.id}
                            onClick={() => setModalMonsterId(m.id)}
                            style={{ background: bg, border: `1px solid ${color}33`, borderLeft: `3px solid ${color}`, borderRadius: "4px", padding: "0.65rem 0.85rem", cursor: "pointer", transition: "box-shadow 0.15s" }}
                            onMouseEnter={e => e.currentTarget.style.boxShadow = `0 0 0 2px ${color}66`}
                            onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
                        >
                            <div style={{ fontWeight: 700, fontSize: "0.88rem", color, marginBottom: "0.2rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={m.name}>
                                {m.name}
                            </div>
                            <div style={{ fontSize: "0.72rem", color: "var(--ink-faded)", marginBottom: "0.35rem" }}>
                                {[m.type, m.cr != null ? `CR ${m.cr}` : null].filter(Boolean).join(" · ") || "Sin datos"}
                            </div>
                            <div style={{ fontSize: "0.8rem" }}>
                                <strong style={{ color }}>{m.count}</strong>
                                <span style={{ color: "var(--ink-faded)" }}> × · {m.sessions.length} sesión{m.sessions.length !== 1 ? "es" : ""}</span>
                            </div>
                            <div style={{ fontSize: "0.68rem", color: "var(--ink-faded)", marginTop: "0.25rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={m.sessions.join(", ")}>
                                {m.sessions.join(", ")}
                            </div>
                        </div>
                    );
                })}
            </div>
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
            <p style={{ margin: "0 0 0.75rem", fontSize: "0.82rem", color: "var(--ink-faded)" }}>
                {campaign.participants?.length || 0} aventurero{campaign.participants?.length !== 1 ? "s" : ""} en la campaña
            </p>

            {campaign.participants?.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "0.6rem", marginBottom: "1.25rem" }}>
                    {campaign.participants.map(p => {
                        const c = p.character;
                        const name = c?.name || p.characterName;
                        return (
                            <div key={c?._id || p.characterName}
                                style={{ background: "var(--parchment)", border: "1px solid var(--parchment-shadow)", borderLeft: "3px solid var(--gold)", borderRadius: "4px", padding: "0.65rem 0.85rem" }}>
                                <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--ink)", marginBottom: "0.2rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={name}>
                                    {name}
                                </div>
                                {c && (
                                    <div style={{ fontSize: "0.72rem", color: "var(--ink-faded)", marginBottom: "0.4rem" }}>
                                        {c.charClass} · Nv. {c.level}
                                    </div>
                                )}
                                <button className="btn btn-small btn-danger" style={{ fontSize: "0.72rem", padding: "0.2rem 0.5rem" }} onClick={() => remove(c?._id)}>Quitar</button>
                            </div>
                        );
                    })}
                </div>
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
    const [adding, setAdding] = useState(false);

    const addCard = async () => {
        setAdding(true);
        try {
            await campaignsApi.addNoteCard(campaign._id, { content: "" });
            onChanged();
        } catch (e) { onError(e.message); }
        finally { setAdding(false); }
    };

    const cards = campaign.noteCards || [];

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--ink-faded)" }}>
                    {cards.length} nota{cards.length !== 1 ? "s" : ""}
                </p>
                <button className="btn btn-primary btn-small" onClick={addCard} disabled={adding}>
                    + Nueva nota
                </button>
            </div>

            {cards.length === 0 && (
                <p style={{ color: "var(--ink-faded)", fontSize: "0.9rem" }}>Sin notas todavía. Añade tramas, secretos o recordatorios.</p>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.6rem", alignItems: "start" }}>
                {cards.map(note => (
                    <NoteCard
                        key={note._id}
                        note={note}
                        campaignId={campaign._id}
                        onDeleted={onChanged}
                        onError={onError}
                        onFlash={onFlash}
                    />
                ))}
            </div>
        </div>
    );
}

function NoteCard({ note, campaignId, onDeleted, onError, onFlash }) {
    const [content,      setContent]      = useState(note.content);
    const [savedContent, setSavedContent] = useState(note.content);
    const [editing,      setEditing]      = useState(!note.content); // nueva nota vacía → entra directo en edición
    const [saving,       setSaving]       = useState(false);
    const dirty = content !== savedContent;

    const save = async () => {
        setSaving(true);
        try {
            await campaignsApi.updateNoteCard(campaignId, note._id, { content });
            setSavedContent(content);
            setEditing(false);
            onFlash("Nota guardada");
        } catch (e) { onError(e.message); }
        finally { setSaving(false); }
    };

    const cancel = () => {
        setContent(savedContent);
        setEditing(false);
    };

    const remove = async () => {
        if (!confirm("¿Eliminar esta nota?")) return;
        try {
            await campaignsApi.removeNoteCard(campaignId, note._id);
            onDeleted();
        } catch (e) { onError(e.message); }
    };

    return (
        <div
            style={{ background: "var(--parchment)", border: "1px solid var(--parchment-shadow)", borderLeft: "3px solid var(--gold)", borderRadius: "4px", padding: "0.7rem 0.85rem", display: "flex", flexDirection: "column", gap: "0.4rem", cursor: editing ? "default" : "pointer" }}
            onClick={!editing ? () => setEditing(true) : undefined}
        >
            {editing ? (
                <textarea
                    autoFocus
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    rows={5}
                    placeholder="Escribe aquí tu nota…"
                    onClick={e => e.stopPropagation()}
                    style={{ width: "100%", minWidth: 0, boxSizing: "border-box", resize: "vertical", background: "transparent", border: "none", outline: "none", fontSize: "0.85rem", lineHeight: 1.6, color: "var(--ink)", fontFamily: "inherit", padding: 0 }}
                />
            ) : (
                <div style={{ minHeight: "4rem", fontSize: "0.85rem", lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word", color: content ? "var(--ink)" : "var(--ink-faded)" }}>
                    {content || "Haz clic para escribir…"}
                </div>
            )}

            {editing && (
                <div style={{ borderTop: "1px dashed var(--parchment-shadow)", paddingTop: "0.4rem", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                    <div style={{ display: "flex", gap: "0.3rem" }}>
                        <button className="btn btn-small btn-primary" style={{ flex: 1, fontSize: "0.75rem" }} onMouseDown={e => e.preventDefault()} onClick={e => { e.stopPropagation(); save(); }} disabled={!dirty || saving}>
                            {saving ? "Guardando" : "Guardar"}
                        </button>
                        <button className="btn btn-small" style={{ flex: 1, fontSize: "0.75rem" }} onMouseDown={e => e.preventDefault()} onClick={e => { e.stopPropagation(); cancel(); }}>Cancelar</button>
                    </div>
                    <button className="btn btn-small btn-danger" style={{ fontSize: "0.75rem" }} onMouseDown={e => e.preventDefault()} onClick={e => { e.stopPropagation(); remove(); }}>Eliminar</button>
                </div>
            )}
        </div>
    );
}

// ─── Vista de sesión con log ──────────────────────────────────────────────────

function SessionView({ campaign, colorIndex, session, onBack, onChanged, onError, onFlash }) {
    const [logKind, setLogKind]         = useState("note");
    const [logContent, setLogContent]   = useState("");
    const [logMonsters, setLogMonsters] = useState([]);
    const [adding, setAdding]         = useState(false);
    const [editingEntry, setEditingEntry] = useState(null);
    const [monsterPopup, setMonsterPopup] = useState(null);

    const log = [...(session.log || [])].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    const addEntry = async () => {
        if (logKind !== "encounter" && !logContent.trim()) return;
        if (logKind === "encounter" && !logMonsters.length && !logContent.trim()) return;
        setAdding(true);
        try {
            await campaignsApi.addLogEntry(campaign._id, session._id, {
                kind: logKind,
                content: logContent,
                monsterIds: logKind === "encounter" ? logMonsters : []
            });
            setLogContent("");
            setLogMonsters([]);
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
                        value={logMonsters}
                        onChange={setLogMonsters}
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
                                            {entry.kind === "encounter" && (() => {
                                                const monsters = entry.monsters?.filter(Boolean) ?? [];
                                                const legacy   = entry.monster;
                                                const legacyNm = entry.monsterName;
                                                if (!monsters.length && !legacy && !legacyNm) return null;
                                                const monsterBtn = (m) => (
                                                    <span key={m._id} style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                                                        <button onClick={() => setMonsterPopup(m._id)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "var(--blood)", fontWeight: 600, fontSize: "inherit", textDecoration: "underline dotted", textUnderlineOffset: "3px" }} title="Ver stat block">
                                                            ⚔️ {m.name}
                                                        </button>
                                                        {m.challengeRating && <span style={{ fontWeight: 400, color: "var(--ink-faded)", fontSize: "0.8em" }}>CR {m.challengeRating}</span>}
                                                    </span>
                                                );
                                                return (
                                                    <div style={{ margin: "0.15rem 0 0", fontSize: "0.85rem", fontWeight: 600, display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                                                        {monsters.length
                                                            ? monsters.map(m => monsterBtn(m))
                                                            : legacy?._id
                                                                ? monsterBtn(legacy)
                                                                : <span style={{ color: "var(--blood)" }}>⚔️ {legacyNm}</span>
                                                        }
                                                    </div>
                                                );
                                            })()}
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

function SessionForm({ form, setForm, editingId, participants, onSubmit, onCancel }) {
    const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

    const toggleAttendee = (charId) => {
        setForm(p => {
            const id = charId.toString();
            const has = p.attendees.includes(id);
            return { ...p, attendees: has ? p.attendees.filter(a => a !== id) : [...p.attendees, id] };
        });
    };

    return (
        <div style={{ background: "rgba(0,0,0,0.04)", borderRadius: "6px", padding: "1rem", marginBottom: "0.75rem" }}>
            <form onSubmit={onSubmit}>
                <div className="form-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.7rem" }}>
                    <div style={{ gridColumn: "1/-1" }}>
                        <label style={lbl}>Título *</label>
                        <input type="text" value={form.title} onChange={set("title")} required placeholder="La llegada al pueblo…" style={{ width: "100%" }} />
                    </div>
                    <div>
                        <label style={lbl}>Fecha</label>
                        <input type="date" value={form.date} onChange={set("date")} style={{ width: "100%" }} />
                    </div>
                    <div>
                        <label style={lbl}>Duración (minutos)</label>
                        <input type="number" min="0" step="5" value={form.duration} onChange={set("duration")} placeholder="180" style={{ width: "100%" }} />
                    </div>
                    <div style={{ gridColumn: "1/-1" }}>
                        <label style={lbl}>Resumen</label>
                        <input type="text" value={form.summary} onChange={set("summary")} placeholder="Breve descripción…" style={{ width: "100%" }} />
                    </div>
                </div>

                {participants.length > 0 && (
                    <div style={{ marginTop: "0.7rem" }}>
                        <label style={lbl}>Asistentes</label>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                            {participants.map(p => {
                                const charId = (p.character?._id || p.character || "").toString();
                                const name   = p.character?.name || p.characterName || "Personaje";
                                const active = form.attendees.includes(charId);
                                return (
                                    <button
                                        type="button"
                                        key={charId}
                                        onClick={() => toggleAttendee(charId)}
                                        className="btn btn-small"
                                        style={{ opacity: active ? 1 : 0.5, fontWeight: active ? 700 : 400 }}
                                    >
                                        {active ? "✓ " : ""}{name}
                                    </button>
                                );
                            })}
                        </div>
                        <p style={hint}>Marca quiénes estuvieron presentes para llevar el registro de asistencia.</p>
                    </div>
                )}

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
    const [filter, setFilter]           = useState("campaign");
    const [search, setSearch]           = useState("");
    const [apiMonsters, setApiMonsters] = useState([]);
    const [loading, setLoading]         = useState(false);

    useEffect(() => {
        if (filter === "campaign") return;
        setLoading(true);
        const params = filter === "all" ? {} : { source: filter };
        monstersApi.list(params)
            .then(setApiMonsters)
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [filter]);

    const allKnown = [...campaignMonsters, ...apiMonsters];
    const source   = filter === "campaign" ? campaignMonsters : apiMonsters;
    const filtered = search.trim()
        ? source.filter(m => m.name.toLowerCase().includes(search.toLowerCase()))
        : source;

    const add    = (m) => { if (!value.includes(m._id)) onChange([...value, m._id]); };
    const remove = (id) => onChange(value.filter(v => v !== id));

    return (
        <div style={{ marginBottom: "0.5rem" }}>
            <label style={lbl}>Enemigos del encuentro</label>

            {/* Tags de monstruos seleccionados */}
            {value.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", marginBottom: "0.5rem" }}>
                    {value.map(id => {
                        const m = allKnown.find(x => x._id === id);
                        return (
                            <span key={id} style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", padding: "0.2rem 0.6rem", background: "rgba(139,0,0,0.12)", border: "1px solid rgba(139,0,0,0.25)", borderRadius: "4px", fontSize: "0.83rem" }}>
                                ⚔️ {m?.name ?? "Monstruo"}
                                <button style={{ background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 1, color: "var(--blood)", fontSize: "1rem" }} onClick={() => remove(id)}>×</button>
                            </span>
                        );
                    })}
                </div>
            )}

            {/* Filtros */}
            <div style={{ display: "flex", gap: "0.3rem", marginBottom: "0.4rem", flexWrap: "wrap" }}>
                {FILTERS.map(([f, label]) => (
                    <button key={f} className="btn btn-small" style={{ opacity: filter === f ? 1 : 0.5, fontWeight: filter === f ? 700 : 400 }} onClick={() => setFilter(f)}>
                        {label}
                    </button>
                ))}
            </div>

            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar y añadir enemigos…" style={{ width: "100%", marginBottom: "0.3rem" }} />

            <ul style={{ listStyle: "none", padding: 0, marginTop: 0, border: "1px solid var(--parchment-shadow)", borderRadius: "4px", overflow: "hidden", maxHeight: "160px", overflowY: "auto" }}>
                {loading ? (
                    <li style={{ padding: "0.45rem 0.75rem", color: "var(--ink-faded)", fontSize: "0.85rem" }}>Cargando…</li>
                ) : filtered.length === 0 ? (
                    <li style={{ padding: "0.45rem 0.75rem", color: "var(--ink-faded)", fontSize: "0.85rem" }}>
                        {filter === "campaign" ? "Sin monstruos en el pool de esta campaña." : "Sin resultados."}
                    </li>
                ) : filtered.map(m => {
                    const selected = value.includes(m._id);
                    return (
                        <li
                            key={m._id}
                            onClick={() => selected ? remove(m._id) : add(m)}
                            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.45rem 0.75rem", borderBottom: "1px solid var(--parchment-shadow)", cursor: "pointer", background: selected ? "rgba(139,0,0,0.07)" : undefined }}
                        >
                            <span style={{ fontSize: "0.88rem" }}>{selected ? "✓ " : ""}{m.name}</span>
                            <span style={{ color: "var(--ink-faded)", fontSize: "0.78rem" }}>CR {m.challengeRating}</span>
                        </li>
                    );
                })}
            </ul>
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
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(50px, 1fr))", gap: "0.4rem", margin: "0.75rem 0 1rem", fontSize: "0.85rem", textAlign: "center", borderTop: "1px dashed var(--parchment-shadow)", paddingTop: "0.75rem" }}>
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
const emptySessionForm  = () => ({ title: "", date: "", summary: "", duration: "", attendees: [] });
const lbl  = { display: "block", marginBottom: "0.25rem", fontWeight: 600, fontSize: "0.85rem" };
const hint = { fontSize: "0.8rem", color: "var(--ink-faded)", marginTop: "0.4rem" };
