import { useState, useEffect } from "react";
import { spellsApi } from "../../api/spells.js";
import { abilityMod, formatMod } from "../../utils/dndCalc.js";

const SLOT_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const ABILITY_OPTIONS = [
    { value: "", label: "—" },
    { value: "intelligence", label: "Inteligencia" },
    { value: "wisdom", label: "Sabiduría" },
    { value: "charisma", label: "Carisma" }
];

/**
 * Pestaña CONJUROS
 */
export default function SpellsSection({ character, onUpdate, onAddSpell, onUpdateSpell, onRemoveSpell }) {
    const [showSelector, setShowSelector] = useState(false);

    const sc = character.spellcasting || {};
    const slots = sc.spellSlots || {};
    const known = sc.spellsKnown || [];

    const updateSpellcasting = (field, value) => {
        onUpdate({ spellcasting: { ...sc, [field]: value } });
    };

    const updateSlot = (level, field, value) => {
        const key = `level${level}`;
        const current = slots[key] || { total: 0, used: 0 };
        onUpdate({
            spellcasting: {
                ...sc,
                spellSlots: {
                    ...slots,
                    [key]: { ...current, [field]: Number(value) || 0 }
                }
            }
        });
    };

    const togglePrepared = (knownEntry) => {
        onUpdateSpell(knownEntry._id, { prepared: !knownEntry.prepared });
    };

    // Agrupa los hechizos conocidos por nivel
    const knownByLevel = {};
    for (const k of known) {
        const lvl = k.spell?.level ?? 0;
        if (!knownByLevel[lvl]) knownByLevel[lvl] = [];
        knownByLevel[lvl].push(k);
    }

    return (
        <>
            {/* Cabecera de aptitud mágica */}
            <div className="scroll-card">
                <h2>✨ Aptitud mágica</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
                    <div className="spellcast-stat">
                        <label className="spellcast-stat__label">Atributo de aptitud</label>
                        <select
                            className="spellcast-stat__select"
                            value={sc.ability || ""}
                            onChange={(e) => updateSpellcasting("ability", e.target.value)}
                        >
                            {ABILITY_OPTIONS.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                        {sc.ability && (
                            <div className="spellcast-stat__hint">
                                Mod: {formatMod(abilityMod(character.abilityScores?.[sc.ability] ?? 10))}
                            </div>
                        )}
                    </div>

                    <div className="spellcast-stat">
                        <label className="spellcast-stat__label">CD salvación</label>
                        <input
                            type="number"
                            className="spellcast-stat__input"
                            value={sc.saveDC ?? 8}
                            onChange={(e) => updateSpellcasting("saveDC", Number(e.target.value))}
                        />
                    </div>

                    <div className="spellcast-stat">
                        <label className="spellcast-stat__label">Bono de ataque</label>
                        <input
                            type="number"
                            className="spellcast-stat__input"
                            value={sc.attackBonus ?? 0}
                            onChange={(e) => updateSpellcasting("attackBonus", Number(e.target.value))}
                        />
                    </div>
                </div>
                <p style={{ fontSize: "0.8rem", color: "var(--ink-faded)", marginTop: "1rem", marginBottom: 0 }}>
                    💡 Fórmulas estándar D&D 5e: <strong>CD = 8 + bonus competencia + mod aptitud</strong>;
                    <strong> Ataque = bonus competencia + mod aptitud</strong>.
                </p>
            </div>

            {/* Espacios de conjuro */}
            <div className="scroll-card">
                <h2>🔮 Espacios de conjuro</h2>
                <div className="slot-grid">
                    {SLOT_LEVELS.map(lvl => {
                        const slot = slots[`level${lvl}`] || { total: 0, used: 0 };
                        const remaining = Math.max(0, slot.total - slot.used);
                        const hasSlots = slot.total > 0;
                        return (
                            <div
                                key={lvl}
                                className={`slot-cell ${hasSlots ? "" : "slot-cell--empty"}`}
                            >
                                <div className="slot-cell__header">
                                    <span className="slot-cell__level">Nv {lvl}</span>
                                    {hasSlots && (
                                        <span className="slot-cell__remaining">
                                            {remaining}/{slot.total}
                                        </span>
                                    )}
                                </div>
                                <div className="slot-cell__inputs">
                                    <label>
                                        Total
                                        <input
                                            type="number"
                                            min="0"
                                            value={slot.total}
                                            onChange={(e) => updateSlot(lvl, "total", e.target.value)}
                                        />
                                    </label>
                                    <label>
                                        Usados
                                        <input
                                            type="number"
                                            min="0"
                                            max={slot.total}
                                            value={slot.used}
                                            onChange={(e) => updateSlot(lvl, "used", e.target.value)}
                                        />
                                    </label>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Hechizos conocidos */}
            <div className="scroll-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <h2 style={{ margin: 0 }}>📜 Hechizos conocidos</h2>
                    <button className="btn btn-primary" onClick={() => setShowSelector(true)}>
                        + Añadir hechizo
                    </button>
                </div>

                {known.length === 0 ? (
                    <div className="empty">
                        Este personaje aún no conoce hechizos.
                        Pulsa "+ Añadir hechizo" para buscar uno en el catálogo.
                    </div>
                ) : (
                    <>
                        {/* Trucos primero */}
                        {knownByLevel[0] && (
                            <SpellLevelGroup
                                level={0}
                                title="Trucos (nivel 0)"
                                spells={knownByLevel[0]}
                                onTogglePrepared={togglePrepared}
                                onRemove={(id) => onRemoveSpell(id)}
                            />
                        )}
                        {/* Resto por nivel */}
                        {SLOT_LEVELS.map(lvl =>
                            knownByLevel[lvl] ? (
                                <SpellLevelGroup
                                    key={lvl}
                                    level={lvl}
                                    title={`Nivel ${lvl}`}
                                    spells={knownByLevel[lvl]}
                                    onTogglePrepared={togglePrepared}
                                    onRemove={(id) => onRemoveSpell(id)}
                                />
                            ) : null
                        )}
                    </>
                )}
            </div>

            {showSelector && (
                <SpellSelectorModal
                    character={character}
                    existingSpellIds={known.map(k => k.spell?._id)}
                    onClose={() => setShowSelector(false)}
                    onAdd={async (spellId) => {
                        await onAddSpell({ spell: spellId });
                    }}
                />
            )}
        </>
    );
}

/**
 * Grupo de hechizos de un mismo nivel.
 */
function SpellLevelGroup({ level, title, spells, onTogglePrepared, onRemove }) {
    const [expanded, setExpanded] = useState({});

    return (
        <div className="spell-group">
            <h3 className="spell-group__title">{title} ({spells.length})</h3>
            <ul className="spell-list">
                {spells.map(known => {
                    const sp = known.spell;
                    if (!sp) return null;
                    const isOpen = expanded[known._id];
                    return (
                        <li key={known._id} className={`spell-item ${known.prepared ? "spell-item--prepared" : ""}`}>
                            <div className="spell-item__row">
                                {/* Checkbox preparado solo para hechizos > 0 */}
                                {level > 0 ? (
                                    <input
                                        type="checkbox"
                                        className="spell-item__check"
                                        checked={!!known.prepared}
                                        onChange={() => onTogglePrepared(known)}
                                        title="Preparado"
                                    />
                                ) : (
                                    <span className="spell-item__check-spacer" title="Los trucos siempre están disponibles">✦</span>
                                )}

                                <div
                                    className="spell-item__info"
                                    onClick={() => setExpanded({ ...expanded, [known._id]: !isOpen })}
                                >
                                    <strong>{sp.name}</strong>
                                    <div className="spell-item__meta">
                                        {sp.school}
                                        {sp.concentration && <span className="badge-tag">Concentración</span>}
                                        {sp.ritual && <span className="badge-tag">Ritual</span>}
                                        {sp.damageType && <span> • Daño: {sp.damageType}</span>}
                                    </div>
                                </div>

                                <button className="btn btn-small btn-danger" onClick={() => onRemove(known._id)} title="Olvidar hechizo">×</button>
                            </div>

                            {isOpen && (
                                <div className="spell-item__detail">
                                    <div className="spell-item__props">
                                        <span><strong>Lanzamiento:</strong> {sp.castingTime}</span>
                                        <span><strong>Alcance:</strong> {sp.range}</span>
                                        <span><strong>Duración:</strong> {sp.duration}</span>
                                        <span>
                                            <strong>Componentes:</strong>
                                            {sp.components?.verbal && " V"}
                                            {sp.components?.somatic && " S"}
                                            {sp.components?.material && " M"}
                                            {sp.components?.materialDesc && (
                                                <em> ({sp.components.materialDesc})</em>
                                            )}
                                        </span>
                                    </div>
                                    {sp.description && (
                                        <div className="spell-item__desc">{sp.description}</div>
                                    )}
                                    {sp.atHigherLevels && (
                                        <div className="spell-item__higher">
                                            <strong>A niveles superiores:</strong> {sp.atHigherLevels}
                                        </div>
                                    )}
                                </div>
                            )}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

/**
 * Modal selector de hechizos con búsqueda y filtro por nivel.
 */
function SpellSelectorModal({ character, existingSpellIds, onClose, onAdd }) {
    const [spells, setSpells] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [filterLevel, setFilterLevel] = useState("");
    const [filterByClass, setFilterByClass] = useState(true);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        spellsApi.list({
            class: filterByClass ? character.charClass : undefined,
            level: filterLevel,
            search: search.trim()
        })
            .then(data => {
                if (cancelled) return;
                // Excluye los que ya conoce
                const exists = new Set(existingSpellIds.map(String));
                setSpells(data.filter(s => !exists.has(String(s._id))));
            })
            .catch(err => console.error(err))
            .finally(() => !cancelled && setLoading(false));
        return () => { cancelled = true; };
    }, [search, filterLevel, filterByClass, character.charClass, existingSpellIds]);

    const handleAdd = async (spellId) => {
        await onAdd(spellId);
        // Quitarlo de la lista local para que no aparezca duplicado mientras está abierto
        setSpells(spells.filter(s => s._id !== spellId));
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-content"
                style={{ maxWidth: "800px", width: "95%", maxHeight: "90vh", display: "flex", flexDirection: "column" }}
                onClick={(e) => e.stopPropagation()}
            >
                <button className="modal-close" onClick={onClose}>×</button>
                <h2 style={{ marginTop: 0 }}>📜 Catálogo de hechizos</h2>

                {/* Filtros */}
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem", alignItems: "center" }}>
                    <input
                        type="text"
                        placeholder="Buscar por nombre..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ flex: "1 1 200px" }}
                    />
                    <select
                        value={filterLevel}
                        onChange={(e) => setFilterLevel(e.target.value)}
                        style={{ width: "auto" }}
                    >
                        <option value="">Todos los niveles</option>
                        <option value="0">Truco (Nv 0)</option>
                        {SLOT_LEVELS.map(l => (
                            <option key={l} value={l}>Nivel {l}</option>
                        ))}
                    </select>
                    <label style={{ display: "flex", alignItems: "center", gap: "0.3rem", whiteSpace: "nowrap", margin: 0 }}>
                        <input
                            type="checkbox"
                            checked={filterByClass}
                            onChange={(e) => setFilterByClass(e.target.checked)}
                            style={{ width: "auto", margin: 0 }}
                        />
                        Solo {character.charClass}
                    </label>
                </div>

                {/* Lista */}
                <div style={{ flex: 1, overflowY: "auto", border: "1px solid var(--parchment-shadow)", borderRadius: "3px", background: "rgba(255,255,255,0.2)" }}>
                    {loading ? (
                        <div style={{ padding: "2rem", textAlign: "center", color: "var(--ink-faded)" }}>
                            Buscando hechizos...
                        </div>
                    ) : spells.length === 0 ? (
                        <div style={{ padding: "2rem", textAlign: "center", color: "var(--ink-faded)" }}>
                            No se encontraron hechizos con esos filtros.
                        </div>
                    ) : (
                        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                            {spells.map(s => (
                                <li
                                    key={s._id}
                                    style={{
                                        padding: "0.6rem 0.8rem",
                                        borderBottom: "1px dotted var(--parchment-shadow)",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        gap: "0.5rem"
                                    }}
                                >
                                    <div style={{ flex: 1 }}>
                                        <strong>{s.name}</strong>{" "}
                                        <span style={{ fontSize: "0.85rem", color: "var(--ink-faded)" }}>
                                            (Nv {s.level} • {s.school})
                                        </span>
                                        <div style={{ fontSize: "0.8rem", color: "var(--ink-faded)", marginTop: "0.2rem" }}>
                                            {s.castingTime} • {s.range} • {s.duration}
                                        </div>
                                    </div>
                                    <button
                                        className="btn btn-small btn-primary"
                                        onClick={() => handleAdd(s._id)}
                                    >
                                        + Aprender
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div style={{ marginTop: "0.8rem", fontSize: "0.8rem", color: "var(--ink-faded)", textAlign: "right" }}>
                    Mostrando {spells.length} hechizos
                </div>
            </div>
        </div>
    );
}
