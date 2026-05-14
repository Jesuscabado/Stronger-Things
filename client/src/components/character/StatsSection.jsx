import { useEffect, useState } from "react";
import {
    ABILITY_LIST,
    SKILL_LIST,
    abilityMod,
    formatMod,
    savingThrowMod,
    skillMod,
    passivePerception,
    proficiencyBonus,
    isProficiencyBonusOverridden,
    isPassivePerceptionOverridden
} from "../../utils/dndCalc.js";
import { COMMON_LANGUAGES, COMMON_OTHER_PROFICIENCIES } from "../../utils/dndConstants.js";
import ChipList from "../ChipList.jsx";

/**
 * Pestaña ATRIBUTOS — características, salvaciones, habilidades,
 * idiomas y otras competencias.
 */
export default function StatsSection({ character, onUpdate }) {
    const stats = character.abilityScores || {};
    const profs = character.proficiencies || { savingThrows: {}, skills: {}, languages: [], other: [] };
    const combat = character.combatStats || {};

    const pb = proficiencyBonus(character);
    const pbOverridden = isProficiencyBonusOverridden(character);
    const ppOverridden = isPassivePerceptionOverridden(character);
    const ppBonus = Number(combat.passivePerceptionBonus || 0);

    const toggleSavingThrow = (abilityKey) => {
        const current = profs.savingThrows?.[abilityKey] || false;
        onUpdate({
            proficiencies: {
                ...profs,
                savingThrows: {
                    ...(profs.savingThrows || {}),
                    [abilityKey]: !current
                }
            }
        });
    };

    const toggleSkill = (skillKey) => {
        const current = profs.skills?.[skillKey] || false;
        onUpdate({
            proficiencies: {
                ...profs,
                skills: {
                    ...(profs.skills || {}),
                    [skillKey]: !current
                }
            }
        });
    };

    const updateAbilityScore = (key, value) => {
        onUpdate({ abilityScores: { ...stats, [key]: value } });
    };

    const updateLanguages = (next) => {
        onUpdate({ proficiencies: { ...profs, languages: next } });
    };

    const updateOtherProfs = (next) => {
        onUpdate({ proficiencies: { ...profs, other: next } });
    };

    const updateCombat = (field, value) => {
        onUpdate({ combatStats: { ...combat, [field]: value } });
    };

    return (
        <>
            {/* Cabecera con dos cajas grandes editables */}
            <div className="scroll-card">
                <div style={{ display: "flex", gap: "1rem", justifyContent: "space-around", flexWrap: "wrap" }}>
                    <ProficiencyBonusBox
                        value={pb}
                        overridden={pbOverridden}
                        characterLevel={character.level}
                        onSetOverride={(v) => updateCombat("proficiencyBonusOverride", v)}
                    />
                    <PassivePerceptionBox
                        value={passivePerception(character)}
                        overridden={ppOverridden}
                        bonus={ppBonus}
                        onSetOverride={(v) => updateCombat("passivePerceptionOverride", v)}
                        onSetBonus={(v) => updateCombat("passivePerceptionBonus", v)}
                    />
                </div>
            </div>

            {/* Atributos */}
            <div className="scroll-card">
                <h2>Características</h2>
                <div className="stats-grid">
                    {ABILITY_LIST.map(a => (
                        <div key={a.key} className="stat">
                            <div className="stat__label">{a.short}</div>
                            <div className="stat__value">
                                <EditableNumber
                                    value={stats[a.key] ?? 10}
                                    onSave={(v) => updateAbilityScore(a.key, v)}
                                    min={1} max={30}
                                />
                            </div>
                            <div className="stat__mod">{formatMod(abilityMod(stats[a.key] ?? 10))}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Salvaciones */}
            <div className="scroll-card">
                <h2>Tiradas de salvación</h2>
                <p style={{ fontSize: "0.85rem", color: "var(--ink-faded)", marginTop: "-0.5rem", marginBottom: "1rem" }}>
                    Marca las que tu clase te otorga competencia.
                </p>
                <div className="dnd-list">
                    {ABILITY_LIST.map(a => {
                        const isProf = profs.savingThrows?.[a.key] || false;
                        const total = savingThrowMod(character, a.key);
                        return (
                            <label key={a.key} className={`dnd-list-row ${isProf ? "dnd-list-row--prof" : ""}`}>
                                <input
                                    type="checkbox"
                                    checked={isProf}
                                    onChange={() => toggleSavingThrow(a.key)}
                                />
                                <span className="dnd-list-row__mod">{formatMod(total)}</span>
                                <span className="dnd-list-row__name">{a.label}</span>
                            </label>
                        );
                    })}
                </div>
            </div>

            {/* Habilidades */}
            <div className="scroll-card">
                <h2>Habilidades</h2>
                <p style={{ fontSize: "0.85rem", color: "var(--ink-faded)", marginTop: "-0.5rem", marginBottom: "1rem" }}>
                    Las marcadas reciben tu bonificador por competencia (+{pb}).
                </p>
                <div className="dnd-list dnd-list--two-col">
                    {SKILL_LIST.map(s => {
                        const isProf = profs.skills?.[s.key] || false;
                        const total = skillMod(character, s);
                        return (
                            <label key={s.key} className={`dnd-list-row ${isProf ? "dnd-list-row--prof" : ""}`}>
                                <input
                                    type="checkbox"
                                    checked={isProf}
                                    onChange={() => toggleSkill(s.key)}
                                />
                                <span className="dnd-list-row__mod">{formatMod(total)}</span>
                                <span className="dnd-list-row__name">
                                    {s.label} <span className="dnd-list-row__attr">({s.abbr})</span>
                                </span>
                            </label>
                        );
                    })}
                </div>
            </div>

            {/* Idiomas */}
            <div className="scroll-card">
                <h2>🗣 Idiomas</h2>
                <p style={{ fontSize: "0.85rem", color: "var(--ink-faded)", marginTop: "-0.5rem", marginBottom: "1rem" }}>
                    Idiomas que tu personaje puede hablar y leer. Escribe y pulsa Enter, o selecciona del autocompletado.
                </p>
                <ChipList
                    values={profs.languages || []}
                    onChange={updateLanguages}
                    suggestions={COMMON_LANGUAGES}
                    placeholder="Escribe un idioma (Común, Élfico, Dracónico...)"
                    emptyMessage="No habla ningún idioma todavía. Añade el primero abajo."
                />
            </div>

            {/* Otras competencias */}
            <div className="scroll-card">
                <h2>🛡 Otras competencias</h2>
                <p style={{ fontSize: "0.85rem", color: "var(--ink-faded)", marginTop: "-0.5rem", marginBottom: "1rem" }}>
                    Competencia con armaduras, tipos de armas, herramientas, vehículos o instrumentos.
                </p>
                <ChipList
                    values={profs.other || []}
                    onChange={updateOtherProfs}
                    suggestions={COMMON_OTHER_PROFICIENCIES}
                    placeholder="Escribe una competencia (Armas marciales, Útiles de ladrón...)"
                    emptyMessage="Sin competencias adicionales todavía."
                />
            </div>
        </>
    );
}

/**
 * Caja de Bonificador por competencia con botón ⚙ para override manual.
 */
function ProficiencyBonusBox({ value, overridden, characterLevel, onSetOverride }) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value);

    useEffect(() => { setDraft(value); }, [value, editing]);

    const save = () => {
        const n = Number(draft);
        if (Number.isFinite(n)) onSetOverride(n);
        setEditing(false);
    };

    const reset = () => {
        onSetOverride(null);
        setEditing(false);
    };

    const autoValue = Math.ceil((characterLevel || 1) / 4) + 1;

    return (
        <div style={{ textAlign: "center", position: "relative", minWidth: "180px" }}>
            <div style={{
                fontSize: "2rem",
                fontFamily: "Cinzel",
                color: overridden ? "var(--blood, #8b1a1a)" : "var(--gold)"
            }}>
                +{value}
            </div>
            <div style={{
                fontSize: "0.75rem",
                color: "var(--ink-faded)",
                textTransform: "uppercase",
                fontFamily: "Cinzel"
            }}>
                Bonificador<br />por competencia
            </div>
            {overridden && (
                <div style={{
                    fontSize: "0.7rem",
                    color: "var(--blood, #8b1a1a)",
                    marginTop: "0.2rem",
                    fontStyle: "italic"
                }}>
                    Manual (auto: +{autoValue})
                </div>
            )}
            <button
                className="btn btn-small"
                onClick={() => setEditing(!editing)}
                style={{ marginTop: "0.4rem", fontSize: "0.7rem", padding: "0.2rem 0.5rem" }}
                title="Editar manualmente"
            >
                ⚙ Ajustar
            </button>

            {editing && (
                <div className="override-popover">
                    <div style={{ fontSize: "0.85rem", marginBottom: "0.5rem", color: "var(--ink-faded)" }}>
                        Valor automático: <strong>+{autoValue}</strong> (nivel {characterLevel})
                    </div>
                    <label style={{ display: "block", fontSize: "0.8rem", marginBottom: "0.3rem" }}>
                        Sobrescribir con:
                    </label>
                    <input
                        type="number"
                        autoFocus
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") save();
                            if (e.key === "Escape") setEditing(false);
                        }}
                        style={{ width: "100%", padding: "0.4rem", marginBottom: "0.5rem" }}
                    />
                    <div style={{ display: "flex", gap: "0.3rem", justifyContent: "space-between" }}>
                        <button className="btn btn-small btn-primary" onClick={save}>Guardar</button>
                        {overridden && (
                            <button className="btn btn-small" onClick={reset} title="Volver al cálculo automático">
                                ↻ Auto
                            </button>
                        )}
                        <button className="btn btn-small" onClick={() => setEditing(false)}>Cerrar</button>
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * Caja de Percepción pasiva con botón ⚙ para añadir bonus o sobrescribir.
 */
function PassivePerceptionBox({ value, overridden, bonus, onSetOverride, onSetBonus }) {
    const [editing, setEditing] = useState(false);
    const [draftBonus, setDraftBonus] = useState(bonus);
    const [draftOverride, setDraftOverride] = useState(value);

    useEffect(() => {
        setDraftBonus(bonus);
        setDraftOverride(value);
    }, [bonus, value, editing]);

    const saveBonus = () => {
        const n = Number(draftBonus);
        if (Number.isFinite(n)) onSetBonus(n);
        // No cerramos para que vea el efecto
    };

    const saveOverride = () => {
        const n = Number(draftOverride);
        if (Number.isFinite(n)) onSetOverride(n);
        setEditing(false);
    };

    const resetOverride = () => {
        onSetOverride(null);
        setEditing(false);
    };

    return (
        <div style={{ textAlign: "center", position: "relative", minWidth: "180px" }}>
            <div style={{
                fontSize: "2rem",
                fontFamily: "Cinzel",
                color: overridden ? "var(--blood, #8b1a1a)" : "var(--gold)"
            }}>
                {value}
            </div>
            <div style={{
                fontSize: "0.75rem",
                color: "var(--ink-faded)",
                textTransform: "uppercase",
                fontFamily: "Cinzel"
            }}>
                Percepción<br />pasiva
            </div>
            {overridden && (
                <div style={{
                    fontSize: "0.7rem",
                    color: "var(--blood, #8b1a1a)",
                    marginTop: "0.2rem",
                    fontStyle: "italic"
                }}>
                    Manual (override total)
                </div>
            )}
            {!overridden && bonus !== 0 && (
                <div style={{
                    fontSize: "0.7rem",
                    color: "var(--gold)",
                    marginTop: "0.2rem",
                    fontStyle: "italic"
                }}>
                    Incluye bonus {bonus >= 0 ? "+" : ""}{bonus}
                </div>
            )}
            <button
                className="btn btn-small"
                onClick={() => setEditing(!editing)}
                style={{ marginTop: "0.4rem", fontSize: "0.7rem", padding: "0.2rem 0.5rem" }}
                title="Editar manualmente"
            >
                ⚙ Ajustar
            </button>

            {editing && (
                <div className="override-popover" style={{ minWidth: "260px" }}>
                    {!overridden && (
                        <>
                            <div style={{ fontSize: "0.8rem", marginBottom: "0.5rem", textAlign: "left" }}>
                                <strong>Bonus extra</strong>
                                <div style={{ fontSize: "0.7rem", color: "var(--ink-faded)", fontWeight: "normal" }}>
                                    Se suma al cálculo automático. Ej: +5 por la dote "Observador atento".
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: "0.3rem", marginBottom: "0.8rem" }}>
                                <input
                                    type="number"
                                    value={draftBonus}
                                    onChange={(e) => setDraftBonus(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") saveBonus();
                                        if (e.key === "Escape") setEditing(false);
                                    }}
                                    style={{ flex: 1, padding: "0.4rem" }}
                                    placeholder="0"
                                />
                                <button className="btn btn-small btn-primary" onClick={saveBonus}>Guardar bonus</button>
                            </div>
                            <hr style={{ margin: "0.8rem 0", border: "none", borderTop: "1px dashed var(--parchment-shadow)" }} />
                        </>
                    )}

                    <div style={{ fontSize: "0.8rem", marginBottom: "0.5rem", textAlign: "left" }}>
                        <strong>Override total</strong>
                        <div style={{ fontSize: "0.7rem", color: "var(--ink-faded)", fontWeight: "normal" }}>
                            Sobrescribe el cálculo entero. Úsalo solo si quieres un valor fijo.
                        </div>
                    </div>
                    <input
                        type="number"
                        value={draftOverride}
                        onChange={(e) => setDraftOverride(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") saveOverride();
                            if (e.key === "Escape") setEditing(false);
                        }}
                        style={{ width: "100%", padding: "0.4rem", marginBottom: "0.5rem" }}
                    />
                    <div style={{ display: "flex", gap: "0.3rem", justifyContent: "space-between" }}>
                        <button className="btn btn-small btn-primary" onClick={saveOverride}>Sobrescribir</button>
                        {overridden && (
                            <button className="btn btn-small" onClick={resetOverride} title="Volver al cálculo automático">
                                ↻ Auto
                            </button>
                        )}
                        <button className="btn btn-small" onClick={() => setEditing(false)}>Cerrar</button>
                    </div>
                </div>
            )}
        </div>
    );
}

function EditableNumber({ value, onSave, min, max }) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value);

    useEffect(() => { setDraft(value); }, [value]);

    const commit = () => {
        const n = Number(draft);
        if (!Number.isFinite(n) || n === value) {
            setEditing(false);
            setDraft(value);
            return;
        }
        if (min != null && n < min) { setDraft(value); setEditing(false); return; }
        if (max != null && n > max) { setDraft(value); setEditing(false); return; }
        onSave(n);
        setEditing(false);
    };

    if (!editing) {
        return (
            <strong onClick={() => setEditing(true)} style={{ cursor: "pointer", borderBottom: "1px dotted var(--ink-faded)" }}>
                {value}
            </strong>
        );
    }

    return (
        <input
            type="number"
            autoFocus
            min={min}
            max={max}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
                if (e.key === "Enter") commit();
                if (e.key === "Escape") { setDraft(value); setEditing(false); }
            }}
            style={{ width: "70px", display: "inline-block", padding: "0.1rem 0.3rem", fontSize: "1rem" }}
        />
    );
}
