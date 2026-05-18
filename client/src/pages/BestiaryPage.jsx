import { useEffect, useState } from "react";
import { monstersApi } from "../api/monsters.js";
import { authApi } from "../api/auth.js";
import { useAuth } from "../context/AuthContext.jsx";

const SIZES = ["Diminuto", "Pequeño", "Mediano", "Grande", "Enorme", "Gargantuesco"];
const TYPES = [
    "Aberración", "Bestia", "Celestial", "Constructo", "Dragón",
    "Elemental", "Hada", "Gigante", "Humanoide", "Monstruosidad",
    "Cieno", "Planta", "Muerto viviente"
];

// CR ordenado de menor a mayor para selects
const CR_OPTIONS = [
    "0", "1/8", "1/4", "1/2",
    "1", "2", "3", "4", "5", "6", "7", "8", "9", "10",
    "11", "12", "13", "14", "15", "16", "17", "18", "19", "20",
    "21", "22", "23", "24", "25", "26", "27", "28", "29", "30"
];

const ACTION_KINDS = [
    { value: "trait",     label: "Rasgo" },
    { value: "action",    label: "Acción" },
    { value: "bonus",     label: "Acción adicional" },
    { value: "reaction",  label: "Reacción" },
    { value: "legendary", label: "Acción legendaria" },
    { value: "lair",      label: "Acción de guarida" }
];

const emptyAction = { kind: "action", name: "", description: "", attackBonus: "", reach: "", damage: "", damageType: "" };

const emptyMonster = {
    name: "",
    size: "Mediano",
    type: "Humanoide",
    subtype: "",
    alignment: "Sin alineamiento",
    armorClass: 10,
    armorClassNote: "",
    hitPoints: { average: 10, roll: "" },
    speed: ["30 ft"],
    abilityScores: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
    senses: [],
    passivePerception: 10,
    languages: [],
    challengeRating: "0",
    experiencePoints: 0,
    damageVulnerabilities: [],
    damageResistances: [],
    damageImmunities: [],
    conditionImmunities: [],
    actions: [],
    spellcastingNote: "",
    description: "",
    dmNotes: ""
};

/**
 * Página /bestiary
 *
 * Si el usuario no es DM, se le ofrece activar el modo DM con un solo click.
 * Si ya lo es, ve la lista de su bestiario privado, con filtros y formulario
 * de creación.
 */
export default function BestiaryPage() {
    const { user, updateUser } = useAuth();
    const isDM = user?.isDM === true;

    return isDM ? <Bestiary /> : <ActivateDM updateUser={updateUser} />;
}

/* ─────────────────────────────────────────────────────────────────────
   Pantalla de activación: visible si el usuario aún no es DM.
   Un solo botón llama al endpoint y, si funciona, refresca el user
   en el contexto. La página entonces re-renderiza mostrando ya el
   bestiario.
   ───────────────────────────────────────────────────────────────────── */
function ActivateDM({ updateUser }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const activate = async () => {
        setLoading(true);
        setError("");
        try {
            const updated = await authApi.toggleDM(true);
            updateUser(updated);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container">
            <div className="scroll-card" style={{ textAlign: "center", padding: "3rem 2rem" }}>
                <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🐉</div>
                <h1>Modo Director de Juego</h1>
                <p style={{ color: "var(--ink-faded)", maxWidth: "520px", margin: "1rem auto" }}>
                    El bestiario es una herramienta para los Directores de Juego.
                    Aquí podrás crear y gestionar tus propios monstruos para usarlos
                    en tus campañas. Tu bestiario es <strong>privado</strong>: sólo tú
                    ves los monstruos que crees.
                </p>
                <p style={{ color: "var(--ink-faded)", maxWidth: "520px", margin: "1rem auto" }}>
                    Activa el modo DM para empezar. Podrás desactivarlo desde aquí en
                    cualquier momento.
                </p>

                {error && <div className="alert">{error}</div>}

                <button
                    className="btn btn-primary"
                    onClick={activate}
                    disabled={loading}
                    style={{ marginTop: "1rem" }}
                >
                    {loading ? "Activando..." : "🎲 Activar modo DM"}
                </button>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────────────
   El bestiario propiamente dicho.
   ───────────────────────────────────────────────────────────────────── */
function Bestiary() {
    const { user, updateUser } = useAuth();

    const [monsters, setMonsters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Filtros
    const [search, setSearch] = useState("");
    const [filterType, setFilterType] = useState("");
    const [filterSize, setFilterSize] = useState("");
    const [filterCR, setFilterCR] = useState("");
    const [filterSource, setFilterSource] = useState("");

    // Creación / edición
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(emptyMonster);
    const [editingId, setEditingId] = useState(null);

    const [expanded, setExpanded] = useState(null);

    const flash = (msg) => {
        setSuccess(msg);
        setTimeout(() => setSuccess(""), 2500);
    };

    const load = async () => {
        try {
            setLoading(true);
            const data = await monstersApi.list({
                search: search.trim().length >= 3 ? search.trim() : undefined,
                type: filterType || undefined,
                size: filterSize || undefined,
                cr: filterCR || undefined,
                source: filterSource || undefined
            });
            setMonsters(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const handle = setTimeout(load, 250);
        return () => clearTimeout(handle);
    }, [search, filterType, filterSize, filterCR, filterSource]);

    const openCreate = () => {
        setForm(emptyMonster);
        setEditingId(null);
        setShowForm(true);
    };

    const openEdit = (monster) => {
        setForm({
            ...emptyMonster,
            ...monster,
            // El Map de skills viene como objeto plano; lo mantenemos
            // tal cual lo devuelve el backend.
            speed: monster.speed?.length ? monster.speed : ["30 ft"],
            actions: (monster.actions || []).map(a => ({
                ...emptyAction,
                ...a,
                attackBonus: a.attackBonus ?? ""
            }))
        });
        setEditingId(monster._id);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingId(null);
        setForm(emptyMonster);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Limpieza: campos numéricos vacíos pasan a undefined para que
            // Mongoose no los guarde como NaN.
            const payload = {
                ...form,
                armorClass: Number(form.armorClass) || 10,
                passivePerception: Number(form.passivePerception) || 10,
                experiencePoints: Number(form.experiencePoints) || 0,
                hitPoints: {
                    average: Number(form.hitPoints.average) || 1,
                    roll: form.hitPoints.roll
                },
                abilityScores: Object.fromEntries(
                    Object.entries(form.abilityScores).map(([k, v]) => [k, Number(v) || 10])
                ),
                actions: form.actions.map(a => ({
                    ...a,
                    attackBonus: a.attackBonus === "" ? undefined : Number(a.attackBonus)
                }))
            };

            if (editingId) {
                await monstersApi.update(editingId, payload);
                flash("Monstruo actualizado");
            } else {
                await monstersApi.create(payload);
                flash("Monstruo creado");
            }
            closeForm();
            load();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDelete = async (monster) => {
        if (!confirm(`¿Eliminar "${monster.name}" de tu bestiario?`)) return;
        try {
            await monstersApi.remove(monster._id);
            flash("Monstruo eliminado");
            load();
        } catch (err) {
            setError(err.message);
        }
    };

    const deactivateDM = async () => {
        if (!confirm("¿Desactivar el modo DM? Tu bestiario se conservará, pero no podrás verlo hasta volver a activarlo.")) return;
        try {
            const updated = await authApi.toggleDM(false);
            updateUser(updated);
        } catch (err) {
            setError(err.message);
        }
    };

    /* ─── Helpers para los arrays "lista de strings" (speed, idiomas, etc.) ─── */
    const updateStringList = (field, idx, value) => {
        setForm(prev => {
            const list = [...(prev[field] || [])];
            list[idx] = value;
            return { ...prev, [field]: list };
        });
    };
    const addToStringList = (field) => {
        setForm(prev => ({ ...prev, [field]: [...(prev[field] || []), ""] }));
    };
    const removeFromStringList = (field, idx) => {
        setForm(prev => ({
            ...prev,
            [field]: (prev[field] || []).filter((_, i) => i !== idx)
        }));
    };

    /* ─── Helpers para acciones ─── */
    const addAction = () => {
        setForm(prev => ({ ...prev, actions: [...prev.actions, { ...emptyAction }] }));
    };
    const updateAction = (idx, field, value) => {
        setForm(prev => {
            const actions = [...prev.actions];
            actions[idx] = { ...actions[idx], [field]: value };
            return { ...prev, actions };
        });
    };
    const removeAction = (idx) => {
        setForm(prev => ({ ...prev, actions: prev.actions.filter((_, i) => i !== idx) }));
    };

    return (
        <div className="container">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                    <h1>🐉 Bestiario</h1>
                    <p style={{ color: "var(--ink-faded)", margin: "0.2rem 0 0", fontSize: "0.9rem" }}>
                        Tu colección privada de monstruos. {monsters.length} {monsters.length === 1 ? "criatura" : "criaturas"} registradas.
                    </p>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    {!showForm && (
                        <button className="btn btn-primary" onClick={openCreate}>+ Nuevo monstruo</button>
                    )}
                    <button className="btn btn-small" onClick={deactivateDM} title="Desactivar modo DM">
                        Desactivar modo DM
                    </button>
                </div>
            </div>

            {error && <div className="alert" onClick={() => setError("")} style={{ cursor: "pointer" }}>{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            {/* Formulario de creación / edición */}
            {showForm && (
                <MonsterForm
                    form={form}
                    setForm={setForm}
                    editingId={editingId}
                    onSubmit={handleSubmit}
                    onCancel={closeForm}
                    helpers={{ updateStringList, addToStringList, removeFromStringList, addAction, updateAction, removeAction }}
                />
            )}

            {/* Filtros */}
            <form className="scroll-card filters-bar" onSubmit={(e) => e.preventDefault()}>
                <div className="grid" style={{ gap: "1rem" }}>
                    <div className="field field--search" style={{ marginBottom: 0 }}>
                        <label>Buscar</label>
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Nombre del monstruo... (mín. 3 caracteres)"
                        />
                    </div>
                    <div className="field" style={{ marginBottom: 0 }}>
                        <label>Tipo</label>
                        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                            <option value="">Todos</option>
                            {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div className="field" style={{ marginBottom: 0 }}>
                        <label>Tamaño</label>
                        <select value={filterSize} onChange={(e) => setFilterSize(e.target.value)}>
                            <option value="">Todos</option>
                            {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="field" style={{ marginBottom: 0 }}>
                        <label>Desafío (CR)</label>
                        <select value={filterCR} onChange={(e) => setFilterCR(e.target.value)}>
                            <option value="">Cualquiera</option>
                            {CR_OPTIONS.map(cr => <option key={cr} value={cr}>{cr}</option>)}
                        </select>
                    </div>
                    <div className="field" style={{ marginBottom: 0 }}>
    <label>Origen</label>
    <select value={filterSource} onChange={(e) => setFilterSource(e.target.value)}>
        <option value="">Todos</option>
        <option value="mine">Mis monstruos</option>
        <option value="public">Catálogo SRD</option>
    </select>
</div>
                </div>
            </form>

            {/* Listado */}
            {loading ? (
                <div className="loading">Convocando criaturas...</div>
            ) : monsters.length === 0 ? (
                <div className="empty">
                    {search || filterType || filterSize || filterCR
                        ? "No hay monstruos que coincidan con tu búsqueda."
                        : "Tu bestiario está vacío. Crea tu primer monstruo con \"+ Nuevo monstruo\"."}
                </div>
            ) : (
                <div className="grid grid-2">
                    {monsters.map(m => (
                        <MonsterCard
                            key={m._id}
                            monster={m}
                            expanded={expanded === m._id}
                            onToggle={() => setExpanded(expanded === m._id ? null : m._id)}
                            onEdit={() => openEdit(m)}
                            onDelete={() => handleDelete(m)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────────────
   Tarjeta de monstruo (modo lectura, expandible).
   ───────────────────────────────────────────────────────────────────── */
function MonsterCard({ monster, expanded, onToggle, onEdit, onDelete }) {
    const abil = (key) => {
        const v = monster.abilityScores?.[key] ?? 10;
        const mod = Math.floor((v - 10) / 2);
        return `${v} (${mod >= 0 ? "+" : ""}${mod})`;
    };

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
                    <h3 style={{ margin: 0, marginBottom: "0.3rem" }}>{monster.name}</h3>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", alignItems: "center", fontSize: "0.85rem", color: "var(--ink-faded)" }}>
                        <span className="badge-tag">{monster.size}</span>
                        <span className="badge-tag">{monster.type}{monster.subtype ? ` (${monster.subtype})` : ""}</span>
                        <span className="badge-tag" style={{ background: "rgba(160, 32, 32, 0.15)" }}>CR {monster.challengeRating}</span>
                        <span>·</span>
                        <span>{monster.alignment}</span>
                        {monster.isPublic && (
    <span className="badge-tag" style={{ background: "rgba(59, 109, 255, 0.15)", color: "#3b6dff" }}>
        SRD
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
                    {/* Defensas */}
                    <div style={{ margin: "1rem 0", fontSize: "0.9rem", lineHeight: 1.6 }}>
                        <div><strong>Clase de armadura:</strong> {monster.armorClass}{monster.armorClassNote && ` (${monster.armorClassNote})`}</div>
                        <div>
                            <strong>Puntos de golpe:</strong> {monster.hitPoints?.average}
                            {monster.hitPoints?.roll && ` (${monster.hitPoints.roll})`}
                        </div>
                        <div><strong>Velocidad:</strong> {(monster.speed || []).join(", ") || "—"}</div>
                    </div>

                    {/* Atributos en grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "0.4rem", margin: "1rem 0", fontSize: "0.85rem", textAlign: "center" }}>
                        {["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"].map(k => (
                            <div key={k}>
                                <div style={{ fontFamily: "Cinzel, serif", fontSize: "0.7rem", color: "var(--ink-faded)", textTransform: "uppercase" }}>{k.slice(0, 3)}</div>
                                <div><strong>{abil(k)}</strong></div>
                            </div>
                        ))}
                    </div>

                    {/* Sentidos e idiomas */}
                    <div style={{ fontSize: "0.85rem", lineHeight: 1.6 }}>
                        {(monster.senses || []).length > 0 && (
                            <div><strong>Sentidos:</strong> {monster.senses.join(", ")}, Percepción pasiva {monster.passivePerception}</div>
                        )}
                        {(monster.languages || []).length > 0 && (
                            <div><strong>Idiomas:</strong> {monster.languages.join(", ")}</div>
                        )}
                        {(monster.damageResistances || []).length > 0 && (
                            <div><strong>Resistencias:</strong> {monster.damageResistances.join(", ")}</div>
                        )}
                        {(monster.damageImmunities || []).length > 0 && (
                            <div><strong>Inmunidades:</strong> {monster.damageImmunities.join(", ")}</div>
                        )}
                        {(monster.conditionImmunities || []).length > 0 && (
                            <div><strong>Inmunidad a condiciones:</strong> {monster.conditionImmunities.join(", ")}</div>
                        )}
                    </div>

                    {/* Acciones agrupadas por tipo */}
                    {(monster.actions || []).length > 0 && (
                        <ActionsGroup actions={monster.actions} />
                    )}

                    {monster.spellcastingNote && (
                        <div style={{ marginTop: "1rem", padding: "0.6rem", background: "rgba(184, 134, 11, 0.08)", borderLeft: "3px solid var(--gold)", borderRadius: "2px", fontSize: "0.9rem", whiteSpace: "pre-wrap" }}>
                            <strong>Lanzamiento de conjuros:</strong> {monster.spellcastingNote}
                        </div>
                    )}

                    {monster.description && (
                        <div style={{ marginTop: "1rem", fontStyle: "italic", whiteSpace: "pre-wrap" }}>{monster.description}</div>
                    )}

                    {monster.dmNotes && (
                        <div style={{ marginTop: "1rem", padding: "0.6rem", background: "rgba(139, 0, 0, 0.08)", borderLeft: "3px solid var(--blood)", borderRadius: "2px", fontSize: "0.9rem", whiteSpace: "pre-wrap" }}>
                            <strong>📝 Notas del DM:</strong>
                            <br />
                            {monster.dmNotes}
                        </div>
                    )}

                    {/* Acciones */}
                    <div style={{ display: "flex", gap: "0.4rem", marginTop: "1rem" }}>
                        <button className="btn btn-small" onClick={(e) => { e.stopPropagation(); onEdit(); }}>Editar</button>
                        <button className="btn btn-small btn-danger" onClick={(e) => { e.stopPropagation(); onDelete(); }}>Eliminar</button>
                    </div>
                </div>
            )}
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
    const order = ["trait", "action", "bonus", "reaction", "legendary", "lair"];
    const titles = {
        trait: "Rasgos",
        action: "Acciones",
        bonus: "Acciones adicionales",
        reaction: "Reacciones",
        legendary: "Acciones legendarias",
        lair: "Acciones de guarida"
    };

    return (
        <>
            {order.filter(k => grouped[k]).map(k => (
                <div key={k} style={{ marginTop: "1rem" }}>
                    <h4 style={{ borderBottom: "1px solid var(--gold)", paddingBottom: "0.2rem", marginBottom: "0.4rem" }}>
                        {titles[k]}
                    </h4>
                    {grouped[k].map(a => (
                        <div key={a._id} style={{ marginBottom: "0.6rem", fontSize: "0.9rem" }}>
                            <strong>{a.name}.</strong>{" "}
                            {(a.attackBonus !== undefined && a.attackBonus !== null && a.attackBonus !== "") && (
                                <em>Ataque cuerpo a cuerpo o a distancia con arma: {a.attackBonus >= 0 ? "+" : ""}{a.attackBonus} al golpe{a.reach && `, alcance ${a.reach}`}. Impacto: {a.damage}{a.damageType ? ` de daño ${a.damageType}` : ""}.</em>
                            )}{" "}
                            <span style={{ whiteSpace: "pre-wrap" }}>{a.description}</span>
                        </div>
                    ))}
                </div>
            ))}
        </>
    );
}

/* ─────────────────────────────────────────────────────────────────────
   Formulario de creación / edición. Es grande, lo extraigo en componente
   propio para no inflar la página principal.
   ───────────────────────────────────────────────────────────────────── */
function MonsterForm({ form, setForm, editingId, onSubmit, onCancel, helpers }) {
    const { updateStringList, addToStringList, removeFromStringList, addAction, updateAction, removeAction } = helpers;

    return (
        <div className="scroll-card">
            <h2>{editingId ? "Editar monstruo" : "Forjar nuevo monstruo"}</h2>
            <form onSubmit={onSubmit}>
                {/* Identidad básica */}
                <div className="grid grid-2">
                    <div className="field">
                        <label>Nombre</label>
                        <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div className="field">
                        <label>Subtipo (opcional)</label>
                        <input value={form.subtype} onChange={(e) => setForm({ ...form, subtype: e.target.value })} placeholder="elfo, demonio..." />
                    </div>
                    <div className="field">
                        <label>Tamaño</label>
                        <select value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })}>
                            {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="field">
                        <label>Tipo</label>
                        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                            {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div className="field">
                        <label>Alineamiento</label>
                        <input value={form.alignment} onChange={(e) => setForm({ ...form, alignment: e.target.value })} />
                    </div>
                    <div className="field">
                        <label>Desafío (CR)</label>
                        <select value={form.challengeRating} onChange={(e) => setForm({ ...form, challengeRating: e.target.value })}>
                            {CR_OPTIONS.map(cr => <option key={cr} value={cr}>{cr}</option>)}
                        </select>
                    </div>
                </div>

                {/* Defensas */}
                <h3 style={{ marginTop: "1rem", borderBottom: "1px solid var(--gold)", paddingBottom: "0.2rem" }}>Defensas</h3>
                <div className="grid grid-2">
                    <div className="field">
                        <label>Clase de armadura</label>
                        <input type="number" value={form.armorClass} onChange={(e) => setForm({ ...form, armorClass: e.target.value })} />
                    </div>
                    <div className="field">
                        <label>Nota de armadura (opcional)</label>
                        <input value={form.armorClassNote} onChange={(e) => setForm({ ...form, armorClassNote: e.target.value })} placeholder="armadura natural" />
                    </div>
                    <div className="field">
                        <label>PG (media)</label>
                        <input type="number" value={form.hitPoints.average} onChange={(e) => setForm({ ...form, hitPoints: { ...form.hitPoints, average: e.target.value } })} />
                    </div>
                    <div className="field">
                        <label>PG (fórmula, opcional)</label>
                        <input value={form.hitPoints.roll} onChange={(e) => setForm({ ...form, hitPoints: { ...form.hitPoints, roll: e.target.value } })} placeholder="2d8+2" />
                    </div>
                </div>

                {/* Velocidad (lista de strings) */}
                <StringListField label="Velocidad" field="speed" form={form} updateStringList={updateStringList} addToStringList={addToStringList} removeFromStringList={removeFromStringList} placeholder="30 ft, vuelo 60 ft..." />

                {/* Atributos */}
                <h3 style={{ marginTop: "1rem", borderBottom: "1px solid var(--gold)", paddingBottom: "0.2rem" }}>Atributos</h3>
                <div className="stats-grid">
                    {["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"].map(k => (
                        <div key={k} className="stat">
                            <div className="stat__label">{k.slice(0, 3)}</div>
                            <input
                                type="number"
                                value={form.abilityScores[k]}
                                onChange={(e) => setForm({ ...form, abilityScores: { ...form.abilityScores, [k]: e.target.value } })}
                                style={{ textAlign: "center", padding: "0.3rem", fontSize: "1.1rem", fontWeight: "bold" }}
                            />
                        </div>
                    ))}
                </div>

                {/* Sentidos, idiomas, percepción */}
                <h3 style={{ marginTop: "1rem", borderBottom: "1px solid var(--gold)", paddingBottom: "0.2rem" }}>Sentidos e idiomas</h3>
                <StringListField label="Sentidos" field="senses" form={form} updateStringList={updateStringList} addToStringList={addToStringList} removeFromStringList={removeFromStringList} placeholder="visión en la oscuridad 60 ft..." />
                <div className="field">
                    <label>Percepción pasiva</label>
                    <input type="number" value={form.passivePerception} onChange={(e) => setForm({ ...form, passivePerception: e.target.value })} />
                </div>
                <StringListField label="Idiomas" field="languages" form={form} updateStringList={updateStringList} addToStringList={addToStringList} removeFromStringList={removeFromStringList} placeholder="Común, Élfico..." />

                {/* Resistencias/inmunidades */}
                <h3 style={{ marginTop: "1rem", borderBottom: "1px solid var(--gold)", paddingBottom: "0.2rem" }}>Resistencias e inmunidades</h3>
                <StringListField label="Vulnerabilidades al daño" field="damageVulnerabilities" form={form} updateStringList={updateStringList} addToStringList={addToStringList} removeFromStringList={removeFromStringList} placeholder="fuego..." />
                <StringListField label="Resistencias al daño" field="damageResistances" form={form} updateStringList={updateStringList} addToStringList={addToStringList} removeFromStringList={removeFromStringList} placeholder="contundente no mágico..." />
                <StringListField label="Inmunidades al daño" field="damageImmunities" form={form} updateStringList={updateStringList} addToStringList={addToStringList} removeFromStringList={removeFromStringList} placeholder="veneno..." />
                <StringListField label="Inmunidad a condiciones" field="conditionImmunities" form={form} updateStringList={updateStringList} addToStringList={addToStringList} removeFromStringList={removeFromStringList} placeholder="envenenado, paralizado..." />

                {/* Acciones */}
                <h3 style={{ marginTop: "1rem", borderBottom: "1px solid var(--gold)", paddingBottom: "0.2rem" }}>Acciones, rasgos y reacciones</h3>
                {form.actions.map((a, idx) => (
                    <div key={idx} style={{ border: "1px dashed var(--parchment-shadow)", borderRadius: "3px", padding: "0.8rem", marginBottom: "0.6rem", background: "rgba(255,255,255,0.1)" }}>
                        <div className="grid grid-2">
                            <div className="field">
                                <label>Tipo</label>
                                <select value={a.kind} onChange={(e) => updateAction(idx, "kind", e.target.value)}>
                                    {ACTION_KINDS.map(k => <option key={k.value} value={k.value}>{k.label}</option>)}
                                </select>
                            </div>
                            <div className="field">
                                <label>Nombre</label>
                                <input required value={a.name} onChange={(e) => updateAction(idx, "name", e.target.value)} />
                            </div>
                        </div>
                        <div className="grid grid-2">
                            <div className="field">
                                <label>Bono de ataque (opcional)</label>
                                <input type="number" value={a.attackBonus} onChange={(e) => updateAction(idx, "attackBonus", e.target.value)} />
                            </div>
                            <div className="field">
                                <label>Alcance (opcional)</label>
                                <input value={a.reach} onChange={(e) => updateAction(idx, "reach", e.target.value)} placeholder="5 ft" />
                            </div>
                            <div className="field">
                                <label>Daño (opcional)</label>
                                <input value={a.damage} onChange={(e) => updateAction(idx, "damage", e.target.value)} placeholder="1d8+3" />
                            </div>
                            <div className="field">
                                <label>Tipo de daño (opcional)</label>
                                <input value={a.damageType} onChange={(e) => updateAction(idx, "damageType", e.target.value)} placeholder="cortante" />
                            </div>
                        </div>
                        <div className="field">
                            <label>Descripción</label>
                            <textarea rows="3" value={a.description} onChange={(e) => updateAction(idx, "description", e.target.value)} />
                        </div>
                        <button type="button" className="btn btn-small btn-danger" onClick={() => removeAction(idx)}>Eliminar acción</button>
                    </div>
                ))}
                <button type="button" className="btn btn-small" onClick={addAction}>+ Añadir acción / rasgo / reacción</button>

                {/* Conjuros */}
                <h3 style={{ marginTop: "1rem", borderBottom: "1px solid var(--gold)", paddingBottom: "0.2rem" }}>Lanzamiento de conjuros (opcional)</h3>
                <div className="field">
                    <label>Notas de conjuros</label>
                    <textarea
                        rows="3"
                        value={form.spellcastingNote}
                        onChange={(e) => setForm({ ...form, spellcastingNote: e.target.value })}
                        placeholder="El monstruo es un lanzador de nivel 5. Su CD de salvación de hechizos es 14, bono de ataque +6. Tiene los siguientes hechizos preparados..."
                    />
                </div>

                {/* Lore y notas */}
                <h3 style={{ marginTop: "1rem", borderBottom: "1px solid var(--gold)", paddingBottom: "0.2rem" }}>Lore y notas</h3>
                <div className="field">
                    <label>Descripción (visible)</label>
                    <textarea rows="3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Historia, costumbres, descripción visual..." />
                </div>
                <div className="field">
                    <label>📝 Notas del DM (privadas)</label>
                    <textarea rows="3" value={form.dmNotes} onChange={(e) => setForm({ ...form, dmNotes: e.target.value })} placeholder="Trucos, sorpresas para la mesa, ganchos narrativos..." />
                </div>

                {/* Submit */}
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                    <button type="submit" className="btn btn-primary">
                        {editingId ? "Guardar cambios" : "Crear monstruo"}
                    </button>
                    <button type="button" className="btn" onClick={onCancel}>Cancelar</button>
                </div>
            </form>
        </div>
    );
}

/**
 * Lista editable de strings (velocidades, idiomas, sentidos, etc.).
 * Cada item es un input con un botón ✕ y al final hay un botón "+".
 */
function StringListField({ label, field, form, updateStringList, addToStringList, removeFromStringList, placeholder }) {
    const items = form[field] || [];
    return (
        <div className="field">
            <label>{label}</label>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                {items.map((item, idx) => (
                    <div key={idx} style={{ display: "flex", gap: "0.4rem" }}>
                        <input
                            value={item}
                            onChange={(e) => updateStringList(field, idx, e.target.value)}
                            placeholder={placeholder}
                            style={{ flex: 1 }}
                        />
                        <button
                            type="button"
                            className="btn btn-small btn-danger"
                            onClick={() => removeFromStringList(field, idx)}
                            title="Eliminar"
                        >
                            ✕
                        </button>
                    </div>
                ))}
                <button type="button" className="btn btn-small" onClick={() => addToStringList(field)} style={{ alignSelf: "flex-start" }}>
                    + Añadir
                </button>
            </div>
        </div>
    );
}
