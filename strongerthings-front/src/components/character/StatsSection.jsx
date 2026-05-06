import {
    ABILITY_LIST,
    SKILL_LIST,
    abilityMod,
    formatMod,
    savingThrowMod,
    skillMod,
    passivePerception,
    proficiencyBonus
} from "../../utils/dndCalc.js";

/**
 * Pestaña ATRIBUTOS — características, salvaciones, habilidades.
 */
export default function StatsSection({ character, onUpdate }) {
    const stats = character.abilityScores || {};
    const profs = character.proficiencies || { savingThrows: {}, skills: {} };
    const pb = proficiencyBonus(character.level);

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

    return (
        <>
            {/* Bonus por competencia y percepción pasiva */}
            <div className="scroll-card">
                <div style={{ display: "flex", gap: "1rem", justifyContent: "space-around", flexWrap: "wrap" }}>
                    <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "2rem", fontFamily: "Cinzel", color: "var(--gold)" }}>+{pb}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--ink-faded)", textTransform: "uppercase", fontFamily: "Cinzel" }}>
                            Bonificador<br />por competencia
                        </div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "2rem", fontFamily: "Cinzel", color: "var(--gold)" }}>{passivePerception(character)}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--ink-faded)", textTransform: "uppercase", fontFamily: "Cinzel" }}>
                            Percepción<br />pasiva
                        </div>
                    </div>
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
        </>
    );
}

import { useEffect, useState } from "react";

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
