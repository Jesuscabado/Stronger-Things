import { useEffect, useState } from "react";
import { spellsApi } from "../api/spells.js";
import { useAuth } from "../context/AuthContext.jsx";
import { CLASS_OPTIONS, translateClass } from "../utils/dndLabels.js";

const SCHOOLS = [
    "Abjuración", "Conjuración", "Adivinación", "Encantamiento",
    "Evocación", "Ilusión", "Nigromancia", "Transmutación"
];

const SCHOOL_COLORS = {
    "Abjuración":     "#3b6dff",
    "Conjuración":    "#1eb7b7",
    "Adivinación":    "#a347c4",
    "Encantamiento":  "#e08000",
    "Evocación":      "#a02020",
    "Ilusión":        "#666",
    "Nigromancia":    "#2a2a2a",
    "Transmutación":  "#2d6a2d"
};

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
    const [expanded, setExpanded] = useState(null);

    // Filtros
    const [search, setSearch] = useState("");
    const [filterLevel, setFilterLevel] = useState("");
    const [filterClass, setFilterClass] = useState("");
    const [filterSchool, setFilterSchool] = useState("");

    // Ordenación: "level" agrupa por nivel; "name" muestra una lista plana A-Z
    const [sortBy, setSortBy] = useState("level");

    // Creación
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(emptyForm);

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

    // Recargar cuando cambian los filtros con un pequeño debounce para la búsqueda
    useEffect(() => {
        const handle = setTimeout(load, 250);
        return () => clearTimeout(handle);
    }, [search, filterLevel, filterClass]);

    // El filtro por escuela se aplica en cliente (no hay query param en el backend)
    const filtered = filterSchool
        ? spells.filter(s => s.school === filterSchool)
        : spells;

    // Orden alfabético: copia ordenada por nombre con localeCompare en español.
    const alphabetical = [...filtered].sort((a, b) =>
        (a.name || "").localeCompare(b.name || "", "es", { sensitivity: "base" })
    );

    // Agrupado por nivel: dentro de cada nivel también se ordena alfabéticamente.
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

    /* ─── Crear ─── */
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
                // Limpia campos vacíos opcionales
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
                <h1>📜 Catálogo de hechizos</h1>
                <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                    {showForm ? "Cancelar" : "+ Nuevo hechizo"}
                </button>
            </div>

            {error && <div className="alert" onClick={() => setError("")} style={{ cursor: "pointer" }}>{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            {/* Formulario de creación */}
            {showForm && (
                <div className="scroll-card">
                    <h2>Inscribir nuevo hechizo</h2>
                    <form onSubmit={handleCreate}>
                        <div className="grid grid-2">
                            <div className="field">
                                <label>Nombre (español)</label>
                                <input
                                    required
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    placeholder="Bola de fuego"
                                />
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

                        {/* Flags */}
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

                        {/* Componentes V/S/M */}
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

                        {/* Clases compatibles */}
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

                        <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button type="submit" className="btn btn-primary">Inscribir</button>
                            <button type="button" className="btn" onClick={() => { setShowForm(false); setForm(emptyForm); }}>
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Filtros y ordenación */}
            <div className="scroll-card" style={{ padding: "1rem 1.5rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: "0.8rem", alignItems: "end" }}>
                    <div className="field" style={{ marginBottom: 0 }}>
                        <label>Buscar</label>
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Nombre del hechizo..."
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
                        <label>Ordenar por</label>
                        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                            <option value="level">Nivel</option>
                            <option value="name">Alfabético (A-Z)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Listado */}
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
                        // Agrupado por nivel con cabeceras
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
                                            expanded={expanded === spell._id}
                                            onToggle={() => setExpanded(expanded === spell._id ? null : spell._id)}
                                            onDelete={isAdmin ? () => handleDelete(spell) : null}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))
                    ) : (
                        // Lista plana alfabética
                        <div className="grid grid-2">
                            {alphabetical.map(spell => (
                                <SpellCard
                                    key={spell._id}
                                    spell={spell}
                                    expanded={expanded === spell._id}
                                    onToggle={() => setExpanded(expanded === spell._id ? null : spell._id)}
                                    onDelete={isAdmin ? () => handleDelete(spell) : null}
                                    showLevelBadge
                                />
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

/**
 * Tarjeta de un hechizo. Click sobre la cabecera para expandir/contraer.
 * En el modo alfabético se añade un badge con el nivel del hechizo, ya
 * que sin cabeceras de grupo esa información se perdería visualmente.
 */
function SpellCard({ spell, expanded, onToggle, onDelete, showLevelBadge }) {
    const schoolColor = SCHOOL_COLORS[spell.school] || "#666";

    const componentLetters = [
        spell.components?.verbal && "V",
        spell.components?.somatic && "S",
        spell.components?.material && "M"
    ].filter(Boolean).join("/");

    return (
        <div className="scroll-card" style={{ padding: 0, overflow: "hidden" }}>
            <div
                onClick={onToggle}
                style={{
                    padding: "1rem 1.5rem",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "1rem"
                }}
            >
                <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ margin: 0, marginBottom: "0.3rem" }}>
                        {spell.name}
                        {spell.nameOriginal && spell.nameOriginal !== spell.name && (
                            <span style={{ fontSize: "0.8rem", color: "var(--ink-faded)", fontWeight: "normal", marginLeft: "0.5rem" }}>
                                ({spell.nameOriginal})
                            </span>
                        )}
                    </h3>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", alignItems: "center" }}>
                        {showLevelBadge && (
                            <span className="badge-tag" style={{ background: "rgba(184, 134, 11, 0.3)" }}>
                                {LEVEL_LABEL(spell.level ?? 0)}
                            </span>
                        )}
                        <span
                            className="class-badge"
                            style={{ color: schoolColor, borderColor: schoolColor }}
                        >
                            {spell.school}
                        </span>
                        {spell.concentration && <span className="badge-tag">Concentración</span>}
                        {spell.ritual && <span className="badge-tag">Ritual</span>}
                        {componentLetters && <span className="badge-tag">{componentLetters}</span>}
                        {spell.damageType && (
                            <span className="badge-tag" style={{ background: "rgba(160, 32, 32, 0.15)" }}>
                                {spell.damageType}
                            </span>
                        )}
                    </div>
                </div>
                <span style={{ fontSize: "1.3rem", color: "var(--ink-faded)" }}>
                    {expanded ? "▾" : "▸"}
                </span>
            </div>

            {expanded && (
                <div style={{ padding: "0 1.5rem 1rem", borderTop: "1px dashed var(--parchment-shadow)" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.8rem", margin: "1rem 0", fontSize: "0.9rem" }}>
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
                        <p style={{ fontSize: "0.85rem", color: "var(--ink-faded)", marginBottom: onDelete ? "0.8rem" : 0 }}>
                            <strong>Clases:</strong> {spell.classes.map(translateClass).join(", ")}
                        </p>
                    )}

                    {onDelete && (
                        <button
                            className="btn btn-small btn-danger"
                            onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        >
                            Eliminar del catálogo
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}