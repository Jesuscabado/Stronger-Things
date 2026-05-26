import { useEffect, useState } from "react";
import { objectsApi } from "../api/objects.js";
import PageIntro from "../components/layout/PageIntro.jsx";
import { useNameCheck } from "../hooks/useNameCheck.js";
import { translateCategory } from "../utils/categoryLabels.js";
import { rarityColor } from "../utils/dndColors.js";
import { useAuth } from "../context/AuthContext.jsx";

const IconEdit = ({ size = 13 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M11.5 2.5a1.414 1.414 0 0 1 2 2L5 13H3v-2L11.5 2.5z" />
    </svg>
);

const CATEGORIES = ["weapon", "armor", "shield", "potion", "scroll", "wondrous", "tool", "gear", "ammunition"];
const RARITIES = ["common", "uncommon", "rare", "very rare", "legendary", "artifact"];

const RARITY_LABELS = {
    common:      "Común",
    uncommon:    "Poco común",
    rare:        "Raro",
    "very rare": "Muy raro",
    legendary:   "Legendario",
    artifact:    "Artefacto"
};

const translateRarity = (en) => RARITY_LABELS[en?.toLowerCase()] || en || "Común";

const emptyForm = () => ({
    name: "", description: "", category: "weapon", cost: 0,
    damage: "", damageType: "", armorClass: "", weight: 0, rarity: "common"
});

// ─── Tarjeta de objeto (expandible) ─────────────────────────────────────────

function ObjectCard({ o, isAdmin, expanded, onToggle, onEdit, onDelete }) {
    const { color, bg } = rarityColor(o.stats?.rarity);
    const canEdit = !o.isPublic || isAdmin;

    return (
        <div className="scroll-card" style={{ padding: 0, overflow: "hidden" }}>
            {/* Cabecera clicable */}
            <div
                onClick={onToggle}
                style={{ padding: "1rem 1.25rem", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem" }}
            >
                <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ margin: "0 0 0.3rem", ...(expanded ? {} : { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }) }}>{o.name}</h3>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", alignItems: "center" }}>
                        <span className="badge-tag" style={{ background: bg, color, border: `1px solid ${color}40` }}>
                            {translateRarity(o.stats?.rarity)}
                        </span>
                        <span className="badge-tag">{translateCategory(o.category)}</span>
                        {o.isPublic && (
                            <span className="badge-tag" style={{ background: "rgba(59,109,255,0.15)", color: "#3b6dff" }}>SRD</span>
                        )}
                    </div>
                </div>
                <span style={{ fontSize: "1.2rem", color: "var(--ink-faded)", flexShrink: 0 }}>
                    {expanded ? "▾" : "▸"}
                </span>
            </div>

            {/* Detalle expandido */}
            {expanded && (
                <div style={{ padding: "0 1.25rem 1rem", borderTop: "1px dashed var(--parchment-shadow)" }}>
                    {o.description && (
                        <p style={{ fontSize: "0.9rem", lineHeight: 1.6, margin: "0.85rem 0 0.6rem", whiteSpace: "pre-wrap" }}>{o.description}</p>
                    )}
                    <div style={{ fontSize: "0.85rem", color: "var(--ink-faded)", lineHeight: 1.8, marginTop: o.description ? 0 : "0.85rem" }}>
                        {o.stats?.damage     && <div>⚔ <strong>Daño:</strong> {o.stats.damage}{o.stats.damageType ? ` ${o.stats.damageType}` : ""}</div>}
                        {o.stats?.armorClass && <div>🛡 <strong>CA:</strong> {o.stats.armorClass}</div>}
                        {(o.stats?.properties || []).length > 0 && <div>🔸 <strong>Propiedades:</strong> {o.stats.properties.join(", ")}</div>}
                        {o.cost > 0          && <div>💰 <strong>Coste:</strong> {o.cost} po</div>}
                        {o.stats?.weight > 0 && <div>⚖ <strong>Peso:</strong> {o.stats.weight} lb</div>}
                    </div>

                    {canEdit && (
                        <div style={{ display: "flex", gap: "0.4rem", marginTop: "1rem", flexWrap: "wrap" }}>
                            <button className="btn btn-small" style={{ width: "fit-content" }} onClick={e => { e.stopPropagation(); onEdit(); }}>
                                <IconEdit /> Editar
                            </button>
                            <button className="btn btn-small btn-danger" style={{ width: "fit-content" }} onClick={e => { e.stopPropagation(); onDelete(); }}>
                                × Eliminar
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Página principal ────────────────────────────────────────────────────────

export default function ObjectsPage() {
    const { user } = useAuth();
    const isAdmin = user?.role === "admin";
    const [objects, setObjects]   = useState([]);
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState("");
    const [success, setSuccess]   = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [expanded, setExpanded] = useState(null);
    const [filter, setFilter]     = useState("all");
    const [search, setSearch]     = useState("");
    const [form, setForm]         = useState(emptyForm());

    const { nameError, nameChecking } = useNameCheck(objectsApi.checkName, form.name, editingId);

    const flash = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(""), 2500); };

    useEffect(() => {
        document.body.style.overflow = showForm ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [showForm]);

    const load = async () => {
        try {
            setLoading(true);
            setObjects(await objectsApi.list());
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const openCreate = () => {
        setForm(emptyForm());
        setEditingId(null);
        setShowForm(true);
    };

    const openEdit = (o) => {
        setForm({
            name:        o.name        || "",
            description: o.description || "",
            category:    o.category    || "weapon",
            cost:        o.cost        ?? 0,
            damage:      o.stats?.damage     || "",
            damageType:  o.stats?.damageType || "",
            armorClass:  o.stats?.armorClass || "",
            weight:      o.stats?.weight     ?? 0,
            rarity:      o.stats?.rarity     || "common",
        });
        setEditingId(o._id);
        setShowForm(true);
    };

    const closeForm = () => { setShowForm(false); setEditingId(null); };

    const buildPayload = () => {
        const stats = { rarity: form.rarity, weight: Number(form.weight) || 0 };
        if (form.damage)     stats.damage     = form.damage;
        if (form.damageType) stats.damageType = form.damageType;
        if (form.armorClass) stats.armorClass = Number(form.armorClass);
        return { name: form.name, description: form.description, category: form.category, cost: Number(form.cost) || 0, stats };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await objectsApi.update(editingId, buildPayload());
                flash("Objeto actualizado");
            } else {
                await objectsApi.create(buildPayload());
                flash("Objeto creado");
            }
            closeForm();
            load();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDelete = async (o) => {
        if (!confirm(`¿Eliminar "${o.name}"? Esta acción no se puede deshacer.`)) return;
        try {
            await objectsApi.remove(o._id);
            flash("Objeto eliminado");
            load();
        } catch (err) {
            setError(err.message);
        }
    };

    // Filtrado combinado: categoría + texto de búsqueda.
    // La búsqueda es case-insensitive y se aplica al nombre del objeto.
    const normalizedSearch = search.trim().toLowerCase();
    const filtered = objects.filter(o => {
        const matchesCategory = filter === "all" || o.category === filter;
        const matchesSearch = !normalizedSearch ||
            (o.name || "").toLowerCase().includes(normalizedSearch);
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="container">
            <PageIntro pageKey="objects" text="El catálogo de objetos de D&D 5e: armas, armaduras, pociones, objetos maravillosos y más. Los objetos del SRD son de solo lectura; los administradores pueden editarlos. Cualquier usuario puede crear objetos propios." />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
                <h1>Catálogo de objetos</h1>
                <button className="btn btn-primary" onClick={openCreate}>+ Nuevo objeto</button>
            </div>

            {error   && <div className="alert" style={{ cursor: "pointer" }} onClick={() => setError("")}>{error}</div>}
            {success && <div className="alert-success" style={{ marginBottom: "1rem", padding: "0.75rem 1rem", borderRadius: "4px" }}>{success}</div>}

            {showForm && (
                <div className="modal-overlay modal-overlay--form" onClick={closeForm}>
                <div className="modal-content--form" onClick={(e) => e.stopPropagation()}>
                <div className="scroll-card">
                    <h2>{editingId ? "Editar objeto" : "Forjar objeto"}</h2>
                    <form id="object-form" onSubmit={handleSubmit}>
                        <div className="grid grid-2">
                            <div className="field">
                                <label>Nombre</label>
                                <input
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    required
                                    style={nameError ? { borderColor: "var(--blood-dark)" } : undefined}
                                />
                                {nameChecking && <p className="field-hint field-hint--checking">Comprobando...</p>}
                                {nameError && <p className="field-hint field-hint--error">{nameError}</p>}
                            </div>
                            <div className="field">
                                <label>Categoría</label>
                                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                                    {CATEGORIES.map(c => (
                                        <option key={c} value={c}>{translateCategory(c)}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="field" style={{ gridColumn: "1 / -1" }}>
                                <label>Descripción</label>
                                <textarea rows="2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                            </div>
                            <div className="field">
                                <label>Coste (oro)</label>
                                <input type="number" min="0" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
                            </div>
                            <div className="field">
                                <label>Peso (lb)</label>
                                <input type="number" min="0" step="0.1" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
                            </div>
                            <div className="field">
                                <label>Daño (ej: 1d8)</label>
                                <input value={form.damage} onChange={(e) => setForm({ ...form, damage: e.target.value })} placeholder="1d8" />
                            </div>
                            <div className="field">
                                <label>Tipo daño</label>
                                <input value={form.damageType} onChange={(e) => setForm({ ...form, damageType: e.target.value })} placeholder="cortante" />
                            </div>
                            <div className="field">
                                <label>CA (armadura)</label>
                                <input type="number" value={form.armorClass} onChange={(e) => setForm({ ...form, armorClass: e.target.value })} />
                            </div>
                            <div className="field">
                                <label>Rareza</label>
                                <select value={form.rarity} onChange={(e) => setForm({ ...form, rarity: e.target.value })}>
                                    {RARITIES.map(r => (
                                        <option key={r} value={r}>{translateRarity(r)}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </form>
                </div>
                <div className="modal-form-footer">
                    <button type="submit" form="object-form" className="btn btn-primary" disabled={!!nameError}>
                        {editingId ? "Guardar cambios" : "Crear"}
                    </button>
                    <button type="button" className="btn" onClick={closeForm}>Cancelar</button>
                </div>
                </div>
                </div>
            )}

            {/*
                Barra de búsqueda. Envuelta en <form> para heredar los estilos
                globales de inputs (font Garamond, fondo crema, borde dorado
                en focus). El submit se neutraliza porque el filtrado es en vivo.
            */}
            <form
                className="scroll-card"
                onSubmit={(e) => e.preventDefault()}
                style={{ padding: "1rem 1.5rem", marginBottom: "1rem" }}
            >
                <div className="field" style={{ marginBottom: 0, display: "flex", alignItems: "center", gap: "0.8rem", flexWrap: "wrap" }}>
                    <label style={{ marginBottom: 0, flexShrink: 0 }}>🔍 Buscar</label>
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Nombre del objeto..."
                        style={{ flex: 1, minWidth: "200px" }}
                    />
                    {search && (
                        <button
                            type="button"
                            className="btn btn-small"
                            onClick={() => setSearch("")}
                            title="Limpiar búsqueda"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </form>

            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                <button className={`btn btn-small ${filter === "all" ? "btn-gold" : ""}`} onClick={() => setFilter("all")}>Todos</button>
                {CATEGORIES.map(c => (
                    <button
                        key={c}
                        className={`btn btn-small ${filter === c ? "btn-gold" : ""}`}
                        onClick={() => setFilter(c)}
                    >
                        {translateCategory(c)}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="loading">Hojeando los grimorios...</div>
            ) : filtered.length === 0 ? (
                <div className="empty">
                    {normalizedSearch
                        ? `No hay objetos que coincidan con "${search}".`
                        : "No hay objetos en esta categoría."}
                </div>
            ) : (
                <>
                    {/* Contador discreto que confirma cuántos resultados se ven */}
                    <p style={{ color: "var(--ink-faded)", fontSize: "0.9rem", margin: "0 0 1rem" }}>
                        Mostrando {filtered.length} de {objects.length} objetos
                    </p>
                    <div className="grid grid-3">
                        {filtered.map(o => (
                            <ObjectCard
                                key={o._id}
                                o={o}
                                isAdmin={isAdmin}
                                expanded={expanded === o._id}
                                onToggle={() => setExpanded(expanded === o._id ? null : o._id)}
                                onEdit={() => openEdit(o)}
                                onDelete={() => handleDelete(o)}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}