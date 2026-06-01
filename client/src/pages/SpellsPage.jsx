import { useEffect, useState } from "react";
import { spellsApi } from "../api/spells.js";
import PageIntro from "../components/layout/PageIntro.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useNameCheck } from "../hooks/useNameCheck.js";
import { CLASS_OPTIONS, translateClass } from "../utils/dndLabels.js";
import { spellSchoolColor } from "../utils/dndColors.js";

const SCHOOLS = [
    "Abjuración", "Conjuración", "Adivinación", "Encantamiento",
    "Evocación", "Ilusión", "Nigromancia", "Transmutación"
];

const LEVEL_LABEL = (lvl) => lvl === 0 ? "Truco" : `Nivel ${lvl}`;

const emptyForm = {
    name: "",
    nameOriginal: "",
    description: "",
    atHigherLevels: "",
    level: 0,
    school: "Evocación",
    castingTime: "1 acción",
    range: "30 pies",
    duration: "Instantáneo",
    concentration: false,
    ritual: false,
    components: { verbal: false, somatic: false, material: false, materialDesc: "" },
    damageType: "",
    classes: []
};

export default function SpellsPage() {
    const { user } = useAuth();
    const isAdmin = user?.role === "admin";

    const [spells, setSpells] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [selected, setSelected] = useState(null);

    // Filtros
    const [search, setSearch] = useState("");
    const [filterLevel, setFilterLevel] = useState("");
    const [filterClass, setFilterClass] = useState("");
    const [filterSchool, setFilterSchool] = useState("");

    // Ordenación
    const [sortBy, setSortBy] = useState("level");

    // Creación
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const { nameError, nameChecking } = useNameCheck(spellsApi.checkName, form.name);

    useEffect(() => {
        if (showForm) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => { document.body.style.overflow = ""; };
    }, [showForm]);

    const flash = (msg) => {
        setSuccess(msg);
        setTimeout(() => setSuccess(""), 2500);
    };

    const load = async () => {
        try {
            setLoading(true);
            const data = await spellsApi.list({
                search: search.trim() || undefined,
                level: filterLevel,
                class: filterClass || undefined
            });
            setSpells(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const trimmed = search.trim();
        if (trimmed.length > 0 && trimmed.length < 3) return;

        const handle = setTimeout(load, 250);
        return () => clearTimeout(handle);
    }, [search, filterLevel, filterClass]);

    const filtered = filterSchool
        ? spells.filter(s => s.school === filterSchool)
        : spells;

    const alphabetical = [...filtered].sort((a, b) =>
        (a.name || "").localeCompare(b.name || "", "es", { sensitivity: "base" })
    );

    const byLevel = {};
    for (const s of filtered) {
        const lvl = s.level ?? 0;
        if (!byLevel[lvl]) byLevel[lvl] = [];
        byLevel[lvl].push(s);
    }
    for (const lvl of Object.keys(byLevel)) {
        byLevel[lvl].sort((a, b) =>
            (a.name || "").localeCompare(b.name || "", "es", { sensitivity: "base" })
        );
    }
    const sortedLevels = Object.keys(byLevel).map(Number).sort((a, b) => a - b);

    const toggleClassInForm = (cls) => {
        setForm(prev => ({
            ...prev,
            classes: prev.classes.includes(cls)
                ? prev.classes.filter(c => c !== cls)
                : [...prev.classes, cls]
        }));
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...form,
                level: Number(form.level),
                nameOriginal: form.nameOriginal || undefined,
                atHigherLevels: form.atHigherLevels || undefined,
                damageType: form.damageType || undefined
            };
            await spellsApi.create(payload);
            setForm(emptyForm);
            setShowForm(false);
            flash("Hechizo creado");
            load();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDelete = async (spell) => {
        if (!confirm(`¿Eliminar "${spell.name}" del catálogo? Los personajes que lo conozcan también lo perderán.`)) return;
        try {
            await spellsApi.delete(spell._id);
            flash("Hechizo eliminado");
            load();
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="container">
            <PageIntro pageKey="spells" text="Todos los hechizos de D&D 5e, organizados por escuela de magia. Los hechizos del SRD son de consulta; los administradores pueden editarlos. Puedes crear hechizos propios para personalizarlos." />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
                <h1>📜 Catálogo de hechizos</h1>
                <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                    {showForm ? "Cancelar" : "+ Nuevo hechizo"}
                </button>
            </div>

            {error && <div className="alert" onClick={() => setError("")} style={{ cursor: "pointer" }}>{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            {showForm && (
                <div className="modal-overlay modal-overlay--form" onClick={() => { setShowForm(false); setForm(emptyForm); }}>
                <div className="modal-content--form" onClick={(e) => e.stopPropagation()}>
                <div className="scroll-card">
                    <h2>Inscribir nuevo hechizo</h2>
                    <form id="spell-form" onSubmit={handleCreate}>
                        <div className="grid grid-2">
                            <div className="field">
                                <label>Nombre (español)</label>
                                <input
                                    required
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    placeholder="Bola de fuego"
                                    style={nameError ? { borderColor: "var(--blood-dark)" } : undefined}
                                />
                                {nameChecking && <p className="field-hint field-hint--checking">Comprobando...</p>}
                                {nameError && <p className="field-hint field-hint--error">{nameError}</p>}
                            </div>
                            <div className="field">
                                <label>Nombre original (inglés, opcional)</label>
                                <input
                                    value={form.nameOriginal}
                                    onChange={(e) => setForm({ ...form, nameOriginal: e.target.value })}
                                    placeholder="Fireball"
                                />
                            </div>

                            <div className="field">
                                <label>Nivel</label>
                                <select
                                    value={form.level}
                                    onChange={(e) => setForm({ ...form, level: e.target.value })}
                                >
                                    <option value={0}>Truco (nivel 0)</option>
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(l => (
                                        <option key={l} value={l}>Nivel {l}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="field">
                                <label>Escuela</label>
                                <select
                                    value={form.school}
                                    onChange={(e) => setForm({ ...form, school: e.target.value })}
                                >
                                    {SCHOOLS.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>

                            <div className="field">
                                <label>Tiempo de lanzamiento</label>
                                <input
                                    value={form.castingTime}
                                    onChange={(e) => setForm({ ...form, castingTime: e.target.value })}
                                    placeholder="1 acción"
                                />
                            </div>
                            <div className="field">
                                <label>Alcance</label>
                                <input
                                    value={form.range}
                                    onChange={(e) => setForm({ ...form, range: e.target.value })}
                                    placeholder="30 pies"
                                />
                            </div>

                            <div className="field">
                                <label>Duración</label>
                                <input
                                    value={form.duration}
                                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                                    placeholder="Instantáneo"
                                />
                            </div>
                            <div className="field">
                                <label>Tipo de daño (opcional)</label>
                                <input
                                    value={form.damageType}
                                    onChange={(e) => setForm({ ...form, damageType: e.target.value })}
                                    placeholder="fuego, frío, psíquico..."
                                />
                            </div>
                        </div>

                        <div className="field" style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
                            <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", textTransform: "none", letterSpacing: "normal" }}>
                                <input
                                    type="checkbox"
                                    checked={form.concentration}
                                    onChange={(e) => setForm({ ...form, concentration: e.target.checked })}
                                    style={{ width: "auto", margin: 0 }}
                                />
                                Concentración
                            </label>
                            <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", textTransform: "none", letterSpacing: "normal" }}>
                                <input
                                    type="checkbox"
                                    checked={form.ritual}
                                    onChange={(e) => setForm({ ...form, ritual: e.target.checked })}
                                    style={{ width: "auto", margin: 0 }}
                                />
                                Ritual
                            </label>
                        </div>

                        <div className="field">
                            <label>Componentes</label>
                            <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                                <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", textTransform: "none", letterSpacing: "normal" }}>
                                    <input
                                        type="checkbox"
                                        checked={form.components.verbal}
                                        onChange={(e) => setForm({ ...form, components: { ...form.components, verbal: e.target.checked } })}
                                        style={{ width: "auto", margin: 0 }}
                                    />
                                    Verbal (V)
                                </label>
                                <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", textTransform: "none", letterSpacing: "normal" }}>
                                    <input
                                        type="checkbox"
                                        checked={form.components.somatic}
                                        onChange={(e) => setForm({ ...form, components: { ...form.components, somatic: e.target.checked } })}
                                        style={{ width: "auto", margin: 0 }}
                                    />
                                    Somático (S)
                                </label>
                                <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", textTransform: "none", letterSpacing: "normal" }}>
                                    <input
                                        type="checkbox"
                                        checked={form.components.material}
                                        onChange={(e) => setForm({ ...form, components: { ...form.components, material: e.target.checked } })}
                                        style={{ width: "auto", margin: 0 }}
                                    />
                                    Material (M)
                                </label>
                            </div>
                            {form.components.material && (
                                <input
                                    value={form.components.materialDesc}
                                    onChange={(e) => setForm({ ...form, components: { ...form.components, materialDesc: e.target.value } })}
                                    placeholder="una pizca de azufre, un trozo de cuero..."
                                />
                            )}
                        </div>

                        <div className="field">
                            <label>Clases que pueden lanzarlo</label>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                                {CLASS_OPTIONS.map(o => {
                                    const selected = form.classes.includes(o.value);
                                    return (
                                        <button
                                            type="button"
                                            key={o.value}
                                            className={`btn btn-small ${selected ? "btn-gold" : ""}`}
                                            onClick={() => toggleClassInForm(o.value)}
                                        >
                                            {selected ? "✓ " : ""}{o.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="field">
                            <label>Descripción</label>
                            <textarea
                                rows="5"
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                placeholder="Una explosión de fuego brillante surge de tu dedo apuntado..."
                            />
                        </div>

                        <div className="field">
                            <label>A niveles superiores (opcional)</label>
                            <textarea
                                rows="2"
                                value={form.atHigherLevels}
                                onChange={(e) => setForm({ ...form, atHigherLevels: e.target.value })}
                                placeholder="Cuando lances este conjuro usando un espacio de nivel 4 o superior, el daño aumenta en 1d6 por cada nivel..."
                            />
                        </div>

                    </form>
                </div>
                <div className="modal-form-footer">
                    <button type="submit" form="spell-form" className="btn btn-primary" disabled={!!nameError}>Inscribir</button>
                    <button type="button" className="btn" onClick={() => { setShowForm(false); setForm(emptyForm); }}>Cancelar</button>
                </div>
                </div>
                </div>
            )}

            {/*
                Filtros y ordenación.
                Clases relevantes:
                - filters-bar: marca del bloque para el CSS responsive.
                - field--search: marca del campo principal para que ocupe
                  todo el ancho disponible en cada breakpoint.
                Las columnas las gestiona el CSS según el tamaño de pantalla.
            */}
            <form className="scroll-card filters-bar" onSubmit={(e) => e.preventDefault()}>
                <div className="grid" style={{ gap: "1rem" }}>
                    <div className="field field--search" style={{ marginBottom: 0 }}>
                        <label>Buscar</label>
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Nombre del conjuro..."
                        />
                    </div>
                    <div className="field" style={{ marginBottom: 0 }}>
                        <label>Nivel</label>
                        <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)}>
                            <option value="">Todos</option>
                            <option value="0">Trucos</option>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(l => (
                                <option key={l} value={l}>Nivel {l}</option>
                            ))}
                        </select>
                    </div>
                    <div className="field" style={{ marginBottom: 0 }}>
                        <label>Clase</label>
                        <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)}>
                            <option value="">Todas</option>
                            {CLASS_OPTIONS.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="field" style={{ marginBottom: 0 }}>
                        <label>Escuela</label>
                        <select value={filterSchool} onChange={(e) => setFilterSchool(e.target.value)}>
                            <option value="">Todas</option>
                            {SCHOOLS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="field" style={{ marginBottom: 0 }}>
                        <label>Ordenar</label>
                        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                            <option value="level">Nivel</option>
                            <option value="name">Alfabético (A-Z)</option>
                        </select>
                    </div>
                </div>
            </form>

            {loading ? (
                <div className="loading">Hojeando grimorios...</div>
            ) : filtered.length === 0 ? (
                <div className="empty">
                    No hay hechizos que coincidan con la búsqueda.
                    {spells.length === 0 && " Pulsa \"+ Nuevo hechizo\" para inscribir el primero."}
                </div>
            ) : (
                <>
                    <p style={{ color: "var(--ink-faded)", fontSize: "0.9rem", margin: "1rem 0" }}>
                        Mostrando {filtered.length} hechizo{filtered.length === 1 ? "" : "s"}
                    </p>

                    {sortBy === "level" ? (
                        sortedLevels.map(lvl => (
                            <div key={lvl} style={{ marginBottom: "1.5rem" }}>
                                <h2 style={{ borderBottom: "2px solid var(--gold)", paddingBottom: "0.3rem", marginBottom: "0.8rem" }}>
                                    {LEVEL_LABEL(lvl)} ({byLevel[lvl].length})
                                </h2>
                                <div className="grid grid-2">
                                    {byLevel[lvl].map(spell => (
                                        <SpellCard
                                            key={spell._id}
                                            spell={spell}
                                            onClick={() => setSelected(spell)}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="grid grid-2">
                            {alphabetical.map(spell => (
                                <SpellCard
                                    key={spell._id}
                                    spell={spell}
                                    onClick={() => setSelected(spell)}
                                    showLevelBadge
                                />
                            ))}
                        </div>
                    )}
                    {selected && (
                        <SpellDetailModal
                            spell={selected}
                            isAdmin={isAdmin}
                            onClose={() => setSelected(null)}
                            onDelete={() => { setSelected(null); handleDelete(selected); }}
                        />
                    )}
                </>
            )}
        </div>
    );
}

function SpellCard({ spell, onClick, showLevelBadge }) {
    const { color: schoolColor, bg: schoolBg } = spellSchoolColor(spell.school);
    return (
        <div className="scroll-card" style={{ padding: "0.85rem 1.25rem", marginBottom: 0, minWidth: 0, width: "100%", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem" }} onClick={onClick}>
            <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ margin: "0 0 0.3rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{spell.name}</h3>
                <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", alignItems: "center" }}>
                    {showLevelBadge && <span className="badge-tag">{LEVEL_LABEL(spell.level ?? 0)}</span>}
                    <span className="badge-tag" style={{ color: schoolColor, background: schoolBg, border: `1px solid ${schoolColor}40` }}>{spell.school}</span>
                    {spell.castingTime && <span className="card-stat">⚡ {spell.castingTime}</span>}
                    {spell.range      && <span className="card-stat">📏 {spell.range}</span>}
                </div>
            </div>
            <span style={{ color: "var(--gold)", flexShrink: 0, fontSize: "1rem" }}>👁</span>
        </div>
    );
}

function SpellDetailModal({ spell, isAdmin, onClose, onDelete }) {
    const { color: schoolColor, bg: schoolBg } = spellSchoolColor(spell.school);
    const canDelete = !spell.isPublic || isAdmin;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="scroll-card"
                style={{ maxWidth: 540, width: "92%", padding: "1.5rem" }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                    <h2 style={{ margin: 0 }}>
                        {spell.name}
                        {spell.nameOriginal && spell.nameOriginal !== spell.name && (
                            <span style={{ fontSize: "0.8rem", color: "var(--ink-faded)", fontWeight: "normal", marginLeft: "0.5rem" }}>
                                ({spell.nameOriginal})
                            </span>
                        )}
                    </h2>
                    <button className="btn btn-small" onClick={onClose}>✕</button>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", alignItems: "center", marginBottom: "1rem" }}>
                    <span className="badge-tag" style={{ background: "rgba(184, 134, 11, 0.3)" }}>
                        {LEVEL_LABEL(spell.level ?? 0)}
                    </span>
                    <span
                        className="badge-tag"
                        style={{ color: schoolColor, background: schoolBg, border: `1px solid ${schoolColor}40` }}
                    >
                        {spell.school}
                    </span>
                    {spell.concentration && <span className="badge-tag">Concentración</span>}
                    {spell.ritual && <span className="badge-tag">Ritual</span>}
                    {spell.damageType && (
                        <span className="badge-tag" style={{ background: "rgba(160, 32, 32, 0.15)" }}>
                            {spell.damageType}
                        </span>
                    )}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: "0.8rem", margin: "1rem 0", fontSize: "0.9rem" }}>
                    <div>
                        <div style={{ fontSize: "0.7rem", color: "var(--ink-faded)", textTransform: "uppercase", fontFamily: "Cinzel" }}>Lanzamiento</div>
                        <div><strong>{spell.castingTime}</strong></div>
                    </div>
                    <div>
                        <div style={{ fontSize: "0.7rem", color: "var(--ink-faded)", textTransform: "uppercase", fontFamily: "Cinzel" }}>Alcance</div>
                        <div><strong>{spell.range}</strong></div>
                    </div>
                    <div>
                        <div style={{ fontSize: "0.7rem", color: "var(--ink-faded)", textTransform: "uppercase", fontFamily: "Cinzel" }}>Duración</div>
                        <div><strong>{spell.duration}</strong></div>
                    </div>
                </div>

                {spell.components?.material && spell.components?.materialDesc && (
                    <p style={{ fontSize: "0.85rem", color: "var(--ink-faded)", fontStyle: "italic", marginBottom: "0.8rem" }}>
                        <strong>Materiales:</strong> {spell.components.materialDesc}
                    </p>
                )}

                {spell.description && (
                    <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.5, marginBottom: "0.8rem" }}>
                        {spell.description}
                    </div>
                )}

                {spell.atHigherLevels && (
                    <div className="spell-item__higher" style={{ marginBottom: "0.8rem" }}>
                        <strong>A niveles superiores:</strong> {spell.atHigherLevels}
                    </div>
                )}

                {spell.classes?.length > 0 && (
                    <p style={{ fontSize: "0.85rem", color: "var(--ink-faded)", marginBottom: canDelete ? "0.8rem" : 0 }}>
                        <strong>Clases:</strong> {spell.classes.map(translateClass).join(", ")}
                    </p>
                )}

                {canDelete && (
                    <button className="btn btn-small btn-danger" onClick={onDelete}>
                        Eliminar del catálogo
                    </button>
                )}
            </div>
        </div>
    );
}